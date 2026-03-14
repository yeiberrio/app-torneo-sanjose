import { Injectable, NotFoundException } from '@nestjs/common';
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

  async update(id: string, dto: Partial<CreateMatchDto>) {
    return this.prisma.match.update({
      where: { id },
      data: { ...dto, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined },
    });
  }

  async addEvent(matchId: string, dto: CreateMatchEventDto, userId: string) {
    const event = await this.prisma.matchEvent.create({
      data: { ...dto, matchId, createdBy: userId },
    });

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
        // Own goal scores for the other team
        const newScoreA = dto.teamId === match.teamAId ? (match.scoreA || 0) : (match.scoreA || 0) + 1;
        const newScoreB = dto.teamId === match.teamBId ? (match.scoreB || 0) : (match.scoreB || 0) + 1;
        await this.prisma.match.update({ where: { id: matchId }, data: { scoreA: newScoreA, scoreB: newScoreB } });
        this.matchesGateway.emitScoreUpdate(matchId, newScoreA, newScoreB);
      }
    }

    // Emit event via WebSocket
    this.matchesGateway.emitMatchEvent(matchId, event);

    // Check for automatic sanctions on card events
    if (['YELLOW_CARD', 'RED_CARD', 'YELLOW_RED_CARD'].includes(dto.type) && dto.playerId) {
      const sanction = await this.sanctionsService.checkAndApplySanctions(
        matchId, dto.playerId, dto.type, userId,
      );
      if (sanction) {
        return { event, sanction };
      }
    }

    return event;
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
