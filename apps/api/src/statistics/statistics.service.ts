import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StandingRow {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  yellowCards: number;
  redCards: number;
}

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

  async getStandings(tournamentId: string): Promise<StandingRow[]> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { winPoints: true, drawPoints: true, lossPoints: true },
    });

    if (!tournament) return [];

    const { winPoints, drawPoints, lossPoints } = tournament;

    // Get all teams in this tournament
    const tournamentTeams = await this.prisma.tournamentTeam.findMany({
      where: { tournamentId },
      include: { team: { select: { id: true, name: true, logoUrl: true } } },
    });

    // Get all finished matches
    const matches = await this.prisma.match.findMany({
      where: { tournamentId, status: 'FINISHED' },
      select: { teamAId: true, teamBId: true, scoreA: true, scoreB: true },
    });

    const standingsMap = new Map<string, StandingRow>();

    for (const tt of tournamentTeams) {
      standingsMap.set(tt.team.id, {
        teamId: tt.team.id,
        teamName: tt.team.name,
        logoUrl: tt.team.logoUrl,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        yellowCards: 0,
        redCards: 0,
      });
    }

    for (const match of matches) {
      const a = standingsMap.get(match.teamAId);
      const b = standingsMap.get(match.teamBId);
      const scoreA = match.scoreA ?? 0;
      const scoreB = match.scoreB ?? 0;

      if (a) {
        a.played++;
        a.goalsFor += scoreA;
        a.goalsAgainst += scoreB;
        if (scoreA > scoreB) { a.won++; a.points += winPoints; }
        else if (scoreA === scoreB) { a.drawn++; a.points += drawPoints; }
        else { a.lost++; a.points += lossPoints; }
      }

      if (b) {
        b.played++;
        b.goalsFor += scoreB;
        b.goalsAgainst += scoreA;
        if (scoreB > scoreA) { b.won++; b.points += winPoints; }
        else if (scoreB === scoreA) { b.drawn++; b.points += drawPoints; }
        else { b.lost++; b.points += lossPoints; }
      }
    }

    // Count cards for fair play tiebreaker
    const cardEvents = await this.prisma.matchEvent.findMany({
      where: {
        match: { tournamentId, status: 'FINISHED' },
        type: { in: ['YELLOW_CARD', 'RED_CARD', 'YELLOW_RED_CARD'] },
      },
      select: { teamId: true, type: true },
    });

    for (const event of cardEvents) {
      const team = standingsMap.get(event.teamId);
      if (team) {
        if (event.type === 'YELLOW_CARD') team.yellowCards++;
        else if (event.type === 'RED_CARD') team.redCards++;
        else if (event.type === 'YELLOW_RED_CARD') { team.yellowCards++; team.redCards++; }
      }
    }

    const standings = Array.from(standingsMap.values());
    for (const s of standings) {
      s.goalDifference = s.goalsFor - s.goalsAgainst;
    }

    // Load tiebreaker configuration
    const tiebreakers = await this.prisma.tournamentTiebreaker.findMany({
      where: { tournamentId, roundId: null },
      orderBy: { priority: 'asc' },
    });

    // If no custom tiebreakers configured, use default FIFA order
    const tiebreakerOrder = tiebreakers.length > 0
      ? tiebreakers.map(t => t.criteria)
      : ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD', 'FAIR_PLAY'];

    // Sort function
    standings.sort((a, b) => {
      // Points always first
      if (b.points !== a.points) return b.points - a.points;

      // Apply tiebreakers in order
      for (const criteria of tiebreakerOrder) {
        let diff = 0;
        switch (criteria) {
          case 'GOAL_DIFFERENCE':
            diff = b.goalDifference - a.goalDifference;
            break;
          case 'GOALS_FOR':
            diff = b.goalsFor - a.goalsFor;
            break;
          case 'GOALS_AGAINST':
            diff = a.goalsAgainst - b.goalsAgainst; // Less goals against is better
            break;
          case 'WINS':
            diff = b.won - a.won;
            break;
          case 'DRAWS':
            diff = b.drawn - a.drawn;
            break;
          case 'FAIR_PLAY':
            diff = (a.yellowCards || 0) - (b.yellowCards || 0); // Less cards is better
            break;
          case 'HEAD_TO_HEAD':
            // Would need specific match data - skip for now, handled by existing GD/GF
            break;
        }
        if (diff !== 0) return diff;
      }

      return a.teamName.localeCompare(b.teamName);
    });

    return standings;
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

  async getTournamentSummary(tournamentId: string) {
    const [totalMatches, finishedMatches, totalTeams, totalPlayers] = await Promise.all([
      this.prisma.match.count({ where: { tournamentId } }),
      this.prisma.match.count({ where: { tournamentId, status: 'FINISHED' } }),
      this.prisma.tournamentTeam.count({ where: { tournamentId } }),
      this.prisma.player.count({
        where: { team: { tournaments: { some: { tournamentId } } } },
      }),
    ]);

    // Total goals
    const finishedMatchesData = await this.prisma.match.findMany({
      where: { tournamentId, status: 'FINISHED' },
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
