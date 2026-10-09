"use client";

import Link from "next/link";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { cn } from "@/lib/utils";

export interface StandingRow {
  teamId: string; teamName: string; logoUrl?: string | null; groupName?: string | null;
  played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; goalDifference: number; points: number;
  yellowCards?: number; redCards?: number; form?: ("W" | "D" | "L")[]; position?: number;
}

export function FormDots({ form }: { form?: ("W" | "D" | "L")[] }) {
  if (!form || form.length === 0) return <span className="text-muted-foreground/50">—</span>;
  return (
    <span className="inline-flex gap-0.5">
      {form.map((f, i) => (
        <span key={i} title={f === "W" ? "Victoria" : f === "D" ? "Empate" : "Derrota"} className={cn("h-4 w-4 rounded-sm text-[9px] font-bold flex items-center justify-center text-white", f === "W" ? "bg-emerald-500" : f === "D" ? "bg-slate-400" : "bg-rose-500")}>
          {f === "W" ? "G" : f === "D" ? "E" : "P"}
        </span>
      ))}
    </span>
  );
}

export function StandingsTable({ rows, qualify = 0, relegate = 0, compact, title, highlightTeamId, maxRows, linkTo }: {
  rows: StandingRow[]; qualify?: number; relegate?: number; compact?: boolean; title?: string; highlightTeamId?: string; maxRows?: number; linkTo?: string;
}) {
  const shown = maxRows ? rows.slice(0, maxRows) : rows;
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {title && <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between"><p className="text-sm font-semibold">{title}</p>{linkTo && <Link href={linkTo} className="text-xs text-primary hover:underline">Ver todo</Link>}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-soft">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="text-left w-8">#</th>
              <th className="text-left">Equipo</th>
              <th className="text-center">PJ</th>
              {!compact && <><th className="text-center">PG</th><th className="text-center">PE</th><th className="text-center">PP</th></>}
              <th className="text-center hidden sm:table-cell">GF</th>
              <th className="text-center hidden sm:table-cell">GC</th>
              <th className="text-center">DG</th>
              <th className="text-center font-bold">Pts</th>
              {!compact && <th className="text-center hidden md:table-cell">Forma</th>}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => {
              const pos = r.position || i + 1;
              const q = qualify > 0 && pos <= qualify;
              const rel = relegate > 0 && pos > rows.length - relegate;
              return (
                <tr key={r.teamId} className={cn("transition-colors hover:bg-muted/30", highlightTeamId === r.teamId && "bg-primary/5")}>
                  <td className="text-center">
                    <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold", q ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : rel ? "bg-rose-500/15 text-rose-700 dark:text-rose-300" : "text-muted-foreground")}>{pos}</span>
                  </td>
                  <td>
                    <Link href={`/dashboard/teams/detalle?id=${r.teamId}`} className="flex items-center gap-2 min-w-0 hover:text-primary">
                      <TeamAvatar name={r.teamName} logoUrl={r.logoUrl} size="xs" />
                      <span className="font-medium truncate max-w-[140px] sm:max-w-[220px]">{r.teamName}</span>
                    </Link>
                  </td>
                  <td className="text-center text-muted-foreground">{r.played}</td>
                  {!compact && <><td className="text-center">{r.won}</td><td className="text-center">{r.drawn}</td><td className="text-center">{r.lost}</td></>}
                  <td className="text-center hidden sm:table-cell">{r.goalsFor}</td>
                  <td className="text-center hidden sm:table-cell">{r.goalsAgainst}</td>
                  <td className={cn("text-center font-medium", r.goalDifference > 0 ? "text-emerald-600" : r.goalDifference < 0 ? "text-rose-600" : "text-muted-foreground")}>{r.goalDifference > 0 ? "+" : ""}{r.goalDifference}</td>
                  <td className="text-center font-bold text-primary">{r.points}</td>
                  {!compact && <td className="text-center hidden md:table-cell"><FormDots form={r.form} /></td>}
                </tr>
              );
            })}
            {shown.length === 0 && <tr><td colSpan={12} className="text-center text-muted-foreground py-6">Sin equipos.</td></tr>}
          </tbody>
        </table>
      </div>
      {(qualify > 0 || relegate > 0) && (
        <div className="px-4 py-2 border-t text-[11px] text-muted-foreground flex gap-4">
          {qualify > 0 && <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/60" />Clasifica</span>}
          {relegate > 0 && <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500/60" />Zona baja</span>}
        </div>
      )}
    </div>
  );
}
