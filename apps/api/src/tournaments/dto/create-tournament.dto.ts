import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentType } from '@prisma/client';

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
}
