-- =============================================
-- SEED DATOS REALES - TORNEO FUTBOL 7 SAN JOSE 2026
-- Fuente: Jugadores.xlsx + Tabla de Control 20251.xlsx
-- =============================================

BEGIN;

-- Limpiar datos demo (orden por dependencias FK)
DELETE FROM match_events;
DELETE FROM match_player_stats;
DELETE FROM sanctions;
DELETE FROM matches;
DELETE FROM players;
DELETE FROM tournament_tiebreakers;
DELETE FROM tournament_rounds;
DELETE FROM tournament_teams;
DELETE FROM teams;
DELETE FROM tournaments WHERE id = 'demo-torneo-sanjose-2026';

-- =============================================
-- TORNEO
-- =============================================
INSERT INTO tournaments (id, name, "organizerId", type, status, "startDate", "endDate", "winPoints", "drawPoints", "lossPoints", "maxYellowCards", "createdAt")
SELECT 'torneo-sanjose-2026', 'Torneo Fútbol 7 San José 2026', id, 'LEAGUE', 'IN_PROGRESS',
  '2026-01-25', '2026-05-31', 3, 1, 0, 3, NOW()
FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

-- =============================================
-- EQUIPOS (17 equipos reales)
-- =============================================
INSERT INTO teams (id, name, city, "createdAt") VALUES
  ('team-netherland', 'Netherland', 'Guarne', NOW()),
  ('team-hojas-anchas', 'Hojas Anchas', 'Guarne', NOW()),
  ('team-rayados-fc', 'Rayados FC', 'Guarne', NOW()),
  ('team-alianza', 'Alianza', 'Guarne', NOW()),
  ('team-elite-fc', 'Élite FC', 'Guarne', NOW()),
  ('team-deportivo-fenix', 'Deportivo Fénix', 'Guarne', NOW()),
  ('team-amenadim', 'Amenadim', 'Guarne', NOW()),
  ('team-ron-star', 'Ron Star', 'Guarne', NOW()),
  ('team-konami', 'Konami', 'Guarne', NOW()),
  ('team-atletico-turro', 'Atlético Turro', 'Guarne', NOW()),
  ('team-los-aliados', 'Los Aliados', 'Guarne', NOW()),
  ('team-valentin-fc', 'Valentín FC', 'Guarne', NOW()),
  ('team-quilmes', 'Quilmes', 'Guarne', NOW()),
  ('team-borussia', 'Borussia', 'Guarne', NOW()),
  ('team-la-mosquita', 'La Mosquita', 'Guarne', NOW()),
  ('team-villanueva', 'Villanueva', 'Guarne', NOW()),
  ('team-real-sociedad', 'Real Sociedad', 'Guarne', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- =============================================
-- VINCULAR EQUIPOS AL TORNEO
-- =============================================
INSERT INTO tournament_teams (id, "tournamentId", "teamId")
SELECT gen_random_uuid(), 'torneo-sanjose-2026', id FROM teams WHERE id LIKE 'team-%'
ON CONFLICT ("tournamentId", "teamId") DO NOTHING;

-- =============================================
-- JUGADORES (266 jugadores reales)
-- =============================================

-- Netherland (14 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-netherland-1', 'team-netherland', 'Deiby', 'Yepes', 1, 'CEDULA_CIUDADANIA', '1035917877', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-2', 'team-netherland', 'Andrés', 'Gallego', 2, 'CEDULA_CIUDADANIA', '1035421158', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-3', 'team-netherland', 'Yeison', 'Velasquez', 3, 'CEDULA_CIUDADANIA', '1035918511', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-4', 'team-netherland', 'Jeferson', 'Álzate', 4, 'CEDULA_CIUDADANIA', '1001445192', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-5', 'team-netherland', 'Duvian', 'Henao', 5, 'CEDULA_CIUDADANIA', '1038212360', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-6', 'team-netherland', 'Marlon', 'Salazar', 6, 'CEDULA_CIUDADANIA', '1035917620', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-7', 'team-netherland', 'Harold', 'Zapata', 7, 'CEDULA_CIUDADANIA', '1020102562', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-8', 'team-netherland', 'Duvan', 'Villa', 8, 'CEDULA_CIUDADANIA', '1035920762', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-9', 'team-netherland', 'Brahian', 'Gil Chalarca', 9, 'CEDULA_CIUDADANIA', '1192831995', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-10', 'team-netherland', 'Luis Fernando', 'Ruíz', 10, 'CEDULA_CIUDADANIA', '1035916783', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-11', 'team-netherland', 'Felipe', 'Ochoa', 11, 'CEDULA_CIUDADANIA', '1035915230', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-12', 'team-netherland', 'Johan', 'Yepes', 12, 'CEDULA_CIUDADANIA', '1001416419', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-13', 'team-netherland', 'Juan José', 'Rave Carvajal', 13, 'CEDULA_CIUDADANIA', '1011397555', 'Colombiana', 'ACTIVE', NOW()),
  ('player-netherland-14', 'team-netherland', 'Daniel', 'Ruíz Ospina', 14, 'CEDULA_CIUDADANIA', '1035914165', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "jerseyNumber" = EXCLUDED."jerseyNumber", "documentNumber" = EXCLUDED."documentNumber";

-- Hojas Anchas (15 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-hojas-anchas-1', 'team-hojas-anchas', 'Julián Esteban', 'Gil', 1, 'CEDULA_CIUDADANIA', '1035916092', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-2', 'team-hojas-anchas', 'Matías', 'Montoya Flórez', 2, 'CEDULA_CIUDADANIA', '1035913267', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-3', 'team-hojas-anchas', 'Edissón', 'Gaviria Londoño', 3, 'CEDULA_CIUDADANIA', '1001415560', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-4', 'team-hojas-anchas', 'Jefferson', 'Álzate Alvarez', 4, 'CEDULA_CIUDADANIA', '1001415783', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-5', 'team-hojas-anchas', 'Jeison Alberto', 'Londoño Otalvaro', 5, 'CEDULA_CIUDADANIA', '1035916472', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-6', 'team-hojas-anchas', 'Julio Cesar', 'Gaviria Londoño', 6, 'CEDULA_CIUDADANIA', '1035910439', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-7', 'team-hojas-anchas', 'José Ángel', 'Londoño', 7, 'CEDULA_CIUDADANIA', '1015068191', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-8', 'team-hojas-anchas', 'Jorge', 'Duque', 8, 'CEDULA_CIUDADANIA', '1001478610', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-9', 'team-hojas-anchas', 'James', 'Londoño Herrera', 9, 'CEDULA_CIUDADANIA', '1001723874', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-10', 'team-hojas-anchas', 'Luis Guillermo', 'Sánchez', 10, 'CEDULA_CIUDADANIA', '1003191984', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-11', 'team-hojas-anchas', 'Jonathan', 'Zuleta', 11, 'CEDULA_CIUDADANIA', '1035913987', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-12', 'team-hojas-anchas', 'Juan de Dios', 'Duque Ospina', 12, 'CEDULA_CIUDADANIA', '1035918267', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-13', 'team-hojas-anchas', 'Orlando Manuel', 'Pérez Padilla', 13, 'CEDULA_CIUDADANIA', '1003188527', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-14', 'team-hojas-anchas', 'Juan José', 'Angulo Ochoa', 14, 'CEDULA_CIUDADANIA', '1001416247', 'Colombiana', 'ACTIVE', NOW()),
  ('player-hojas-anchas-15', 'team-hojas-anchas', 'Deibyd', 'Cárdenas Ríos', 15, 'CEDULA_CIUDADANIA', '1035921748', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "jerseyNumber" = EXCLUDED."jerseyNumber", "documentNumber" = EXCLUDED."documentNumber";

-- Rayados FC (16 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-rayados-fc-1', 'team-rayados-fc', 'Juan Esteban', 'Maya', NULL, 'CEDULA_CIUDADANIA', '1001446955', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-2', 'team-rayados-fc', 'Alexander', 'Salgado', NULL, 'CEDULA_CIUDADANIA', '1039092689', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-3', 'team-rayados-fc', 'Silvio', 'Celins', NULL, 'CEDULA_CIUDADANIA', '21227633', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-4', 'team-rayados-fc', 'Julián', 'Botero Carvajal', NULL, 'CEDULA_CIUDADANIA', '1035913106', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-5', 'team-rayados-fc', 'Ricardo', 'Peralta', NULL, 'CEDULA_CIUDADANIA', '10416267254', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-6', 'team-rayados-fc', 'Yilmar', 'García', NULL, 'CEDULA_CIUDADANIA', '1007291138', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-7', 'team-rayados-fc', 'Gonzalo', 'Carvajal Marín', NULL, 'CEDULA_CIUDADANIA', '70754940', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-8', 'team-rayados-fc', 'Luis Fernando', 'Madera', NULL, 'CEDULA_CIUDADANIA', '1041258302', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-9', 'team-rayados-fc', 'Edison', 'Molina', NULL, 'CEDULA_CIUDADANIA', '1003076492', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-10', 'team-rayados-fc', 'Yonier', 'de la Torre', NULL, 'CEDULA_CIUDADANIA', '1049563396', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-11', 'team-rayados-fc', 'José Gregorio', 'Hernández', NULL, 'CEDULA_CIUDADANIA', '1120742338', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-12', 'team-rayados-fc', 'José Andrés', 'Cantero', NULL, 'CEDULA_CIUDADANIA', '1039093825', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-13', 'team-rayados-fc', 'Luis Fernando', 'Hernández', NULL, 'CEDULA_CIUDADANIA', '1035152696', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-14', 'team-rayados-fc', 'Jesús David', 'Ortega Jiménez', NULL, 'CEDULA_CIUDADANIA', '1052992792', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-15', 'team-rayados-fc', 'Danilo', 'Ocampo', NULL, 'CEDULA_CIUDADANIA', '1036840103', 'Colombiana', 'ACTIVE', NOW()),
  ('player-rayados-fc-16', 'team-rayados-fc', 'Germán', 'Cleto', NULL, 'CEDULA_CIUDADANIA', '1039079560', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- Alianza (16 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-alianza-1', 'team-alianza', 'Alexander', 'Silva', NULL, 'CEDULA_CIUDADANIA', '27339899', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-2', 'team-alianza', 'Donis', 'Garrido', NULL, 'CEDULA_CIUDADANIA', '92032780', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-3', 'team-alianza', 'Santiago', 'Soto', NULL, 'CEDULA_CIUDADANIA', '1064187882', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-4', 'team-alianza', 'Adán', 'Barrera', NULL, 'CEDULA_CIUDADANIA', '1067280861', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-5', 'team-alianza', 'José', 'Mendoza Cantero', NULL, 'CEDULA_CIUDADANIA', '15621880', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-6', 'team-alianza', 'Ubeimar', 'Paternina', NULL, 'CEDULA_CIUDADANIA', '1067290271', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-7', 'team-alianza', 'Juan Camilo', 'Álzate', NULL, 'CEDULA_CIUDADANIA', '1036934032', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-8', 'team-alianza', 'Amín Enrique', 'Ortega', NULL, 'CEDULA_CIUDADANIA', '1052097073', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-9', 'team-alianza', 'Andrés', 'García', NULL, 'CEDULA_CIUDADANIA', '1066000504', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-10', 'team-alianza', 'Jaider', 'Álzate', NULL, 'CEDULA_CIUDADANIA', '1021928604', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-11', 'team-alianza', 'Luis David', 'Fernández', NULL, 'CEDULA_CIUDADANIA', '1066729781', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-12', 'team-alianza', 'Omar', 'Suarez', NULL, 'CEDULA_CIUDADANIA', '1067287142', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-13', 'team-alianza', 'Fidel', 'García', NULL, 'CEDULA_CIUDADANIA', '1063955039', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-14', 'team-alianza', 'Hernán David', 'Pérez', NULL, 'CEDULA_CIUDADANIA', '1066733611', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-15', 'team-alianza', 'José', 'Mendoza', NULL, 'CEDULA_CIUDADANIA', '71989765', 'Colombiana', 'ACTIVE', NOW()),
  ('player-alianza-16', 'team-alianza', 'Merki', 'Martínez', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- Élite FC (17 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-elite-fc-1', 'team-elite-fc', 'Jhohan Antonio', 'Muñoz', NULL, 'CEDULA_CIUDADANIA', '1051637027', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-2', 'team-elite-fc', 'Luis', 'Estrada', NULL, 'CEDULA_CIUDADANIA', '1003307520', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-3', 'team-elite-fc', 'Osnaider', 'Martínez', NULL, 'CEDULA_CIUDADANIA', '1003307119', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-4', 'team-elite-fc', 'Carlos', 'Ospina', NULL, 'CEDULA_CIUDADANIA', '1007238254', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-5', 'team-elite-fc', 'José Gregorio', 'Mercado', NULL, 'CEDULA_CIUDADANIA', '1069500102', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-6', 'team-elite-fc', 'Adrián', 'Cadrozo', NULL, 'CEDULA_CIUDADANIA', '1129184406', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-7', 'team-elite-fc', 'José Alfredo', 'Martínez', NULL, 'CEDULA_CIUDADANIA', '1005525079', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-8', 'team-elite-fc', 'Esneider', 'Bettin', NULL, 'CEDULA_CIUDADANIA', '1003501016', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-9', 'team-elite-fc', 'Diego Luis', 'Martínez', NULL, 'CEDULA_CIUDADANIA', '1007432724', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-10', 'team-elite-fc', 'Kevín', 'Montagut', NULL, 'CEDULA_CIUDADANIA', '1050556577', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-11', 'team-elite-fc', 'Deimer', 'Mercado', NULL, 'CEDULA_CIUDADANIA', '1069488899', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-12', 'team-elite-fc', 'Luis David', 'Pérez', NULL, 'CEDULA_CIUDADANIA', '1192772022', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-13', 'team-elite-fc', 'Juan Sebastián', 'Baldovino', NULL, 'CEDULA_CIUDADANIA', '1007066488', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-14', 'team-elite-fc', 'Cesar', 'Canabal', NULL, 'CEDULA_CIUDADANIA', '1007066419', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-15', 'team-elite-fc', 'Pablo', 'Amaya', NULL, 'CEDULA_CIUDADANIA', '1036963277', 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-16', 'team-elite-fc', 'Diego', 'Ángulo', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-elite-fc-17', 'team-elite-fc', 'Luis David', 'Martínez', NULL, 'CEDULA_CIUDADANIA', '1033377118', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- Deportivo Fénix (16 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-deportivo-fenix-1', 'team-deportivo-fenix', 'Andrés Alfonso', 'Martínez', NULL, 'CEDULA_CIUDADANIA', '1007369648', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-2', 'team-deportivo-fenix', 'Jorge Eliecer', 'Mayo', NULL, 'CEDULA_CIUDADANIA', '1040367522', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-3', 'team-deportivo-fenix', 'Harold Andrés', 'Moreno', NULL, 'CEDULA_CIUDADANIA', '1002276422', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-4', 'team-deportivo-fenix', 'Francisco Javier', 'Iturriago Gutiérrez', NULL, 'CEDULA_CIUDADANIA', '1085167070', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-5', 'team-deportivo-fenix', 'Hernán David', 'Gonzalez', NULL, 'CEDULA_CIUDADANIA', '1068665515', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-6', 'team-deportivo-fenix', 'Juan Felipe', 'Hincapíe', NULL, 'CEDULA_CIUDADANIA', '1036967345', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-7', 'team-deportivo-fenix', 'Yan Carlos', 'Ortiz', NULL, 'CEDULA_CIUDADANIA', '1003589029', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-8', 'team-deportivo-fenix', 'Andrés David', 'Reyes', NULL, 'CEDULA_CIUDADANIA', '1063172422', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-9', 'team-deportivo-fenix', 'Oscar David', 'Pimienta', NULL, 'CEDULA_CIUDADANIA', '1003003240', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-10', 'team-deportivo-fenix', 'Juan David', 'Redondo', NULL, 'CEDULA_CIUDADANIA', '1036935495', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-11', 'team-deportivo-fenix', 'Yerson Andrés', 'Jaramillo Blandon', NULL, 'CEDULA_CIUDADANIA', '1048600099', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-12', 'team-deportivo-fenix', 'Elvis Manuel', 'Ortíz', NULL, 'CEDULA_CIUDADANIA', '1003456756', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-13', 'team-deportivo-fenix', 'Elder José', 'Gonzalez', NULL, 'CEDULA_CIUDADANIA', '1068665436', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-14', 'team-deportivo-fenix', 'Samir', 'Cueto Salas', NULL, 'CEDULA_CIUDADANIA', '1002275239', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-15', 'team-deportivo-fenix', 'Aldo José', 'Rangel', NULL, 'CEDULA_CIUDADANIA', '17580723', 'Colombiana', 'ACTIVE', NOW()),
  ('player-deportivo-fenix-16', 'team-deportivo-fenix', 'Manuel Antonio', 'Naranjo', NULL, 'CEDULA_CIUDADANIA', '1068656122', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- Amenadim (16 jugadores - sin CC)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-amenadim-1', 'team-amenadim', 'Juan David', 'Ballesteros', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-2', 'team-amenadim', 'Jorge Luis', 'Zapata', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-3', 'team-amenadim', 'Eider', 'Simanca', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-4', 'team-amenadim', 'Juan Bautista', 'García', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-5', 'team-amenadim', 'Didier', 'Montoya', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-6', 'team-amenadim', 'Humberto', 'Ochoa', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-7', 'team-amenadim', 'Daniel Enrique', 'Cuevas', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-8', 'team-amenadim', 'Yohan', 'Araque', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-9', 'team-amenadim', 'Juan Carlos', 'García', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-10', 'team-amenadim', 'Juan Sebastián', 'Zapata', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-11', 'team-amenadim', 'Juan Carlos', 'Zapata', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-12', 'team-amenadim', 'Rogelio', 'Rueda', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-13', 'team-amenadim', 'Duvan Felipe', 'Ossa', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-14', 'team-amenadim', 'Franklin', 'Cuenú', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-15', 'team-amenadim', 'Carlos', 'Arias', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-amenadim-16', 'team-amenadim', 'Santiago', 'Araque', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName";

-- Ron Star (16 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-ron-star-1', 'team-ron-star', 'Eliecer', 'Serpa', NULL, 'CEDULA_CIUDADANIA', '27267603', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-2', 'team-ron-star', 'Juan Guillermo', 'Vallejo', NULL, 'CEDULA_CIUDADANIA', '1035910882', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-3', 'team-ron-star', 'José Gregorio', 'Medina', NULL, 'CEDULA_CIUDADANIA', '5494795', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-4', 'team-ron-star', 'Javier Danilo', 'Castrillón', NULL, 'CEDULA_CIUDADANIA', '1035915378', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-5', 'team-ron-star', 'John Alexander', 'Sánchez', NULL, 'CEDULA_CIUDADANIA', '15446394', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-6', 'team-ron-star', 'Julián', 'Hincapie', NULL, 'CEDULA_CIUDADANIA', '1035915334', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-7', 'team-ron-star', 'John Fredy', 'Zapata', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-8', 'team-ron-star', 'Kevín', 'Meneses', NULL, 'CEDULA_CIUDADANIA', '1035876603', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-9', 'team-ron-star', 'Juan Fernando', 'Loaiza', NULL, 'CEDULA_CIUDADANIA', '1035918370', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-10', 'team-ron-star', 'Santiago', 'Quiroz', NULL, 'CEDULA_CIUDADANIA', '1001651934', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-11', 'team-ron-star', 'Juan Guillermo', 'Ossa', NULL, 'CEDULA_CIUDADANIA', '70756611', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-12', 'team-ron-star', 'Brayan', 'Monsalve', NULL, 'CEDULA_CIUDADANIA', '103668041', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-13', 'team-ron-star', 'Robin', 'Rodriguez', NULL, 'CEDULA_CIUDADANIA', '1035911733', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-14', 'team-ron-star', 'Juan Camilo', 'Zapata', NULL, 'CEDULA_CIUDADANIA', '70756143', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-15', 'team-ron-star', 'Erwin', 'Padilla Prado', NULL, 'CEDULA_CIUDADANIA', '1082837458', 'Colombiana', 'ACTIVE', NOW()),
  ('player-ron-star-16', 'team-ron-star', 'Diego', 'Patiño', NULL, 'CEDULA_CIUDADANIA', '1053817090', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- Konami (16 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-konami-1', 'team-konami', 'Santiago', 'Lopera', NULL, 'CEDULA_CIUDADANIA', '1035919787', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-2', 'team-konami', 'Luis Norbey', 'Flórez', NULL, 'CEDULA_CIUDADANIA', '1035913398', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-3', 'team-konami', 'Erick', 'Rendón', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-4', 'team-konami', 'Juan', 'Montoya', NULL, 'CEDULA_CIUDADANIA', '15448702', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-5', 'team-konami', 'Kevín', 'Cardona', NULL, 'CEDULA_CIUDADANIA', '1035912589', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-6', 'team-konami', 'Cristián', 'Orozco', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-7', 'team-konami', 'Tomás', 'Montoya', NULL, 'CEDULA_CIUDADANIA', '1036253739', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-8', 'team-konami', 'Julián', 'Duque', NULL, 'CEDULA_CIUDADANIA', '1038414743', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-9', 'team-konami', 'Fabián', 'Serna', NULL, 'CEDULA_CIUDADANIA', '1035921034', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-10', 'team-konami', 'Robinson', 'Ossa', NULL, 'CEDULA_CIUDADANIA', '1035919066', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-11', 'team-konami', 'Giovanni', 'Orozco', NULL, 'CEDULA_CIUDADANIA', '1036930534', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-12', 'team-konami', 'Cesar', 'Vanegas', NULL, 'CEDULA_CIUDADANIA', '1035417589', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-13', 'team-konami', 'Hugo Alejandro', 'Vergara', NULL, 'CEDULA_CIUDADANIA', '103591419', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-14', 'team-konami', 'Ramón', 'Isaza', NULL, 'CEDULA_CIUDADANIA', '103591389', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-15', 'team-konami', 'Jorge', 'Gutierrez', NULL, 'CEDULA_CIUDADANIA', '107374669', 'Colombiana', 'ACTIVE', NOW()),
  ('player-konami-16', 'team-konami', 'Yojan', 'Yepes', NULL, 'CEDULA_CIUDADANIA', '1001416221', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- Atlético Turro (16 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-atletico-turro-1', 'team-atletico-turro', 'Omar', 'Jaramillo', NULL, 'CEDULA_CIUDADANIA', '1036955372', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-2', 'team-atletico-turro', 'Maicol Stiven', 'Órtiz', NULL, 'CEDULA_CIUDADANIA', '1007650642', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-3', 'team-atletico-turro', 'Juan Felipe', 'Jaramillo', NULL, 'CEDULA_CIUDADANIA', '1036936834', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-4', 'team-atletico-turro', 'Juan Gamilo', 'Henao Jaramillo', NULL, 'CEDULA_CIUDADANIA', '1036941802', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-5', 'team-atletico-turro', 'Cristián Andrés', 'Urrea M', NULL, 'CEDULA_CIUDADANIA', '1104872475', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-6', 'team-atletico-turro', 'Yorman', 'Quintero', NULL, 'CEDULA_CIUDADANIA', '1007319647', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-7', 'team-atletico-turro', 'Víctor', 'Jaramillo', NULL, 'CEDULA_CIUDADANIA', '1036936833', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-8', 'team-atletico-turro', 'Camilo', 'Araujo', NULL, 'CEDULA_CIUDADANIA', '1069658543', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-9', 'team-atletico-turro', 'Sebastián', 'Ospina', NULL, 'CEDULA_CIUDADANIA', '1036250619', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-10', 'team-atletico-turro', 'Alber', 'Pérez', NULL, 'CEDULA_CIUDADANIA', '1063077263', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-11', 'team-atletico-turro', 'Juan Diego', 'Herrera', NULL, 'CEDULA_CIUDADANIA', '10369334', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-12', 'team-atletico-turro', 'Jerson', 'Quintero', NULL, 'CEDULA_CIUDADANIA', '1045396318', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-13', 'team-atletico-turro', 'Steven', 'Zuluaga', NULL, 'CEDULA_CIUDADANIA', '1035913082', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-14', 'team-atletico-turro', 'Ronal', 'Bohórquez', NULL, 'CEDULA_CIUDADANIA', '1103498375', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-15', 'team-atletico-turro', 'Juan José', 'Gaviria', NULL, 'CEDULA_CIUDADANIA', '1035911309', 'Colombiana', 'ACTIVE', NOW()),
  ('player-atletico-turro-16', 'team-atletico-turro', 'Cristián', 'Torres', NULL, 'CEDULA_CIUDADANIA', '1073323617', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- Los Aliados (16 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-los-aliados-1', 'team-los-aliados', 'Pablo', 'Martínez', NULL, 'CEDULA_CIUDADANIA', '1047494826', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-2', 'team-los-aliados', 'Maicol', 'Rúa', NULL, 'CEDULA_CIUDADANIA', '1001416101', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-3', 'team-los-aliados', 'Gustavo', 'Moscoso', NULL, 'CEDULA_CIUDADANIA', '1038801351', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-4', 'team-los-aliados', 'Yeison', 'Gaviria', NULL, 'CEDULA_CIUDADANIA', '1035912533', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-5', 'team-los-aliados', 'Dany', 'Gaviria', NULL, 'CEDULA_CIUDADANIA', '1036945737', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-6', 'team-los-aliados', 'Argemiro', 'Médina', NULL, 'CEDULA_CIUDADANIA', '8866338', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-7', 'team-los-aliados', 'Carlos', 'Zapata', NULL, 'CEDULA_CIUDADANIA', '1035915851', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-8', 'team-los-aliados', 'Santiago', 'Ruiz', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-9', 'team-los-aliados', 'Jorge', 'Atehortua', NULL, 'CEDULA_CIUDADANIA', '1035914635', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-10', 'team-los-aliados', 'Obed', 'Echavarria', NULL, 'CEDULA_CIUDADANIA', '3379720', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-11', 'team-los-aliados', 'Marcos', 'Muñoz', NULL, 'CEDULA_CIUDADANIA', '1073986424', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-12', 'team-los-aliados', 'Juan Pablo', 'Ríos', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-13', 'team-los-aliados', 'Cristián Alejandro', 'Echavarría', NULL, 'CEDULA_CIUDADANIA', '1035916420', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-14', 'team-los-aliados', 'Din Arley', 'Castrillón', NULL, 'CEDULA_CIUDADANIA', '70756908', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-15', 'team-los-aliados', 'Stiven', 'Guevara', NULL, 'CEDULA_CIUDADANIA', '92540895', 'Colombiana', 'ACTIVE', NOW()),
  ('player-los-aliados-16', 'team-los-aliados', 'Camilo', 'Cardona', NULL, 'CEDULA_CIUDADANIA', '1035910185', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- Valentín FC (14 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-valentin-fc-1', 'team-valentin-fc', 'Jaider', 'Carvajal Ríos', NULL, 'CEDULA_CIUDADANIA', '1001447388', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-2', 'team-valentin-fc', 'Juan David', 'Vergara', NULL, 'CEDULA_CIUDADANIA', '10016877363', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-3', 'team-valentin-fc', 'Daniel Stiven', 'Zuleta', NULL, 'CEDULA_CIUDADANIA', '1035919811', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-4', 'team-valentin-fc', 'Carlos Andrés', 'Berrio', NULL, 'CEDULA_CIUDADANIA', '1035918679', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-5', 'team-valentin-fc', 'Luis Eduardo', 'Berrio', NULL, 'CEDULA_CIUDADANIA', '1035917668', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-6', 'team-valentin-fc', 'Stiven', 'Álzate', NULL, 'CEDULA_CIUDADANIA', '1040874602', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-7', 'team-valentin-fc', 'Sebastián', 'Carvajal Duque', NULL, 'CEDULA_CIUDADANIA', '1035919187', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-8', 'team-valentin-fc', 'David Alejandro', 'Acevedo', NULL, 'CEDULA_CIUDADANIA', '1036934863', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-9', 'team-valentin-fc', 'Victor', 'Sierra', NULL, 'CEDULA_CIUDADANIA', '1003458121', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-10', 'team-valentin-fc', 'Santiago', 'Grisales', NULL, 'CEDULA_CIUDADANIA', '1035919696', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-11', 'team-valentin-fc', 'Fredy', 'Ochoa', NULL, 'CEDULA_CIUDADANIA', '1007240877', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-12', 'team-valentin-fc', 'Cristián', 'Duque', NULL, 'CEDULA_CIUDADANIA', '1035921805', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-13', 'team-valentin-fc', 'Cristian', 'Carvajal Ríos', NULL, 'CEDULA_CIUDADANIA', '1193138307', 'Colombiana', 'ACTIVE', NOW()),
  ('player-valentin-fc-14', 'team-valentin-fc', 'Daniel', 'Correa', NULL, 'CEDULA_CIUDADANIA', '1000442259', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- Quilmes (15 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-quilmes-1', 'team-quilmes', 'Yeremi Sebastián', 'Muñoz', NULL, 'CEDULA_CIUDADANIA', '1035915849', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-2', 'team-quilmes', 'Sebastián', 'Jiménez', NULL, 'CEDULA_CIUDADANIA', '1128454934', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-3', 'team-quilmes', 'Brayan', 'Salazar Gómez', NULL, 'CEDULA_CIUDADANIA', '1007690672', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-4', 'team-quilmes', 'Fernando', 'Torres', NULL, 'CEDULA_CIUDADANIA', '1036953589', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-5', 'team-quilmes', 'Jaider', 'Isaza', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-6', 'team-quilmes', 'Juan Manuel', 'Marulanda', NULL, 'CEDULA_CIUDADANIA', '1035921946', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-7', 'team-quilmes', 'Santiago', 'Londoño', NULL, 'CEDULA_CIUDADANIA', '70755647', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-8', 'team-quilmes', 'Jhonatan', 'Chavarría', NULL, 'CEDULA_CIUDADANIA', '1035912496', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-9', 'team-quilmes', 'Yesid', 'Herrera', NULL, 'CEDULA_CIUDADANIA', '1035921420', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-10', 'team-quilmes', 'Santiago', 'Mejía', NULL, 'CEDULA_CIUDADANIA', '1192815765', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-11', 'team-quilmes', 'Juan David', 'García', NULL, 'CEDULA_CIUDADANIA', '1036948820', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-12', 'team-quilmes', 'Miguel Ángel', 'Patiño', NULL, 'CEDULA_CIUDADANIA', '1017213174', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-13', 'team-quilmes', 'Alejandro', 'Arango', NULL, 'CEDULA_CIUDADANIA', '1038413985', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-14', 'team-quilmes', 'Alexis', 'Chavarría', NULL, 'CEDULA_CIUDADANIA', '1035915122', 'Colombiana', 'ACTIVE', NOW()),
  ('player-quilmes-15', 'team-quilmes', 'Germán', 'Arenas Herrera', NULL, 'CEDULA_CIUDADANIA', '1035922000', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- Borussia (18 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-borussia-1', 'team-borussia', 'Hernán', 'Paternina', NULL, 'CEDULA_CIUDADANIA', '1062963472', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-2', 'team-borussia', 'Jesús David', 'Aguirre', NULL, 'CEDULA_CIUDADANIA', '100336345', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-3', 'team-borussia', 'Marcial', 'Mena', NULL, 'CEDULA_CIUDADANIA', '1148699434', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-4', 'team-borussia', 'Jhon Freddy', 'Córdoba', NULL, 'CEDULA_CIUDADANIA', '1067896247', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-5', 'team-borussia', 'Saúl', 'Reyes', NULL, 'CEDULA_CIUDADANIA', '1067879032', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-6', 'team-borussia', 'Jorge Mario', 'Cogollo', NULL, 'CEDULA_CIUDADANIA', '1067912972', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-7', 'team-borussia', 'Carlos', 'Gonzalez', NULL, 'CEDULA_CIUDADANIA', '5363650', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-8', 'team-borussia', 'John James', 'Bastidas', NULL, 'CEDULA_CIUDADANIA', '1002498849', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-9', 'team-borussia', 'Julián', 'Mejía', NULL, 'CEDULA_CIUDADANIA', '1056772712', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-10', 'team-borussia', 'Cristián', 'Morales Hernández', NULL, 'CEDULA_CIUDADANIA', '1067876049', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-11', 'team-borussia', 'Keimer', 'Guevara', NULL, 'CEDULA_CIUDADANIA', '1067947492', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-12', 'team-borussia', 'Luis', 'Morales', NULL, 'CEDULA_CIUDADANIA', '1192807744', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-13', 'team-borussia', 'Robert Alfonso', 'Martínez', NULL, 'CEDULA_CIUDADANIA', '5877598', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-14', 'team-borussia', 'Ramón', 'Ciro', NULL, 'CEDULA_CIUDADANIA', '1056782291', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-15', 'team-borussia', 'Duván', 'Ciro', NULL, 'CEDULA_CIUDADANIA', '1056786291', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-16', 'team-borussia', 'Manuel', 'Correa', NULL, 'CEDULA_CIUDADANIA', '1033258021', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-17', 'team-borussia', 'Elkín', 'Aguirre', NULL, 'CEDULA_CIUDADANIA', '1037636273', 'Colombiana', 'ACTIVE', NOW()),
  ('player-borussia-18', 'team-borussia', 'José Ayberth', 'Medina', NULL, 'CEDULA_CIUDADANIA', '34089556', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- La Mosquita (16 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-la-mosquita-1', 'team-la-mosquita', 'Juan Esteban', 'Otalvaro', NULL, 'CEDULA_CIUDADANIA', '1035914538', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-2', 'team-la-mosquita', 'Arbenis', 'Montoya', NULL, 'CEDULA_CIUDADANIA', '70757113', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-3', 'team-la-mosquita', 'Anderson', 'Henao', NULL, 'CEDULA_CIUDADANIA', '1036950018', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-4', 'team-la-mosquita', 'Deimer', 'Pérez', NULL, 'CEDULA_CIUDADANIA', '1003406176', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-5', 'team-la-mosquita', 'Darío', 'Delgado', NULL, 'CEDULA_CIUDADANIA', '24432158', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-6', 'team-la-mosquita', 'Gabriel Enrique', 'Romero', NULL, 'CEDULA_CIUDADANIA', '6062026', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-7', 'team-la-mosquita', 'Gabino', 'Romero', NULL, 'CEDULA_CIUDADANIA', '6043103', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-8', 'team-la-mosquita', 'Enrique', 'Urganete', NULL, 'CEDULA_CIUDADANIA', '6956282', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-9', 'team-la-mosquita', 'Yan Carlos', 'Cervantes', NULL, 'CEDULA_CIUDADANIA', '1129506520', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-10', 'team-la-mosquita', 'Jefferson Arcangel', 'Piyela', NULL, 'CEDULA_CIUDADANIA', '6746403', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-11', 'team-la-mosquita', 'Erideson', 'Caraballo', NULL, 'CEDULA_CIUDADANIA', '1047482930', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-12', 'team-la-mosquita', 'Kevin Alexis', 'Quiroz Ruiz', NULL, 'CEDULA_CIUDADANIA', '1020112219', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-13', 'team-la-mosquita', 'Edgar Segundo', 'Gonzáles', NULL, 'CEDULA_CIUDADANIA', '28780310', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-14', 'team-la-mosquita', 'Santiago', 'Palacio Londoño', NULL, 'CEDULA_CIUDADANIA', '1036960473', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-15', 'team-la-mosquita', 'Yeisón', 'Ramírez', NULL, 'CEDULA_CIUDADANIA', '1193260635', 'Colombiana', 'ACTIVE', NOW()),
  ('player-la-mosquita-16', 'team-la-mosquita', 'Nevel Eliomar', 'Gonzalez', NULL, 'CEDULA_CIUDADANIA', '8061272', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- Villanueva (16 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-villanueva-1', 'team-villanueva', 'Andrés', 'Contreras', NULL, 'CEDULA_CIUDADANIA', '1003432592', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-2', 'team-villanueva', 'Denilson', 'Cadena', NULL, 'CEDULA_CIUDADANIA', '1063948774', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-3', 'team-villanueva', 'Juan Carlos', 'Vega', NULL, 'CEDULA_CIUDADANIA', '1121326445', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-4', 'team-villanueva', 'Raúl José', 'Martíz', NULL, 'CEDULA_CIUDADANIA', '1006735441', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-5', 'team-villanueva', 'Jheison Daniel', 'Cadena', NULL, 'CEDULA_CIUDADANIA', '1063948773', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-6', 'team-villanueva', 'Manuel David', 'Ospina', NULL, 'CEDULA_CIUDADANIA', '1102579031', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-7', 'team-villanueva', 'Donaldo Enrique', 'Reyes', NULL, 'CEDULA_CIUDADANIA', '1041266049', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-8', 'team-villanueva', 'Carlos', 'Villa', NULL, 'CEDULA_CIUDADANIA', '16305567', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-9', 'team-villanueva', 'Derwis Rafael', 'Villa', NULL, 'CEDULA_CIUDADANIA', '1042473711', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-10', 'team-villanueva', 'Yehis', 'Pacheco', NULL, 'CEDULA_CIUDADANIA', '1045232422', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-11', 'team-villanueva', 'Jorge', 'Castellar', NULL, 'CEDULA_CIUDADANIA', '10474316837', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-12', 'team-villanueva', 'Leider Javier', 'Padilla', NULL, 'CEDULA_CIUDADANIA', '1007122165', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-13', 'team-villanueva', 'Julio Cesar', 'Medina', NULL, 'CEDULA_CIUDADANIA', '1102578197', 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-14', 'team-villanueva', 'Carlos', 'Oviedo', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-15', 'team-villanueva', 'Elias', 'Reyes', NULL, NULL, NULL, 'Colombiana', 'ACTIVE', NOW()),
  ('player-villanueva-16', 'team-villanueva', 'Ángel', 'Mora', NULL, 'CEDULA_CIUDADANIA', '28157513', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- Real Sociedad (15 jugadores)
INSERT INTO players (id, "teamId", "firstName", "lastName", "jerseyNumber", "documentType", "documentNumber", nationality, status, "createdAt") VALUES
  ('player-real-sociedad-1', 'team-real-sociedad', 'Jhoan José', 'Rojas Martínez', NULL, 'CEDULA_CIUDADANIA', '8146725', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-2', 'team-real-sociedad', 'Gustavo Enrique', 'Gonzalez', NULL, 'CEDULA_CIUDADANIA', '23865581', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-3', 'team-real-sociedad', 'Nilson', 'Cipriano', NULL, 'CEDULA_CIUDADANIA', '1066242278', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-4', 'team-real-sociedad', 'Jonathan', 'Santiago', NULL, 'CEDULA_CIUDADANIA', '1035911539', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-5', 'team-real-sociedad', 'Eduar', 'Gonzalez', NULL, 'CEDULA_CIUDADANIA', '21491655', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-6', 'team-real-sociedad', 'José Enrique', 'Llorente', NULL, 'CEDULA_CIUDADANIA', '106705013', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-7', 'team-real-sociedad', 'Yonfer', 'García', NULL, 'CEDULA_CIUDADANIA', '100336931', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-8', 'team-real-sociedad', 'Edwin', 'Quintero', NULL, 'CEDULA_CIUDADANIA', '106228857', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-9', 'team-real-sociedad', 'John', 'Posso', NULL, 'CEDULA_CIUDADANIA', '1112405704', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-10', 'team-real-sociedad', 'Ivan', 'Betancourt', NULL, 'CEDULA_CIUDADANIA', '1035924811', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-11', 'team-real-sociedad', 'Juan David', 'López', NULL, 'CEDULA_CIUDADANIA', '1036950905', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-12', 'team-real-sociedad', 'Yohan', 'Ospina', NULL, 'CEDULA_CIUDADANIA', '1001415202', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-13', 'team-real-sociedad', 'Leonardo', 'Herrera', NULL, 'CEDULA_CIUDADANIA', '1067402681', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-14', 'team-real-sociedad', 'Cristián', 'Otalvaro', NULL, 'CEDULA_CIUDADANIA', '1036942216', 'Colombiana', 'ACTIVE', NOW()),
  ('player-real-sociedad-15', 'team-real-sociedad', 'Deivys', 'Llorente', NULL, 'CEDULA_CIUDADANIA', '1003213244', 'Colombiana', 'ACTIVE', NOW())
ON CONFLICT (id) DO UPDATE SET "firstName" = EXCLUDED."firstName", "lastName" = EXCLUDED."lastName", "documentNumber" = EXCLUDED."documentNumber";

-- =============================================
-- PARTIDOS (136 partidos, 17 fechas)
-- =============================================

-- Fecha 1 - 2026-01-25
INSERT INTO matches (id, "tournamentId", "teamAId", "teamBId", "scheduledAt", venue, "matchNumber", "dayNumber", status, "createdAt", "updatedAt") VALUES
  ('match-1', 'torneo-sanjose-2026', 'team-la-mosquita', 'team-quilmes', '2026-01-25 18:00:00', 'Cancha San José', 1, 1, 'SCHEDULED', NOW(), NOW()),
  ('match-2', 'torneo-sanjose-2026', 'team-alianza', 'team-elite-fc', '2026-01-25 08:00:00', 'Cancha San José', 2, 1, 'SCHEDULED', NOW(), NOW()),
  ('match-3', 'torneo-sanjose-2026', 'team-konami', 'team-villanueva', '2026-01-25 15:30:00', 'Cancha San José', 3, 1, 'SCHEDULED', NOW(), NOW()),
  ('match-4', 'torneo-sanjose-2026', 'team-atletico-turro', 'team-los-aliados', '2026-01-25 11:45:00', 'Cancha San José', 4, 1, 'SCHEDULED', NOW(), NOW()),
  ('match-5', 'torneo-sanjose-2026', 'team-netherland', 'team-ron-star', '2026-01-25 16:45:00', 'Cancha San José', 5, 1, 'SCHEDULED', NOW(), NOW()),
  ('match-6', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-amenadim', '2026-01-25 09:15:00', 'Cancha San José', 6, 1, 'SCHEDULED', NOW(), NOW()),
  ('match-7', 'torneo-sanjose-2026', 'team-borussia', 'team-valentin-fc', '2026-01-25 10:30:00', 'Cancha San José', 7, 1, 'SCHEDULED', NOW(), NOW()),
  ('match-8', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-hojas-anchas', '2026-01-25 19:15:00', 'Cancha San José', 8, 1, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 2 - 2026-02-01
  ('match-9', 'torneo-sanjose-2026', 'team-real-sociedad', 'team-elite-fc', '2026-02-01 08:00:00', 'Cancha San José', 9, 2, 'SCHEDULED', NOW(), NOW()),
  ('match-10', 'torneo-sanjose-2026', 'team-alianza', 'team-villanueva', '2026-02-01 10:30:00', 'Cancha San José', 10, 2, 'SCHEDULED', NOW(), NOW()),
  ('match-11', 'torneo-sanjose-2026', 'team-konami', 'team-los-aliados', '2026-02-01 13:00:00', 'Cancha San José', 11, 2, 'SCHEDULED', NOW(), NOW()),
  ('match-12', 'torneo-sanjose-2026', 'team-atletico-turro', 'team-ron-star', '2026-02-01 14:15:00', 'Cancha San José', 12, 2, 'SCHEDULED', NOW(), NOW()),
  ('match-13', 'torneo-sanjose-2026', 'team-netherland', 'team-amenadim', '2026-02-01 18:00:00', 'Cancha San José', 13, 2, 'SCHEDULED', NOW(), NOW()),
  ('match-14', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-valentin-fc', '2026-02-01 19:15:00', 'Cancha San José', 14, 2, 'SCHEDULED', NOW(), NOW()),
  ('match-15', 'torneo-sanjose-2026', 'team-borussia', 'team-hojas-anchas', '2026-02-01 16:45:00', 'Cancha San José', 15, 2, 'SCHEDULED', NOW(), NOW()),
  ('match-16', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-la-mosquita', '2026-02-01 11:45:00', 'Cancha San José', 16, 2, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 3 - 2026-02-08
  ('match-17', 'torneo-sanjose-2026', 'team-hojas-anchas', 'team-la-mosquita', '2026-02-08 16:45:00', 'Cancha San José', 17, 3, 'SCHEDULED', NOW(), NOW()),
  ('match-18', 'torneo-sanjose-2026', 'team-valentin-fc', 'team-quilmes', '2026-02-08 10:30:00', 'Cancha San José', 18, 3, 'SCHEDULED', NOW(), NOW()),
  ('match-19', 'torneo-sanjose-2026', 'team-konami', 'team-real-sociedad', '2026-02-08 14:15:00', 'Cancha San José', 19, 3, 'SCHEDULED', NOW(), NOW()),
  ('match-20', 'torneo-sanjose-2026', 'team-atletico-turro', 'team-elite-fc', '2026-02-08 19:15:00', 'Cancha San José', 20, 3, 'SCHEDULED', NOW(), NOW()),
  ('match-21', 'torneo-sanjose-2026', 'team-netherland', 'team-villanueva', '2026-02-08 11:45:00', 'Cancha San José', 21, 3, 'SCHEDULED', NOW(), NOW()),
  ('match-22', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-los-aliados', '2026-02-08 13:00:00', 'Cancha San José', 22, 3, 'SCHEDULED', NOW(), NOW()),
  ('match-23', 'torneo-sanjose-2026', 'team-borussia', 'team-ron-star', '2026-02-08 08:00:00', 'Cancha San José', 23, 3, 'SCHEDULED', NOW(), NOW()),
  ('match-24', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-amenadim', '2026-02-08 15:30:00', 'Cancha San José', 24, 3, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 4 - 2026-02-15
  ('match-25', 'torneo-sanjose-2026', 'team-valentin-fc', 'team-la-mosquita', '2026-02-15 08:00:00', 'Cancha San José', 25, 4, 'SCHEDULED', NOW(), NOW()),
  ('match-26', 'torneo-sanjose-2026', 'team-amenadim', 'team-quilmes', '2026-02-15 13:00:00', 'Cancha San José', 26, 4, 'SCHEDULED', NOW(), NOW()),
  ('match-27', 'torneo-sanjose-2026', 'team-konami', 'team-alianza', '2026-02-15 16:45:00', 'Cancha San José', 27, 4, 'SCHEDULED', NOW(), NOW()),
  ('match-28', 'torneo-sanjose-2026', 'team-atletico-turro', 'team-real-sociedad', '2026-02-15 09:15:00', 'Cancha San José', 28, 4, 'SCHEDULED', NOW(), NOW()),
  ('match-29', 'torneo-sanjose-2026', 'team-netherland', 'team-elite-fc', '2026-02-15 14:15:00', 'Cancha San José', 29, 4, 'SCHEDULED', NOW(), NOW()),
  ('match-30', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-villanueva', '2026-02-15 19:15:00', 'Cancha San José', 30, 4, 'SCHEDULED', NOW(), NOW()),
  ('match-31', 'torneo-sanjose-2026', 'team-borussia', 'team-los-aliados', '2026-02-15 15:30:00', 'Cancha San José', 31, 4, 'SCHEDULED', NOW(), NOW()),
  ('match-32', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-ron-star', '2026-02-15 11:45:00', 'Cancha San José', 32, 4, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 5 - 2026-02-22
  ('match-33', 'torneo-sanjose-2026', 'team-valentin-fc', 'team-hojas-anchas', '2026-02-22 19:15:00', 'Cancha San José', 33, 5, 'SCHEDULED', NOW(), NOW()),
  ('match-34', 'torneo-sanjose-2026', 'team-amenadim', 'team-la-mosquita', '2026-02-22 16:45:00', 'Cancha San José', 34, 5, 'SCHEDULED', NOW(), NOW()),
  ('match-35', 'torneo-sanjose-2026', 'team-ron-star', 'team-quilmes', '2026-02-22 18:00:00', 'Cancha San José', 35, 5, 'SCHEDULED', NOW(), NOW()),
  ('match-36', 'torneo-sanjose-2026', 'team-atletico-turro', 'team-alianza', '2026-02-22 11:45:00', 'Cancha San José', 36, 5, 'SCHEDULED', NOW(), NOW()),
  ('match-37', 'torneo-sanjose-2026', 'team-netherland', 'team-real-sociedad', '2026-02-22 13:00:00', 'Cancha San José', 37, 5, 'SCHEDULED', NOW(), NOW()),
  ('match-38', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-elite-fc', '2026-02-22 15:30:00', 'Cancha San José', 38, 5, 'SCHEDULED', NOW(), NOW()),
  ('match-39', 'torneo-sanjose-2026', 'team-borussia', 'team-villanueva', '2026-02-22 09:15:00', 'Cancha San José', 39, 5, 'SCHEDULED', NOW(), NOW()),
  ('match-40', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-los-aliados', '2026-02-22 08:00:00', 'Cancha San José', 40, 5, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 6 - 2026-03-01
  ('match-41', 'torneo-sanjose-2026', 'team-amenadim', 'team-hojas-anchas', '2026-03-01 09:15:00', 'Cancha San José', 41, 6, 'SCHEDULED', NOW(), NOW()),
  ('match-42', 'torneo-sanjose-2026', 'team-ron-star', 'team-la-mosquita', '2026-03-01 18:00:00', 'Cancha San José', 42, 6, 'SCHEDULED', NOW(), NOW()),
  ('match-43', 'torneo-sanjose-2026', 'team-los-aliados', 'team-quilmes', '2026-03-01 10:30:00', 'Cancha San José', 43, 6, 'SCHEDULED', NOW(), NOW()),
  ('match-44', 'torneo-sanjose-2026', 'team-atletico-turro', 'team-konami', '2026-03-01 08:00:00', 'Cancha San José', 44, 6, 'SCHEDULED', NOW(), NOW()),
  ('match-45', 'torneo-sanjose-2026', 'team-netherland', 'team-alianza', '2026-03-01 19:15:00', 'Cancha San José', 45, 6, 'SCHEDULED', NOW(), NOW()),
  ('match-46', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-real-sociedad', '2026-03-01 13:00:00', 'Cancha San José', 46, 6, 'SCHEDULED', NOW(), NOW()),
  ('match-47', 'torneo-sanjose-2026', 'team-borussia', 'team-elite-fc', '2026-03-01 16:45:00', 'Cancha San José', 47, 6, 'SCHEDULED', NOW(), NOW()),
  ('match-48', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-villanueva', '2026-03-01 15:30:00', 'Cancha San José', 48, 6, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 7 - 2026-03-15
  ('match-49', 'torneo-sanjose-2026', 'team-amenadim', 'team-valentin-fc', '2026-03-15 10:30:00', 'Cancha San José', 49, 7, 'SCHEDULED', NOW(), NOW()),
  ('match-50', 'torneo-sanjose-2026', 'team-ron-star', 'team-hojas-anchas', '2026-03-15 11:45:00', 'Cancha San José', 50, 7, 'SCHEDULED', NOW(), NOW()),
  ('match-51', 'torneo-sanjose-2026', 'team-los-aliados', 'team-la-mosquita', '2026-03-15 16:45:00', 'Cancha San José', 51, 7, 'SCHEDULED', NOW(), NOW()),
  ('match-52', 'torneo-sanjose-2026', 'team-villanueva', 'team-quilmes', '2026-03-15 18:00:00', 'Cancha San José', 52, 7, 'SCHEDULED', NOW(), NOW()),
  ('match-53', 'torneo-sanjose-2026', 'team-netherland', 'team-konami', '2026-03-15 13:00:00', 'Cancha San José', 53, 7, 'SCHEDULED', NOW(), NOW()),
  ('match-54', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-alianza', '2026-03-15 08:00:00', 'Cancha San José', 54, 7, 'SCHEDULED', NOW(), NOW()),
  ('match-55', 'torneo-sanjose-2026', 'team-borussia', 'team-real-sociedad', '2026-03-15 14:15:00', 'Cancha San José', 55, 7, 'SCHEDULED', NOW(), NOW()),
  ('match-56', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-elite-fc', '2026-03-15 09:15:00', 'Cancha San José', 56, 7, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 8 - 2026-03-22
  ('match-57', 'torneo-sanjose-2026', 'team-los-aliados', 'team-amenadim', '2026-03-22 18:00:00', 'Cancha San José', 57, 8, 'SCHEDULED', NOW(), NOW()),
  ('match-58', 'torneo-sanjose-2026', 'team-villanueva', 'team-valentin-fc', '2026-03-22 08:00:00', 'Cancha San José', 58, 8, 'SCHEDULED', NOW(), NOW()),
  ('match-59', 'torneo-sanjose-2026', 'team-elite-fc', 'team-hojas-anchas', '2026-03-22 16:45:00', 'Cancha San José', 59, 8, 'SCHEDULED', NOW(), NOW()),
  ('match-60', 'torneo-sanjose-2026', 'team-real-sociedad', 'team-la-mosquita', '2026-03-22 13:00:00', 'Cancha San José', 60, 8, 'SCHEDULED', NOW(), NOW()),
  ('match-61', 'torneo-sanjose-2026', 'team-alianza', 'team-quilmes', '2026-03-22 15:30:00', 'Cancha San José', 61, 8, 'SCHEDULED', NOW(), NOW()),
  ('match-62', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-netherland', '2026-03-22 09:15:00', 'Cancha San José', 62, 8, 'SCHEDULED', NOW(), NOW()),
  ('match-63', 'torneo-sanjose-2026', 'team-borussia', 'team-atletico-turro', '2026-03-22 14:15:00', 'Cancha San José', 63, 8, 'SCHEDULED', NOW(), NOW()),
  ('match-64', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-konami', '2026-03-22 11:45:00', 'Cancha San José', 64, 8, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 9 - 2026-03-29
  ('match-65', 'torneo-sanjose-2026', 'team-ron-star', 'team-amenadim', '2026-03-29 09:15:00', 'Cancha San José', 65, 9, 'SCHEDULED', NOW(), NOW()),
  ('match-66', 'torneo-sanjose-2026', 'team-los-aliados', 'team-valentin-fc', '2026-03-29 10:30:00', 'Cancha San José', 66, 9, 'SCHEDULED', NOW(), NOW()),
  ('match-67', 'torneo-sanjose-2026', 'team-villanueva', 'team-hojas-anchas', '2026-03-29 17:15:00', 'Cancha San José', 67, 9, 'SCHEDULED', NOW(), NOW()),
  ('match-68', 'torneo-sanjose-2026', 'team-elite-fc', 'team-la-mosquita', '2026-03-29 16:00:00', 'Cancha San José', 68, 9, 'SCHEDULED', NOW(), NOW()),
  ('match-69', 'torneo-sanjose-2026', 'team-real-sociedad', 'team-quilmes', '2026-03-29 13:00:00', 'Cancha San José', 69, 9, 'SCHEDULED', NOW(), NOW()),
  ('match-70', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-atletico-turro', '2026-03-29 08:00:00', 'Cancha San José', 70, 9, 'SCHEDULED', NOW(), NOW()),
  ('match-71', 'torneo-sanjose-2026', 'team-borussia', 'team-konami', '2026-03-29 14:15:00', 'Cancha San José', 71, 9, 'SCHEDULED', NOW(), NOW()),
  ('match-72', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-alianza', '2026-03-29 18:30:00', 'Cancha San José', 72, 9, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 10 - 2026-04-05
  ('match-73', 'torneo-sanjose-2026', 'team-ron-star', 'team-valentin-fc', '2026-04-05 08:00:00', 'Cancha San José', 73, 10, 'SCHEDULED', NOW(), NOW()),
  ('match-74', 'torneo-sanjose-2026', 'team-los-aliados', 'team-hojas-anchas', '2026-04-05 09:15:00', 'Cancha San José', 74, 10, 'SCHEDULED', NOW(), NOW()),
  ('match-75', 'torneo-sanjose-2026', 'team-villanueva', 'team-la-mosquita', '2026-04-05 10:30:00', 'Cancha San José', 75, 10, 'SCHEDULED', NOW(), NOW()),
  ('match-76', 'torneo-sanjose-2026', 'team-elite-fc', 'team-quilmes', '2026-04-05 11:45:00', 'Cancha San José', 76, 10, 'SCHEDULED', NOW(), NOW()),
  ('match-77', 'torneo-sanjose-2026', 'team-netherland', 'team-atletico-turro', '2026-04-05 13:00:00', 'Cancha San José', 77, 10, 'SCHEDULED', NOW(), NOW()),
  ('match-78', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-konami', '2026-04-05 16:45:00', 'Cancha San José', 78, 10, 'SCHEDULED', NOW(), NOW()),
  ('match-79', 'torneo-sanjose-2026', 'team-borussia', 'team-alianza', '2026-04-05 15:30:00', 'Cancha San José', 79, 10, 'SCHEDULED', NOW(), NOW()),
  ('match-80', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-real-sociedad', '2026-04-05 14:15:00', 'Cancha San José', 80, 10, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 11 - 2026-04-12 (sin horario asignado)
  ('match-81', 'torneo-sanjose-2026', 'team-los-aliados', 'team-ron-star', '2026-04-12 08:00:00', 'Cancha San José', 81, 11, 'SCHEDULED', NOW(), NOW()),
  ('match-82', 'torneo-sanjose-2026', 'team-villanueva', 'team-amenadim', '2026-04-12 08:00:00', 'Cancha San José', 82, 11, 'SCHEDULED', NOW(), NOW()),
  ('match-83', 'torneo-sanjose-2026', 'team-elite-fc', 'team-valentin-fc', '2026-04-12 08:00:00', 'Cancha San José', 83, 11, 'SCHEDULED', NOW(), NOW()),
  ('match-84', 'torneo-sanjose-2026', 'team-real-sociedad', 'team-hojas-anchas', '2026-04-12 08:00:00', 'Cancha San José', 84, 11, 'SCHEDULED', NOW(), NOW()),
  ('match-85', 'torneo-sanjose-2026', 'team-alianza', 'team-la-mosquita', '2026-04-12 08:00:00', 'Cancha San José', 85, 11, 'SCHEDULED', NOW(), NOW()),
  ('match-86', 'torneo-sanjose-2026', 'team-konami', 'team-quilmes', '2026-04-12 08:00:00', 'Cancha San José', 86, 11, 'SCHEDULED', NOW(), NOW()),
  ('match-87', 'torneo-sanjose-2026', 'team-borussia', 'team-netherland', '2026-04-12 08:00:00', 'Cancha San José', 87, 11, 'SCHEDULED', NOW(), NOW()),
  ('match-88', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-atletico-turro', '2026-04-12 08:00:00', 'Cancha San José', 88, 11, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 12 - 2026-04-19
  ('match-89', 'torneo-sanjose-2026', 'team-villanueva', 'team-ron-star', '2026-04-19 08:00:00', 'Cancha San José', 89, 12, 'SCHEDULED', NOW(), NOW()),
  ('match-90', 'torneo-sanjose-2026', 'team-elite-fc', 'team-amenadim', '2026-04-19 08:00:00', 'Cancha San José', 90, 12, 'SCHEDULED', NOW(), NOW()),
  ('match-91', 'torneo-sanjose-2026', 'team-real-sociedad', 'team-valentin-fc', '2026-04-19 08:00:00', 'Cancha San José', 91, 12, 'SCHEDULED', NOW(), NOW()),
  ('match-92', 'torneo-sanjose-2026', 'team-alianza', 'team-hojas-anchas', '2026-04-19 08:00:00', 'Cancha San José', 92, 12, 'SCHEDULED', NOW(), NOW()),
  ('match-93', 'torneo-sanjose-2026', 'team-konami', 'team-la-mosquita', '2026-04-19 08:00:00', 'Cancha San José', 93, 12, 'SCHEDULED', NOW(), NOW()),
  ('match-94', 'torneo-sanjose-2026', 'team-atletico-turro', 'team-quilmes', '2026-04-19 08:00:00', 'Cancha San José', 94, 12, 'SCHEDULED', NOW(), NOW()),
  ('match-95', 'torneo-sanjose-2026', 'team-borussia', 'team-deportivo-fenix', '2026-04-19 08:00:00', 'Cancha San José', 95, 12, 'SCHEDULED', NOW(), NOW()),
  ('match-96', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-netherland', '2026-04-19 08:00:00', 'Cancha San José', 96, 12, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 13 - 2026-04-26
  ('match-97', 'torneo-sanjose-2026', 'team-villanueva', 'team-los-aliados', '2026-04-26 08:00:00', 'Cancha San José', 97, 13, 'SCHEDULED', NOW(), NOW()),
  ('match-98', 'torneo-sanjose-2026', 'team-elite-fc', 'team-ron-star', '2026-04-26 08:00:00', 'Cancha San José', 98, 13, 'SCHEDULED', NOW(), NOW()),
  ('match-99', 'torneo-sanjose-2026', 'team-real-sociedad', 'team-amenadim', '2026-04-26 08:00:00', 'Cancha San José', 99, 13, 'SCHEDULED', NOW(), NOW()),
  ('match-100', 'torneo-sanjose-2026', 'team-alianza', 'team-valentin-fc', '2026-04-26 08:00:00', 'Cancha San José', 100, 13, 'SCHEDULED', NOW(), NOW()),
  ('match-101', 'torneo-sanjose-2026', 'team-konami', 'team-hojas-anchas', '2026-04-26 08:00:00', 'Cancha San José', 101, 13, 'SCHEDULED', NOW(), NOW()),
  ('match-102', 'torneo-sanjose-2026', 'team-atletico-turro', 'team-la-mosquita', '2026-04-26 08:00:00', 'Cancha San José', 102, 13, 'SCHEDULED', NOW(), NOW()),
  ('match-103', 'torneo-sanjose-2026', 'team-netherland', 'team-quilmes', '2026-04-26 08:00:00', 'Cancha San José', 103, 13, 'SCHEDULED', NOW(), NOW()),
  ('match-104', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-deportivo-fenix', '2026-04-26 08:00:00', 'Cancha San José', 104, 13, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 14 - 2026-05-03
  ('match-105', 'torneo-sanjose-2026', 'team-elite-fc', 'team-los-aliados', '2026-05-03 08:00:00', 'Cancha San José', 105, 14, 'SCHEDULED', NOW(), NOW()),
  ('match-106', 'torneo-sanjose-2026', 'team-real-sociedad', 'team-ron-star', '2026-05-03 08:00:00', 'Cancha San José', 106, 14, 'SCHEDULED', NOW(), NOW()),
  ('match-107', 'torneo-sanjose-2026', 'team-alianza', 'team-amenadim', '2026-05-03 08:00:00', 'Cancha San José', 107, 14, 'SCHEDULED', NOW(), NOW()),
  ('match-108', 'torneo-sanjose-2026', 'team-konami', 'team-valentin-fc', '2026-05-03 08:00:00', 'Cancha San José', 108, 14, 'SCHEDULED', NOW(), NOW()),
  ('match-109', 'torneo-sanjose-2026', 'team-atletico-turro', 'team-hojas-anchas', '2026-05-03 08:00:00', 'Cancha San José', 109, 14, 'SCHEDULED', NOW(), NOW()),
  ('match-110', 'torneo-sanjose-2026', 'team-netherland', 'team-la-mosquita', '2026-05-03 08:00:00', 'Cancha San José', 110, 14, 'SCHEDULED', NOW(), NOW()),
  ('match-111', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-quilmes', '2026-05-03 08:00:00', 'Cancha San José', 111, 14, 'SCHEDULED', NOW(), NOW()),
  ('match-112', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-borussia', '2026-05-03 08:00:00', 'Cancha San José', 112, 14, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 15 - 2026-05-17
  ('match-113', 'torneo-sanjose-2026', 'team-elite-fc', 'team-villanueva', '2026-05-17 08:00:00', 'Cancha San José', 113, 15, 'SCHEDULED', NOW(), NOW()),
  ('match-114', 'torneo-sanjose-2026', 'team-real-sociedad', 'team-los-aliados', '2026-05-17 08:00:00', 'Cancha San José', 114, 15, 'SCHEDULED', NOW(), NOW()),
  ('match-115', 'torneo-sanjose-2026', 'team-alianza', 'team-ron-star', '2026-05-17 08:00:00', 'Cancha San José', 115, 15, 'SCHEDULED', NOW(), NOW()),
  ('match-116', 'torneo-sanjose-2026', 'team-konami', 'team-amenadim', '2026-05-17 08:00:00', 'Cancha San José', 116, 15, 'SCHEDULED', NOW(), NOW()),
  ('match-117', 'torneo-sanjose-2026', 'team-atletico-turro', 'team-valentin-fc', '2026-05-17 08:00:00', 'Cancha San José', 117, 15, 'SCHEDULED', NOW(), NOW()),
  ('match-118', 'torneo-sanjose-2026', 'team-netherland', 'team-hojas-anchas', '2026-05-17 08:00:00', 'Cancha San José', 118, 15, 'SCHEDULED', NOW(), NOW()),
  ('match-119', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-la-mosquita', '2026-05-17 08:00:00', 'Cancha San José', 119, 15, 'SCHEDULED', NOW(), NOW()),
  ('match-120', 'torneo-sanjose-2026', 'team-borussia', 'team-quilmes', '2026-05-17 08:00:00', 'Cancha San José', 120, 15, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 16 - 2026-05-24
  ('match-121', 'torneo-sanjose-2026', 'team-real-sociedad', 'team-villanueva', '2026-05-24 08:00:00', 'Cancha San José', 121, 16, 'SCHEDULED', NOW(), NOW()),
  ('match-122', 'torneo-sanjose-2026', 'team-alianza', 'team-los-aliados', '2026-05-24 08:00:00', 'Cancha San José', 122, 16, 'SCHEDULED', NOW(), NOW()),
  ('match-123', 'torneo-sanjose-2026', 'team-konami', 'team-ron-star', '2026-05-24 08:00:00', 'Cancha San José', 123, 16, 'SCHEDULED', NOW(), NOW()),
  ('match-124', 'torneo-sanjose-2026', 'team-atletico-turro', 'team-amenadim', '2026-05-24 08:00:00', 'Cancha San José', 124, 16, 'SCHEDULED', NOW(), NOW()),
  ('match-125', 'torneo-sanjose-2026', 'team-netherland', 'team-valentin-fc', '2026-05-24 08:00:00', 'Cancha San José', 125, 16, 'SCHEDULED', NOW(), NOW()),
  ('match-126', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-hojas-anchas', '2026-05-24 08:00:00', 'Cancha San José', 126, 16, 'SCHEDULED', NOW(), NOW()),
  ('match-127', 'torneo-sanjose-2026', 'team-borussia', 'team-la-mosquita', '2026-05-24 08:00:00', 'Cancha San José', 127, 16, 'SCHEDULED', NOW(), NOW()),
  ('match-128', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-quilmes', '2026-05-24 08:00:00', 'Cancha San José', 128, 16, 'SCHEDULED', NOW(), NOW()),
  -- Fecha 17 - 2026-05-31
  ('match-129', 'torneo-sanjose-2026', 'team-hojas-anchas', 'team-quilmes', '2026-05-31 08:00:00', 'Cancha San José', 129, 17, 'SCHEDULED', NOW(), NOW()),
  ('match-130', 'torneo-sanjose-2026', 'team-alianza', 'team-real-sociedad', '2026-05-31 08:00:00', 'Cancha San José', 130, 17, 'SCHEDULED', NOW(), NOW()),
  ('match-131', 'torneo-sanjose-2026', 'team-konami', 'team-elite-fc', '2026-05-31 08:00:00', 'Cancha San José', 131, 17, 'SCHEDULED', NOW(), NOW()),
  ('match-132', 'torneo-sanjose-2026', 'team-atletico-turro', 'team-villanueva', '2026-05-31 08:00:00', 'Cancha San José', 132, 17, 'SCHEDULED', NOW(), NOW()),
  ('match-133', 'torneo-sanjose-2026', 'team-netherland', 'team-los-aliados', '2026-05-31 08:00:00', 'Cancha San José', 133, 17, 'SCHEDULED', NOW(), NOW()),
  ('match-134', 'torneo-sanjose-2026', 'team-deportivo-fenix', 'team-ron-star', '2026-05-31 08:00:00', 'Cancha San José', 134, 17, 'SCHEDULED', NOW(), NOW()),
  ('match-135', 'torneo-sanjose-2026', 'team-borussia', 'team-amenadim', '2026-05-31 08:00:00', 'Cancha San José', 135, 17, 'SCHEDULED', NOW(), NOW()),
  ('match-136', 'torneo-sanjose-2026', 'team-rayados-fc', 'team-valentin-fc', '2026-05-31 08:00:00', 'Cancha San José', 136, 17, 'SCHEDULED', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET "teamAId" = EXCLUDED."teamAId", "teamBId" = EXCLUDED."teamBId", "scheduledAt" = EXCLUDED."scheduledAt", "dayNumber" = EXCLUDED."dayNumber";

-- =============================================
-- TIEBREAKERS
-- =============================================
INSERT INTO tournament_tiebreakers (id, "tournamentId", criteria, priority) VALUES
  (gen_random_uuid(), 'torneo-sanjose-2026', 'GOAL_DIFFERENCE', 1),
  (gen_random_uuid(), 'torneo-sanjose-2026', 'GOALS_FOR', 2),
  (gen_random_uuid(), 'torneo-sanjose-2026', 'HEAD_TO_HEAD', 3),
  (gen_random_uuid(), 'torneo-sanjose-2026', 'FAIR_PLAY', 4)
ON CONFLICT ("tournamentId", "roundId", criteria) DO NOTHING;

COMMIT;
