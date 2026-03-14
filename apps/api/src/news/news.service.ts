import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { NewsStatus } from '@prisma/client';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNewsDto, authorId: string) {
    return this.prisma.news.create({
      data: { ...dto, authorId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        tournament: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(status?: NewsStatus, tournamentId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (tournamentId) where.tournamentId = tournamentId;

    const [data, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          tournament: { select: { id: true, name: true } },
        },
      }),
      this.prisma.news.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const news = await this.prisma.news.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        tournament: { select: { id: true, name: true } },
      },
    });
    if (!news) throw new NotFoundException('Noticia no encontrada');
    return news;
  }

  async update(id: string, dto: Partial<CreateNewsDto>) {
    await this.findById(id);
    return this.prisma.news.update({
      where: { id },
      data: dto,
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        tournament: { select: { id: true, name: true } },
      },
    });
  }

  async publish(id: string) {
    await this.findById(id);
    return this.prisma.news.update({
      where: { id },
      data: { status: NewsStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async archive(id: string) {
    await this.findById(id);
    return this.prisma.news.update({
      where: { id },
      data: { status: NewsStatus.ARCHIVED },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.news.delete({ where: { id } });
  }
}
