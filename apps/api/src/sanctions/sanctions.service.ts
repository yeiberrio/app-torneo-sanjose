import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SanctionsService {
  constructor(private prisma: PrismaService) {}

  async checkAndApplySanctions(
    matchId: string,
    playerId: string,
    eventType: string,
    userId: string,
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: { select: { id: true, maxYellowCards: true } } },
    });
    if (!match) return null;

    const tournamentId = match.tournamentId;
    const maxYellows = match.tournament.maxYellowCards;

    // Direct red card → 1 match ban
    if (eventType === 'RED_CARD') {
      return this.prisma.sanction.create({
        data: {
          playerId,
          tournamentId,
          matchId,
          type: 'RED_CARD',
          matchesBanned: 1,
          reason: `Tarjeta roja directa en partido ${matchId}`,
          isActive: true,
          imposedBy: userId,
        },
      });
    }

    // Double yellow (yellow+red) → 1 match ban
    if (eventType === 'YELLOW_RED_CARD') {
      return this.prisma.sanction.create({
        data: {
          playerId,
          tournamentId,
          matchId,
          type: 'RED_CARD',
          matchesBanned: 1,
          reason: `Doble amarilla en partido ${matchId}`,
          isActive: true,
          imposedBy: userId,
        },
      });
    }

    // Yellow card accumulation check
    if (eventType === 'YELLOW_CARD') {
      const yellowCount = await this.prisma.matchEvent.count({
        where: {
          playerId,
          type: 'YELLOW_CARD',
          match: { tournamentId, status: 'FINISHED' },
        },
      });

      // Also count the current one (not yet in finished matches)
      const currentYellows = await this.prisma.matchEvent.count({
        where: {
          playerId,
          type: 'YELLOW_CARD',
          matchId,
        },
      });

      const totalYellows = yellowCount + currentYellows;

      if (totalYellows >= maxYellows && totalYellows % maxYellows === 0) {
        return this.prisma.sanction.create({
          data: {
            playerId,
            tournamentId,
            type: 'YELLOW_ACCUMULATION',
            matchesBanned: 1,
            reason: `Acumulacion de ${maxYellows} tarjetas amarillas`,
            isActive: true,
            imposedBy: userId,
          },
        });
      }
    }

    return null;
  }

  async findByTournament(tournamentId: string, activeOnly = true) {
    return this.prisma.sanction.findMany({
      where: {
        tournamentId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: {
        player: {
          select: { id: true, firstName: true, lastName: true, jerseyNumber: true, teamId: true,
            team: { select: { name: true } },
          },
        },
      },
      orderBy: { imposedAt: 'desc' },
    });
  }

  async findByPlayer(playerId: string, tournamentId: string) {
    return this.prisma.sanction.findMany({
      where: { playerId, tournamentId },
      orderBy: { imposedAt: 'desc' },
    });
  }

  async deactivate(id: string) {
    return this.prisma.sanction.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getActiveSanctionCount(playerId: string, tournamentId: string): Promise<number> {
    return this.prisma.sanction.count({
      where: { playerId, tournamentId, isActive: true },
    });
  }

  async getActiveSanctions(playerId: string, tournamentId: string) {
    return this.prisma.sanction.findMany({
      where: { playerId, tournamentId, isActive: true },
    });
  }

  async unlockPlayer(sanctionId: string, reason: string) {
    return this.prisma.sanction.update({
      where: { id: sanctionId },
      data: { isActive: false, reason: reason ? `DESBLOQUEADO: ${reason}` : 'Desbloqueado por super admin' },
    });
  }
}
