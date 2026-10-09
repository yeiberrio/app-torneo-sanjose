export function fmtDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-CO", opts);
}

export function fmtTime(value: string | Date | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function fmtLong(value: string | Date | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-CO", { weekday: "short", day: "2-digit", month: "long" });
}

/** Convierte fecha (YYYY-MM-DD) + hora (HH:mm) locales a ISO UTC. */
export function localToISO(date: string, time = "15:00") {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString();
}

/** Devuelve { date: YYYY-MM-DD, time: HH:mm } en hora local a partir de un ISO. */
export function isoToLocal(iso: string | Date) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function initials(name: string, n = 2) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, n)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
