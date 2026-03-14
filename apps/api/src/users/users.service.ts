import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, status: true, avatarUrl: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { data: users, total, page, limit };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, gender: true, role: true, status: true,
        avatarUrl: true, birthDate: true, heightCm: true, weightKg: true,
        municipality: true, sector: true, address: true, createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateRole(userId: string, role: Role, approvedBy: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role, approvedBy, approvedAt: new Date() },
    });
  }

  async updateStatus(userId: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  async getPendingApprovals() {
    return this.prisma.roleRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true, email: true, firstName: true, lastName: true,
            documentType: true, documentNumber: true, avatarUrl: true,
            municipality: true, sector: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveRoleRequest(requestId: string, reviewedBy: string, approved: boolean) {
    const request = await this.prisma.roleRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Solicitud no encontrada');

    await this.prisma.roleRequest.update({
      where: { id: requestId },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewedBy,
        reviewedAt: new Date(),
      },
    });

    if (approved) {
      await this.prisma.user.update({
        where: { id: request.userId },
        data: { role: request.requestedRole, approvedBy: reviewedBy, approvedAt: new Date() },
      });
    }

    return { message: approved ? 'Rol aprobado' : 'Rol rechazado' };
  }
}
