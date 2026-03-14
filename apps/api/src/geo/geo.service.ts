import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeoRegion } from '@prisma/client';

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  async getMunicipalities(region?: GeoRegion) {
    const where = region ? { region } : {};
    return this.prisma.municipality.findMany({ where, orderBy: { name: 'asc' } });
  }

  async getSectors(municipalityId: string) {
    return this.prisma.geoSector.findMany({
      where: { municipalityId },
      orderBy: { name: 'asc' },
    });
  }
}
