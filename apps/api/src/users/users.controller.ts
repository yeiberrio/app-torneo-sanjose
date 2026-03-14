import { Controller, Get, Param, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar usuarios' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.usersService.findAll(Number(page) || 1, Number(limit) || 20);
  }

  @Get('pending-approvals')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Solicitudes de rol pendientes' })
  getPendingApprovals() {
    return this.usersService.getPendingApprovals();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ver usuario por ID' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('approve-role/:requestId')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Aprobar o rechazar solicitud de rol' })
  approveRoleRequest(
    @Param('requestId') requestId: string,
    @Body('approved') approved: boolean,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.approveRoleRequest(requestId, userId, approved);
  }
}
