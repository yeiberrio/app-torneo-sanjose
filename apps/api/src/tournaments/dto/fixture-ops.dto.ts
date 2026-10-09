import { IsArray, IsIn, IsInt, IsOptional, IsString, Min, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MatchPatchItemDto {
  @ApiProperty() @IsString() id: string;
  @ApiPropertyOptional() @IsOptional() @IsString() teamAId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() teamBId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() scheduledAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() venue?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) dayNumber?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) matchNumber?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() roundId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() groupName?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() label?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) legNumber?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() refereeId?: string | null;
}

export class BulkUpdateMatchesDto {
  @ApiProperty({ type: [MatchPatchItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchPatchItemDto)
  matches: MatchPatchItemDto[];
}

export class DistributeGroupsDto {
  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  groupsCount: number;

  @ApiPropertyOptional({ enum: ['random', 'sequential', 'snake'], default: 'random' })
  @IsOptional()
  @IsIn(['random', 'sequential', 'snake'])
  method?: 'random' | 'sequential' | 'snake';

  @ApiPropertyOptional({ description: 'Mantener los grupos ya asignados y solo repartir los equipos sin grupo' })
  @IsOptional()
  @IsBoolean()
  keepExisting?: boolean;
}

export class SetGroupDto {
  @ApiPropertyOptional({ example: 'A', nullable: true })
  @IsOptional()
  @IsString()
  groupName?: string | null;
}

export class NextPhaseDto {
  @ApiPropertyOptional({ example: '2026-04-10' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ default: '15:00' })
  @IsOptional()
  @IsString()
  matchTime?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  slotMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultVenue?: string;

  @ApiPropertyOptional({ description: 'Ganadores forzados por partido para empates: { matchId: teamId }' })
  @IsOptional()
  winners?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Emparejamientos manuales para la siguiente fase' })
  @IsOptional()
  @IsArray()
  pairs?: string[][];
}
