import { IsString, IsOptional, IsEnum, IsInt, Min, IsArray, Max, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentType } from '@prisma/client';

export class PhaseTemplateDto {
  @ApiPropertyOptional({ example: 'Fase de grupos' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: ['ROUND_ROBIN', 'GROUP_STAGE', 'KNOCKOUT', 'POINTS_CLASSIFICATION'] })
  @IsIn(['ROUND_ROBIN', 'GROUP_STAGE', 'KNOCKOUT', 'POINTS_CLASSIFICATION'])
  type: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  legs?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  teamsAdvancing?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  groupsCount?: number;
}

export class CreateTournamentDto {
  @ApiProperty({ example: 'Torneo San Jose 2026' })
  @IsString()
  name: string;

  @ApiProperty({ enum: TournamentType })
  @IsEnum(TournamentType)
  type: TournamentType;

  @ApiProperty({ example: '2026-06-01' })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-12-01' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizerLogoUrl?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  winPoints?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  drawPoints?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lossPoints?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxYellowCards?: number;

  @ApiPropertyOptional({ example: 'Torneo de fútbol 7 categoría libre' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Guarne' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: ['Cancha San José', 'Cancha La Clara'] })
  @IsOptional()
  @IsArray()
  venues?: string[];

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(240)
  matchDurationMin?: number;

  @ApiPropertyOptional({ type: [PhaseTemplateDto], description: 'Fases a crear junto con el torneo' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhaseTemplateDto)
  phases?: PhaseTemplateDto[];
}
