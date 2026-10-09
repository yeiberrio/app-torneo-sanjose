import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PlayerStatus } from '@prisma/client';
import { CreatePlayerDto } from './create-player.dto';

export class UpdatePlayerDto extends PartialType(CreatePlayerDto) {
  @ApiPropertyOptional({ enum: PlayerStatus })
  @IsOptional()
  @IsEnum(PlayerStatus)
  status?: PlayerStatus;
}
