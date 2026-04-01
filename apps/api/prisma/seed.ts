import { PrismaClient, GeoRegion, SectorType, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// =============================================
// DATOS REALES - TORNEO FUTBOL 7 SAN JOSE 2026
// Fuente: Jugadores.xlsx + Tabla de Control 20251.xlsx
// =============================================

interface PlayerData {
  name: string;
  cc: string | null;
  jerseyNumber: number | null;
}

interface TeamData {
  name: string;
  players: PlayerData[];
}

interface MatchData {
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  dayNumber: number;
  date: string;
  time: string | null;
}

// -- Nombres de equipos normalizados (usados como referencia canonica) --
const TEAM_NAME_MAP: Record<string, string> = {
  'Konamí': 'Konami',
  'Konami': 'Konami',
};

function normalizeTeamName(name: string): string {
  return TEAM_NAME_MAP[name] || name;
}

// Limpia nombres de jugadores que tienen la CC pegada al final
function cleanPlayerName(name: string): { cleanName: string; extractedCc: string | null } {
  const match = name.match(/^(.+?)\s+(\d{7,11})\s*$/);
  if (match) {
    return { cleanName: match[1].trim(), extractedCc: match[2] };
  }
  return { cleanName: name, extractedCc: null };
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
  // For 3+ parts, first 1-2 are first name, rest is last name
  // Common patterns: "Juan David Vergara" -> first: "Juan David", last: "Vergara"
  // "Jesús David Ortega Jiménez" -> first: "Jesús David", last: "Ortega Jiménez"
  return { firstName: parts.slice(0, 2).join(' '), lastName: parts.slice(2).join(' ') };
}

// =============================================
// EQUIPOS Y JUGADORES REALES (Jugadores.xlsx)
// =============================================
const TEAMS_DATA: TeamData[] = [
  {
    name: 'Netherland',
    players: [
      { name: 'Deiby Yepes', cc: '1035917877', jerseyNumber: 1 },
      { name: 'Andrés Gallego', cc: '1035421158', jerseyNumber: 2 },
      { name: 'Yeison Velasquez', cc: '1035918511', jerseyNumber: 3 },
      { name: 'Jeferson Álzate', cc: '1001445192', jerseyNumber: 4 },
      { name: 'Duvian Henao', cc: '1038212360', jerseyNumber: 5 },
      { name: 'Marlon Salazar', cc: '1035917620', jerseyNumber: 6 },
      { name: 'Harold Zapata', cc: '1020102562', jerseyNumber: 7 },
      { name: 'Duvan Villa', cc: '1035920762', jerseyNumber: 8 },
      { name: 'Brahian Gil Chalarca', cc: '1192831995', jerseyNumber: 9 },
      { name: 'Luis Fernando Ruíz', cc: '1035916783', jerseyNumber: 10 },
      { name: 'Felipe Ochoa', cc: '1035915230', jerseyNumber: 11 },
      { name: 'Johan Yepes', cc: '1001416419', jerseyNumber: 12 },
      { name: 'Juan José Rave Carvajal', cc: '1011397555', jerseyNumber: 13 },
      { name: 'Daniel Ruíz Ospina', cc: '1035914165', jerseyNumber: 14 },
    ],
  },
  {
    name: 'Hojas Anchas',
    players: [
      { name: 'Julián Esteban Gil', cc: '1035916092', jerseyNumber: 1 },
      { name: 'Matías Montoya Flórez', cc: '1035913267', jerseyNumber: 2 },
      { name: 'Edissón Gaviria Londoño', cc: '1001415560', jerseyNumber: 3 },
      { name: 'Jefferson Álzate Alvarez', cc: '1001415783', jerseyNumber: 4 },
      { name: 'Jeison Alberto Londoño Otalvaro', cc: '1035916472', jerseyNumber: 5 },
      { name: 'Julio Cesar Gaviria Londoño', cc: '1035910439', jerseyNumber: 6 },
      { name: 'José Ángel Londoño', cc: '1015068191', jerseyNumber: 7 },
      { name: 'Jorge Duque', cc: '1001478610', jerseyNumber: 8 },
      { name: 'James Londoño Herrera', cc: '1001723874', jerseyNumber: 9 },
      { name: 'Luis Guillermo Sánchez', cc: '1003191984', jerseyNumber: 10 },
      { name: 'Jonathan Zuleta', cc: '1035913987', jerseyNumber: 11 },
      { name: 'Juan de Dios Duque Ospina', cc: '1035918267', jerseyNumber: 12 },
      { name: 'Orlando Manuel Pérez Padilla', cc: '1003188527', jerseyNumber: 13 },
      { name: 'Juan José Angulo Ochoa', cc: '1001416247', jerseyNumber: 14 },
      { name: 'Deibyd Cárdenas Ríos', cc: '1035921748', jerseyNumber: 15 },
    ],
  },
  {
    name: 'Rayados FC',
    players: [
      { name: 'Juan Esteban Maya', cc: '1001446955', jerseyNumber: null },
      { name: 'Alexander Salgado', cc: '1039092689', jerseyNumber: null },
      { name: 'Silvio Celins', cc: '21227633', jerseyNumber: null },
      { name: 'Julián Botero Carvajal', cc: '1035913106', jerseyNumber: null },
      { name: 'Ricardo Peralta', cc: '10416267254', jerseyNumber: null },
      { name: 'Yilmar García', cc: '1007291138', jerseyNumber: null },
      { name: 'Gonzalo Carvajal Marín', cc: '70754940', jerseyNumber: null },
      { name: 'Luis Fernando Madera', cc: '1041258302', jerseyNumber: null },
      { name: 'Edison Molina', cc: '1003076492', jerseyNumber: null },
      { name: 'Yonier de la Torre', cc: '1049563396', jerseyNumber: null },
      { name: 'José Gregorio Hernández', cc: '1120742338', jerseyNumber: null },
      { name: 'José Andrés Cantero', cc: '1039093825', jerseyNumber: null },
      { name: 'Luis Fernando Hernández', cc: '1035152696', jerseyNumber: null },
      { name: 'Jesús David Ortega Jiménez', cc: '1052992792', jerseyNumber: null },
      { name: 'Danilo Ocampo', cc: '1036840103', jerseyNumber: null },
      { name: 'Germán Cleto', cc: '1039079560', jerseyNumber: null },
    ],
  },
  {
    name: 'Alianza',
    players: [
      { name: 'Alexander Silva', cc: '27339899', jerseyNumber: null },
      { name: 'Donis Garrido', cc: '92032780', jerseyNumber: null },
      { name: 'Santiago Soto', cc: '1064187882', jerseyNumber: null },
      { name: 'Adán Barrera', cc: '1067280861', jerseyNumber: null },
      { name: 'José Mendoza Cantero', cc: '15621880', jerseyNumber: null },
      { name: 'Ubeimar Paternina', cc: '1067290271', jerseyNumber: null },
      { name: 'Juan Camilo Álzate', cc: '1036934032', jerseyNumber: null },
      { name: 'Amín Enrique Ortega', cc: '1052097073', jerseyNumber: null },
      { name: 'Andrés García', cc: '1066000504', jerseyNumber: null },
      { name: 'Jaider Álzate', cc: '1021928604', jerseyNumber: null },
      { name: 'Luis David Fernández', cc: '1066729781', jerseyNumber: null },
      { name: 'Omar Suarez', cc: '1067287142', jerseyNumber: null },
      { name: 'Fidel García', cc: '1063955039', jerseyNumber: null },
      { name: 'Hernán David Pérez', cc: '1066733611', jerseyNumber: null },
      { name: 'José Mendoza', cc: '71989765', jerseyNumber: null },
      { name: 'Merki Martínez', cc: null, jerseyNumber: null },
    ],
  },
  {
    name: 'Élite FC',
    players: [
      { name: 'Jhohan Antonio Muñoz', cc: '1051637027', jerseyNumber: null },
      { name: 'Luis Estrada', cc: '1003307520', jerseyNumber: null },
      { name: 'Osnaider Martínez', cc: '1003307119', jerseyNumber: null },
      { name: 'Carlos Ospina', cc: '1007238254', jerseyNumber: null },
      { name: 'José Gregorio Mercado', cc: '1069500102', jerseyNumber: null },
      { name: 'Adrián Cadrozo', cc: '1129184406', jerseyNumber: null },
      { name: 'José Alfredo Martínez', cc: '1005525079', jerseyNumber: null },
      { name: 'Esneider Bettin', cc: '1003501016', jerseyNumber: null },
      { name: 'Diego Luis Martínez', cc: '1007432724', jerseyNumber: null },
      { name: 'Kevín Montagut', cc: '1050556577', jerseyNumber: null },
      { name: 'Deimer Mercado', cc: '1069488899', jerseyNumber: null },
      { name: 'Luis David Pérez', cc: '1192772022', jerseyNumber: null },
      { name: 'Juan Sebastián Baldovino', cc: '1007066488', jerseyNumber: null },
      { name: 'Cesar Canabal', cc: '1007066419', jerseyNumber: null },
      { name: 'Pablo Amaya', cc: '1036963277', jerseyNumber: null },
      { name: 'Diego Ángulo', cc: null, jerseyNumber: null },
      { name: 'Luis David Martínez', cc: '1033377118', jerseyNumber: null },
    ],
  },
  {
    name: 'Deportivo Fénix',
    players: [
      { name: 'Andrés Alfonso Martínez', cc: '1007369648', jerseyNumber: null },
      { name: 'Jorge Eliecer Mayo', cc: '1040367522', jerseyNumber: null },
      { name: 'Harold Andrés Moreno', cc: '1002276422', jerseyNumber: null },
      { name: 'Francisco Javier Iturriago Gutiérrez', cc: '1085167070', jerseyNumber: null },
      { name: 'Hernán David Gonzalez', cc: '1068665515', jerseyNumber: null },
      { name: 'Juan Felipe Hincapíe', cc: '1036967345', jerseyNumber: null },
      { name: 'Yan Carlos Ortiz', cc: '1003589029', jerseyNumber: null },
      { name: 'Andrés David Reyes', cc: '1063172422', jerseyNumber: null },
      { name: 'Oscar David Pimienta', cc: '1003003240', jerseyNumber: null },
      { name: 'Juan David Redondo', cc: '1036935495', jerseyNumber: null },
      { name: 'Yerson Andrés Jaramillo Blandon', cc: '1048600099', jerseyNumber: null },
      { name: 'Elvis Manuel Ortíz', cc: '1003456756', jerseyNumber: null },
      { name: 'Elder José Gonzalez', cc: '1068665436', jerseyNumber: null },
      { name: 'Samir Cueto Salas', cc: '1002275239', jerseyNumber: null },
      { name: 'Aldo José Rangel', cc: '17580723', jerseyNumber: null },
      { name: 'Manuel Antonio Naranjo', cc: '1068656122', jerseyNumber: null },
    ],
  },
  {
    name: 'Amenadim',
    players: [
      { name: 'Juan David Ballesteros', cc: null, jerseyNumber: null },
      { name: 'Jorge Luis Zapata', cc: null, jerseyNumber: null },
      { name: 'Eider Simanca', cc: null, jerseyNumber: null },
      { name: 'Juan Bautista García', cc: null, jerseyNumber: null },
      { name: 'Didier Montoya', cc: null, jerseyNumber: null },
      { name: 'Humberto Ochoa', cc: null, jerseyNumber: null },
      { name: 'Daniel Enrique Cuevas', cc: null, jerseyNumber: null },
      { name: 'Yohan Araque', cc: null, jerseyNumber: null },
      { name: 'Juan Carlos García', cc: null, jerseyNumber: null },
      { name: 'Juan Sebastián Zapata', cc: null, jerseyNumber: null },
      { name: 'Juan Carlos Zapata', cc: null, jerseyNumber: null },
      { name: 'Rogelio Rueda', cc: null, jerseyNumber: null },
      { name: 'Duvan Felipe Ossa', cc: null, jerseyNumber: null },
      { name: 'Franklin Cuenú', cc: null, jerseyNumber: null },
      { name: 'Carlos Arias', cc: null, jerseyNumber: null },
      { name: 'Santiago Araque', cc: null, jerseyNumber: null },
    ],
  },
  {
    name: 'Ron Star',
    players: [
      { name: 'Eliecer Serpa', cc: '27267603', jerseyNumber: null },
      { name: 'Juan Guillermo Vallejo', cc: '1035910882', jerseyNumber: null },
      { name: 'José Gregorio Medina', cc: '5494795', jerseyNumber: null },
      { name: 'Javier Danilo Castrillón', cc: '1035915378', jerseyNumber: null },
      { name: 'John Alexander Sánchez', cc: '15446394', jerseyNumber: null },
      { name: 'Julián Hincapie', cc: '1035915334', jerseyNumber: null },
      { name: 'John Fredy Zapata', cc: null, jerseyNumber: null },
      { name: 'Kevín Meneses', cc: '1035876603', jerseyNumber: null },
      { name: 'Juan Fernando Loaiza', cc: '1035918370', jerseyNumber: null },
      { name: 'Santiago Quiroz', cc: '1001651934', jerseyNumber: null },
      { name: 'Juan Guillermo Ossa', cc: '70756611', jerseyNumber: null },
      { name: 'Brayan Monsalve', cc: '103668041', jerseyNumber: null },
      { name: 'Robin Rodriguez', cc: '1035911733', jerseyNumber: null },
      { name: 'Juan Camilo Zapata', cc: '70756143', jerseyNumber: null },
      { name: 'Erwin Padilla Prado', cc: '1082837458', jerseyNumber: null },
      { name: 'Diego Patiño', cc: '1053817090', jerseyNumber: null },
    ],
  },
  {
    name: 'Konami',
    players: [
      { name: 'Santiago Lopera', cc: '1035919787', jerseyNumber: null },
      { name: 'Luis Norbey Flórez', cc: '1035913398', jerseyNumber: null },
      { name: 'Erick Rendón', cc: null, jerseyNumber: null },
      { name: 'Juan Montoya', cc: '15448702', jerseyNumber: null },
      { name: 'Kevín Cardona', cc: '1035912589', jerseyNumber: null },
      { name: 'Cristián Orozco', cc: null, jerseyNumber: null },
      { name: 'Tomás Montoya', cc: '1036253739', jerseyNumber: null },
      { name: 'Julián Duque', cc: '1038414743', jerseyNumber: null },
      { name: 'Fabián Serna', cc: '1035921034', jerseyNumber: null },
      { name: 'Robinson Ossa', cc: '1035919066', jerseyNumber: null },
      { name: 'Giovanni Orozco', cc: '1036930534', jerseyNumber: null },
      { name: 'Cesar Vanegas', cc: '1035417589', jerseyNumber: null },
      { name: 'Hugo Alejandro Vergara', cc: '103591419', jerseyNumber: null },
      { name: 'Ramón Isaza', cc: '103591389', jerseyNumber: null },
      { name: 'Jorge Gutierrez', cc: '107374669', jerseyNumber: null },
      { name: 'Yojan Yepes', cc: '1001416221', jerseyNumber: null },
    ],
  },
  {
    name: 'Atlético Turro',
    players: [
      { name: 'Omar Jaramillo', cc: '1036955372', jerseyNumber: null },
      { name: 'Maicol Stiven Órtiz', cc: '1007650642', jerseyNumber: null },
      { name: 'Juan Felipe Jaramillo', cc: '1036936834', jerseyNumber: null },
      { name: 'Juan Gamilo Henao Jaramillo', cc: '1036941802', jerseyNumber: null },
      { name: 'Cristián Andrés Urrea M', cc: '1104872475', jerseyNumber: null },
      { name: 'Yorman Quintero', cc: '1007319647', jerseyNumber: null },
      { name: 'Víctor Jaramillo', cc: '1036936833', jerseyNumber: null },
      { name: 'Camilo Araujo', cc: '1069658543', jerseyNumber: null },
      { name: 'Sebastián Ospina', cc: '1036250619', jerseyNumber: null },
      { name: 'Alber Pérez', cc: '1063077263', jerseyNumber: null },
      { name: 'Juan Diego Herrera', cc: '10369334', jerseyNumber: null },
      { name: 'Jerson Quintero', cc: '1045396318', jerseyNumber: null },
      { name: 'Steven Zuluaga', cc: '1035913082', jerseyNumber: null },
      { name: 'Ronal Bohórquez', cc: '1103498375', jerseyNumber: null },
      { name: 'Juan José Gaviria', cc: '1035911309', jerseyNumber: null },
      { name: 'Cristián Torres', cc: '1073323617', jerseyNumber: null },
    ],
  },
  {
    name: 'Los Aliados',
    players: [
      { name: 'Pablo Martínez', cc: '1047494826', jerseyNumber: null },
      { name: 'Maicol Rúa', cc: '1001416101', jerseyNumber: null },
      { name: 'Gustavo Moscoso', cc: '1038801351', jerseyNumber: null },
      { name: 'Yeison Gaviria', cc: '1035912533', jerseyNumber: null },
      { name: 'Dany Gaviria', cc: '1036945737', jerseyNumber: null },
      { name: 'Argemiro Médina', cc: '8866338', jerseyNumber: null },
      { name: 'Carlos Zapata', cc: '1035915851', jerseyNumber: null },
      { name: 'Santiago Ruiz', cc: null, jerseyNumber: null },
      { name: 'Jorge Atehortua', cc: '1035914635', jerseyNumber: null },
      { name: 'Obed Echavarria', cc: '3379720', jerseyNumber: null },
      { name: 'Marcos Muñoz', cc: '1073986424', jerseyNumber: null },
      { name: 'Juan Pablo Ríos', cc: null, jerseyNumber: null },
      { name: 'Cristián Alejandro Echavarría', cc: '1035916420', jerseyNumber: null },
      { name: 'Din Arley Castrillón', cc: '70756908', jerseyNumber: null },
      { name: 'Stiven Guevara', cc: '92540895', jerseyNumber: null },
      { name: 'Camilo Cardona', cc: '1035910185', jerseyNumber: null },
    ],
  },
  {
    name: 'Valentín FC',
    players: [
      { name: 'Jaider Carvajal Ríos', cc: '1001447388', jerseyNumber: null },
      { name: 'Juan David Vergara', cc: '10016877363', jerseyNumber: null },
      { name: 'Daniel Stiven Zuleta', cc: '1035919811', jerseyNumber: null },
      { name: 'Carlos Andrés Berrio', cc: '1035918679', jerseyNumber: null },
      { name: 'Luis Eduardo Berrio', cc: '1035917668', jerseyNumber: null },
      { name: 'Stiven Álzate', cc: '1040874602', jerseyNumber: null },
      { name: 'Sebastián Carvajal Duque', cc: '1035919187', jerseyNumber: null },
      { name: 'David Alejandro Acevedo', cc: '1036934863', jerseyNumber: null },
      { name: 'Victor Sierra', cc: '1003458121', jerseyNumber: null },
      { name: 'Santiago Grisales', cc: '1035919696', jerseyNumber: null },
      { name: 'Fredy Ochoa', cc: '1007240877', jerseyNumber: null },
      { name: 'Cristián Duque', cc: '1035921805', jerseyNumber: null },
      { name: 'Cristian Carvajal Ríos', cc: '1193138307', jerseyNumber: null },
      { name: 'Daniel Correa', cc: '1000442259', jerseyNumber: null },
    ],
  },
  {
    name: 'Quilmes',
    players: [
      { name: 'Yeremi Sebastián Muñoz', cc: '1035915849', jerseyNumber: null },
      { name: 'Sebastián Jiménez', cc: '1128454934', jerseyNumber: null },
      { name: 'Brayan Salazar Gómez', cc: '1007690672', jerseyNumber: null },
      { name: 'Fernando Torres', cc: '1036953589', jerseyNumber: null },
      { name: 'Jaider Isaza', cc: null, jerseyNumber: null },
      { name: 'Juan Manuel Marulanda', cc: '1035921946', jerseyNumber: null },
      { name: 'Santiago Londoño', cc: '70755647', jerseyNumber: null },
      { name: 'Jhonatan Chavarría', cc: '1035912496', jerseyNumber: null },
      { name: 'Yesid Herrera', cc: '1035921420', jerseyNumber: null },
      { name: 'Santiago Mejía', cc: '1192815765', jerseyNumber: null },
      { name: 'Juan David García', cc: '1036948820', jerseyNumber: null },
      { name: 'Miguel Ángel Patiño', cc: '1017213174', jerseyNumber: null },
      { name: 'Alejandro Arango', cc: '1038413985', jerseyNumber: null },
      { name: 'Alexis Chavarría', cc: '1035915122', jerseyNumber: null },
      { name: 'Germán Arenas Herrera', cc: '1035922000', jerseyNumber: null },
    ],
  },
  {
    name: 'Borussia',
    players: [
      { name: 'Hernán Paternina', cc: '1062963472', jerseyNumber: null },
      { name: 'Jesús David Aguirre', cc: '100336345', jerseyNumber: null },
      { name: 'Marcial Mena', cc: '1148699434', jerseyNumber: null },
      { name: 'Jhon Freddy Córdoba', cc: '1067896247', jerseyNumber: null },
      { name: 'Saúl Reyes', cc: '1067879032', jerseyNumber: null },
      { name: 'Jorge Mario Cogollo', cc: '1067912972', jerseyNumber: null },
      { name: 'Carlos Gonzalez', cc: '5363650', jerseyNumber: null },
      { name: 'John James Bastidas', cc: '1002498849', jerseyNumber: null },
      { name: 'Julián Mejía', cc: '1056772712', jerseyNumber: null },
      { name: 'Cristián Morales Hernández', cc: '1067876049', jerseyNumber: null },
      { name: 'Keimer Guevara', cc: '1067947492', jerseyNumber: null },
      { name: 'Luis Morales', cc: '1192807744', jerseyNumber: null },
      { name: 'Robert Alfonso Martínez', cc: '5877598', jerseyNumber: null },
      { name: 'Ramón Ciro', cc: '1056782291', jerseyNumber: null },
      { name: 'Duván Ciro', cc: '1056786291', jerseyNumber: null },
      { name: 'Manuel Correa', cc: '1033258021', jerseyNumber: null },
      { name: 'Elkín Aguirre', cc: '1037636273', jerseyNumber: null },
      { name: 'José Ayberth Medina', cc: '34089556', jerseyNumber: null },
    ],
  },
  {
    name: 'La Mosquita',
    players: [
      { name: 'Juan Esteban Otalvaro', cc: '1035914538', jerseyNumber: null },
      { name: 'Arbenis Montoya', cc: '70757113', jerseyNumber: null },
      { name: 'Anderson Henao', cc: '1036950018', jerseyNumber: null },
      { name: 'Deimer Pérez', cc: '1003406176', jerseyNumber: null },
      { name: 'Darío Delgado', cc: '24432158', jerseyNumber: null },
      { name: 'Gabriel Enrique Romero', cc: '6062026', jerseyNumber: null },
      { name: 'Gabino Romero', cc: '6043103', jerseyNumber: null },
      { name: 'Enrique Urganete', cc: '6956282', jerseyNumber: null },
      { name: 'Yan Carlos Cervantes', cc: '1129506520', jerseyNumber: null },
      { name: 'Jefferson Arcangel Piyela', cc: '6746403', jerseyNumber: null },
      { name: 'Erideson Caraballo', cc: '1047482930', jerseyNumber: null },
      { name: 'Kevin Alexis Quiroz Ruiz', cc: '1020112219', jerseyNumber: null },
      { name: 'Edgar Segundo Gonzáles', cc: '28780310', jerseyNumber: null },
      { name: 'Santiago Palacio Londoño', cc: '1036960473', jerseyNumber: null },
      { name: 'Yeisón Ramírez', cc: '1193260635', jerseyNumber: null },
      { name: 'Nevel Eliomar Gonzalez', cc: '8061272', jerseyNumber: null },
    ],
  },
  {
    name: 'Villanueva',
    players: [
      { name: 'Andrés Contreras', cc: '1003432592', jerseyNumber: null },
      { name: 'Denilson Cadena', cc: '1063948774', jerseyNumber: null },
      { name: 'Juan Carlos Vega', cc: '1121326445', jerseyNumber: null },
      { name: 'Raúl José Martíz', cc: '1006735441', jerseyNumber: null },
      { name: 'Jheison Daniel Cadena', cc: '1063948773', jerseyNumber: null },
      { name: 'Manuel David Ospina', cc: '1102579031', jerseyNumber: null },
      { name: 'Donaldo Enrique Reyes', cc: '1041266049', jerseyNumber: null },
      { name: 'Carlos Villa', cc: '16305567', jerseyNumber: null },
      { name: 'Derwis Rafael Villa', cc: '1042473711', jerseyNumber: null },
      { name: 'Yehis Pacheco', cc: '1045232422', jerseyNumber: null },
      { name: 'Jorge Castellar', cc: '10474316837', jerseyNumber: null },
      { name: 'Leider Javier Padilla', cc: '1007122165', jerseyNumber: null },
      { name: 'Julio Cesar Medina', cc: '1102578197', jerseyNumber: null },
      { name: 'Carlos Oviedo', cc: null, jerseyNumber: null },
      { name: 'Elias Reyes', cc: null, jerseyNumber: null },
      { name: 'Ángel Mora', cc: '28157513', jerseyNumber: null },
    ],
  },
  {
    name: 'Real Sociedad',
    players: [
      { name: 'Jhoan José Rojas Martínez', cc: '8146725', jerseyNumber: null },
      { name: 'Gustavo Enrique Gonzalez', cc: '23865581', jerseyNumber: null },
      { name: 'Nilson Cipriano', cc: '1066242278', jerseyNumber: null },
      { name: 'Jonathan Santiago', cc: '1035911539', jerseyNumber: null },
      { name: 'Eduar Gonzalez', cc: '21491655', jerseyNumber: null },
      { name: 'José Enrique Llorente', cc: '106705013', jerseyNumber: null },
      { name: 'Yonfer García', cc: '100336931', jerseyNumber: null },
      { name: 'Edwin Quintero', cc: '106228857', jerseyNumber: null },
      { name: 'John Posso', cc: '1112405704', jerseyNumber: null },
      { name: 'Ivan Betancourt', cc: '1035924811', jerseyNumber: null },
      { name: 'Juan David López', cc: '1036950905', jerseyNumber: null },
      { name: 'Yohan Ospina', cc: '1001415202', jerseyNumber: null },
      { name: 'Leonardo Herrera', cc: '1067402681', jerseyNumber: null },
      { name: 'Cristián Otalvaro', cc: '1036942216', jerseyNumber: null },
      { name: 'Deivys Llorente', cc: '1003213244', jerseyNumber: null },
    ],
  },
];

// =============================================
// FIXTURE REAL (Jugadores.xlsx - Hoja2)
// 17 Fechas, 136 partidos
// =============================================
const FIXTURE_DATA: MatchData[] = [
  // Fecha 1 - 2026-01-25
  { matchNumber: 1, homeTeam: 'La Mosquita', awayTeam: 'Quilmes', dayNumber: 1, date: '2026-01-25', time: '18:00' },
  { matchNumber: 2, homeTeam: 'Alianza', awayTeam: 'Élite FC', dayNumber: 1, date: '2026-01-25', time: '08:00' },
  { matchNumber: 3, homeTeam: 'Konami', awayTeam: 'Villanueva', dayNumber: 1, date: '2026-01-25', time: '15:30' },
  { matchNumber: 4, homeTeam: 'Atlético Turro', awayTeam: 'Los Aliados', dayNumber: 1, date: '2026-01-25', time: '11:45' },
  { matchNumber: 5, homeTeam: 'Netherland', awayTeam: 'Ron Star', dayNumber: 1, date: '2026-01-25', time: '16:45' },
  { matchNumber: 6, homeTeam: 'Deportivo Fénix', awayTeam: 'Amenadim', dayNumber: 1, date: '2026-01-25', time: '09:15' },
  { matchNumber: 7, homeTeam: 'Borussia', awayTeam: 'Valentín FC', dayNumber: 1, date: '2026-01-25', time: '10:30' },
  { matchNumber: 8, homeTeam: 'Rayados FC', awayTeam: 'Hojas Anchas', dayNumber: 1, date: '2026-01-25', time: '19:15' },
  // Fecha 2 - 2026-02-01
  { matchNumber: 9, homeTeam: 'Real Sociedad', awayTeam: 'Élite FC', dayNumber: 2, date: '2026-02-01', time: '08:00' },
  { matchNumber: 10, homeTeam: 'Alianza', awayTeam: 'Villanueva', dayNumber: 2, date: '2026-02-01', time: '10:30' },
  { matchNumber: 11, homeTeam: 'Konami', awayTeam: 'Los Aliados', dayNumber: 2, date: '2026-02-01', time: '13:00' },
  { matchNumber: 12, homeTeam: 'Atlético Turro', awayTeam: 'Ron Star', dayNumber: 2, date: '2026-02-01', time: '14:15' },
  { matchNumber: 13, homeTeam: 'Netherland', awayTeam: 'Amenadim', dayNumber: 2, date: '2026-02-01', time: '18:00' },
  { matchNumber: 14, homeTeam: 'Deportivo Fénix', awayTeam: 'Valentín FC', dayNumber: 2, date: '2026-02-01', time: '19:15' },
  { matchNumber: 15, homeTeam: 'Borussia', awayTeam: 'Hojas Anchas', dayNumber: 2, date: '2026-02-01', time: '16:45' },
  { matchNumber: 16, homeTeam: 'Rayados FC', awayTeam: 'La Mosquita', dayNumber: 2, date: '2026-02-01', time: '11:45' },
  // Fecha 3 - 2026-02-08
  { matchNumber: 17, homeTeam: 'Hojas Anchas', awayTeam: 'La Mosquita', dayNumber: 3, date: '2026-02-08', time: '16:45' },
  { matchNumber: 18, homeTeam: 'Valentín FC', awayTeam: 'Quilmes', dayNumber: 3, date: '2026-02-08', time: '10:30' },
  { matchNumber: 19, homeTeam: 'Konami', awayTeam: 'Real Sociedad', dayNumber: 3, date: '2026-02-08', time: '14:15' },
  { matchNumber: 20, homeTeam: 'Atlético Turro', awayTeam: 'Élite FC', dayNumber: 3, date: '2026-02-08', time: '19:15' },
  { matchNumber: 21, homeTeam: 'Netherland', awayTeam: 'Villanueva', dayNumber: 3, date: '2026-02-08', time: '11:45' },
  { matchNumber: 22, homeTeam: 'Deportivo Fénix', awayTeam: 'Los Aliados', dayNumber: 3, date: '2026-02-08', time: '13:00' },
  { matchNumber: 23, homeTeam: 'Borussia', awayTeam: 'Ron Star', dayNumber: 3, date: '2026-02-08', time: '08:00' },
  { matchNumber: 24, homeTeam: 'Rayados FC', awayTeam: 'Amenadim', dayNumber: 3, date: '2026-02-08', time: '15:30' },
  // Fecha 4 - 2026-02-15
  { matchNumber: 25, homeTeam: 'Valentín FC', awayTeam: 'La Mosquita', dayNumber: 4, date: '2026-02-15', time: '08:00' },
  { matchNumber: 26, homeTeam: 'Amenadim', awayTeam: 'Quilmes', dayNumber: 4, date: '2026-02-15', time: '13:00' },
  { matchNumber: 27, homeTeam: 'Konami', awayTeam: 'Alianza', dayNumber: 4, date: '2026-02-15', time: '16:45' },
  { matchNumber: 28, homeTeam: 'Atlético Turro', awayTeam: 'Real Sociedad', dayNumber: 4, date: '2026-02-15', time: '09:15' },
  { matchNumber: 29, homeTeam: 'Netherland', awayTeam: 'Élite FC', dayNumber: 4, date: '2026-02-15', time: '14:15' },
  { matchNumber: 30, homeTeam: 'Deportivo Fénix', awayTeam: 'Villanueva', dayNumber: 4, date: '2026-02-15', time: '19:15' },
  { matchNumber: 31, homeTeam: 'Borussia', awayTeam: 'Los Aliados', dayNumber: 4, date: '2026-02-15', time: '15:30' },
  { matchNumber: 32, homeTeam: 'Rayados FC', awayTeam: 'Ron Star', dayNumber: 4, date: '2026-02-15', time: '11:45' },
  // Fecha 5 - 2026-02-22
  { matchNumber: 33, homeTeam: 'Valentín FC', awayTeam: 'Hojas Anchas', dayNumber: 5, date: '2026-02-22', time: '19:15' },
  { matchNumber: 34, homeTeam: 'Amenadim', awayTeam: 'La Mosquita', dayNumber: 5, date: '2026-02-22', time: '16:45' },
  { matchNumber: 35, homeTeam: 'Ron Star', awayTeam: 'Quilmes', dayNumber: 5, date: '2026-02-22', time: '18:00' },
  { matchNumber: 36, homeTeam: 'Atlético Turro', awayTeam: 'Alianza', dayNumber: 5, date: '2026-02-22', time: '11:45' },
  { matchNumber: 37, homeTeam: 'Netherland', awayTeam: 'Real Sociedad', dayNumber: 5, date: '2026-02-22', time: '13:00' },
  { matchNumber: 38, homeTeam: 'Deportivo Fénix', awayTeam: 'Élite FC', dayNumber: 5, date: '2026-02-22', time: '15:30' },
  { matchNumber: 39, homeTeam: 'Borussia', awayTeam: 'Villanueva', dayNumber: 5, date: '2026-02-22', time: '09:15' },
  { matchNumber: 40, homeTeam: 'Rayados FC', awayTeam: 'Los Aliados', dayNumber: 5, date: '2026-02-22', time: '08:00' },
  // Fecha 6 - 2026-03-01
  { matchNumber: 41, homeTeam: 'Amenadim', awayTeam: 'Hojas Anchas', dayNumber: 6, date: '2026-03-01', time: '09:15' },
  { matchNumber: 42, homeTeam: 'Ron Star', awayTeam: 'La Mosquita', dayNumber: 6, date: '2026-03-01', time: '18:00' },
  { matchNumber: 43, homeTeam: 'Los Aliados', awayTeam: 'Quilmes', dayNumber: 6, date: '2026-03-01', time: '10:30' },
  { matchNumber: 44, homeTeam: 'Atlético Turro', awayTeam: 'Konami', dayNumber: 6, date: '2026-03-01', time: '08:00' },
  { matchNumber: 45, homeTeam: 'Netherland', awayTeam: 'Alianza', dayNumber: 6, date: '2026-03-01', time: '19:15' },
  { matchNumber: 46, homeTeam: 'Deportivo Fénix', awayTeam: 'Real Sociedad', dayNumber: 6, date: '2026-03-01', time: '13:00' },
  { matchNumber: 47, homeTeam: 'Borussia', awayTeam: 'Élite FC', dayNumber: 6, date: '2026-03-01', time: '16:45' },
  { matchNumber: 48, homeTeam: 'Rayados FC', awayTeam: 'Villanueva', dayNumber: 6, date: '2026-03-01', time: '15:30' },
  // Fecha 7 - 2026-03-15
  { matchNumber: 49, homeTeam: 'Amenadim', awayTeam: 'Valentín FC', dayNumber: 7, date: '2026-03-15', time: '10:30' },
  { matchNumber: 50, homeTeam: 'Ron Star', awayTeam: 'Hojas Anchas', dayNumber: 7, date: '2026-03-15', time: '11:45' },
  { matchNumber: 51, homeTeam: 'Los Aliados', awayTeam: 'La Mosquita', dayNumber: 7, date: '2026-03-15', time: '16:45' },
  { matchNumber: 52, homeTeam: 'Villanueva', awayTeam: 'Quilmes', dayNumber: 7, date: '2026-03-15', time: '18:00' },
  { matchNumber: 53, homeTeam: 'Netherland', awayTeam: 'Konami', dayNumber: 7, date: '2026-03-15', time: '13:00' },
  { matchNumber: 54, homeTeam: 'Deportivo Fénix', awayTeam: 'Alianza', dayNumber: 7, date: '2026-03-15', time: '08:00' },
  { matchNumber: 55, homeTeam: 'Borussia', awayTeam: 'Real Sociedad', dayNumber: 7, date: '2026-03-15', time: '14:15' },
  { matchNumber: 56, homeTeam: 'Rayados FC', awayTeam: 'Élite FC', dayNumber: 7, date: '2026-03-15', time: '09:15' },
  // Fecha 8 - 2026-03-22
  { matchNumber: 57, homeTeam: 'Los Aliados', awayTeam: 'Amenadim', dayNumber: 8, date: '2026-03-22', time: '18:00' },
  { matchNumber: 58, homeTeam: 'Villanueva', awayTeam: 'Valentín FC', dayNumber: 8, date: '2026-03-22', time: '08:00' },
  { matchNumber: 59, homeTeam: 'Élite FC', awayTeam: 'Hojas Anchas', dayNumber: 8, date: '2026-03-22', time: '16:45' },
  { matchNumber: 60, homeTeam: 'Real Sociedad', awayTeam: 'La Mosquita', dayNumber: 8, date: '2026-03-22', time: '13:00' },
  { matchNumber: 61, homeTeam: 'Alianza', awayTeam: 'Quilmes', dayNumber: 8, date: '2026-03-22', time: '15:30' },
  { matchNumber: 62, homeTeam: 'Deportivo Fénix', awayTeam: 'Netherland', dayNumber: 8, date: '2026-03-22', time: '09:15' },
  { matchNumber: 63, homeTeam: 'Borussia', awayTeam: 'Atlético Turro', dayNumber: 8, date: '2026-03-22', time: '14:15' },
  { matchNumber: 64, homeTeam: 'Rayados FC', awayTeam: 'Konami', dayNumber: 8, date: '2026-03-22', time: '11:45' },
  // Fecha 9 - 2026-03-29
  { matchNumber: 65, homeTeam: 'Ron Star', awayTeam: 'Amenadim', dayNumber: 9, date: '2026-03-29', time: '09:15' },
  { matchNumber: 66, homeTeam: 'Los Aliados', awayTeam: 'Valentín FC', dayNumber: 9, date: '2026-03-29', time: '10:30' },
  { matchNumber: 67, homeTeam: 'Villanueva', awayTeam: 'Hojas Anchas', dayNumber: 9, date: '2026-03-29', time: '17:15' },
  { matchNumber: 68, homeTeam: 'Élite FC', awayTeam: 'La Mosquita', dayNumber: 9, date: '2026-03-29', time: '16:00' },
  { matchNumber: 69, homeTeam: 'Real Sociedad', awayTeam: 'Quilmes', dayNumber: 9, date: '2026-03-29', time: '13:00' },
  { matchNumber: 70, homeTeam: 'Deportivo Fénix', awayTeam: 'Atlético Turro', dayNumber: 9, date: '2026-03-29', time: '08:00' },
  { matchNumber: 71, homeTeam: 'Borussia', awayTeam: 'Konami', dayNumber: 9, date: '2026-03-29', time: '14:15' },
  { matchNumber: 72, homeTeam: 'Rayados FC', awayTeam: 'Alianza', dayNumber: 9, date: '2026-03-29', time: '18:30' },
  // Fecha 10 - 2026-04-05
  { matchNumber: 73, homeTeam: 'Ron Star', awayTeam: 'Valentín FC', dayNumber: 10, date: '2026-04-05', time: '08:00' },
  { matchNumber: 74, homeTeam: 'Los Aliados', awayTeam: 'Hojas Anchas', dayNumber: 10, date: '2026-04-05', time: '09:15' },
  { matchNumber: 75, homeTeam: 'Villanueva', awayTeam: 'La Mosquita', dayNumber: 10, date: '2026-04-05', time: '10:30' },
  { matchNumber: 76, homeTeam: 'Élite FC', awayTeam: 'Quilmes', dayNumber: 10, date: '2026-04-05', time: '11:45' },
  { matchNumber: 77, homeTeam: 'Netherland', awayTeam: 'Atlético Turro', dayNumber: 10, date: '2026-04-05', time: '13:00' },
  { matchNumber: 78, homeTeam: 'Deportivo Fénix', awayTeam: 'Konami', dayNumber: 10, date: '2026-04-05', time: '16:45' },
  { matchNumber: 79, homeTeam: 'Borussia', awayTeam: 'Alianza', dayNumber: 10, date: '2026-04-05', time: '15:30' },
  { matchNumber: 80, homeTeam: 'Rayados FC', awayTeam: 'Real Sociedad', dayNumber: 10, date: '2026-04-05', time: '14:15' },
  // Fecha 11 - 2026-04-12
  { matchNumber: 81, homeTeam: 'Los Aliados', awayTeam: 'Ron Star', dayNumber: 11, date: '2026-04-12', time: null },
  { matchNumber: 82, homeTeam: 'Villanueva', awayTeam: 'Amenadim', dayNumber: 11, date: '2026-04-12', time: null },
  { matchNumber: 83, homeTeam: 'Élite FC', awayTeam: 'Valentín FC', dayNumber: 11, date: '2026-04-12', time: null },
  { matchNumber: 84, homeTeam: 'Real Sociedad', awayTeam: 'Hojas Anchas', dayNumber: 11, date: '2026-04-12', time: null },
  { matchNumber: 85, homeTeam: 'Alianza', awayTeam: 'La Mosquita', dayNumber: 11, date: '2026-04-12', time: null },
  { matchNumber: 86, homeTeam: 'Konami', awayTeam: 'Quilmes', dayNumber: 11, date: '2026-04-12', time: null },
  { matchNumber: 87, homeTeam: 'Borussia', awayTeam: 'Netherland', dayNumber: 11, date: '2026-04-12', time: null },
  { matchNumber: 88, homeTeam: 'Rayados FC', awayTeam: 'Atlético Turro', dayNumber: 11, date: '2026-04-12', time: null },
  // Fecha 12 - 2026-04-19
  { matchNumber: 89, homeTeam: 'Villanueva', awayTeam: 'Ron Star', dayNumber: 12, date: '2026-04-19', time: null },
  { matchNumber: 90, homeTeam: 'Élite FC', awayTeam: 'Amenadim', dayNumber: 12, date: '2026-04-19', time: null },
  { matchNumber: 91, homeTeam: 'Real Sociedad', awayTeam: 'Valentín FC', dayNumber: 12, date: '2026-04-19', time: null },
  { matchNumber: 92, homeTeam: 'Alianza', awayTeam: 'Hojas Anchas', dayNumber: 12, date: '2026-04-19', time: null },
  { matchNumber: 93, homeTeam: 'Konami', awayTeam: 'La Mosquita', dayNumber: 12, date: '2026-04-19', time: null },
  { matchNumber: 94, homeTeam: 'Atlético Turro', awayTeam: 'Quilmes', dayNumber: 12, date: '2026-04-19', time: null },
  { matchNumber: 95, homeTeam: 'Borussia', awayTeam: 'Deportivo Fénix', dayNumber: 12, date: '2026-04-19', time: null },
  { matchNumber: 96, homeTeam: 'Rayados FC', awayTeam: 'Netherland', dayNumber: 12, date: '2026-04-19', time: null },
  // Fecha 13 - 2026-04-26
  { matchNumber: 97, homeTeam: 'Villanueva', awayTeam: 'Los Aliados', dayNumber: 13, date: '2026-04-26', time: null },
  { matchNumber: 98, homeTeam: 'Élite FC', awayTeam: 'Ron Star', dayNumber: 13, date: '2026-04-26', time: null },
  { matchNumber: 99, homeTeam: 'Real Sociedad', awayTeam: 'Amenadim', dayNumber: 13, date: '2026-04-26', time: null },
  { matchNumber: 100, homeTeam: 'Alianza', awayTeam: 'Valentín FC', dayNumber: 13, date: '2026-04-26', time: null },
  { matchNumber: 101, homeTeam: 'Konami', awayTeam: 'Hojas Anchas', dayNumber: 13, date: '2026-04-26', time: null },
  { matchNumber: 102, homeTeam: 'Atlético Turro', awayTeam: 'La Mosquita', dayNumber: 13, date: '2026-04-26', time: null },
  { matchNumber: 103, homeTeam: 'Netherland', awayTeam: 'Quilmes', dayNumber: 13, date: '2026-04-26', time: null },
  { matchNumber: 104, homeTeam: 'Rayados FC', awayTeam: 'Deportivo Fénix', dayNumber: 13, date: '2026-04-26', time: null },
  // Fecha 14 - 2026-05-03
  { matchNumber: 105, homeTeam: 'Élite FC', awayTeam: 'Los Aliados', dayNumber: 14, date: '2026-05-03', time: null },
  { matchNumber: 106, homeTeam: 'Real Sociedad', awayTeam: 'Ron Star', dayNumber: 14, date: '2026-05-03', time: null },
  { matchNumber: 107, homeTeam: 'Alianza', awayTeam: 'Amenadim', dayNumber: 14, date: '2026-05-03', time: null },
  { matchNumber: 108, homeTeam: 'Konami', awayTeam: 'Valentín FC', dayNumber: 14, date: '2026-05-03', time: null },
  { matchNumber: 109, homeTeam: 'Atlético Turro', awayTeam: 'Hojas Anchas', dayNumber: 14, date: '2026-05-03', time: null },
  { matchNumber: 110, homeTeam: 'Netherland', awayTeam: 'La Mosquita', dayNumber: 14, date: '2026-05-03', time: null },
  { matchNumber: 111, homeTeam: 'Deportivo Fénix', awayTeam: 'Quilmes', dayNumber: 14, date: '2026-05-03', time: null },
  { matchNumber: 112, homeTeam: 'Rayados FC', awayTeam: 'Borussia', dayNumber: 14, date: '2026-05-03', time: null },
  // Fecha 15 - 2026-05-17
  { matchNumber: 113, homeTeam: 'Élite FC', awayTeam: 'Villanueva', dayNumber: 15, date: '2026-05-17', time: null },
  { matchNumber: 114, homeTeam: 'Real Sociedad', awayTeam: 'Los Aliados', dayNumber: 15, date: '2026-05-17', time: null },
  { matchNumber: 115, homeTeam: 'Alianza', awayTeam: 'Ron Star', dayNumber: 15, date: '2026-05-17', time: null },
  { matchNumber: 116, homeTeam: 'Konami', awayTeam: 'Amenadim', dayNumber: 15, date: '2026-05-17', time: null },
  { matchNumber: 117, homeTeam: 'Atlético Turro', awayTeam: 'Valentín FC', dayNumber: 15, date: '2026-05-17', time: null },
  { matchNumber: 118, homeTeam: 'Netherland', awayTeam: 'Hojas Anchas', dayNumber: 15, date: '2026-05-17', time: null },
  { matchNumber: 119, homeTeam: 'Deportivo Fénix', awayTeam: 'La Mosquita', dayNumber: 15, date: '2026-05-17', time: null },
  { matchNumber: 120, homeTeam: 'Borussia', awayTeam: 'Quilmes', dayNumber: 15, date: '2026-05-17', time: null },
  // Fecha 16 - 2026-05-24
  { matchNumber: 121, homeTeam: 'Real Sociedad', awayTeam: 'Villanueva', dayNumber: 16, date: '2026-05-24', time: null },
  { matchNumber: 122, homeTeam: 'Alianza', awayTeam: 'Los Aliados', dayNumber: 16, date: '2026-05-24', time: null },
  { matchNumber: 123, homeTeam: 'Konami', awayTeam: 'Ron Star', dayNumber: 16, date: '2026-05-24', time: null },
  { matchNumber: 124, homeTeam: 'Atlético Turro', awayTeam: 'Amenadim', dayNumber: 16, date: '2026-05-24', time: null },
  { matchNumber: 125, homeTeam: 'Netherland', awayTeam: 'Valentín FC', dayNumber: 16, date: '2026-05-24', time: null },
  { matchNumber: 126, homeTeam: 'Deportivo Fénix', awayTeam: 'Hojas Anchas', dayNumber: 16, date: '2026-05-24', time: null },
  { matchNumber: 127, homeTeam: 'Borussia', awayTeam: 'La Mosquita', dayNumber: 16, date: '2026-05-24', time: null },
  { matchNumber: 128, homeTeam: 'Rayados FC', awayTeam: 'Quilmes', dayNumber: 16, date: '2026-05-24', time: null },
  // Fecha 17 - 2026-05-31
  { matchNumber: 129, homeTeam: 'Hojas Anchas', awayTeam: 'Quilmes', dayNumber: 17, date: '2026-05-31', time: null },
  { matchNumber: 130, homeTeam: 'Alianza', awayTeam: 'Real Sociedad', dayNumber: 17, date: '2026-05-31', time: null },
  { matchNumber: 131, homeTeam: 'Konami', awayTeam: 'Élite FC', dayNumber: 17, date: '2026-05-31', time: null },
  { matchNumber: 132, homeTeam: 'Atlético Turro', awayTeam: 'Villanueva', dayNumber: 17, date: '2026-05-31', time: null },
  { matchNumber: 133, homeTeam: 'Netherland', awayTeam: 'Los Aliados', dayNumber: 17, date: '2026-05-31', time: null },
  { matchNumber: 134, homeTeam: 'Deportivo Fénix', awayTeam: 'Ron Star', dayNumber: 17, date: '2026-05-31', time: null },
  { matchNumber: 135, homeTeam: 'Borussia', awayTeam: 'Amenadim', dayNumber: 17, date: '2026-05-31', time: null },
  { matchNumber: 136, homeTeam: 'Rayados FC', awayTeam: 'Valentín FC', dayNumber: 17, date: '2026-05-31', time: null },
];

async function main() {
  console.log('🏟️  Seeding database with REAL tournament data...');

  // -- Super Admin --
  const passwordHash = await bcrypt.hash(process.env.SEED_SUPER_ADMIN_PASSWORD || 'Admin2026*', 12);
  const admin = await prisma.user.upsert({
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

  // =============================================
  // TORNEO REAL - Futbol 7 San Jose 2026
  // =============================================
  const tournament = await prisma.tournament.upsert({
    where: { id: 'torneo-sanjose-2026' },
    update: {},
    create: {
      id: 'torneo-sanjose-2026',
      name: 'Torneo Fútbol 7 San José 2026',
      organizerId: admin.id,
      type: 'LEAGUE',
      status: 'IN_PROGRESS',
      startDate: new Date('2026-01-25'),
      endDate: new Date('2026-05-31'),
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      maxYellowCards: 3,
    },
  });
  console.log(`Tournament created: ${tournament.name}`);

  // -- Create Teams and Players --
  const teamMap = new Map<string, string>(); // team name -> team id

  for (const teamData of TEAMS_DATA) {
    const teamSlug = teamData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    const teamId = `team-${teamSlug}`;

    const team = await prisma.team.upsert({
      where: { id: teamId },
      update: { name: teamData.name },
      create: { id: teamId, name: teamData.name, city: 'Guarne' },
    });
    teamMap.set(teamData.name, team.id);

    // Link team to tournament
    await prisma.tournamentTeam.upsert({
      where: { tournamentId_teamId: { tournamentId: tournament.id, teamId: team.id } },
      update: {},
      create: { tournamentId: tournament.id, teamId: team.id },
    });

    // Create players
    for (let i = 0; i < teamData.players.length; i++) {
      const p = teamData.players[i];
      const { cleanName, extractedCc } = cleanPlayerName(p.name);
      const cc = extractedCc || p.cc;
      const { firstName, lastName } = splitName(cleanName);
      const playerId = `player-${teamSlug}-${i + 1}`;

      await prisma.player.upsert({
        where: { id: playerId },
        update: {
          firstName,
          lastName,
          jerseyNumber: p.jerseyNumber,
          documentNumber: cc,
        },
        create: {
          id: playerId,
          teamId: team.id,
          firstName,
          lastName,
          jerseyNumber: p.jerseyNumber,
          documentType: cc ? 'CEDULA_CIUDADANIA' : undefined,
          documentNumber: cc,
          nationality: 'Colombiana',
          status: 'ACTIVE',
        },
      });
    }
  }
  console.log(`${TEAMS_DATA.length} teams and ${TEAMS_DATA.reduce((s, t) => s + t.players.length, 0)} players seeded`);

  // -- Create Matches from Fixture --
  for (const m of FIXTURE_DATA) {
    const homeTeamName = normalizeTeamName(m.homeTeam);
    const awayTeamName = normalizeTeamName(m.awayTeam);
    const homeTeamId = teamMap.get(homeTeamName);
    const awayTeamId = teamMap.get(awayTeamName);

    if (!homeTeamId || !awayTeamId) {
      console.warn(`Team not found for match ${m.matchNumber}: "${m.homeTeam}" vs "${m.awayTeam}"`);
      continue;
    }

    // Build scheduled date/time
    let scheduledAt: Date;
    if (m.time) {
      const [hours, minutes] = m.time.split(':');
      scheduledAt = new Date(`${m.date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`);
    } else {
      // Matches without assigned time default to 08:00
      scheduledAt = new Date(`${m.date}T08:00:00`);
    }

    const matchId = `match-${m.matchNumber}`;
    await prisma.match.upsert({
      where: { id: matchId },
      update: {
        scheduledAt,
        dayNumber: m.dayNumber,
      },
      create: {
        id: matchId,
        tournamentId: tournament.id,
        teamAId: homeTeamId,
        teamBId: awayTeamId,
        scheduledAt,
        venue: 'Cancha San José',
        matchNumber: m.matchNumber,
        dayNumber: m.dayNumber,
        status: 'SCHEDULED',
      },
    });
  }
  console.log(`${FIXTURE_DATA.length} matches seeded (17 fechas)`);

  // -- Tiebreakers (based on 2025 tournament format) --
  const tiebreakers: { criteria: 'GOAL_DIFFERENCE' | 'GOALS_FOR' | 'HEAD_TO_HEAD' | 'FAIR_PLAY'; priority: number }[] = [
    { criteria: 'GOAL_DIFFERENCE', priority: 1 },
    { criteria: 'GOALS_FOR', priority: 2 },
    { criteria: 'HEAD_TO_HEAD', priority: 3 },
    { criteria: 'FAIR_PLAY', priority: 4 },
  ];

  for (const tb of tiebreakers) {
    const existing = await prisma.tournamentTiebreaker.findFirst({
      where: { tournamentId: tournament.id, roundId: null, criteria: tb.criteria },
    });
    if (!existing) {
      await prisma.tournamentTiebreaker.create({
        data: {
          tournamentId: tournament.id,
          criteria: tb.criteria,
          priority: tb.priority,
        },
      });
    }
  }
  console.log('Tiebreakers configured');

  console.log('\n✅ Seed completed successfully!');
  console.log(`   - ${TEAMS_DATA.length} equipos reales`);
  console.log(`   - ${TEAMS_DATA.reduce((s, t) => s + t.players.length, 0)} jugadores reales`);
  console.log(`   - ${FIXTURE_DATA.length} partidos programados`);
  console.log(`   - 17 fechas (Ene 25 - May 31, 2026)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
