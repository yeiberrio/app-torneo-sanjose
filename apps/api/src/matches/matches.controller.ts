import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard, CheckPolicies } from '../casl/policies.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar partidos' })
  findAll(
    @Query('tournamentId') tournamentId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.matchesService.findAll(tournamentId, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver partido por ID' })
  findById(@Param('id') id: string) {
    return this.matchesService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'create', subject: 'Match' })
  @ApiOperation({ summary: 'Crear partido' })
  create(@Body() dto: CreateMatchDto) {
    return this.matchesService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Match' })
  @ApiOperation({ summary: 'Actualizar partido' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateMatchDto>) {
    return this.matchesService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Match' })
  @ApiOperation({ summary: 'Cambiar estado del partido' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.matchesService.updateStatus(id, status);
  }

  @Post(':id/events')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'create', subject: 'MatchEvent' })
  @ApiOperation({ summary: 'Registrar evento en el partido' })
  addEvent(
    @Param('id') id: string,
    @Body() dto: CreateMatchEventDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.matchesService.addEvent(id, dto, userId);
  }

  @Delete(':id/events/:eventId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'MatchEvent' })
  @ApiOperation({ summary: 'Eliminar evento del partido' })
  deleteEvent(@Param('eventId') eventId: string) {
    return this.matchesService.deleteEvent(eventId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'Match' })
  @ApiOperation({ summary: 'Eliminar partido' })
  deleteMatch(@Param('id') id: string) {
    return this.matchesService.deleteMatch(id);
  }
}
