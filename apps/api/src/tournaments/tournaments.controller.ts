import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { GenerateFixtureDto } from './dto/generate-fixture.dto';
import { CreateRoundDto } from './dto/create-round.dto';
import { ConfigureTiebreakersDto } from './dto/configure-tiebreakers.dto';
import { BulkUpdateMatchesDto, DistributeGroupsDto, NextPhaseDto, SetGroupDto } from './dto/fixture-ops.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard, CheckPolicies } from '../casl/policies.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private tournamentsService: TournamentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar torneos' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.tournamentsService.findAll(Number(page) || 1, Number(limit) || 20);
  }

  @Get('trash/list')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'Tournament' })
  @ApiOperation({ summary: 'Listar torneos en papelera' })
  findTrashed(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.tournamentsService.findTrashed(Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver torneo por ID' })
  findById(@Param('id') id: string) {
    return this.tournamentsService.findById(id);
  }

  @Get(':id/standings')
  @ApiOperation({ summary: 'Tabla de posiciones (opcional por ronda y grupo)' })
  getStandings(@Param('id') id: string, @Query('roundId') roundId?: string, @Query('group') group?: string) {
    return this.tournamentsService.getStandings(id, roundId || undefined, group || undefined);
  }

  @Get(':id/standings/grouped')
  @ApiOperation({ summary: 'Tabla de posiciones agrupada por grupo' })
  getGroupedStandings(@Param('id') id: string, @Query('roundId') roundId?: string) {
    return this.tournamentsService.getGroupedStandings(id, roundId || undefined);
  }

  @Get(':id/rounds/:roundId/standings')
  @ApiOperation({ summary: 'Posiciones de una ronda agrupadas' })
  getRoundStandings(@Param('id') id: string, @Param('roundId') roundId: string) {
    return this.tournamentsService.getGroupedStandings(id, roundId);
  }

  @Get(':id/rounds/:roundId/qualified')
  @ApiOperation({ summary: 'Equipos clasificados de una ronda' })
  getQualified(@Param('id') id: string, @Param('roundId') roundId: string) {
    return this.tournamentsService.getQualified(id, roundId);
  }

  @Post(':id/rounds/:roundId/next-phase')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Generar la siguiente fase de una ronda eliminatoria' })
  nextPhase(@Param('id') id: string, @Param('roundId') roundId: string, @Body() dto: NextPhaseDto) {
    return this.tournamentsService.generateNextPhase(id, roundId, dto);
  }

  @Patch(':id/fixture/bulk')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Match' })
  @ApiOperation({ summary: 'Editar varios partidos del fixture a la vez' })
  bulkUpdate(@Param('id') id: string, @Body() dto: BulkUpdateMatchesDto) {
    return this.tournamentsService.bulkUpdateMatches(id, dto);
  }

  @Post(':id/fixture/renumber')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Match' })
  @ApiOperation({ summary: 'Renumerar jornadas y partidos por fecha' })
  renumber(@Param('id') id: string, @Query('roundId') roundId?: string) {
    return this.tournamentsService.renumberFixture(id, roundId || undefined);
  }

  @Post(':id/matches/:matchId/swap')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Match' })
  @ApiOperation({ summary: 'Invertir local y visitante' })
  swap(@Param('id') id: string, @Param('matchId') matchId: string) {
    return this.tournamentsService.swapMatchTeams(id, matchId);
  }

  @Post(':id/groups/distribute')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Distribuir equipos en grupos automaticamente' })
  distributeGroups(@Param('id') id: string, @Body() dto: DistributeGroupsDto) {
    return this.tournamentsService.distributeGroups(id, dto);
  }

  @Patch(':id/teams/:teamId/group')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Asignar grupo a un equipo' })
  setGroup(@Param('id') id: string, @Param('teamId') teamId: string, @Body() dto: SetGroupDto) {
    return this.tournamentsService.setTeamGroup(id, teamId, dto.groupName);
  }

  @Post(':id/teams/bulk')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Inscribir varios equipos' })
  addTeams(@Param('id') id: string, @Body('teamIds') teamIds: string[], @Body('groupName') groupName?: string) {
    return this.tournamentsService.addTeams(id, teamIds || [], groupName);
  }

  @Get(':id/export-excel')
  @ApiOperation({ summary: 'Exportar torneo a Excel' })
  async exportExcel(@Param('id') id: string, @Res() res: any) {
    const buffer = await this.tournamentsService.exportToExcel(id);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=torneo_${id}.xlsx`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'create', subject: 'Tournament' })
  @ApiOperation({ summary: 'Crear torneo' })
  create(@Body() dto: CreateTournamentDto, @CurrentUser('id') userId: string) {
    return this.tournamentsService.create(dto, userId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Actualizar torneo' })
  update(@Param('id') id: string, @Body() dto: UpdateTournamentDto) {
    return this.tournamentsService.update(id, dto);
  }

  @Post(':id/teams/:teamId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Agregar equipo al torneo' })
  addTeam(@Param('id') id: string, @Param('teamId') teamId: string, @Body('groupName') groupName?: string) {
    return this.tournamentsService.addTeam(id, teamId, groupName);
  }

  @Delete(':id/teams/:teamId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Remover equipo del torneo' })
  removeTeam(@Param('id') id: string, @Param('teamId') teamId: string) {
    return this.tournamentsService.removeTeam(id, teamId);
  }

  @Post(':id/generate-fixture')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Generar fixture automaticamente' })
  generateFixture(@Param('id') id: string, @Body() dto: GenerateFixtureDto) {
    return this.tournamentsService.generateFixture(id, dto);
  }

  @Delete(':id/fixture')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Eliminar fixture (mover a papelera)' })
  deleteFixture(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tournamentsService.deleteFixture(id, userId);
  }

  @Post(':id/fixture/restore')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Restaurar fixture desde papelera' })
  restoreFixture(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tournamentsService.restoreFixture(id, userId);
  }

  @Get(':id/fixture/trash-count')
  @ApiOperation({ summary: 'Cantidad de partidos en papelera' })
  getTrashedMatchesCount(@Param('id') id: string) {
    return this.tournamentsService.getTrashedMatchesCount(id);
  }

  @Get(':id/rounds')
  @ApiOperation({ summary: 'Listar rondas del torneo' })
  getRounds(@Param('id') id: string) {
    return this.tournamentsService.getRounds(id);
  }

  @Post(':id/rounds')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Crear ronda del torneo' })
  createRound(@Param('id') id: string, @Body() dto: CreateRoundDto) {
    return this.tournamentsService.createRound(id, dto);
  }

  @Patch('rounds/:roundId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Actualizar ronda' })
  updateRound(@Param('roundId') roundId: string, @Body() dto: Partial<CreateRoundDto>) {
    return this.tournamentsService.updateRound(roundId, dto);
  }

  @Delete('rounds/:roundId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Eliminar ronda' })
  deleteRound(@Param('roundId') roundId: string) {
    return this.tournamentsService.deleteRound(roundId);
  }

  @Post(':id/tiebreakers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Configurar criterios de desempate' })
  configureTiebreakers(@Param('id') id: string, @Body() dto: ConfigureTiebreakersDto) {
    return this.tournamentsService.configureTiebreakers(id, dto);
  }

  @Get(':id/tiebreakers')
  @ApiOperation({ summary: 'Ver criterios de desempate' })
  getTiebreakers(@Param('id') id: string, @Query('roundId') roundId?: string) {
    return this.tournamentsService.getTiebreakers(id, roundId);
  }

  @Post(':id/teams/:teamId/mid-tournament')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Tournament' })
  @ApiOperation({ summary: 'Agregar equipo a torneo en curso (genera partidos adicionales)' })
  addTeamMidTournament(@Param('id') id: string, @Param('teamId') teamId: string, @Body('groupName') groupName?: string) {
    return this.tournamentsService.addTeamMidTournament(id, teamId, groupName);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'Tournament' })
  @ApiOperation({ summary: 'Eliminar torneo (mover a papelera, requiere contraseña)' })
  softDelete(@Param('id') id: string, @Body('password') password: string, @CurrentUser('id') userId: string) {
    return this.tournamentsService.softDelete(id, password, userId);
  }

  @Post(':id/restore')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'Tournament' })
  @ApiOperation({ summary: 'Restaurar torneo de la papelera' })
  restore(@Param('id') id: string) {
    return this.tournamentsService.restore(id);
  }
}
