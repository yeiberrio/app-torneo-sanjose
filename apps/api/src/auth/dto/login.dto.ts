import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@sportmanager.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin2026*' })
  @IsString()
  password: string;
}
