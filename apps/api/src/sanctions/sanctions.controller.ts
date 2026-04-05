import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SanctionsService } from './sanctions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard, CheckPolicies } from '../casl/policies.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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

  @Get('player/:playerId/:tournamentId/status')
  @ApiOperation({ summary: 'Estado de habilitacion del jugador' })
  async getPlayerStatus(
    @Param('playerId') playerId: string,
    @Param('tournamentId') tournamentId: string,
  ) {
    const activeSanctions = await this.sanctionsService.getActiveSanctions(playerId, tournamentId);
    return {
      isBlocked: activeSanctions.length > 0,
      sanctions: activeSanctions,
      reasons: activeSanctions.map(s => s.reason),
    };
  }

  @Post('manual')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'create', subject: 'Sanction' })
  @ApiOperation({ summary: 'Crear sancion manual (conducta, administrativa)' })
  createManual(
    @Body() body: { playerId: string; tournamentId: string; type: string; matchesBanned: number; reason: string; matchId?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.sanctionsService.createManual({ ...body, imposedBy: userId });
  }

  @Patch(':id/serve-match')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Sanction' })
  @ApiOperation({ summary: 'Registrar cumplimiento de 1 partido de suspension' })
  serveMatch(@Param('id') id: string) {
    return this.sanctionsService.serveMatch(id);
  }

  @Patch(':id/mark-served')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Sanction' })
  @ApiOperation({ summary: 'Marcar sancion como totalmente cumplida' })
  markAsServed(@Param('id') id: string) {
    return this.sanctionsService.markAsServed(id);
  }

  @Patch(':id/deactivate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Sanction' })
  @ApiOperation({ summary: 'Desactivar sancion (cumplida)' })
  deactivate(@Param('id') id: string) {
    return this.sanctionsService.deactivate(id);
  }

  @Patch(':id/unlock')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'manage', subject: 'Sanction' })
  @ApiOperation({ summary: 'Desbloquear jugador (solo super admin)' })
  unlockPlayer(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.sanctionsService.unlockPlayer(id, reason || '');
  }

  @Post('tournament/:tournamentId/auto-process')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Sanction' })
  @ApiOperation({ summary: 'Auto-procesar sanciones: detectar partidos cumplidos y desbloquear automaticamente' })
  autoProcess(@Param('tournamentId') tournamentId: string) {
    return this.sanctionsService.autoProcessSanctions(tournamentId);
  }
}
