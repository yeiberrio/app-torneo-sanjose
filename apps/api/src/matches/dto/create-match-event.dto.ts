import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '@prisma/client';

export class CreateMatchEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  playerId?: string;

  @ApiProperty()
  @IsString()
  teamId: string;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  type: EventType;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  minute?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
