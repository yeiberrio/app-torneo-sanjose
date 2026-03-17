import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';

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
    const where = teamId ? { teamId } : {};
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
        stats: { include: { match: { select: { id: true, scheduledAt: true, venue: true } } } },
        sanctions: true,
      },
    });
    if (!player) throw new NotFoundException('Jugador no encontrado');
    return player;
  }

  async update(id: string, dto: Partial<CreatePlayerDto>) {
    return this.prisma.player.update({
      where: { id },
      data: { ...dto, birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined },
    });
  }

  async delete(id: string) {
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) throw new NotFoundException('Jugador no encontrado');

    // Delete related data first
    await this.prisma.matchEvent.deleteMany({ where: { playerId: id } });
    await this.prisma.matchPlayerStat.deleteMany({ where: { playerId: id } });
    await this.prisma.sanction.deleteMany({ where: { playerId: id } });
    await this.prisma.player.delete({ where: { id } });
    return { message: 'Jugador eliminado' };
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
