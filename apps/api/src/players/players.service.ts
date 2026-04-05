import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePlayerDto) {
    return this.prisma.player.create({
      data: { ...dto, birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined },
    });
  }

  async findAll(teamId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (teamId) where.teamId = teamId;
    const [data, total] = await Promise.all([
      this.prisma.player.findMany({
        where, skip, take: limit,
        include: { team: { select: { id: true, name: true, logoUrl: true } } },
        orderBy: { lastName: 'asc' },
      }),
      this.prisma.player.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: {
        team: true,
        stats: {
          include: {
            match: {
              select: {
                id: true, scheduledAt: true, venue: true, status: true,
                scoreA: true, scoreB: true, teamAId: true, teamBId: true,
                dayNumber: true,
                tournament: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { match: { scheduledAt: 'desc' } },
        },
        events: {
          include: {
            match: {
              select: {
                id: true, scheduledAt: true, teamAId: true, teamBId: true,
                status: true, scoreA: true, scoreB: true, dayNumber: true, venue: true,
                tournament: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { match: { scheduledAt: 'desc' } },
        },
        sanctions: { orderBy: { imposedAt: 'desc' } },
      },
    });
    if (!player) throw new NotFoundException('Jugador no encontrado');

    // Resolve team names for matches (from stats and events)
    const matchTeamIds = new Set<string>();
    player.stats.forEach(s => { matchTeamIds.add(s.match.teamAId); matchTeamIds.add(s.match.teamBId); });
    player.events.forEach((e: any) => { if (e.match) { matchTeamIds.add(e.match.teamAId); matchTeamIds.add(e.match.teamBId); } });
    const teams = await this.prisma.team.findMany({
      where: { id: { in: Array.from(matchTeamIds) } },
      select: { id: true, name: true },
    });
    const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]));

    return { ...player, _teamMap: teamMap };
  }

  async update(id: string, dto: UpdatePlayerDto) {
    const data: any = { ...dto };
    if (dto.birthDate) data.birthDate = new Date(dto.birthDate);
    else delete data.birthDate;
    return this.prisma.player.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string, userId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: { team: { select: { name: true } } },
    });
    if (!player) throw new NotFoundException('Jugador no encontrado');
    if (player.deletedAt) throw new BadRequestException('El jugador ya esta en la papelera');

    await this.prisma.player.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Player',
        entityId: id,
        oldValue: {
          firstName: player.firstName,
          lastName: player.lastName,
          jerseyNumber: player.jerseyNumber,
          team: player.team?.name,
        },
      },
    });

    return { message: 'Jugador movido a la papelera' };
  }

  async findTrashed(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: { not: null } };
    const [data, total] = await Promise.all([
      this.prisma.player.findMany({
        where: where as any,
        skip, take: limit,
        include: { team: { select: { id: true, name: true, logoUrl: true } } },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.player.count({ where: where as any }),
    ]);
    return { data, total, page, limit };
  }

  async restore(id: string, userId: string) {
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) throw new NotFoundException('Jugador no encontrado');
    if (!player.deletedAt) throw new BadRequestException('El jugador no esta en la papelera');

    await this.prisma.player.update({
      where: { id },
      data: { deletedAt: null, deletedBy: null },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'RESTORE',
        entity: 'Player',
        entityId: id,
        newValue: { firstName: player.firstName, lastName: player.lastName },
      },
    });

    return { message: 'Jugador restaurado' };
  }

  async getTopScorers(tournamentId: string, limit = 10) {
    const stats = await this.prisma.matchPlayerStat.groupBy({
      by: ['playerId'],
      where: { match: { tournamentId } },
      _sum: { goals: true, assists: true },
      orderBy: { _sum: { goals: 'desc' } },
      take: limit,
    });

    const playerIds = stats.map((s) => s.playerId);
    const players = await this.prisma.player.findMany({
      where: { id: { in: playerIds } },
      include: { team: { select: { id: true, name: true, logoUrl: true } } },
    });

    return stats.map((s) => ({
      player: players.find((p) => p.id === s.playerId),
      goals: s._sum.goals || 0,
      assists: s._sum.assists || 0,
    }));
  }
}
