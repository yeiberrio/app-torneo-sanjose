import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { SanctionsService } from '../sanctions/sanctions.service';
import { MatchesGateway } from './matches.gateway';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private sanctionsService: SanctionsService,
    private matchesGateway: MatchesGateway,
  ) {}

  async create(dto: CreateMatchDto) {
    return this.prisma.match.create({
      data: { ...dto, scheduledAt: new Date(dto.scheduledAt) },
    });
  }

  async findAll(tournamentId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = tournamentId ? { tournamentId } : {};
    const [matches, total] = await Promise.all([
      this.prisma.match.findMany({
        where, skip, take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          tournament: { select: { id: true, name: true } },
        },
      }),
      this.prisma.match.count({ where }),
    ]);

    // Resolve team names
    const teamIds = [...new Set(matches.flatMap((m) => [m.teamAId, m.teamBId]))];
    const teams = await this.prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, name: true, logoUrl: true },
    });
    const teamMap = new Map(teams.map((t) => [t.id, t]));

    const data = matches.map((m) => ({
      ...m,
      teamA: teamMap.get(m.teamAId) || { id: m.teamAId, name: m.teamAId, logoUrl: null },
      teamB: teamMap.get(m.teamBId) || { id: m.teamBId, name: m.teamBId, logoUrl: null },
    }));

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        tournament: { select: { id: true, name: true, logoUrl: true } },
        events: { orderBy: { minute: 'asc' }, include: { player: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true } } } },
        playerStats: { include: { player: { select: { id: true, firstName: true, lastName: true, jerseyNumber: true, teamId: true } } } },
        referee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!match) throw new NotFoundException('Partido no encontrado');
    return match;
  }

  async update(id: string, dto: Partial<CreateMatchDto> & { scoreA?: number; scoreB?: number; refereeReport?: string }) {
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) throw new NotFoundException('Partido no encontrado');

    const data: any = {};
    if (dto.scheduledAt) data.scheduledAt = new Date(dto.scheduledAt);
    if (dto.venue !== undefined) data.venue = dto.venue;
    if (dto.teamAId) data.teamAId = dto.teamAId;
    if (dto.teamBId) data.teamBId = dto.teamBId;
    if (dto.matchNumber !== undefined) data.matchNumber = dto.matchNumber;
    if (dto.dayNumber !== undefined) data.dayNumber = dto.dayNumber;
    if (dto.refereeId !== undefined) data.refereeId = dto.refereeId;
    if (dto.scorekeeperId !== undefined) data.scorekeeperId = dto.scorekeeperId;
    if (dto.observerId !== undefined) data.observerId = dto.observerId;
    if (dto.scoreA !== undefined) data.scoreA = dto.scoreA;
    if (dto.scoreB !== undefined) data.scoreB = dto.scoreB;
    if (dto.refereeReport !== undefined) data.refereeReport = dto.refereeReport;

    return this.prisma.match.update({ where: { id }, data });
  }

  async addEvent(matchId: string, dto: CreateMatchEventDto, userId: string) {
    try {
      // Clean empty/falsy playerId to avoid FK violation
      const playerId = dto.playerId && dto.playerId.trim() !== '' ? dto.playerId : undefined;

      console.log('[addEvent] matchId:', matchId, 'dto:', JSON.stringify(dto), 'userId:', userId, 'cleanPlayerId:', playerId);

      // Check if player is blocked by active sanctions
      if (playerId) {
        const matchData = await this.prisma.match.findUnique({
          where: { id: matchId },
          select: { tournamentId: true, teamAId: true, teamBId: true, scoreA: true, scoreB: true },
        });
        if (matchData) {
          const playerSanctions = await this.sanctionsService.getActiveSanctions(playerId, matchData.tournamentId);
          if (playerSanctions.length > 0) {
            if (['GOAL', 'PENALTY_SCORED', 'SUBSTITUTION_IN'].includes(dto.type)) {
              const reasons = playerSanctions.map(s => s.reason).join('; ');
              throw new BadRequestException(
                `Jugador inhabilitado: ${reasons}. No puede participar activamente en el partido.`
              );
            }
          }
        }
      }

      // Build data explicitly to avoid sending unknown fields to Prisma
      const eventData: any = {
        matchId,
        teamId: dto.teamId,
        type: dto.type,
        createdBy: userId,
      };
      if (playerId) eventData.playerId = playerId;
      if (dto.minute !== undefined && dto.minute !== null) eventData.minute = Number(dto.minute);
      if (dto.description) eventData.description = dto.description;

      console.log('[addEvent] creating event with data:', JSON.stringify(eventData));

      const event = await this.prisma.matchEvent.create({ data: eventData });

      // Update match score if it's a goal
      if (['GOAL', 'PENALTY_SCORED'].includes(dto.type)) {
        const match = await this.prisma.match.findUnique({ where: { id: matchId } });
        if (match) {
          const newScoreA = dto.teamId === match.teamAId ? (match.scoreA || 0) + 1 : (match.scoreA || 0);
          const newScoreB = dto.teamId === match.teamBId ? (match.scoreB || 0) + 1 : (match.scoreB || 0);
          await this.prisma.match.update({ where: { id: matchId }, data: { scoreA: newScoreA, scoreB: newScoreB } });
          this.matchesGateway.emitScoreUpdate(matchId, newScoreA, newScoreB);
        }
      }

      if (dto.type === 'OWN_GOAL') {
        const match = await this.prisma.match.findUnique({ where: { id: matchId } });
        if (match) {
          const newScoreA = dto.teamId === match.teamAId ? (match.scoreA || 0) : (match.scoreA || 0) + 1;
          const newScoreB = dto.teamId === match.teamBId ? (match.scoreB || 0) : (match.scoreB || 0) + 1;
          await this.prisma.match.update({ where: { id: matchId }, data: { scoreA: newScoreA, scoreB: newScoreB } });
          this.matchesGateway.emitScoreUpdate(matchId, newScoreA, newScoreB);
        }
      }

      // Emit event via WebSocket
      this.matchesGateway.emitMatchEvent(matchId, event);

      // Check for automatic sanctions on card events
      if (['YELLOW_CARD', 'RED_CARD', 'YELLOW_RED_CARD'].includes(dto.type) && playerId) {
        const sanction = await this.sanctionsService.checkAndApplySanctions(
          matchId, playerId, dto.type, userId,
        );
        if (sanction) {
          return { event, sanction };
        }
      }

      return event;
    } catch (error) {
      console.error('[addEvent] ERROR:', error?.message, error?.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error al registrar evento: ${error?.message || 'Error desconocido'}`);
    }
  }

  async deleteEvent(eventId: string) {
    const event = await this.prisma.matchEvent.findUnique({
      where: { id: eventId },
      include: { match: true },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    // Recalculate score if it was a goal event
    if (['GOAL', 'PENALTY_SCORED', 'OWN_GOAL'].includes(event.type) && event.match) {
      const match = event.match;
      let scoreA = match.scoreA || 0;
      let scoreB = match.scoreB || 0;

      if (event.type === 'OWN_GOAL') {
        // Own goal was for the OTHER team
        if (event.teamId === match.teamAId) scoreB = Math.max(0, scoreB - 1);
        else scoreA = Math.max(0, scoreA - 1);
      } else {
        if (event.teamId === match.teamAId) scoreA = Math.max(0, scoreA - 1);
        else scoreB = Math.max(0, scoreB - 1);
      }

      await this.prisma.match.update({
        where: { id: match.id },
        data: { scoreA, scoreB },
      });
    }

    await this.prisma.matchEvent.delete({ where: { id: eventId } });
    return { message: 'Evento eliminado' };
  }

  async deleteMatch(id: string) {
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) throw new NotFoundException('Partido no encontrado');

    // Delete all events and stats first
    await this.prisma.matchEvent.deleteMany({ where: { matchId: id } });
    await this.prisma.matchPlayerStat.deleteMany({ where: { matchId: id } });
    await this.prisma.match.delete({ where: { id } });
    return { message: 'Partido eliminado' };
  }

  async updateStatus(id: string, status: string) {
    const data: any = { status };
    if (status === 'IN_PROGRESS') {
      data.scoreA = 0;
      data.scoreB = 0;
    }
    const updated = await this.prisma.match.update({ where: { id }, data });
    this.matchesGateway.emitStatusUpdate(id, status);
    if (status === 'IN_PROGRESS') {
      this.matchesGateway.emitScoreUpdate(id, 0, 0);
    }
    return updated;
  }
}
