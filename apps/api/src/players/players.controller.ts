import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard, CheckPolicies } from '../casl/policies.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
    @Query('search') search?: string,
    @Query('position') position?: string,
    @Query('status') status?: string,
    @Query('tournamentId') tournamentId?: string,
  ) {
    return this.playersService.findAll(teamId, Number(page) || 1, Number(limit) || 20, { search, position, status, tournamentId });
  }

  @Get('import/template')
  @ApiOperation({ summary: 'Descargar plantilla Excel para carga masiva de jugadores' })
  async importTemplate(@Res() res: any, @Query('teamId') teamId?: string) {
    const buffer = await this.playersService.buildImportTemplate(teamId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=plantilla_jugadores.xlsx',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('import')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'create', subject: 'Player' })
  @ApiOperation({ summary: 'Importar jugadores desde Excel (dryRun=true para vista previa)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  importExcel(
    @UploadedFile() file: Express.Multer.File,
    @Query('dryRun') dryRun?: string,
    @Query('createMissingTeams') createMissingTeams?: string,
    @Query('teamId') teamId?: string,
    @CurrentUser('id') userId?: string,
  ) {
    if (!file) throw new BadRequestException('Debe adjuntar un archivo .xlsx');
    return this.playersService.importFromExcel(file.buffer, {
      dryRun: dryRun === 'true',
      createMissingTeams: createMissingTeams === 'true',
      defaultTeamId: teamId || undefined,
      userId,
    });
  }

  @Get('top-scorers/:tournamentId')
  @ApiOperation({ summary: 'Top goleadores del torneo' })
  getTopScorers(@Param('tournamentId') tournamentId: string, @Query('limit') limit?: string) {
    return this.playersService.getTopScorers(tournamentId, Number(limit) || 10);
  }

  @Get('trash/list')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'Player' })
  @ApiOperation({ summary: 'Listar jugadores en papelera' })
  findTrashed(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.playersService.findTrashed(Number(page) || 1, Number(limit) || 20);
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
  update(@Param('id') id: string, @Body() dto: UpdatePlayerDto) {
    return this.playersService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'Player' })
  @ApiOperation({ summary: 'Eliminar jugador (mover a papelera)' })
  softDelete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.playersService.softDelete(id, userId);
  }

  @Post(':id/restore')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: 'delete', subject: 'Player' })
  @ApiOperation({ summary: 'Restaurar jugador de la papelera' })
  restore(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.playersService.restore(id, userId);
  }
}
