import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionDto {
  @ApiProperty() @IsString() module: string;
  @ApiPropertyOptional() @IsOptional() viewModule?: boolean;
  @ApiPropertyOptional() @IsOptional() create?: boolean;
  @ApiPropertyOptional() @IsOptional() read?: boolean;
  @ApiPropertyOptional() @IsOptional() edit?: boolean;
  @ApiPropertyOptional() @IsOptional() delete?: boolean;
}

export class CreateRoleDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PermissionDto)
  permissions?: PermissionDto[];
}

export class UpdatePermissionsDto {
  @ApiProperty({ type: [PermissionDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => PermissionDto)
  permissions: PermissionDto[];
}
