import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RolesService, MODULES } from './roles.service';
import { CreateRoleDto, UpdatePermissionsDto } from './dto/create-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PoliciesGuard, CheckPolicies } from '../casl/policies.guard';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get('modules')
  @CheckPolicies({ action: 'manage', subject: 'all' })
  @ApiOperation({ summary: 'Listar modulos disponibles' })
  getModules() {
    return MODULES;
  }

  @Post()
  @CheckPolicies({ action: 'manage', subject: 'all' })
  @ApiOperation({ summary: 'Crear nuevo rol' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @CheckPolicies({ action: 'manage', subject: 'all' })
  @ApiOperation({ summary: 'Listar todos los roles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('defaults/all')
  @CheckPolicies({ action: 'manage', subject: 'all' })
  @ApiOperation({ summary: 'Obtener todos los permisos default agrupados por rol' })
  getAllDefaults() {
    return this.rolesService.getAllDefaultPermissions();
  }

  @Get('defaults/:role')
  @CheckPolicies({ action: 'manage', subject: 'all' })
  @ApiOperation({ summary: 'Obtener permisos default de un rol' })
  getDefaults(@Param('role') role: Role) {
    return this.rolesService.getDefaultPermissions(role);
  }

  @Get(':id')
  @CheckPolicies({ action: 'manage', subject: 'all' })
  @ApiOperation({ summary: 'Obtener rol por ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id/permissions')
  @CheckPolicies({ action: 'manage', subject: 'all' })
  @ApiOperation({ summary: 'Actualizar permisos de un rol' })
  updatePermissions(@Param('id') id: string, @Body() dto: UpdatePermissionsDto) {
    return this.rolesService.updatePermissions(id, dto);
  }

  @Patch('assign/:userId')
  @CheckPolicies({ action: 'manage', subject: 'all' })
  @ApiOperation({ summary: 'Asignar rol custom a usuario' })
  assignRole(@Param('userId') userId: string, @Body() body: { roleId: string | null }) {
    return this.rolesService.assignRoleToUser(userId, body.roleId);
  }

  @Patch('defaults/:role')
  @CheckPolicies({ action: 'manage', subject: 'all' })
  @ApiOperation({ summary: 'Actualizar permisos default de un rol' })
  updateDefaults(@Param('role') role: Role, @Body() dto: UpdatePermissionsDto) {
    return this.rolesService.updateDefaultPermissions(role, dto);
  }

  @Delete(':id')
  @CheckPolicies({ action: 'manage', subject: 'all' })
  @ApiOperation({ summary: 'Eliminar rol custom' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
