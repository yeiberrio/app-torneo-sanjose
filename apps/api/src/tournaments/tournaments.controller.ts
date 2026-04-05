import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { GenerateFixtureDto } from './dto/generate-fixture.dto';
import { CreateRoundDto } from './dto/create-round.dto';
import { ConfigureTiebreakersDto } from './dto/configure-tiebreakers.dto';
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
  @ApiOperation({ summary: 'Tabla de posiciones' })
  getStandings(@Param('id') id: string) {
    return this.tournamentsService.getStandings(id);
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
  @ApiOperation({ summary: 'Eliminar fixture (solo partidos no jugados)' })
  deleteFixture(@Param('id') id: string) {
    return this.tournamentsService.deleteFixture(id);
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
