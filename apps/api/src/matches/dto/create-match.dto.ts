import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMatchDto {
  @ApiProperty()
  @IsString()
  tournamentId: string;

  @ApiProperty()
  @IsString()
  teamAId: string;

  @ApiProperty()
  @IsString()
  teamBId: string;

  @ApiProperty({ example: '2026-06-15T15:00:00.000Z' })
  @IsString()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 'Cancha San Jose' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  matchNumber?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  dayNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refereeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scorekeeperId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observerId?: string;
}
