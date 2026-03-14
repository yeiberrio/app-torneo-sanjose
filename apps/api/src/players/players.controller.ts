import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard, CheckPolicies } from '../casl/policies.guard';

@ApiTags('Players')
@Controller('players')
export class PlayersController {
  constructor(private playersService: PlayersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar jugadores' })
  findAll(
    @Query('teamId') teamId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.playersService.findAll(teamId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('top-scorers/:tournamentId')
  @ApiOperation({ summary: 'Top goleadores del torneo' })
  getTopScorers(@Param('tournamentId') tournamentId: string, @Query('limit') limit?: string) {
    return this.playersService.getTopScorers(tournamentId, Number(limit) || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver jugador por ID' })
  findById(@Param('id') id: string) {
    return this.playersService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'create', subject: 'Player' })
  @ApiOperation({ summary: 'Crear jugador' })
  create(@Body() dto: CreatePlayerDto) {
    return this.playersService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'update', subject: 'Player' })
  @ApiOperation({ summary: 'Actualizar jugador' })
  update(@Param('id') id: string, @Body() dto: Partial<CreatePlayerDto>) {
    return this.playersService.update(id, dto);
  }
}
