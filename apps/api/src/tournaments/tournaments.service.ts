import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { GenerateFixtureDto } from './dto/generate-fixture.dto';

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTournamentDto, organizerId: string) {
    return this.prisma.tournament.create({
      data: { ...dto, organizerId, startDate: new Date(dto.startDate), endDate: dto.endDate ? new Date(dto.endDate) : undefined },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.tournament.findMany({
        skip, take: limit,
        include: { _count: { select: { teams: true, matches: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tournament.count(),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: { include: { team: true } },
        matches: { orderBy: { scheduledAt: 'asc' } },
      },
    });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');
    return tournament;
  }

  async update(id: string, dto: UpdateTournamentDto) {
    return this.prisma.tournament.update({
      where: { id },
      data: { ...dto, startDate: dto.startDate ? new Date(dto.startDate) : undefined, endDate: dto.endDate ? new Date(dto.endDate) : undefined },
    });
  }

  async addTeam(tournamentId: string, teamId: string, groupName?: string) {
    return this.prisma.tournamentTeam.create({
      data: { tournamentId, teamId, groupName },
    });
  }

  async removeTeam(tournamentId: string, teamId: string) {
    return this.prisma.tournamentTeam.deleteMany({
      where: { tournamentId, teamId },
    });
  }

  async getStandings(tournamentId: string) {
    const teams = await this.prisma.tournamentTeam.findMany({
      where: { tournamentId },
      include: { team: true },
    });

    const matches = await this.prisma.match.findMany({
      where: { tournamentId, status: 'FINISHED' },
    });

    const standings = teams.map((tt) => {
      const teamMatches = matches.filter(
        (m) => m.teamAId === tt.teamId || m.teamBId === tt.teamId,
      );

      let played = 0, won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;

      teamMatches.forEach((m) => {
        played++;
        const isTeamA = m.teamAId === tt.teamId;
        const gf = isTeamA ? (m.scoreA || 0) : (m.scoreB || 0);
        const ga = isTeamA ? (m.scoreB || 0) : (m.scoreA || 0);
        goalsFor += gf;
        goalsAgainst += ga;
        if (gf > ga) won++;
        else if (gf === ga) drawn++;
        else lost++;
      });

      return {
        team: tt.team,
        groupName: tt.groupName,
        played, won, drawn, lost,
        goalsFor, goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: won * 3 + drawn * 1,
      };
    });

    return standings.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
  }

  async generateFixture(tournamentId: string, dto: GenerateFixtureDto) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: { include: { team: true } }, matches: true },
    });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');

    if (tournament.matches.length > 0) {
      throw new BadRequestException('El torneo ya tiene partidos programados. Elimine los partidos existentes antes de generar un nuevo fixture.');
    }

    const teamEntries = tournament.teams;
    if (teamEntries.length < 2) {
      throw new BadRequestException('Se necesitan al menos 2 equipos para generar el fixture.');
    }

    const legs = dto.legs || 1;
    const intervalDays = dto.intervalDays || 7;
    const matchTime = dto.matchTime || '15:00';
    const startDate = dto.startDate ? new Date(dto.startDate) : tournament.startDate;
    const defaultVenue = dto.defaultVenue || null;

    let matchesData: { teamAId: string; teamBId: string; dayNumber: number; matchNumber: number; scheduledAt: Date; venue: string | null }[] = [];

    switch (tournament.type) {
      case 'LEAGUE':
        matchesData = this.generateLeagueFixture(teamEntries.map(t => t.teamId), legs, startDate, intervalDays, matchTime, defaultVenue);
        break;
      case 'KNOCKOUT':
      case 'CUP':
        matchesData = this.generateKnockoutFixture(teamEntries.map(t => t.teamId), startDate, intervalDays, matchTime, defaultVenue);
        break;
      case 'GROUPS':
        matchesData = this.generateGroupsFixture(teamEntries, legs, startDate, intervalDays, matchTime, defaultVenue);
        break;
      default:
        matchesData = this.generateLeagueFixture(teamEntries.map(t => t.teamId), legs, startDate, intervalDays, matchTime, defaultVenue);
    }

    const created = await this.prisma.match.createMany({
      data: matchesData.map(m => ({
        tournamentId,
        teamAId: m.teamAId,
        teamBId: m.teamBId,
        dayNumber: m.dayNumber,
        matchNumber: m.matchNumber,
        scheduledAt: m.scheduledAt,
        venue: m.venue,
        status: 'SCHEDULED',
      })),
    });

    return {
      message: `Fixture generado exitosamente: ${created.count} partidos creados`,
      matchesCreated: created.count,
      totalDays: matchesData.length > 0 ? matchesData[matchesData.length - 1].dayNumber : 0,
    };
  }

  async deleteFixture(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundException('Torneo no encontrado');

    const inProgress = await this.prisma.match.count({
      where: { tournamentId, status: { in: ['IN_PROGRESS', 'HALFTIME', 'FINISHED'] } },
    });
    if (inProgress > 0) {
      throw new BadRequestException('No se puede eliminar el fixture: hay partidos en curso o finalizados.');
    }

    const deleted = await this.prisma.match.deleteMany({
      where: { tournamentId, status: { in: ['SCHEDULED', 'POSTPONED', 'CANCELLED'] } },
    });

    return { message: `${deleted.count} partidos eliminados`, matchesDeleted: deleted.count };
  }

  // --- Algoritmos de fixture ---

  private generateLeagueFixture(
    teamIds: string[], legs: number, startDate: Date, intervalDays: number, matchTime: string, venue: string | null,
  ) {
    const teams = [...teamIds];
    // Si es impar, agregar "bye" (descansa)
    const hasBye = teams.length % 2 !== 0;
    if (hasBye) teams.push('BYE');

    const n = teams.length;
    const rounds = n - 1;
    const matchesPerRound = n / 2;
    const [hours, minutes] = matchTime.split(':').map(Number);

    const matches: { teamAId: string; teamBId: string; dayNumber: number; matchNumber: number; scheduledAt: Date; venue: string | null }[] = [];
    let matchNumber = 0;

    // Algoritmo de round-robin (rotacion circular)
    const fixed = teams[0];
    const rotating = teams.slice(1);

    for (let round = 0; round < rounds; round++) {
      const dayNumber = round + 1;
      const matchDate = new Date(startDate);
      matchDate.setDate(matchDate.getDate() + round * intervalDays);
      matchDate.setHours(hours, minutes, 0, 0);

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
        const returnDate = new Date(startDate);
        returnDate.setDate(returnDate.getDate() + (returnDayNumber - 1) * intervalDays);
        returnDate.setHours(hours, minutes, 0, 0);

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
    teamIds: string[], startDate: Date, intervalDays: number, matchTime: string, venue: string | null,
  ) {
    const teams = this.shuffleArray([...teamIds]);
    const [hours, minutes] = matchTime.split(':').map(Number);

    // Calcular rondas necesarias (potencia de 2 mas cercana)
    const totalTeams = teams.length;
    const rounds = Math.ceil(Math.log2(totalTeams));
    const totalSlots = Math.pow(2, rounds);
    const byes = totalSlots - totalTeams;

    const matches: { teamAId: string; teamBId: string; dayNumber: number; matchNumber: number; scheduledAt: Date; venue: string | null }[] = [];
    let matchNumber = 0;

    // Primera ronda: solo los equipos que no tienen bye
    const firstRoundMatches = totalSlots / 2;
    const teamsInFirstRound = totalTeams - byes; // Equipos que juegan primera ronda
    const dayNumber = 1;
    const matchDate = new Date(startDate);
    matchDate.setHours(hours, minutes, 0, 0);

    // Los primeros 'byes' equipos pasan directo, el resto juega
    const directPass = teams.slice(0, byes);
    const playing = teams.slice(byes);

    for (let i = 0; i < playing.length; i += 2) {
      if (i + 1 < playing.length) {
        matchNumber++;
        matches.push({
          teamAId: playing[i],
          teamBId: playing[i + 1],
          dayNumber,
          matchNumber,
          scheduledAt: new Date(matchDate),
          venue,
        });
      }
    }

    return matches;
  }

  private generateGroupsFixture(
    teamEntries: { teamId: string; groupName: string | null }[],
    legs: number, startDate: Date, intervalDays: number, matchTime: string, venue: string | null,
  ) {
    // Agrupar equipos por grupo
    const groups: Record<string, string[]> = {};
    for (const entry of teamEntries) {
      const group = entry.groupName || 'A';
      if (!groups[group]) groups[group] = [];
      groups[group].push(entry.teamId);
    }

    const allMatches: { teamAId: string; teamBId: string; dayNumber: number; matchNumber: number; scheduledAt: Date; venue: string | null }[] = [];
    let globalMatchNumber = 0;

    // Generar round-robin por cada grupo
    for (const groupTeams of Object.values(groups)) {
      if (groupTeams.length < 2) continue;

      const groupMatches = this.generateLeagueFixture(groupTeams, legs, startDate, intervalDays, matchTime, venue);
      for (const m of groupMatches) {
        globalMatchNumber++;
        allMatches.push({ ...m, matchNumber: globalMatchNumber });
      }
    }

    return allMatches;
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
