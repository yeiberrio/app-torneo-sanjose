import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';

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
}
