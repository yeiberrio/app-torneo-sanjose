import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTeamDto) {
    return this.prisma.team.create({ data: dto });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        skip, take: limit,
        include: { _count: { select: { players: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.team.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        players: { where: { deletedAt: null }, orderBy: { jerseyNumber: 'asc' } },
        tournaments: {
          include: { tournament: { select: { id: true, name: true, type: true, status: true } } },
        },
      },
    });
    if (!team) throw new NotFoundException('Equipo no encontrado');
    return team;
  }

  async update(id: string, dto: Partial<CreateTeamDto>) {
    return this.prisma.team.update({ where: { id }, data: dto });
  }

  async softDelete(id: string, userId: string) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('Equipo no encontrado');
    if (team.deletedAt) throw new BadRequestException('El equipo ya esta en la papelera');

    await this.prisma.team.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Team',
        entityId: id,
        oldValue: { name: team.name, city: team.city },
      },
    });

    return { message: 'Equipo movido a la papelera' };
  }

  async findTrashed(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: { not: null } };
    const [data, total] = await Promise.all([
      this.prisma.team.findMany({
        where: where as any,
        skip, take: limit,
        include: { _count: { select: { players: true } } },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.team.count({ where: where as any }),
    ]);
    return { data, total, page, limit };
  }

  async restore(id: string, userId: string) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('Equipo no encontrado');
    if (!team.deletedAt) throw new BadRequestException('El equipo no esta en la papelera');

    await this.prisma.team.update({
      where: { id },
      data: { deletedAt: null, deletedBy: null },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'RESTORE',
        entity: 'Team',
        entityId: id,
        newValue: { name: team.name },
      },
    });

    return { message: 'Equipo restaurado' };
  }
}
