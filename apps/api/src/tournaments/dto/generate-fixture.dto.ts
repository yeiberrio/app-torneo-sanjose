import { IsOptional, IsInt, IsDateString, IsString, Min, Max, IsArray, IsIn, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateFixtureDto {
  @ApiPropertyOptional({ description: 'Fecha de inicio del fixture', example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '1 = solo ida, 2 = ida y vuelta', enum: [1, 2], default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  legs?: number;

  @ApiPropertyOptional({ description: 'Dias entre jornadas', default: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  intervalDays?: number;

  @ApiPropertyOptional({ description: 'Hora de los partidos (formato HH:mm)', default: '15:00' })
  @IsOptional()
  @IsString()
  matchTime?: string;

  @ApiPropertyOptional({ description: 'Minutos entre partidos de una misma jornada (0 = todos a la misma hora)', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  slotMinutes?: number;

  @ApiPropertyOptional({ description: 'Sede por defecto' })
  @IsOptional()
  @IsString()
  defaultVenue?: string;

  @ApiPropertyOptional({ description: 'ID de la ronda para generar fixture' })
  @IsOptional()
  @IsString()
  roundId?: string;

  @ApiPropertyOptional({ description: 'Equipos a incluir (por defecto todos los del torneo). En eliminatoria, el orden define el sembrado.' })
  @IsOptional()
  @IsArray()
  teamIds?: string[];

  @ApiPropertyOptional({ description: 'Emparejamientos manuales para eliminatoria: [[teamA, teamB], ...]' })
  @IsOptional()
  @IsArray()
  pairs?: string[][];

  @ApiPropertyOptional({ enum: ['seeded', 'random', 'manual'], description: 'Forma de emparejar en eliminatoria' })
  @IsOptional()
  @IsIn(['seeded', 'random', 'manual'])
  pairing?: 'seeded' | 'random' | 'manual';

  @ApiPropertyOptional({ description: 'Mezclar orden de equipos antes de generar (liga/grupos)' })
  @IsOptional()
  @IsBoolean()
  shuffle?: boolean;

  @ApiPropertyOptional({ description: 'Reemplazar los partidos programados existentes de la ronda' })
  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}
