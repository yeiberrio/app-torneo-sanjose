import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeStandings, groupStandings, DEFAULT_TIEBREAKERS, StandingRow } from '../common/standings.util';

export { StandingRow };

export interface TopScorer {
  playerId: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  photoUrl: string | null;
  teamId: string;
  teamName: string;
  goals: number;
}

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getStandings(tournamentId: string, roundId?: string): Promise<StandingRow[]> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { winPoints: true, drawPoints: true, lossPoints: true },
    });
    if (!tournament) return [];

    const tournamentTeams = await this.prisma.tournamentTeam.findMany({
      where: { tournamentId },
      include: { team: { select: { id: true, name: true, logoUrl: true } } },
    });
    const where: any = { tournamentId, deletedAt: null };
    if (roundId) where.roundId = roundId;
    const matches = await this.prisma.match.findMany({
      where,
      select: {
        teamAId: true, teamBId: true, scoreA: true, scoreB: true, status: true, scheduledAt: true,
        events: { where: { type: { in: ['YELLOW_CARD', 'RED_CARD', 'YELLOW_RED_CARD'] } }, select: { teamId: true, type: true } },
      },
    });
    const tiebreakers = await this.prisma.tournamentTiebreaker.findMany({ where: { tournamentId, roundId: roundId || null }, orderBy: { priority: 'asc' } });
    const order = tiebreakers.length > 0 ? tiebreakers.map(t => t.criteria as string) : DEFAULT_TIEBREAKERS;
    return computeStandings(
      tournamentTeams.map(tt => ({ id: tt.team.id, name: tt.team.name, logoUrl: tt.team.logoUrl, groupName: tt.groupName })),
      matches.map(m => ({ ...m, cards: m.events })),
      tournament,
      order,
    );
  }

  async getGroupedStandings(tournamentId: string, roundId?: string) {
    const rows = await this.getStandings(tournamentId, roundId);
    const hasGroups = rows.some(r => r.groupName);
    return { hasGroups, overall: rows, groups: hasGroups ? groupStandings(rows) : { General: rows } };
  }

  async getTopScorers(tournamentId: string, limit = 20): Promise<TopScorer[]> {
    // Get all match events of type GOAL or PENALTY_SCORED for this tournament
    const events = await this.prisma.matchEvent.findMany({
      where: {
        match: { tournamentId, status: 'FINISHED' },
        type: { in: ['GOAL', 'PENALTY_SCORED'] },
        playerId: { not: null },
      },
      select: { playerId: true },
    });

    // Count goals per player
    const goalCounts = new Map<string, number>();
    for (const e of events) {
      if (e.playerId) {
        goalCounts.set(e.playerId, (goalCounts.get(e.playerId) || 0) + 1);
      }
    }

    if (goalCounts.size === 0) return [];

    // Get player details
    const playerIds = Array.from(goalCounts.keys());
    const players = await this.prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jerseyNumber: true,
        photoUrl: true,
        teamId: true,
        team: { select: { name: true } },
      },
    });

    const scorers: TopScorer[] = players.map((p) => ({
      playerId: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      jerseyNumber: p.jerseyNumber,
      photoUrl: p.photoUrl,
      teamId: p.teamId,
      teamName: p.team.name,
      goals: goalCounts.get(p.id) || 0,
    }));

    scorers.sort((a, b) => b.goals - a.goals || a.lastName.localeCompare(b.lastName));

    return scorers.slice(0, limit);
  }

  async getTopCards(tournamentId: string, limit = 20) {
    const events = await this.prisma.matchEvent.findMany({
      where: {
        match: { tournamentId, status: 'FINISHED' },
        type: { in: ['YELLOW_CARD', 'RED_CARD', 'YELLOW_RED_CARD'] },
        playerId: { not: null },
      },
      select: { playerId: true, type: true },
    });

    const cardCounts = new Map<string, { yellow: number; red: number }>();
    for (const e of events) {
      if (!e.playerId) continue;
      if (!cardCounts.has(e.playerId)) cardCounts.set(e.playerId, { yellow: 0, red: 0 });
      const c = cardCounts.get(e.playerId)!;
      if (e.type === 'YELLOW_CARD') c.yellow++;
      else if (e.type === 'RED_CARD') c.red++;
      else if (e.type === 'YELLOW_RED_CARD') { c.yellow++; c.red++; }
    }

    if (cardCounts.size === 0) return [];

    const playerIds = Array.from(cardCounts.keys());
    const players = await this.prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        jerseyNumber: true,
        teamId: true,
        team: { select: { name: true } },
      },
    });

    const result = players.map((p) => {
      const c = cardCounts.get(p.id)!;
      return {
        playerId: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        jerseyNumber: p.jerseyNumber,
        teamId: p.teamId,
        teamName: p.team.name,
        yellowCards: c.yellow,
        redCards: c.red,
      };
    });

    result.sort((a, b) => (b.redCards * 10 + b.yellowCards) - (a.redCards * 10 + a.yellowCards));

    return result.slice(0, limit);
  }

  async getFairPlay(tournamentId: string) {
    const standings = await this.getStandings(tournamentId);
    return standings
      .map(s => ({
        teamId: s.teamId,
        teamName: s.teamName,
        logoUrl: s.logoUrl,
        played: s.played,
        yellowCards: s.yellowCards,
        redCards: s.redCards,
        totalCards: s.yellowCards + s.redCards * 3,
        avgCardsPerMatch: s.played > 0 ? +((s.yellowCards + s.redCards * 3) / s.played).toFixed(2) : 0,
      }))
      .sort((a, b) => a.totalCards - b.totalCards);
  }

  async getTournamentSummary(tournamentId: string) {
    const [totalMatches, finishedMatches, totalTeams, totalPlayers] = await Promise.all([
      this.prisma.match.count({ where: { tournamentId, deletedAt: null } }),
      this.prisma.match.count({ where: { tournamentId, deletedAt: null, status: 'FINISHED' } }),
      this.prisma.tournamentTeam.count({ where: { tournamentId } }),
      this.prisma.player.count({
        where: { team: { tournaments: { some: { tournamentId } } } },
      }),
    ]);

    // Total goals
    const finishedMatchesData = await this.prisma.match.findMany({
      where: { tournamentId, deletedAt: null, status: 'FINISHED' },
      select: { scoreA: true, scoreB: true },
    });

    const totalGoals = finishedMatchesData.reduce(
      (sum, m) => sum + (m.scoreA || 0) + (m.scoreB || 0), 0,
    );

    return {
      totalMatches,
      finishedMatches,
      pendingMatches: totalMatches - finishedMatches,
      totalTeams,
      totalPlayers,
      totalGoals,
      avgGoalsPerMatch: finishedMatches > 0 ? +(totalGoals / finishedMatches).toFixed(2) : 0,
    };
  }
}
