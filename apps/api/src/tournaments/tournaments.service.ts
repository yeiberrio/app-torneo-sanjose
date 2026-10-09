import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { GenerateFixtureDto } from './dto/generate-fixture.dto';
import { CreateRoundDto } from './dto/create-round.dto';
import { ConfigureTiebreakersDto } from './dto/configure-tiebreakers.dto';
import { BulkUpdateMatchesDto, DistributeGroupsDto, NextPhaseDto } from './dto/fixture-ops.dto';
import * as bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import { computeStandings, groupStandings, phaseLabelFor, DEFAULT_TIEBREAKERS, StandingRow } from '../common/standings.util';

/** Zona horaria del torneo (Colombia = UTC-5). Las horas del fixture se interpretan en esta zona. */
const TZ_OFFSET_MIN = Number(process.env.TOURNAMENT_TZ_OFFSET_MIN ?? -300);

function localDateParts(input: string | Date): { y: number; m: number; d: number } {
  if (typeof input === 'string') {
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) };
    input = new Date(input);
  }
  const shifted = new Date(input.getTime() + TZ_OFFSET_MIN * 60000);
  return { y: shifted.getUTCFullYear(), m: shifted.getUTCMonth(), d: shifted.getUTCDate() };
}

function makeLocalDate(parts: { y: number; m: number; d: number }, addDays: number, hours: number, minutes: number): Date {
  return new Date(Date.UTC(parts.y, parts.m, parts.d + addDays, hours, minutes, 0, 0) - TZ_OFFSET_MIN * 60000);
}

type FixtureMatch = {
  teamAId: string; teamBId: string; dayNumber: number; matchNumber: number; scheduledAt: Date; venue: string | null;
  groupName?: string | null; legNumber?: number; label?: string | null; phaseNumber?: number | null;
};

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTournamentDto, organizerId: string) {
    const { phases, venues, ...rest } = dto;
    return this.prisma.tournament.create({
      data: {
        ...rest,
        organizerId,
        venues: (venues || []).map(v => String(v).trim()).filter(Boolean),
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        rounds: phases && phases.length > 0 ? {
          create: phases.map((p, i) => ({
            roundNumber: i + 1,
            name: p.name || undefined,
            type: p.type as any,
            legs: p.legs || 1,
            teamsAdvancing: p.teamsAdvancing,
            groupsCount: p.groupsCount,
            isActive: i === 0,
          })),
        } : undefined,
      },
      include: { rounds: { orderBy: { roundNumber: 'asc' } } },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.tournament.findMany({
        where,
        skip, take: limit,
        include: { _count: { select: { teams: true, matches: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tournament.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: { include: { team: { include: { _count: { select: { players: { where: { deletedAt: null } } } } } } }, orderBy: [{ groupName: 'asc' }, { team: { name: 'asc' } }] },
        matches: {
          where: { deletedAt: null },
          orderBy: [{ dayNumber: 'asc' }, { scheduledAt: 'asc' }, { matchNumber: 'asc' }],
          include: { round: { select: { id: true, name: true, type: true, roundNumber: true } } },
        },
        rounds: { orderBy: { roundNumber: 'asc' }, include: { tiebreakers: { orderBy: { priority: 'asc' } }, _count: { select: { matches: { where: { deletedAt: null } } } } } },
        tiebreakers: { orderBy: { priority: 'asc' } },
      },
    });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');
    return tournament;
  }

  async update(id: string, dto: UpdateTournamentDto) {
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.venues) data.venues = dto.venues.map(v => String(v).trim()).filter(Boolean);
    return this.prisma.tournament.update({ where: { id }, data });
  }

  async addTeam(tournamentId: string, teamId: string, groupName?: string) {
    const exists = await this.prisma.tournamentTeam.findFirst({ where: { tournamentId, teamId } });
    if (exists) throw new BadRequestException('El equipo ya está inscrito en el torneo');
    return this.prisma.tournamentTeam.create({
      data: { tournamentId, teamId, groupName: groupName ? groupName.toUpperCase() : undefined },
    });
  }

  async addTeams(tournamentId: string, teamIds: string[], groupName?: string) {
    const existing = await this.prisma.tournamentTeam.findMany({ where: { tournamentId }, select: { teamId: true } });
    const have = new Set(existing.map(e => e.teamId));
    const toAdd = teamIds.filter(id => !have.has(id));
    if (toAdd.length === 0) return { added: 0 };
    await this.prisma.tournamentTeam.createMany({ data: toAdd.map(teamId => ({ tournamentId, teamId, groupName: groupName ? groupName.toUpperCase() : null })) });
    return { added: toAdd.length };
  }

  async setTeamGroup(tournamentId: string, teamId: string, groupName?: string | null) {
    const tt = await this.prisma.tournamentTeam.findFirst({ where: { tournamentId, teamId } });
    if (!tt) throw new NotFoundException('El equipo no está inscrito en el torneo');
    return this.prisma.tournamentTeam.update({
      where: { id: tt.id },
      data: { groupName: groupName ? String(groupName).trim().toUpperCase() : null },
    });
  }

  async distributeGroups(tournamentId: string, dto: DistributeGroupsDto) {
    const entries = await this.prisma.tournamentTeam.findMany({ where: { tournamentId }, include: { team: { select: { name: true } } }, orderBy: { team: { name: 'asc' } } });
    if (entries.length === 0) throw new BadRequestException('No hay equipos inscritos');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const groups = letters.slice(0, dto.groupsCount);
    const counts: Record<string, number> = Object.fromEntries(groups.map(g => [g, 0]));

    let pool = entries;
    if (dto.keepExisting) {
      for (const e of entries) if (e.groupName && counts[e.groupName] !== undefined) counts[e.groupName]++;
      pool = entries.filter(e => !e.groupName || counts[e.groupName] === undefined);
    }
    if (dto.method === 'random' || !dto.method) pool = this.shuffleArray([...pool]);

    const updates: { id: string; groupName: string }[] = [];
    if (dto.method === 'snake') {
      let dir = 1, idx = 0;
      for (const e of pool) {
        updates.push({ id: e.id, groupName: groups[idx] });
        idx += dir;
        if (idx >= groups.length) { idx = groups.length - 1; dir = -1; }
        if (idx < 0) { idx = 0; dir = 1; }
      }
    } else {
      for (const e of pool) {
        // Asignar al grupo con menos equipos (balanceado)
        const g = groups.reduce((best, cur) => counts[cur] < counts[best] ? cur : best, groups[0]);
        counts[g]++;
        updates.push({ id: e.id, groupName: g });
      }
    }
    await this.prisma.$transaction(updates.map(u => this.prisma.tournamentTeam.update({ where: { id: u.id }, data: { groupName: u.groupName } })));
    return { message: `${updates.length} equipos distribuidos en ${groups.length} grupos`, groups };
  }

  async removeTeam(tournamentId: string, teamId: string) {
    return this.prisma.tournamentTeam.deleteMany({
      where: { tournamentId, teamId },
    });
  }

  private async loadStandingsInput(tournamentId: string, roundId?: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: { include: { team: { select: { id: true, name: true, logoUrl: true } } } }, tiebreakers: { where: { roundId: roundId || null }, orderBy: { priority: 'asc' } } },
    });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');
    const where: any = { tournamentId, deletedAt: null };
    if (roundId) where.roundId = roundId;
    const matches = await this.prisma.match.findMany({
      where,
      include: { events: { where: { type: { in: ['YELLOW_CARD', 'RED_CARD', 'YELLOW_RED_CARD'] } }, select: { teamId: true, type: true } } },
    });
    let tiebreakers = tournament.tiebreakers.map(t => t.criteria as string);
    if (tiebreakers.length === 0 && roundId) {
      const general = await this.prisma.tournamentTiebreaker.findMany({ where: { tournamentId, roundId: null }, orderBy: { priority: 'asc' } });
      tiebreakers = general.map(t => t.criteria as string);
    }
    if (tiebreakers.length === 0) tiebreakers = DEFAULT_TIEBREAKERS;
    return { tournament, matches, tiebreakers };
  }

  async getStandings(tournamentId: string, roundId?: string, groupName?: string) {
    const { tournament, matches, tiebreakers } = await this.loadStandingsInput(tournamentId, roundId);
    // En una ronda, los grupos se toman de los partidos (si existen) o de la inscripcion
    const groupByTeam = new Map<string, string | null>();
    for (const tt of tournament.teams) groupByTeam.set(tt.teamId, tt.groupName);
    if (roundId) {
      const fromMatches = new Map<string, string | null>();
      for (const m of matches) {
        if (m.groupName) { fromMatches.set(m.teamAId, m.groupName); fromMatches.set(m.teamBId, m.groupName); }
      }
      if (fromMatches.size > 0) for (const [k, v] of fromMatches) groupByTeam.set(k, v);
    }
    let teams = tournament.teams.map(tt => ({ id: tt.team.id, name: tt.team.name, logoUrl: tt.team.logoUrl, groupName: groupByTeam.get(tt.teamId) || null }));
    if (roundId) {
      const participating = new Set(matches.flatMap(m => [m.teamAId, m.teamBId]));
      if (participating.size > 0) teams = teams.filter(t => participating.has(t.id));
    }
    if (groupName) teams = teams.filter(t => (t.groupName || '').toUpperCase() === groupName.toUpperCase());
    const rows = computeStandings(
      teams,
      matches.map(m => ({ teamAId: m.teamAId, teamBId: m.teamBId, scoreA: m.scoreA, scoreB: m.scoreB, status: m.status, scheduledAt: m.scheduledAt, cards: m.events })),
      { winPoints: tournament.winPoints, drawPoints: tournament.drawPoints, lossPoints: tournament.lossPoints },
      tiebreakers,
    );
    return rows;
  }

  async getGroupedStandings(tournamentId: string, roundId?: string) {
    const rows = await this.getStandings(tournamentId, roundId);
    const hasGroups = rows.some(r => r.groupName);
    return { hasGroups, overall: rows, groups: hasGroups ? groupStandings(rows) : { General: rows } };
  }

  /** Equipos clasificados de una ronda segun teamsAdvancing (por grupo si aplica) + mejores terceros si falta cupo. */
  async getQualified(tournamentId: string, roundId: string) {
    const round = await this.prisma.tournamentRound.findUnique({ where: { id: roundId } });
    if (!round) throw new NotFoundException('Ronda no encontrada');
    const { hasGroups, overall, groups } = await this.getGroupedStandings(tournamentId, roundId);
    const totalMatches = await this.prisma.match.count({ where: { tournamentId, roundId, deletedAt: null } });
    const finishedMatches = await this.prisma.match.count({ where: { tournamentId, roundId, deletedAt: null, status: 'FINISHED' } });

    if (round.type === 'KNOCKOUT') {
      // Ganadores de la ultima fase jugada
      const matches = await this.prisma.match.findMany({ where: { tournamentId, roundId, deletedAt: null }, orderBy: [{ phaseNumber: 'asc' }, { matchNumber: 'asc' }] });
      const lastPhase = Math.max(0, ...matches.map(m => m.phaseNumber || 1));
      const phaseMatches = matches.filter(m => (m.phaseNumber || 1) === lastPhase);
      const winners = phaseMatches.map(m => this.resolveWinner(m, phaseMatches)).filter(Boolean) as string[];
      const teams = await this.prisma.team.findMany({ where: { id: { in: winners } }, select: { id: true, name: true, logoUrl: true } });
      return { roundType: round.type, complete: finishedMatches === totalMatches && totalMatches > 0, qualified: winners.map((id, i) => ({ ...teams.find(t => t.id === id)!, seed: i + 1, groupName: null, position: 1 })), pending: phaseMatches.filter(m => m.status !== 'FINISHED').length };
    }

    const perGroup = round.teamsAdvancing || (round.advanceAll ? overall.length : Math.max(1, Math.floor(overall.length / 2)));
    let qualified: (StandingRow & { seed: number })[] = [];
    let thirds: StandingRow[] = [];
    if (hasGroups) {
      const names = Object.keys(groups).sort();
      for (const g of names) {
        const rows = groups[g];
        qualified.push(...rows.slice(0, perGroup).map(r => ({ ...r, seed: 0 })));
        if (rows[perGroup]) thirds.push(rows[perGroup]);
      }
      // Orden: primeros de cada grupo (A1, B1, C1...), luego segundos (A2, B2...).
      // Con emparejamiento sembrado (1 vs ultimo) esto produce cruces entre grupos: A1-B2, B1-A2 / A1-D2, B1-C2...
      qualified.sort((a, b) => (a.position! - b.position!) || (a.groupName || '').localeCompare(b.groupName || ''));
      thirds.sort((a, b) => (b.points - a.points) || (b.goalDifference - a.goalDifference) || (b.goalsFor - a.goalsFor));
    } else {
      qualified = overall.slice(0, perGroup).map(r => ({ ...r, seed: 0 }));
    }
    qualified.forEach((q, i) => (q.seed = i + 1));
    return {
      roundType: round.type,
      complete: finishedMatches === totalMatches && totalMatches > 0,
      pending: totalMatches - finishedMatches,
      perGroup,
      qualified,
      bestThirds: thirds,
    };
  }

  private resolveWinner(m: any, siblings: any[], override?: string): string | null {
    if (override) return override;
    if (m.winnerTeamId) return m.winnerTeamId;
    if (m.status !== 'FINISHED') return null;
    // Ida y vuelta: buscar el partido de vuelta con los mismos equipos invertidos y misma fase
    const pair = siblings.find(o => o.id !== m.id && o.teamAId === m.teamBId && o.teamBId === m.teamAId && (o.phaseNumber || 1) === (m.phaseNumber || 1));
    if (pair) {
      if (pair.status !== 'FINISHED') return null;
      if (pair.winnerTeamId) return pair.winnerTeamId;
      const aGoals = (m.scoreA ?? 0) + (pair.scoreB ?? 0);
      const bGoals = (m.scoreB ?? 0) + (pair.scoreA ?? 0);
      if (aGoals > bGoals) return m.teamAId;
      if (bGoals > aGoals) return m.teamBId;
      return null;
    }
    const a = m.scoreA ?? 0, b = m.scoreB ?? 0;
    if (a > b) return m.teamAId;
    if (b > a) return m.teamBId;
    return null;
  }

  async generateFixture(tournamentId: string, dto: GenerateFixtureDto) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: { include: { team: true } }, rounds: true },
    });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');

    const round = dto.roundId ? tournament.rounds.find(r => r.id === dto.roundId) : null;
    if (dto.roundId && !round) throw new NotFoundException('Ronda no encontrada');

    // Partidos existentes en el alcance (ronda o torneo completo)
    const scopeWhere: any = { tournamentId, deletedAt: null };
    if (round) scopeWhere.roundId = round.id;
    const existing = await this.prisma.match.findMany({ where: scopeWhere, select: { id: true, status: true } });
    const played = existing.filter(m => ['IN_PROGRESS', 'HALFTIME', 'FINISHED'].includes(m.status));
    if (existing.length > 0) {
      if (!dto.replace) {
        throw new BadRequestException(round
          ? `La ronda "${round.name || 'Ronda ' + round.roundNumber}" ya tiene ${existing.length} partidos. Active "Reemplazar" para regenerar los no jugados o elimínelos primero.`
          : 'El torneo ya tiene partidos programados. Elimine los partidos existentes antes de generar un nuevo fixture.');
      }
      const removable = existing.filter(m => !played.some(p => p.id === m.id));
      if (removable.length > 0) {
        await this.prisma.match.updateMany({ where: { id: { in: removable.map(m => m.id) } }, data: { deletedAt: new Date() } });
      }
    }

    // Equipos participantes
    let entries = tournament.teams.map(t => ({ teamId: t.teamId, groupName: t.groupName }));
    if (dto.teamIds && dto.teamIds.length > 0) {
      const order = new Map(dto.teamIds.map((id, i) => [id, i]));
      entries = entries.filter(e => order.has(e.teamId)).sort((a, b) => order.get(a.teamId)! - order.get(b.teamId)!);
    }
    if (entries.length < 2) throw new BadRequestException('Se necesitan al menos 2 equipos para generar el fixture.');
    if (dto.shuffle) entries = this.shuffleArray([...entries]);

    const legs = dto.legs || round?.legs || 1;
    const intervalDays = dto.intervalDays || 7;
    const matchTime = dto.matchTime || '15:00';
    const slotMinutes = dto.slotMinutes || 0;
    const startDate: Date | string = dto.startDate ? dto.startDate : (round?.startDate || tournament.startDate);
    const defaultVenue = dto.defaultVenue || tournament.venues?.[0] || null;
    const mode = round ? round.type : tournament.type;

    let matchesData: FixtureMatch[] = [];
    switch (mode) {
      case 'LEAGUE':
      case 'ROUND_ROBIN':
      case 'POINTS_CLASSIFICATION':
        matchesData = this.generateLeagueFixture(entries.map(t => t.teamId), legs, startDate, intervalDays, matchTime, defaultVenue);
        break;
      case 'KNOCKOUT':
      case 'CUP':
        matchesData = this.generateKnockoutFixture(entries.map(t => t.teamId), startDate, intervalDays, matchTime, defaultVenue, dto.pairing || 'seeded', dto.pairs, legs);
        break;
      case 'GROUPS':
      case 'GROUP_STAGE':
        matchesData = this.generateGroupsFixture(entries, legs, startDate, intervalDays, matchTime, defaultVenue);
        break;
      default:
        matchesData = this.generateLeagueFixture(entries.map(t => t.teamId), legs, startDate, intervalDays, matchTime, defaultVenue);
    }

    // Escalonar horarios dentro de cada jornada
    if (slotMinutes > 0) {
      const byDay = new Map<number, FixtureMatch[]>();
      for (const m of matchesData) (byDay.get(m.dayNumber) || byDay.set(m.dayNumber, []).get(m.dayNumber)!).push(m);
      for (const list of byDay.values()) list.forEach((m, i) => { m.scheduledAt = new Date(m.scheduledAt.getTime() + i * slotMinutes * 60000); });
    }
    // Rotar sedes si hay varias
    if (!dto.defaultVenue && tournament.venues && tournament.venues.length > 1) {
      matchesData.forEach((m, i) => { m.venue = tournament.venues[i % tournament.venues.length]; });
    }

    // Continuar numeracion de partidos
    const agg = await this.prisma.match.aggregate({ where: { tournamentId, deletedAt: null }, _max: { matchNumber: true } });
    const offset = agg._max.matchNumber || 0;

    const created = await this.prisma.match.createMany({
      data: matchesData.map(m => ({
        tournamentId,
        teamAId: m.teamAId,
        teamBId: m.teamBId,
        dayNumber: m.dayNumber,
        matchNumber: m.matchNumber + offset,
        scheduledAt: m.scheduledAt,
        venue: m.venue,
        status: 'SCHEDULED',
        roundId: round?.id || null,
        groupName: m.groupName || null,
        legNumber: m.legNumber || 1,
        label: m.label || null,
        phaseNumber: m.phaseNumber || null,
      })),
    });

    if (round && !round.isActive) {
      await this.prisma.tournamentRound.update({ where: { id: round.id }, data: { isActive: true } });
    }

    return {
      message: `Fixture generado exitosamente: ${created.count} partidos creados`,
      matchesCreated: created.count,
      totalDays: matchesData.length > 0 ? Math.max(...matchesData.map(m => m.dayNumber)) : 0,
    };
  }

  /** Genera la siguiente fase de una ronda eliminatoria a partir de los ganadores de la fase anterior. */
  async generateNextPhase(tournamentId: string, roundId: string, dto: NextPhaseDto) {
    const round = await this.prisma.tournamentRound.findUnique({ where: { id: roundId } });
    if (!round || round.tournamentId !== tournamentId) throw new NotFoundException('Ronda no encontrada');
    if (round.type !== 'KNOCKOUT') throw new BadRequestException('Solo las rondas de eliminación directa generan fases');
    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    const matches = await this.prisma.match.findMany({ where: { tournamentId, roundId, deletedAt: null }, orderBy: [{ phaseNumber: 'asc' }, { matchNumber: 'asc' }] });
    if (matches.length === 0) throw new BadRequestException('La ronda no tiene partidos. Genere primero la fase inicial.');
    const lastPhase = Math.max(...matches.map(m => m.phaseNumber || 1));
    const phaseMatches = matches.filter(m => (m.phaseNumber || 1) === lastPhase);
    const pending = phaseMatches.filter(m => m.status !== 'FINISHED');
    if (pending.length > 0) throw new BadRequestException(`Aún hay ${pending.length} partido(s) sin finalizar en la fase actual`);

    // Ganadores (uno por emparejamiento; en ida y vuelta se agrupa por par)
    const seenPairs = new Set<string>();
    const winners: string[] = [];
    const unresolved: string[] = [];
    for (const m of phaseMatches) {
      const key = [m.teamAId, m.teamBId].sort().join('|');
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      const override = dto.winners?.[m.id] || Object.entries(dto.winners || {}).find(([id]) => phaseMatches.some(x => x.id === id && [x.teamAId, x.teamBId].sort().join('|') === key))?.[1];
      const w = this.resolveWinner(m, phaseMatches, override);
      if (w) winners.push(w); else unresolved.push(m.id);
    }
    if (unresolved.length > 0) {
      return { needsWinners: unresolved, message: 'Hay empates sin resolver. Indique el ganador (penales) de cada partido marcado.' };
    }
    if (winners.length < 2) throw new BadRequestException('La eliminatoria ya tiene campeón: no hay más fases por generar.');

    let pairs: string[][] = dto.pairs && dto.pairs.length > 0 ? dto.pairs : [];
    if (pairs.length === 0) for (let i = 0; i + 1 < winners.length; i += 2) pairs.push([winners[i], winners[i + 1]]);
    const [hours, minutes] = (dto.matchTime || '15:00').split(':').map(Number);
    const lastDate = new Date(Math.max(...phaseMatches.map(m => m.scheduledAt.getTime())));
    const baseParts = localDateParts(dto.startDate ? dto.startDate : new Date(lastDate.getTime() + 7 * 86400000));
    const base = makeLocalDate(baseParts, 0, hours, minutes);
    const agg = await this.prisma.match.aggregate({ where: { tournamentId, deletedAt: null }, _max: { matchNumber: true, dayNumber: true } });
    const label = phaseLabelFor(pairs.length);
    const venue = dto.defaultVenue || tournament?.venues?.[0] || phaseMatches[0]?.venue || null;
    const data: any[] = [];
    pairs.forEach((p, i) => {
      const legsCount = round.legs || 1;
      for (let leg = 1; leg <= legsCount; leg++) {
        const date = new Date(base.getTime() + (leg - 1) * 7 * 86400000 + i * (dto.slotMinutes || 0) * 60000);
        data.push({
          tournamentId, roundId, teamAId: leg === 1 ? p[0] : p[1], teamBId: leg === 1 ? p[1] : p[0],
          scheduledAt: date, venue, status: 'SCHEDULED',
          dayNumber: (agg._max.dayNumber || 0) + leg, matchNumber: (agg._max.matchNumber || 0) + data.length + 1,
          phaseNumber: lastPhase + 1, legNumber: leg, label: pairs.length === 1 ? label : `${label} ${i + 1}`,
        });
      }
    });
    const created = await this.prisma.match.createMany({ data });
    return { message: `${label}: ${created.count} partido(s) creados`, matchesCreated: created.count, phaseNumber: lastPhase + 1, label };
  }

  async bulkUpdateMatches(tournamentId: string, dto: BulkUpdateMatchesDto) {
    const ids = dto.matches.map(m => m.id);
    const existing = await this.prisma.match.findMany({ where: { id: { in: ids }, tournamentId } });
    const map = new Map(existing.map(m => [m.id, m]));
    const ops: any[] = [];
    for (const item of dto.matches) {
      const m = map.get(item.id);
      if (!m) continue;
      const data: any = {};
      if (item.teamAId) data.teamAId = item.teamAId;
      if (item.teamBId) data.teamBId = item.teamBId;
      if ((data.teamAId || m.teamAId) === (data.teamBId || m.teamBId)) throw new BadRequestException('Un partido no puede tener el mismo equipo en ambos lados');
      if (item.scheduledAt) data.scheduledAt = new Date(item.scheduledAt);
      if (item.venue !== undefined) data.venue = item.venue || null;
      if (item.dayNumber !== undefined) data.dayNumber = item.dayNumber;
      if (item.matchNumber !== undefined) data.matchNumber = item.matchNumber;
      if (item.roundId !== undefined) data.roundId = item.roundId || null;
      if (item.groupName !== undefined) data.groupName = item.groupName ? item.groupName.toUpperCase() : null;
      if (item.label !== undefined) data.label = item.label || null;
      if (item.legNumber !== undefined) data.legNumber = item.legNumber;
      if (item.refereeId !== undefined) data.refereeId = item.refereeId || null;
      if (item.status && ['SCHEDULED', 'POSTPONED', 'CANCELLED', 'SUSPENDED'].includes(item.status) && m.status !== 'FINISHED') data.status = item.status;
      if (Object.keys(data).length > 0) ops.push(this.prisma.match.update({ where: { id: item.id }, data }));
    }
    if (ops.length > 0) await this.prisma.$transaction(ops);
    return { message: `${ops.length} partido(s) actualizados`, updated: ops.length };
  }

  async swapMatchTeams(tournamentId: string, matchId: string) {
    const m = await this.prisma.match.findFirst({ where: { id: matchId, tournamentId } });
    if (!m) throw new NotFoundException('Partido no encontrado');
    if (m.status === 'FINISHED') throw new BadRequestException('No se puede invertir un partido finalizado');
    return this.prisma.match.update({ where: { id: matchId }, data: { teamAId: m.teamBId, teamBId: m.teamAId } });
  }

  /** Renumera jornadas y partidos segun fecha programada. */
  async renumberFixture(tournamentId: string, roundId?: string) {
    const where: any = { tournamentId, deletedAt: null };
    if (roundId) where.roundId = roundId;
    const matches = await this.prisma.match.findMany({ where, orderBy: [{ scheduledAt: 'asc' }, { matchNumber: 'asc' }] });
    const ops: any[] = [];
    let day = 0; let lastDayKey = '';
    matches.forEach((m, i) => {
      const key = m.scheduledAt.toISOString().slice(0, 10);
      if (key !== lastDayKey) { day++; lastDayKey = key; }
      ops.push(this.prisma.match.update({ where: { id: m.id }, data: { dayNumber: day, matchNumber: i + 1 } }));
    });
    if (ops.length) await this.prisma.$transaction(ops);
    return { message: `${ops.length} partidos renumerados en ${day} jornadas` };
  }

  async deleteFixture(tournamentId: string, userId: string) {
    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');

    // Soft delete: move matches to trash instead of hard delete
    const matchesToDelete = await this.prisma.match.findMany({
      where: { tournamentId, deletedAt: null, status: { in: ['SCHEDULED', 'POSTPONED', 'CANCELLED'] } },
      select: { id: true },
    });

    if (matchesToDelete.length === 0) {
      throw new BadRequestException('No hay partidos eliminables (programados, aplazados o cancelados).');
    }

    await this.prisma.match.updateMany({
      where: { id: { in: matchesToDelete.map(m => m.id) } },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_FIXTURE',
        entity: 'Tournament',
        entityId: tournamentId,
        oldValue: { tournamentName: tournament.name, matchesDeleted: matchesToDelete.length },
      },
    });

    return { message: `${matchesToDelete.length} partidos movidos a la papelera`, matchesDeleted: matchesToDelete.length };
  }

  async restoreFixture(tournamentId: string, userId: string) {
    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');

    const trashed = await this.prisma.match.findMany({
      where: { tournamentId, deletedAt: { not: null } },
      select: { id: true },
    });

    if (trashed.length === 0) {
      throw new BadRequestException('No hay partidos en la papelera para restaurar.');
    }

    await this.prisma.match.updateMany({
      where: { id: { in: trashed.map(m => m.id) } },
      data: { deletedAt: null, deletedBy: null },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'RESTORE_FIXTURE',
        entity: 'Tournament',
        entityId: tournamentId,
        newValue: { tournamentName: tournament.name, matchesRestored: trashed.length },
      },
    });

    return { message: `${trashed.length} partidos restaurados`, matchesRestored: trashed.length };
  }

  async getTrashedMatchesCount(tournamentId: string): Promise<number> {
    return this.prisma.match.count({
      where: { tournamentId, deletedAt: { not: null } },
    });
  }

  // --- Algoritmos de fixture ---

  private generateLeagueFixture(
    teamIds: string[], legs: number, startDate: Date | string, intervalDays: number, matchTime: string, venue: string | null,
  ) {
    const base = localDateParts(startDate);
    const teams = [...teamIds];
    // Si es impar, agregar "bye" (descansa)
    const hasBye = teams.length % 2 !== 0;
    if (hasBye) teams.push('BYE');

    const n = teams.length;
    const rounds = n - 1;
    const matchesPerRound = n / 2;
    const [hours, minutes] = matchTime.split(':').map(Number);

    const matches: FixtureMatch[] = [];
    let matchNumber = 0;

    // Algoritmo de round-robin (rotacion circular)
    const fixed = teams[0];
    const rotating = teams.slice(1);

    for (let round = 0; round < rounds; round++) {
      const dayNumber = round + 1;
      const matchDate = makeLocalDate(base, round * intervalDays, hours, minutes);

      const currentOrder = [fixed, ...rotating];

      for (let i = 0; i < matchesPerRound; i++) {
        const home = currentOrder[i];
        const away = currentOrder[n - 1 - i];

        if (home === 'BYE' || away === 'BYE') continue;

        matchNumber++;
        matches.push({
          teamAId: round % 2 === 0 ? home : away, // Alternar localias
          teamBId: round % 2 === 0 ? away : home,
          dayNumber,
          matchNumber,
          scheduledAt: new Date(matchDate),
          venue,
        });
      }

      // Rotar: ultimo elemento al inicio
      rotating.unshift(rotating.pop()!);
    }

    // Vuelta (ida y vuelta)
    if (legs === 2) {
      const firstLegMatches = [...matches];
      for (const m of firstLegMatches) {
        matchNumber++;
        const returnDayNumber = m.dayNumber + rounds;
        const returnDate = makeLocalDate(base, (returnDayNumber - 1) * intervalDays, hours, minutes);

        matches.push({
          teamAId: m.teamBId, // Invertir localia
          teamBId: m.teamAId,
          dayNumber: returnDayNumber,
          matchNumber,
          scheduledAt: returnDate,
          venue,
        });
      }
    }

    return matches;
  }

  private generateKnockoutFixture(
    teamIds: string[], startDate: Date | string, intervalDays: number, matchTime: string, venue: string | null,
    pairing: 'seeded' | 'random' | 'manual' = 'seeded', manualPairs?: string[][], legs = 1,
  ): FixtureMatch[] {
    const [hours, minutes] = matchTime.split(':').map(Number);
    const base = localDateParts(startDate);
    const matches: FixtureMatch[] = [];
    let pairs: string[][] = [];

    if (pairing === 'manual' && manualPairs && manualPairs.length > 0) {
      pairs = manualPairs.filter(p => p.length === 2 && p[0] && p[1] && p[0] !== p[1]);
    } else {
      const teams = pairing === 'random' ? this.shuffleArray([...teamIds]) : [...teamIds];
      const totalSlots = Math.pow(2, Math.ceil(Math.log2(teams.length)));
      const byes = totalSlots - teams.length;
      // Los mejores sembrados (primeros) descansan si hay byes
      const playing = teams.slice(byes);
      if (pairing === 'seeded') {
        // 1 vs ultimo, 2 vs penultimo...
        for (let i = 0; i < playing.length / 2; i++) pairs.push([playing[i], playing[playing.length - 1 - i]]);
      } else {
        for (let i = 0; i + 1 < playing.length; i += 2) pairs.push([playing[i], playing[i + 1]]);
      }
    }

    const label = phaseLabelFor(pairs.length);
    let matchNumber = 0;
    pairs.forEach((p, i) => {
      for (let leg = 1; leg <= legs; leg++) {
        const d = makeLocalDate(base, (leg - 1) * intervalDays, hours, minutes);
        matchNumber++;
        matches.push({
          teamAId: leg === 1 ? p[0] : p[1], teamBId: leg === 1 ? p[1] : p[0],
          dayNumber: leg, matchNumber, scheduledAt: d, venue,
          phaseNumber: 1, legNumber: leg, label: pairs.length === 1 ? label : `${label} ${i + 1}`,
        });
      }
    });
    return matches;
  }

  private generateGroupsFixture(
    teamEntries: { teamId: string; groupName: string | null }[],
    legs: number, startDate: Date | string, intervalDays: number, matchTime: string, venue: string | null,
  ): FixtureMatch[] {
    const groups: Record<string, string[]> = {};
    for (const entry of teamEntries) {
      const group = (entry.groupName || 'A').toUpperCase();
      (groups[group] ||= []).push(entry.teamId);
    }
    const allMatches: FixtureMatch[] = [];
    for (const [groupName, groupTeams] of Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))) {
      if (groupTeams.length < 2) continue;
      const groupMatches = this.generateLeagueFixture(groupTeams, legs, startDate, intervalDays, matchTime, venue);
      for (const m of groupMatches) allMatches.push({ ...m, groupName });
    }
    // Ordenar por jornada y grupo, y renumerar
    allMatches.sort((a, b) => a.dayNumber - b.dayNumber || (a.groupName || '').localeCompare(b.groupName || '') || a.matchNumber - b.matchNumber);
    allMatches.forEach((m, i) => { m.matchNumber = i + 1; });
    return allMatches;
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // --- Tournament Rounds ---
  async createRound(tournamentId: string, dto: CreateRoundDto) {
    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');

    const dup = await this.prisma.tournamentRound.findFirst({ where: { tournamentId, roundNumber: dto.roundNumber } });
    if (dup) throw new BadRequestException(`Ya existe la ronda número ${dto.roundNumber}`);
    const { startDate, ...rest } = dto;
    return this.prisma.tournamentRound.create({
      data: { tournamentId, ...rest, type: dto.type as any, startDate: startDate ? new Date(startDate) : undefined },
    });
  }

  async getRounds(tournamentId: string) {
    const rounds = await this.prisma.tournamentRound.findMany({
      where: { tournamentId },
      include: { tiebreakers: { orderBy: { priority: 'asc' } }, _count: { select: { matches: { where: { deletedAt: null } } } } },
      orderBy: { roundNumber: 'asc' },
    });
    const finished = await this.prisma.match.groupBy({ by: ['roundId'], where: { tournamentId, deletedAt: null, status: 'FINISHED' }, _count: { _all: true } });
    const finishedMap = new Map(finished.map(f => [f.roundId, f._count._all]));
    return rounds.map(r => ({ ...r, finishedMatches: finishedMap.get(r.id) || 0 }));
  }

  async updateRound(roundId: string, dto: Partial<CreateRoundDto>) {
    const { startDate, ...rest } = dto;
    const data: any = { ...rest };
    if (dto.type) data.type = dto.type as any;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    return this.prisma.tournamentRound.update({ where: { id: roundId }, data });
  }

  async deleteRound(roundId: string) {
    const matchCount = await this.prisma.match.count({ where: { roundId, deletedAt: null, status: { in: ['IN_PROGRESS', 'HALFTIME', 'FINISHED'] } } });
    if (matchCount > 0) throw new BadRequestException('No se puede eliminar una ronda con partidos en curso o finalizados.');
    await this.prisma.match.deleteMany({ where: { roundId, status: { in: ['SCHEDULED', 'POSTPONED', 'CANCELLED'] } } });
    return this.prisma.tournamentRound.delete({ where: { id: roundId } });
  }

  // --- Tiebreakers ---
  async configureTiebreakers(tournamentId: string, dto: ConfigureTiebreakersDto) {
    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');

    // Delete existing tiebreakers for this scope
    await this.prisma.tournamentTiebreaker.deleteMany({
      where: { tournamentId, roundId: dto.roundId || null },
    });

    // Create new ones
    const data = dto.tiebreakers.map(tb => ({
      tournamentId,
      roundId: dto.roundId || null,
      criteria: tb.criteria as any,
      priority: tb.priority,
    }));

    await this.prisma.tournamentTiebreaker.createMany({ data });
    return this.prisma.tournamentTiebreaker.findMany({
      where: { tournamentId, roundId: dto.roundId || null },
      orderBy: { priority: 'asc' },
    });
  }

  async getTiebreakers(tournamentId: string, roundId?: string) {
    return this.prisma.tournamentTiebreaker.findMany({
      where: { tournamentId, roundId: roundId || null },
      orderBy: { priority: 'asc' },
    });
  }

  // --- Export to Excel ---
  async exportToExcel(tournamentId: string): Promise<Buffer> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        teams: { include: { team: { include: { players: { where: { deletedAt: null } } } } } },
        matches: {
          where: { deletedAt: null },
          orderBy: { scheduledAt: 'asc' },
          include: {
            events: { include: { player: { select: { firstName: true, lastName: true, jerseyNumber: true } } } },
          },
        },
      },
    });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');

    const wb = XLSX.utils.book_new();

    // Sheet 1: Tournament Info
    const infoData = [
      ['Torneo', tournament.name],
      ['Tipo', tournament.type],
      ['Estado', tournament.status],
      ['Fecha inicio', tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('es-CO') : ''],
      ['Fecha fin', tournament.endDate ? new Date(tournament.endDate).toLocaleDateString('es-CO') : ''],
      ['Puntos Victoria', tournament.winPoints],
      ['Puntos Empate', tournament.drawPoints],
      ['Puntos Derrota', tournament.lossPoints],
      ['Max Amarillas', tournament.maxYellowCards],
      ['Equipos', tournament.teams?.length || 0],
      ['Partidos', tournament.matches?.length || 0],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    wsInfo['!cols'] = [{ wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Torneo');

    // Sheet 2: Standings
    const standings = await this.getStandings(tournamentId);
    const standingsHeader = ['Pos', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts'];
    const standingsRows = standings.map((s, i) => [
      i + 1, s.teamName, s.played, s.won, s.drawn, s.lost,
      s.goalsFor, s.goalsAgainst, s.goalDifference, s.points,
    ]);
    const wsStandings = XLSX.utils.aoa_to_sheet([standingsHeader, ...standingsRows]);
    wsStandings['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }, { wch: 5 }];
    XLSX.utils.book_append_sheet(wb, wsStandings, 'Posiciones');

    // Sheet 3: Teams & Players
    const playersHeader = ['Equipo', '#', 'Nombre', 'Apellido', 'Posicion', 'Estado'];
    const playersRows: any[][] = [];
    for (const tt of tournament.teams || []) {
      for (const p of tt.team.players || []) {
        playersRows.push([tt.team.name, p.jerseyNumber || '', p.firstName, p.lastName, p.position || '', p.status]);
      }
    }
    const wsPlayers = XLSX.utils.aoa_to_sheet([playersHeader, ...playersRows]);
    wsPlayers['!cols'] = [{ wch: 25 }, { wch: 5 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsPlayers, 'Jugadores');

    // Sheet 4: Matches
    const teamMap = new Map((tournament.teams || []).map(tt => [tt.teamId, tt.team.name]));
    const matchesHeader = ['Jornada', 'Fecha', 'Hora', 'Grupo', 'Fase', 'Local', 'Goles L', 'Goles V', 'Visitante', 'Estado', 'Sede'];
    const matchesRows = (tournament.matches || []).map((m) => [
      m.dayNumber || '',
      new Date(m.scheduledAt).toLocaleDateString('es-CO'),
      new Date(m.scheduledAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      m.groupName || '',
      m.label || '',
      teamMap.get(m.teamAId) || m.teamAId,
      m.scoreA ?? '',
      m.scoreB ?? '',
      teamMap.get(m.teamBId) || m.teamBId,
      m.status,
      m.venue || '',
    ]);
    const wsMatches = XLSX.utils.aoa_to_sheet([matchesHeader, ...matchesRows]);
    wsMatches['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 18 }, { wch: 25 }, { wch: 8 }, { wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsMatches, 'Partidos');

    // Sheet 5: Events / Goals / Cards
    const eventsHeader = ['Partido', 'Minuto', 'Tipo', 'Jugador', 'Equipo'];
    const eventsRows: any[][] = [];
    for (const m of tournament.matches || []) {
      const matchLabel = `${teamMap.get(m.teamAId) || '?'} vs ${teamMap.get(m.teamBId) || '?'}`;
      for (const e of m.events || []) {
        eventsRows.push([
          matchLabel,
          e.minute || '',
          e.type,
          e.player ? `#${e.player.jerseyNumber || '?'} ${e.player.firstName} ${e.player.lastName}` : '',
          teamMap.get(e.teamId) || e.teamId,
        ]);
      }
    }
    const wsEvents = XLSX.utils.aoa_to_sheet([eventsHeader, ...eventsRows]);
    wsEvents['!cols'] = [{ wch: 40 }, { wch: 8 }, { wch: 20 }, { wch: 30 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsEvents, 'Eventos');

    // Sheet 6: Sanctions
    const sanctions = await this.prisma.sanction.findMany({
      where: { tournamentId },
      include: { player: { select: { firstName: true, lastName: true, jerseyNumber: true, team: { select: { name: true } } } } },
      orderBy: { imposedAt: 'desc' },
    });
    const sanctionsHeader = ['Jugador', '#', 'Equipo', 'Tipo', 'Partidos', 'Cumplidos', 'Activa', 'Motivo', 'Fecha'];
    const sanctionsRows = sanctions.map(s => [
      `${s.player.firstName} ${s.player.lastName}`,
      s.player.jerseyNumber || '',
      s.player.team?.name || '',
      s.type,
      s.matchesBanned,
      s.matchesServed,
      s.isActive ? 'SI' : 'NO',
      s.reason || '',
      new Date(s.imposedAt).toLocaleDateString('es-CO'),
    ]);
    const wsSanctions = XLSX.utils.aoa_to_sheet([sanctionsHeader, ...sanctionsRows]);
    wsSanctions['!cols'] = [{ wch: 25 }, { wch: 5 }, { wch: 25 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 40 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsSanctions, 'Sanciones');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  // --- Soft Delete (Papelera) ---
  async softDelete(id: string, password: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Contraseña incorrecta');

    const tournament = await this.prisma.tournament.findUnique({ where: { id } });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');
    if (tournament.deletedAt) throw new BadRequestException('El torneo ya está en la papelera');

    await this.prisma.tournament.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Tournament',
        entityId: id,
        oldValue: { name: tournament.name, type: tournament.type },
      },
    });

    return { message: 'Torneo movido a la papelera' };
  }

  async findTrashed(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: { not: null } };
    const [data, total] = await Promise.all([
      this.prisma.tournament.findMany({
        where,
        skip, take: limit,
        include: { _count: { select: { teams: true, matches: true } } },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.tournament.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async restore(id: string) {
    const tournament = await this.prisma.tournament.findUnique({ where: { id } });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');
    if (!tournament.deletedAt) throw new BadRequestException('El torneo no está en la papelera');

    return this.prisma.tournament.update({
      where: { id },
      data: { deletedAt: null, deletedBy: null },
    });
  }

  // --- Add team mid-tournament ---
  async addTeamMidTournament(tournamentId: string, teamId: string, groupName?: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: true, matches: true },
    });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');

    // Add team to tournament
    const tournamentTeam = await this.prisma.tournamentTeam.create({
      data: { tournamentId, teamId, groupName },
    });

    // If there are existing matches, generate additional matches for the new team
    if (tournament.matches.length > 0) {
      const existingTeamIds = tournament.teams.map(t => t.teamId);
      const lastDayNumber = Math.max(...tournament.matches.map(m => m.dayNumber || 0), 0);
      const lastMatchNumber = Math.max(...tournament.matches.map(m => m.matchNumber || 0), 0);

      // Get the latest match to determine scheduling pattern
      const lastMatch = tournament.matches.sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())[0];
      const intervalDays = 7;

      const newMatches: any[] = [];
      let matchNum = lastMatchNumber;
      let dayNum = lastDayNumber;

      for (const existingTeamId of existingTeamIds) {
        matchNum++;
        dayNum++;
        const matchDate = new Date(lastMatch?.scheduledAt || new Date());
        matchDate.setDate(matchDate.getDate() + (dayNum - lastDayNumber) * intervalDays);

        newMatches.push({
          tournamentId,
          teamAId: teamId,
          teamBId: existingTeamId,
          dayNumber: dayNum,
          matchNumber: matchNum,
          scheduledAt: matchDate,
          status: 'SCHEDULED',
        });
      }

      if (newMatches.length > 0) {
        await this.prisma.match.createMany({ data: newMatches });
      }
    }

    return tournamentTeam;
  }
}
