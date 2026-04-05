import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdatePermissionsDto } from './dto/create-role.dto';

// Modules available in the tournament system
export const MODULES = [
  'dashboard', 'tournaments', 'teams', 'players', 'matches',
  'statistics', 'sanctions', 'news', 'users', 'roles',
];

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.customRole.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Ya existe un rol con ese nombre');

    const role = await this.prisma.customRole.create({
      data: { name: dto.name, description: dto.description, isSystem: false },
    });

    if (dto.permissions?.length) {
      for (const perm of dto.permissions) {
        await this.prisma.rolePermission.create({
          data: {
            roleId: role.id, module: perm.module,
            viewModule: perm.viewModule ?? false, create: perm.create ?? false,
            read: perm.read ?? false, edit: perm.edit ?? false, delete: perm.delete ?? false,
          },
        });
      }
    }

    return this.findOne(role.id);
  }

  async findAll() {
    return this.prisma.customRole.findMany({
      include: {
        permissions: { orderBy: { module: 'asc' } },
        _count: { select: { users: true } },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.customRole.findUnique({
      where: { id },
      include: {
        permissions: { orderBy: { module: 'asc' } },
        _count: { select: { users: true } },
      },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  async updatePermissions(id: string, dto: UpdatePermissionsDto) {
    const role = await this.findOne(id);
    if (role.isSystem) throw new BadRequestException('No se pueden modificar los permisos de un rol del sistema');

    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });

    for (const perm of dto.permissions) {
      await this.prisma.rolePermission.create({
        data: {
          roleId: id, module: perm.module,
          viewModule: perm.viewModule ?? false, create: perm.create ?? false,
          read: perm.read ?? false, edit: perm.edit ?? false, delete: perm.delete ?? false,
        },
      });
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role.isSystem) throw new BadRequestException('No se pueden eliminar roles del sistema');
    if (role._count.users > 0) throw new BadRequestException('No se puede eliminar un rol con usuarios asignados');

    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    return this.prisma.customRole.delete({ where: { id } });
  }

  async assignRoleToUser(userId: string, roleId: string | null) {
    if (roleId) {
      const role = await this.prisma.customRole.findUnique({ where: { id: roleId } });
      if (!role) throw new NotFoundException('Rol no encontrado');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { customRoleId: roleId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, customRoleId: true },
    });
  }

  // Default permissions per enum role
  async getDefaultPermissions(role: Role) {
    return this.prisma.defaultRolePermission.findMany({
      where: { role },
      orderBy: { module: 'asc' },
    });
  }

  async updateDefaultPermissions(role: Role, dto: UpdatePermissionsDto) {
    if (role === 'SUPER_ADMIN') throw new BadRequestException('No se pueden modificar los permisos del SUPER_ADMIN');

    await this.prisma.defaultRolePermission.deleteMany({ where: { role } });

    for (const perm of dto.permissions) {
      await this.prisma.defaultRolePermission.create({
        data: {
          role, module: perm.module,
          viewModule: perm.viewModule ?? false, create: perm.create ?? false,
          read: perm.read ?? false, edit: perm.edit ?? false, delete: perm.delete ?? false,
        },
      });
    }

    return this.getDefaultPermissions(role);
  }

  async getAllDefaultPermissions() {
    const permisos = await this.prisma.defaultRolePermission.findMany({
      orderBy: [{ role: 'asc' }, { module: 'asc' }],
    });
    const grouped: Record<string, typeof permisos> = {};
    for (const p of permisos) {
      if (!grouped[p.role]) grouped[p.role] = [];
      grouped[p.role].push(p);
    }
    return grouped;
  }
}
