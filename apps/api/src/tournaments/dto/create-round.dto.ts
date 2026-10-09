import { IsString, IsOptional, IsInt, IsBoolean, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoundDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  roundNumber: number;

  @ApiPropertyOptional({ example: 'Fase de Grupos' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: ['ROUND_ROBIN', 'KNOCKOUT', 'POINTS_CLASSIFICATION', 'GROUP_STAGE'] })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  teamsAdvancing?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  advanceAll?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  legs?: number;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: 4, description: 'Cantidad de grupos (solo fase de grupos)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  groupsCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
