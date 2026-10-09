"use client";

import Link from "next/link";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { fmtDate, fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MatchLike } from "./match-row";

function phaseName(count: number, idx: number, total: number) {
  if (idx === total - 1 && count === 1) return "Final";
  switch (count) { case 1: return "Final"; case 2: return "Semifinales"; case 4: return "Cuartos"; case 8: return "Octavos"; case 16: return "Dieciseisavos"; default: return `Fase ${idx + 1}`; }
}

export function BracketView({ matches, teams }: { matches: (MatchLike & { phaseNumber?: number | null; winnerTeamId?: string | null })[]; teams: Record<string, { name: string; logoUrl?: string | null }> }) {
  const phases = new Map<number, typeof matches>();
  for (const m of matches) {
    const p = m.phaseNumber || 1;
    if (!phases.has(p)) phases.set(p, []);
    phases.get(p)!.push(m);
  }
  const ordered = Array.from(phases.entries()).sort((a, b) => a[0] - b[0]);
  // Agrupar ida/vuelta por pareja
  const pairsOf = (list: typeof matches) => {
    const seen = new Map<string, typeof matches>();
    for (const m of list) {
      const key = [m.teamAId, m.teamBId].sort().join("|");
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push(m);
    }
    return Array.from(seen.values());
  };

  if (ordered.length === 0) return null;

  return (
    <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
      <div className="flex gap-4 min-w-max py-2">
        {ordered.map(([phase, list], idx) => {
          const pairs = pairsOf(list);
          return (
            <div key={phase} className="flex flex-col justify-around gap-3 w-[230px]">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold text-center">{phaseName(pairs.length, idx, ordered.length)}</p>
              {pairs.map((pair, i) => {
                const first = pair[0];
                const a = teams[first.teamAId] || { name: first.teamAId };
                const b = teams[first.teamBId] || { name: first.teamBId };
                const allFinished = pair.every(m => m.status === "FINISHED");
                const aggA = pair.reduce((s, m) => s + (m.teamAId === first.teamAId ? (m.scoreA ?? 0) : (m.scoreB ?? 0)), 0);
                const aggB = pair.reduce((s, m) => s + (m.teamAId === first.teamAId ? (m.scoreB ?? 0) : (m.scoreA ?? 0)), 0);
                const winner = pair.find(m => m.winnerTeamId)?.winnerTeamId || (allFinished ? (aggA > aggB ? first.teamAId : aggB > aggA ? first.teamBId : null) : null);
                return (
                  <Link key={i} href={`/dashboard/matches/detalle?id=${first.id}`} className="rounded-xl border bg-card hover:border-primary/40 transition-colors overflow-hidden">
                    <div className="px-3 pt-2 text-[10px] text-muted-foreground flex justify-between">
                      <span>{first.label || `Partido ${first.matchNumber ?? i + 1}`}</span>
                      <span>{fmtDate(first.scheduledAt)} {fmtTime(first.scheduledAt)}</span>
                    </div>
                    {[{ id: first.teamAId, t: a, g: aggA }, { id: first.teamBId, t: b, g: aggB }].map((row) => (
                      <div key={row.id} className={cn("flex items-center gap-2 px-3 py-1.5", winner === row.id && "bg-emerald-500/10")}>
                        <TeamAvatar name={row.t.name} logoUrl={row.t.logoUrl} size="xs" />
                        <span className={cn("text-xs truncate flex-1", winner === row.id ? "font-semibold" : winner ? "text-muted-foreground" : "font-medium")}>{row.t.name}</span>
                        <span className="text-xs font-bold tabular-nums w-5 text-right">{pair.some(m => m.status !== "SCHEDULED") ? row.g : ""}</span>
                      </div>
                    ))}
                    {pair.length > 1 && <div className="px-3 pb-1.5 text-[10px] text-muted-foreground">Ida y vuelta · global</div>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
