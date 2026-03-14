import { Injectable, NotFoundException } from '@nestjs/common';
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
    const [data, total] = await Promise.all([
      this.prisma.team.findMany({
        skip, take: limit,
        include: { _count: { select: { players: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.team.count(),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { players: { where: { status: 'ACTIVE' }, orderBy: { jerseyNumber: 'asc' } } },
    });
    if (!team) throw new NotFoundException('Equipo no encontrado');
    return team;
  }

  async update(id: string, dto: Partial<CreateTeamDto>) {
    return this.prisma.team.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return this.prisma.team.delete({ where: { id } });
  }
}
