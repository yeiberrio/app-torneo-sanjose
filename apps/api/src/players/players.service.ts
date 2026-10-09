import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import * as XLSX from 'xlsx';
import {
  buildWorkbook, normalizeText, pick, readSheetRows, toInt, toDateISO, splitFullName,
  POSITION_ALIASES, DOCUMENT_ALIASES, GENDER_ALIASES,
} from '../common/excel.util';

export interface PlayerImportRow {
  row: number;
  status: 'created' | 'skipped' | 'error';
  message?: string;
  data?: any;
}

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePlayerDto) {
    return this.prisma.player.create({
      data: { ...dto, birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined },
    });
  }

  async findAll(teamId?: string, page = 1, limit = 20, filters: { search?: string; position?: string; status?: string; tournamentId?: string } = {}) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (teamId) where.teamId = teamId;
    if (filters.position) where.position = filters.position;
    if (filters.status) where.status = filters.status;
    if (filters.tournamentId) where.team = { tournaments: { some: { tournamentId: filters.tournamentId } } };
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { documentNumber: { contains: filters.search } },
        { team: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.player.findMany({
        where, skip, take: limit,
        include: { team: { select: { id: true, name: true, logoUrl: true } } },
        orderBy: { lastName: 'asc' },
      }),
      this.prisma.player.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: {
        team: true,
        stats: {
          include: {
            match: {
              select: {
                id: true, scheduledAt: true, venue: true, status: true,
                scoreA: true, scoreB: true, teamAId: true, teamBId: true,
                dayNumber: true,
                tournament: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { match: { scheduledAt: 'desc' } },
        },
        events: {
          include: {
            match: {
              select: {
                id: true, scheduledAt: true, teamAId: true, teamBId: true,
                status: true, scoreA: true, scoreB: true, dayNumber: true, venue: true,
                tournament: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { match: { scheduledAt: 'desc' } },
        },
        sanctions: { orderBy: { imposedAt: 'desc' } },
      },
    });
    if (!player) throw new NotFoundException('Jugador no encontrado');

    // Resolve team names for matches (from stats and events)
    const matchTeamIds = new Set<string>();
    player.stats.forEach(s => { matchTeamIds.add(s.match.teamAId); matchTeamIds.add(s.match.teamBId); });
    player.events.forEach((e: any) => { if (e.match) { matchTeamIds.add(e.match.teamAId); matchTeamIds.add(e.match.teamBId); } });
    const teams = await this.prisma.team.findMany({
      where: { id: { in: Array.from(matchTeamIds) } },
      select: { id: true, name: true },
    });
    const teamMap = Object.fromEntries(teams.map(t => [t.id, t.name]));

    return { ...player, _teamMap: teamMap };
  }

  async update(id: string, dto: UpdatePlayerDto) {
    const data: any = { ...dto };
    if (dto.birthDate) data.birthDate = new Date(dto.birthDate);
    else delete data.birthDate;
    return this.prisma.player.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string, userId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: { team: { select: { name: true } } },
    });
    if (!player) throw new NotFoundException('Jugador no encontrado');
    if (player.deletedAt) throw new BadRequestException('El jugador ya esta en la papelera');

    await this.prisma.player.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        entity: 'Player',
        entityId: id,
        oldValue: {
          firstName: player.firstName,
          lastName: player.lastName,
          jerseyNumber: player.jerseyNumber,
          team: player.team?.name,
        },
      },
    });

    return { message: 'Jugador movido a la papelera' };
  }

  async findTrashed(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: { not: null } };
    const [data, total] = await Promise.all([
      this.prisma.player.findMany({
        where: where as any,
        skip, take: limit,
        include: { team: { select: { id: true, name: true, logoUrl: true } } },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.player.count({ where: where as any }),
    ]);
    return { data, total, page, limit };
  }

  async restore(id: string, userId: string) {
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) throw new NotFoundException('Jugador no encontrado');
    if (!player.deletedAt) throw new BadRequestException('El jugador no esta en la papelera');

    await this.prisma.player.update({
      where: { id },
      data: { deletedAt: null, deletedBy: null },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'RESTORE',
        entity: 'Player',
        entityId: id,
        newValue: { firstName: player.firstName, lastName: player.lastName },
      },
    });

    return { message: 'Jugador restaurado' };
  }

  // --- Importacion masiva ---
  async buildImportTemplate(teamId?: string): Promise<Buffer> {
    const teams = await this.prisma.team.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true, city: true } });
    const target = teamId ? teams.find(t => t.id === teamId) : undefined;
    const exampleTeam = target?.name || teams[0]?.name || 'Deportivo San José';
    return buildWorkbook([
      {
        name: 'Jugadores',
        rows: [
          ['Equipo', 'Nombre', 'Apellido', 'Número', 'Posición', 'Tipo documento', 'Documento', 'Fecha nacimiento', 'Género', 'Nacionalidad'],
          [exampleTeam, 'Carlos', 'Gómez', 10, 'Delantero', 'CC', '1035000000', '1998-05-20', 'M', 'Colombiana'],
          [exampleTeam, 'Andrés', 'Pérez', 1, 'Portero', 'CC', '1035000001', '2001-11-03', 'M', 'Colombiana'],
        ],
        widths: [28, 18, 18, 10, 16, 16, 16, 18, 10, 16],
      },
      {
        name: 'Equipos',
        rows: [['Nombre del equipo (use exactamente este texto)', 'Ciudad'], ...teams.map(t => [t.name, t.city || ''])],
        widths: [45, 20],
      },
      {
        name: 'Instrucciones',
        rows: [
          ['Plantilla de carga masiva de jugadores'],
          [''],
          ['1. Una fila por jugador en la hoja "Jugadores". Borre las filas de ejemplo.'],
          ['2. Obligatorios: Equipo, Nombre y Apellido. El equipo debe existir (vea la hoja "Equipos") o active "Crear equipos faltantes" al importar.'],
          ['3. Posición: Portero, Defensa, Mediocampista o Delantero.'],
          ['4. Tipo documento: CC, CE, TI, Pasaporte o NIT. Documento: solo el número.'],
          ['5. Fecha nacimiento en formato AAAA-MM-DD (ej. 1998-05-20) o DD/MM/AAAA. Género: M o F.'],
          ['6. Un jugador se considera duplicado si en el mismo equipo ya existe otro con el mismo documento o el mismo nombre y apellido; esas filas se omiten.'],
          ['7. También se acepta el formato por bloques (como "Jugadores.xlsx"): una fila con el nombre del equipo y luego filas "# | Nombre completo | Documento".'],
        ],
        widths: [130],
      },
    ]);
  }

  /** Detecta el formato por bloques (nombre de equipo + filas #, nombre, cedula). */
  private parseBlockFormat(buffer: Buffer) {
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
    const rows: { __row: number; equipo: string; nombre: string; numero?: number; documento?: string }[] = [];
    let currentTeam: string | null = null;
    for (let i = 0; i < raw.length; i++) {
      const r = raw[i] || [];
      const cells = r.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
      if (cells.length === 0) continue;
      const first = r[0];
      const second = r[1];
      // Fila de equipo: primera celda vacia o no numerica y segunda celda texto, sin numero de jugador
      const isNumber = typeof first === 'number' || (typeof first === 'string' && /^\d+$/.test(first.trim()));
      if (!isNumber && typeof second === 'string' && second.trim()) {
        currentTeam = second.trim();
        continue;
      }
      if (isNumber && currentTeam && typeof second === 'string' && second.trim()) {
        const doc = r[2] !== null && r[2] !== undefined ? String(r[2]).replace(/\.0$/, '').trim() : undefined;
        rows.push({ __row: i + 1, equipo: currentTeam, nombre: second.trim(), numero: Number(first), documento: doc });
      }
    }
    return rows;
  }

  async importFromExcel(buffer: Buffer, options: { dryRun?: boolean; createMissingTeams?: boolean; defaultTeamId?: string; userId?: string }) {
    let { rows, headers } = readSheetRows(buffer, 'Jugadores');
    const hasFlatHeaders = headers.some(h => ['nombre', 'nombres', 'jugador', 'nombre completo'].includes(h));
    let blockMode = false;
    if (!hasFlatHeaders) {
      const block = this.parseBlockFormat(buffer);
      if (block.length === 0) throw new BadRequestException('No se reconoce el formato del archivo. Descargue la plantilla oficial.');
      rows = block as any;
      blockMode = true;
    }

    const teams = await this.prisma.team.findMany({ where: { deletedAt: null }, select: { id: true, name: true } });
    const teamByName = new Map(teams.map(t => [normalizeText(t.name), t]));
    const defaultTeam = options.defaultTeamId ? teams.find(t => t.id === options.defaultTeamId) : undefined;

    const existingPlayers = await this.prisma.player.findMany({
      where: { deletedAt: null },
      select: { teamId: true, firstName: true, lastName: true, documentNumber: true, jerseyNumber: true },
    });
    const dupKeys = new Set<string>();
    const docKeys = new Set<string>();
    for (const p of existingPlayers) {
      dupKeys.add(`${p.teamId}|${normalizeText(p.firstName)} ${normalizeText(p.lastName)}`);
      if (p.documentNumber) docKeys.add(`${p.teamId}|${normalizeText(p.documentNumber)}`);
    }

    const results: PlayerImportRow[] = [];
    const toCreate: { row: number; data: any }[] = [];

    for (const r of rows as any[]) {
      const rowNum = r.__row;
      let firstName: string; let lastName: string;
      const teamName = blockMode ? r.equipo : pick(r, ['equipo', 'team', 'club']);
      if (blockMode) {
        ({ firstName, lastName } = splitFullName(r.nombre));
      } else {
        const fn = pick(r, ['nombre', 'nombres', 'first name', 'firstname']);
        const ln = pick(r, ['apellido', 'apellidos', 'last name', 'lastname']);
        if (fn && !ln) ({ firstName, lastName } = splitFullName(String(fn)));
        else { firstName = fn ? String(fn).trim() : ''; lastName = ln ? String(ln).trim() : ''; }
        const full = pick(r, ['jugador', 'nombre completo']);
        if (!firstName && full) ({ firstName, lastName } = splitFullName(String(full)));
      }
      const jerseyNumber = blockMode ? r.numero : toInt(pick(r, ['número', 'numero', 'no', '#', 'camiseta', 'dorsal', 'number']));
      const positionRaw = blockMode ? undefined : pick(r, ['posición', 'posicion', 'position']);
      const docTypeRaw = blockMode ? (r.documento ? 'CC' : undefined) : pick(r, ['tipo documento', 'tipo de documento', 'tipo doc', 'document type']);
      const documentRaw = blockMode ? r.documento : pick(r, ['documento', 'cédula', 'cedula', 'cc', 'identificación', 'identificacion', 'document']);
      const birthRaw = blockMode ? undefined : pick(r, ['fecha nacimiento', 'fecha de nacimiento', 'nacimiento', 'birthdate', 'birth date']);
      const genderRaw = blockMode ? undefined : pick(r, ['género', 'genero', 'sexo', 'gender']);
      const nationality = blockMode ? undefined : pick(r, ['nacionalidad', 'nationality']);

      if (!firstName) { results.push({ row: rowNum, status: 'error', message: 'Falta el nombre del jugador' }); continue; }
      if (!lastName) { results.push({ row: rowNum, status: 'error', message: 'Falta el apellido del jugador', data: { firstName } }); continue; }

      let team = teamName ? teamByName.get(normalizeText(teamName)) : defaultTeam;
      if (!team && teamName && options.createMissingTeams && !options.dryRun) {
        team = await this.prisma.team.create({ data: { name: String(teamName).trim() } });
        teamByName.set(normalizeText(teamName), team);
      }
      if (!team && teamName && options.createMissingTeams && options.dryRun) {
        team = { id: '__new__', name: String(teamName).trim() } as any;
      }
      if (!team) {
        results.push({ row: rowNum, status: 'error', message: teamName ? `El equipo "${teamName}" no existe` : 'Falta el equipo', data: { firstName, lastName, teamName } });
        continue;
      }

      const position = positionRaw ? POSITION_ALIASES[normalizeText(positionRaw)] || (Object.values(POSITION_ALIASES).includes(String(positionRaw).toUpperCase()) ? String(positionRaw).toUpperCase() : undefined) : undefined;
      if (positionRaw && !position) { results.push({ row: rowNum, status: 'error', message: `Posición no válida: "${positionRaw}"`, data: { firstName, lastName, teamName: team.name } }); continue; }
      const documentType = docTypeRaw ? DOCUMENT_ALIASES[normalizeText(docTypeRaw)] || (Object.values(DOCUMENT_ALIASES).includes(String(docTypeRaw).toUpperCase()) ? String(docTypeRaw).toUpperCase() : undefined) : (documentRaw ? 'CEDULA_CIUDADANIA' : undefined);
      const documentNumber = documentRaw !== undefined ? String(documentRaw).replace(/\.0$/, '').trim() : undefined;
      const birthDate = toDateISO(birthRaw);
      if (birthRaw && !birthDate) { results.push({ row: rowNum, status: 'error', message: `Fecha de nacimiento no válida: "${birthRaw}"`, data: { firstName, lastName, teamName: team.name } }); continue; }
      const gender = genderRaw ? GENDER_ALIASES[normalizeText(genderRaw)] : undefined;
      if (jerseyNumber !== undefined && (jerseyNumber < 0 || jerseyNumber > 999)) { results.push({ row: rowNum, status: 'error', message: `Número de camiseta no válido: ${jerseyNumber}`, data: { firstName, lastName, teamName: team.name } }); continue; }

      const nameKey = `${team.id}|${normalizeText(firstName)} ${normalizeText(lastName)}`;
      const docKey = documentNumber ? `${team.id}|${normalizeText(documentNumber)}` : null;
      const data = { teamId: team.id, teamName: team.name, firstName, lastName, jerseyNumber: jerseyNumber || undefined, position, documentType, documentNumber: documentNumber || undefined, birthDate, gender, nationality: nationality ? String(nationality).trim() : undefined };

      if (dupKeys.has(nameKey) || (docKey && docKeys.has(docKey))) {
        results.push({ row: rowNum, status: 'skipped', message: 'Ya existe en el equipo (duplicado)', data });
        continue;
      }
      dupKeys.add(nameKey);
      if (docKey) docKeys.add(docKey);
      toCreate.push({ row: rowNum, data });
      results.push({ row: rowNum, status: 'created', message: options.dryRun ? 'Se creará' : undefined, data });
    }

    if (!options.dryRun) {
      for (const item of toCreate) {
        const { teamName, ...d } = item.data;
        try {
          const created = await this.prisma.player.create({
            data: {
              teamId: d.teamId, firstName: d.firstName, lastName: d.lastName, jerseyNumber: d.jerseyNumber,
              position: d.position as any, documentType: d.documentType as any, documentNumber: d.documentNumber,
              birthDate: d.birthDate ? new Date(d.birthDate) : undefined, gender: d.gender as any, nationality: d.nationality,
            },
          });
          const res = results.find(x => x.row === item.row);
          if (res) res.data = { ...res.data, id: created.id };
        } catch (e: any) {
          const res = results.find(x => x.row === item.row);
          if (res) { res.status = 'error'; res.message = e?.message || 'Error al guardar'; }
        }
      }
      if (options.userId) {
        await this.prisma.auditLog.create({
          data: { userId: options.userId, action: 'IMPORT', entity: 'Player', newValue: { created: results.filter(r => r.status === 'created').length } },
        });
      }
    }

    return {
      dryRun: !!options.dryRun,
      format: blockMode ? 'bloques' : 'plantilla',
      summary: {
        total: results.length,
        created: results.filter(r => r.status === 'created').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length,
      },
      rows: results.sort((a, b) => a.row - b.row),
    };
  }

  async getTopScorers(tournamentId: string, limit = 10) {
    const stats = await this.prisma.matchPlayerStat.groupBy({
      by: ['playerId'],
      where: { match: { tournamentId } },
      _sum: { goals: true, assists: true },
      orderBy: { _sum: { goals: 'desc' } },
      take: limit,
    });

    const playerIds = stats.map((s) => s.playerId);
    const players = await this.prisma.player.findMany({
      where: { id: { in: playerIds } },
      include: { team: { select: { id: true, name: true, logoUrl: true } } },
    });

    return stats.map((s) => ({
      player: players.find((p) => p.id === s.playerId),
      goals: s._sum.goals || 0,
      assists: s._sum.assists || 0,
    }));
  }
}
