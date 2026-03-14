import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Get(':tournamentId/standings')
  @ApiOperation({ summary: 'Tabla de posiciones del torneo' })
  getStandings(@Param('tournamentId') tournamentId: string) {
    return this.statisticsService.getStandings(tournamentId);
  }

  @Get(':tournamentId/top-scorers')
  @ApiOperation({ summary: 'Tabla de goleadores del torneo' })
  getTopScorers(
    @Param('tournamentId') tournamentId: string,
    @Query('limit') limit?: string,
  ) {
    return this.statisticsService.getTopScorers(tournamentId, Number(limit) || 20);
  }

  @Get(':tournamentId/top-cards')
  @ApiOperation({ summary: 'Tabla de tarjetas del torneo' })
  getTopCards(
    @Param('tournamentId') tournamentId: string,
    @Query('limit') limit?: string,
  ) {
    return this.statisticsService.getTopCards(tournamentId, Number(limit) || 20);
  }

  @Get(':tournamentId/summary')
  @ApiOperation({ summary: 'Resumen del torneo' })
  getSummary(@Param('tournamentId') tournamentId: string) {
    return this.statisticsService.getTournamentSummary(tournamentId);
  }
}
