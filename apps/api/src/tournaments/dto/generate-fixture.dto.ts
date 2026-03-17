import { IsOptional, IsInt, IsDateString, IsEnum, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum FixtureLegs {
  SINGLE = 1,
  HOME_AWAY = 2,
}

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
  @Max(30)
  intervalDays?: number;

  @ApiPropertyOptional({ description: 'Hora de los partidos (formato HH:mm)', default: '15:00' })
  @IsOptional()
  matchTime?: string;

  @ApiPropertyOptional({ description: 'Sede por defecto' })
  @IsOptional()
  defaultVenue?: string;

  @ApiPropertyOptional({ description: 'ID de la ronda para generar fixture' })
  @IsOptional()
  @IsString()
  roundId?: string;
}
