import { IsString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
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
}
