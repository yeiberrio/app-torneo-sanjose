import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { buildWorkbook, normalizeText, pick, readSheetRows, toInt } from '../common/excel.util';

export interface ImportRowResult {
  row: number;
  status: 'created' | 'updated' | 'skipped' | 'error';
  message?: string;
  data?: any;
}

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTeamDto) {
    return this.prisma.team.create({ data: dto });
  }

  async findAll(page = 1, limit = 20, search?: string, tournamentId?: string) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { city: { contains: search, mode: 'insensitive' } }];
    if (tournamentId) where.tournaments = { some: { tournamentId } };
    const [data, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        skip, take: limit,
        include: {
          _count: { select: { players: { where: { deletedAt: null } } } },
          tournaments: { select: { tournamentId: true, groupName: true, tournament: { select: { id: true, name: true, status: true } } } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.team.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  // --- Importacion masiva ---
  buildImportTemplate(): Buffer {
    return buildWorkbook([
      {
        name: 'Equipos',
        rows: [
          ['Nombre', 'Ciudad', 'Año fundación', 'Grupo'],
          ['Deportivo San José', 'Guarne', 2015, 'A'],
          ['Atlético Centro', 'Guarne', 2018, 'B'],
        ],
        widths: [32, 20, 16, 10],
      },
      {
        name: 'Instrucciones',
        rows: [
          ['Plantilla de carga masiva de equipos'],
          [''],
          ['1. Diligencie una fila por equipo en la hoja "Equipos". Las filas de ejemplo pueden borrarse.'],
          ['2. "Nombre" es obligatorio. Si ya existe un equipo con el mismo nombre se actualiza (ciudad / año) en vez de duplicarse.'],
          ['3. "Ciudad" y "Año fundación" son opcionales.'],
          ['4. "Grupo" solo se usa cuando importa desde un torneo: inscribe el equipo en ese torneo con el grupo indicado (A, B, C...).'],
          ['5. Guarde el archivo como .xlsx y súbalo desde el botón "Importar" en la pantalla de Equipos o desde el torneo.'],
          ['6. Antes de confirmar vera una vista previa con los errores detectados por fila.'],
        ],
        widths: [120],
      },
    ]);
  }

  async importFromExcel(buffer: Buffer, options: { dryRun?: boolean; tournamentId?: string; userId?: string }) {
    const { rows, headers } = readSheetRows(buffer, 'Equipos');
    if (rows.length === 0) throw new BadRequestException('El archivo no contiene filas de equipos. Use la plantilla oficial.');
    if (!headers.some(h => ['nombre', 'equipo', 'nombre del equipo', 'name'].includes(h))) {
      throw new BadRequestException('No se encontró la columna "Nombre". Descargue la plantilla y respete los encabezados.');
    }

    const existing = await this.prisma.team.findMany({ where: { deletedAt: null }, select: { id: true, name: true, city: true, foundedYear: true } });
    const byName = new Map(existing.map(t => [normalizeText(t.name), t]));
    const seen = new Set<string>();
    const results: ImportRowResult[] = [];

    let tournament: any = null;
    if (options.tournamentId) {
      tournament = await this.prisma.tournament.findUnique({ where: { id: options.tournamentId }, include: { teams: true } });
      if (!tournament) throw new NotFoundException('Torneo no encontrado');
    }

    for (const r of rows) {
      const name = pick(r, ['nombre', 'equipo', 'nombre del equipo', 'name']);
      const city = pick(r, ['ciudad', 'municipio', 'city']);
      const foundedYear = toInt(pick(r, ['año fundación', 'ano fundacion', 'año', 'fundacion', 'fundación', 'founded']));
      const groupName = pick(r, ['grupo', 'group']);
      const rowNum = r.__row;

      if (!name || String(name).trim().length < 2) {
        results.push({ row: rowNum, status: 'error', message: 'Nombre vacío o demasiado corto' });
        continue;
      }
      const key = normalizeText(name);
      if (seen.has(key)) {
        results.push({ row: rowNum, status: 'skipped', message: 'Equipo repetido dentro del archivo', data: { name } });
        continue;
      }
      seen.add(key);
      if (foundedYear !== undefined && (foundedYear < 1900 || foundedYear > 2100)) {
        results.push({ row: rowNum, status: 'error', message: `Año de fundación inválido: ${foundedYear}`, data: { name } });
        continue;
      }

      const data = { name: String(name).trim(), city: city ? String(city).trim() : undefined, foundedYear, groupName: groupName ? String(groupName).trim().toUpperCase() : undefined };
      const found = byName.get(key);

      if (options.dryRun) {
        results.push({ row: rowNum, status: found ? 'updated' : 'created', message: found ? 'Ya existe: se actualizará' : 'Se creará', data });
        continue;
      }

      try {
        let team = found as any;
        if (found) {
          team = await this.prisma.team.update({
            where: { id: found.id },
            data: { city: data.city ?? found.city ?? undefined, foundedYear: data.foundedYear ?? found.foundedYear ?? undefined },
          });
        } else {
          team = await this.prisma.team.create({ data: { name: data.name, city: data.city, foundedYear: data.foundedYear } });
          byName.set(key, team);
        }
        if (tournament) {
          const already = tournament.teams.find((tt: any) => tt.teamId === team.id);
          if (already) {
            if (data.groupName && already.groupName !== data.groupName) {
              await this.prisma.tournamentTeam.update({ where: { id: already.id }, data: { groupName: data.groupName } });
            }
          } else {
            await this.prisma.tournamentTeam.create({ data: { tournamentId: tournament.id, teamId: team.id, groupName: data.groupName } });
          }
        }
        results.push({ row: rowNum, status: found ? 'updated' : 'created', data: { ...data, id: team.id } });
      } catch (e: any) {
        results.push({ row: rowNum, status: 'error', message: e?.message || 'Error al guardar', data });
      }
    }

    if (!options.dryRun && options.userId) {
      await this.prisma.auditLog.create({
        data: {
          userId: options.userId, action: 'IMPORT', entity: 'Team', entityId: options.tournamentId || null,
          newValue: { created: results.filter(r => r.status === 'created').length, updated: results.filter(r => r.status === 'updated').length },
        },
      });
    }

    return {
      dryRun: !!options.dryRun,
      summary: {
        total: results.length,
        created: results.filter(r => r.status === 'created').length,
        updated: results.filter(r => r.status === 'updated').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length,
      },
      rows: results,
    };
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
