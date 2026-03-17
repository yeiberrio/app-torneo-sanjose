import { IsString, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TiebreakerItemDto {
  @ApiProperty({ enum: ['HEAD_TO_HEAD', 'GOAL_DIFFERENCE', 'GOALS_FOR', 'GOALS_AGAINST', 'FAIR_PLAY', 'PENALTY_SHOOTOUT', 'LOTS_DRAWING', 'AWAY_GOALS', 'WINS', 'DRAWS'] })
  @IsString()
  criteria: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  priority: number;
}

export class ConfigureTiebreakersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roundId?: string;

  @ApiProperty({ type: [TiebreakerItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TiebreakerItemDto)
  tiebreakers: TiebreakerItemDto[];
}
