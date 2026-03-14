import { PrismaClient, GeoRegion, SectorType, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // -- Super Admin --
  const passwordHash = await bcrypt.hash(process.env.SEED_SUPER_ADMIN_PASSWORD || 'Admin2026*', 12);
  await prisma.user.upsert({
    where: { email: process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@sportmanager.com' },
    update: {},
    create: {
      email: process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@sportmanager.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });
  console.log('Super Admin created');

  // -- Municipalities: Valle de Aburra --
  const valleAburra = [
    { name: 'Barbosa', daneCode: '05079' },
    { name: 'Girardota', daneCode: '05308' },
    { name: 'Copacabana', daneCode: '05212' },
    { name: 'Bello', daneCode: '05088' },
    { name: 'Medellin', daneCode: '05001' },
    { name: 'Itagui', daneCode: '05360' },
    { name: 'La Estrella', daneCode: '05380' },
    { name: 'Sabaneta', daneCode: '05631' },
    { name: 'Envigado', daneCode: '05266' },
    { name: 'Caldas', daneCode: '05129' },
  ];

  for (const m of valleAburra) {
    await prisma.municipality.upsert({
      where: { daneCode: m.daneCode },
      update: {},
      create: { name: m.name, region: GeoRegion.VALLE_ABURRA, daneCode: m.daneCode },
    });
  }
  console.log('Valle de Aburra municipalities seeded');

  // -- Municipalities: Oriente Cercano --
  const orienteCercano = [
    { name: 'Rionegro', daneCode: '05615' },
    { name: 'Marinilla', daneCode: '05440' },
    { name: 'El Carmen de Viboral', daneCode: '05148' },
    { name: 'La Ceja', daneCode: '05376' },
    { name: 'La Union', daneCode: '05400' },
    { name: 'El Retiro', daneCode: '05607' },
    { name: 'Guarne', daneCode: '05318' },
    { name: 'San Vicente Ferrer', daneCode: '05674' },
    { name: 'El Santuario', daneCode: '05697' },
    { name: 'Concepcion', daneCode: '05206' },
    { name: 'Granada', daneCode: '05313' },
    { name: 'San Carlos', daneCode: '05649' },
    { name: 'Cocorna', daneCode: '05197' },
    { name: 'Abejorral', daneCode: '05002' },
    { name: 'Argelia', daneCode: '05055' },
    { name: 'Narino', daneCode: '05483' },
    { name: 'Sonson', daneCode: '05756' },
  ];

  for (const m of orienteCercano) {
    await prisma.municipality.upsert({
      where: { daneCode: m.daneCode },
      update: {},
      create: { name: m.name, region: GeoRegion.ORIENTE_CERCANO, daneCode: m.daneCode },
    });
  }
  console.log('Oriente Cercano municipalities seeded');

  // -- Guarne sectors --
  const guarne = await prisma.municipality.findFirst({ where: { daneCode: '05318' } });
  if (guarne) {
    const barriosGuarne = [
      'Centro', 'La Paloma', 'El Carmelo', 'Villa del Este', 'Los Alpes',
      'La Union', 'El Porvenir', 'Villa Hermosa', 'Las Granjas', 'San Jose',
      'Los Alamos', 'La Florida', 'Parque Principal', 'La Inmaculada',
      'El Progreso', 'Urbanizacion Los Pinos', 'Urbanizacion El Estadio',
    ];

    for (const name of barriosGuarne) {
      const type = name.startsWith('Urbanizacion') ? SectorType.URBANIZACION : SectorType.BARRIO;
      await prisma.geoSector.upsert({
        where: { municipalityId_name: { municipalityId: guarne.id, name } },
        update: {},
        create: { municipalityId: guarne.id, name, type },
      });
    }

    const veredasGuarne = [
      'Barro Blanco', 'El Cardal', 'El Chagualo', 'El Molino', 'El Rosario',
      'El Tablazo', 'El Vallano', 'Garrido', 'Guanabano', 'Hoyorrico',
      'La Brizuela', 'La Ceja', 'La Clara', 'La Convencion', 'La Honda',
      'La Mosca', 'Las Palmas', 'Los Salados', 'Montanita', 'Nazareth',
      'Ojo de Agua', 'Palestina', 'Pan de Azucar', 'Piedras Blancas',
      'Playa Rica', 'San Ignacio', 'San Isidro', 'San Jose', 'San Pedro',
      'Santa Elena', 'Santo Domingo', 'Uvital',
    ];

    for (const name of veredasGuarne) {
      await prisma.geoSector.upsert({
        where: { municipalityId_name: { municipalityId: guarne.id, name } },
        update: {},
        create: { municipalityId: guarne.id, name, type: SectorType.VEREDA },
      });
    }
    console.log('Guarne sectors seeded');
  }

  // -- Demo Tournament --
  const admin = await prisma.user.findFirst({ where: { role: Role.SUPER_ADMIN } });
  if (!admin) throw new Error('Super Admin not found');

  const tournament = await prisma.tournament.upsert({
    where: { id: 'demo-torneo-sanjose-2026' },
    update: {},
    create: {
      id: 'demo-torneo-sanjose-2026',
      name: 'Torneo San Jose 2026',
      organizerId: admin.id,
      type: 'LEAGUE',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-06-30'),
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      maxYellowCards: 3,
    },
  });

  const teamNames = [
    'Deportivo San Jose',
    'Atletico Guarne',
    'Real La Mosca',
    'Club San Ignacio',
    'Independiente Barro Blanco',
    'Racing El Tablazo',
    'Union La Brizuela',
    'San Pedro FC',
  ];

  const teams: { id: string; name: string }[] = [];
  for (const name of teamNames) {
    const teamId = `team-${name.toLowerCase().replace(/\s+/g, '-')}`;
    const team = await prisma.team.upsert({
      where: { id: teamId },
      update: {},
      create: { id: teamId, name, city: 'Guarne' },
    });
    teams.push(team);

    await prisma.tournamentTeam.upsert({
      where: { tournamentId_teamId: { tournamentId: tournament.id, teamId: team.id } },
      update: {},
      create: { tournamentId: tournament.id, teamId: team.id },
    });
  }
  console.log('Demo tournament and teams seeded');

  // -- Players for each team --
  const positions = ['GOALKEEPER', 'DEFENDER', 'DEFENDER', 'DEFENDER', 'DEFENDER', 'MIDFIELDER', 'MIDFIELDER', 'MIDFIELDER', 'MIDFIELDER', 'FORWARD', 'FORWARD'] as const;
  const firstNames = ['Juan', 'Carlos', 'Andres', 'Felipe', 'Santiago', 'David', 'Miguel', 'Jose', 'Daniel', 'Sebastian', 'Luis'];
  const lastNames = ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Hernandez', 'Gonzalez', 'Perez', 'Ramirez', 'Torres', 'Diaz', 'Morales'];

  for (const team of teams) {
    for (let i = 0; i < 11; i++) {
      const playerId = `player-${team.id}-${i + 1}`;
      await prisma.player.upsert({
        where: { id: playerId },
        update: {},
        create: {
          id: playerId,
          teamId: team.id,
          firstName: firstNames[i],
          lastName: `${lastNames[i]} ${team.name.split(' ').pop()}`,
          jerseyNumber: i === 0 ? 1 : i + 1,
          position: positions[i],
          nationality: 'Colombiana',
          status: 'ACTIVE',
        },
      });
    }
  }
  console.log('Demo players seeded');

  // -- Matches: round-robin (each team plays each other once) --
  let matchNum = 0;
  const matchIds: string[] = [];

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matchNum++;
      const dayNumber = Math.ceil(matchNum / 4);
      const matchId = `match-demo-${matchNum}`;
      const isFinished = matchNum <= 16; // First 16 matches finished

      const scoreA = isFinished ? Math.floor(Math.random() * 4) : null;
      const scoreB = isFinished ? Math.floor(Math.random() * 4) : null;

      await prisma.match.upsert({
        where: { id: matchId },
        update: {},
        create: {
          id: matchId,
          tournamentId: tournament.id,
          teamAId: teams[i].id,
          teamBId: teams[j].id,
          scheduledAt: new Date(`2026-${String(2 + Math.floor(matchNum / 8)).padStart(2, '0')}-${String(1 + (matchNum % 28)).padStart(2, '0')}T15:00:00`),
          venue: matchNum % 2 === 0 ? 'Cancha El Estadio' : 'Cancha San Jose',
          matchNumber: matchNum,
          dayNumber,
          status: isFinished ? 'FINISHED' : 'SCHEDULED',
          scoreA,
          scoreB,
        },
      });

      if (isFinished) {
        matchIds.push(matchId);
      }
    }
  }
  console.log(`Demo matches seeded (${matchNum} total, ${matchIds.length} finished)`);

  // -- Match events for finished matches (goals) --
  for (const matchId of matchIds) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) continue;

    // Generate goal events for teamA
    for (let g = 0; g < (match.scoreA || 0); g++) {
      const playerIndex = Math.floor(Math.random() * 5) + 6; // forwards/midfielders
      const playerId = `player-${match.teamAId}-${playerIndex}`;
      const exists = await prisma.player.findUnique({ where: { id: playerId } });
      if (!exists) continue;

      await prisma.matchEvent.create({
        data: {
          matchId,
          playerId,
          teamId: match.teamAId,
          type: 'GOAL',
          minute: Math.floor(Math.random() * 90) + 1,
          createdBy: admin.id,
        },
      });
    }

    // Generate goal events for teamB
    for (let g = 0; g < (match.scoreB || 0); g++) {
      const playerIndex = Math.floor(Math.random() * 5) + 6;
      const playerId = `player-${match.teamBId}-${playerIndex}`;
      const exists = await prisma.player.findUnique({ where: { id: playerId } });
      if (!exists) continue;

      await prisma.matchEvent.create({
        data: {
          matchId,
          playerId,
          teamId: match.teamBId,
          type: 'GOAL',
          minute: Math.floor(Math.random() * 90) + 1,
          createdBy: admin.id,
        },
      });
    }

    // Random yellow/red cards
    if (Math.random() > 0.5) {
      const teamId = Math.random() > 0.5 ? match.teamAId : match.teamBId;
      const playerIndex = Math.floor(Math.random() * 11) + 1;
      const playerId = `player-${teamId}-${playerIndex}`;
      const exists = await prisma.player.findUnique({ where: { id: playerId } });
      if (exists) {
        await prisma.matchEvent.create({
          data: {
            matchId,
            playerId,
            teamId,
            type: Math.random() > 0.8 ? 'RED_CARD' : 'YELLOW_CARD',
            minute: Math.floor(Math.random() * 90) + 1,
            createdBy: admin.id,
          },
        });
      }
    }
  }
  console.log('Demo match events seeded');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
