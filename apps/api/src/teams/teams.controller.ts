import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard, CheckPolicies } from '../casl/policies.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar equipos' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.teamsService.findAll(Number(page) || 1, Number(limit) || 20);
  }

  @Get('trash/list')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'Team' })
  @ApiOperation({ summary: 'Listar equipos en papelera' })
  findTrashed(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.teamsService.findTrashed(Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver equipo por ID' })
  findById(@Param('id') id: string) {
    return this.teamsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'create', subject: 'Team' })
  @ApiOperation({ summary: 'Crear equipo' })
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Team' })
  @ApiOperation({ summary: 'Actualizar equipo' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateTeamDto>) {
    return this.teamsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'Team' })
  @ApiOperation({ summary: 'Eliminar equipo (mover a papelera)' })
  softDelete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.teamsService.softDelete(id, userId);
  }

  @Post(':id/restore')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'Team' })
  @ApiOperation({ summary: 'Restaurar equipo de la papelera' })
  restore(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.teamsService.restore(id, userId);
  }
}
