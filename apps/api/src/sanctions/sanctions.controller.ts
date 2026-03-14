import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SanctionsService } from './sanctions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard, CheckPolicies } from '../casl/policies.guard';

@ApiTags('Sanctions')
@Controller('sanctions')
export class SanctionsController {
  constructor(private sanctionsService: SanctionsService) {}

  @Get('tournament/:tournamentId')
  @ApiOperation({ summary: 'Listar sanciones del torneo' })
  findByTournament(
    @Param('tournamentId') tournamentId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.sanctionsService.findByTournament(tournamentId, activeOnly !== 'false');
  }

  @Get('player/:playerId/:tournamentId')
  @ApiOperation({ summary: 'Sanciones de un jugador en un torneo' })
  findByPlayer(
    @Param('playerId') playerId: string,
    @Param('tournamentId') tournamentId: string,
  ) {
    return this.sanctionsService.findByPlayer(playerId, tournamentId);
  }

  @Patch(':id/deactivate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Sanction' })
  @ApiOperation({ summary: 'Desactivar sancion (cumplida)' })
  deactivate(@Param('id') id: string) {
    return this.sanctionsService.deactivate(id);
  }
}
