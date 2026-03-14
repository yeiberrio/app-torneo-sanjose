import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
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
}
