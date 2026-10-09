export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "purple";

export const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  info: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  purple: "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
};

export const matchStatus: Record<string, { label: string; tone: Tone; live?: boolean }> = {
  SCHEDULED: { label: "Programado", tone: "info" },
  IN_PROGRESS: { label: "En juego", tone: "success", live: true },
  HALFTIME: { label: "Entretiempo", tone: "warning", live: true },
  FINISHED: { label: "Finalizado", tone: "neutral" },
  SUSPENDED: { label: "Suspendido", tone: "danger" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
  POSTPONED: { label: "Aplazado", tone: "purple" },
};

export const tournamentStatus: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Borrador", tone: "warning" },
  PUBLISHED: { label: "Publicado", tone: "info" },
  IN_PROGRESS: { label: "En curso", tone: "success" },
  FINISHED: { label: "Finalizado", tone: "neutral" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
};

export const tournamentType: Record<string, string> = {
  LEAGUE: "Liga",
  CUP: "Copa",
  GROUPS: "Grupos + Eliminación",
  KNOCKOUT: "Eliminación directa",
};

export const roundType: Record<string, string> = {
  ROUND_ROBIN: "Todos contra todos",
  GROUP_STAGE: "Fase de grupos",
  KNOCKOUT: "Eliminación directa",
  POINTS_CLASSIFICATION: "Clasificación por puntos",
};

export const tiebreaker: Record<string, string> = {
  HEAD_TO_HEAD: "Enfrentamiento directo",
  GOAL_DIFFERENCE: "Diferencia de goles",
  GOALS_FOR: "Goles a favor",
  GOALS_AGAINST: "Goles en contra",
  FAIR_PLAY: "Juego limpio",
  PENALTY_SHOOTOUT: "Tiros penales",
  LOTS_DRAWING: "Sorteo",
  AWAY_GOALS: "Goles de visitante",
  WINS: "Victorias",
  DRAWS: "Empates",
};

export const position: Record<string, string> = {
  GOALKEEPER: "Portero",
  DEFENDER: "Defensa",
  MIDFIELDER: "Mediocampista",
  FORWARD: "Delantero",
};

export const positionShort: Record<string, string> = {
  GOALKEEPER: "POR",
  DEFENDER: "DEF",
  MIDFIELDER: "MED",
  FORWARD: "DEL",
};

export const playerStatus: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Activo", tone: "success" },
  SUSPENDED: { label: "Suspendido", tone: "danger" },
  INJURED: { label: "Lesionado", tone: "warning" },
  TRANSFERRED: { label: "Transferido", tone: "purple" },
  INACTIVE: { label: "Inactivo", tone: "neutral" },
};

export const documentType: Record<string, string> = {
  CEDULA_CIUDADANIA: "Cédula",
  CEDULA_EXTRANJERIA: "Cédula extranjería",
  TARJETA_IDENTIDAD: "Tarjeta identidad",
  PASAPORTE: "Pasaporte",
  NIT: "NIT",
};

export const LIVE_STATUSES = ["IN_PROGRESS", "HALFTIME"];
