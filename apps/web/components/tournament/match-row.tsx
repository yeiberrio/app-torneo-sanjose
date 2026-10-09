"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { matchStatus } from "@/lib/labels";
import { fmtDate, fmtTime } from "@/lib/format";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MatchLike {
  id: string; teamAId: string; teamBId: string; scheduledAt: string; venue?: string | null; status: string; scoreA?: number | null; scoreB?: number | null;
  dayNumber?: number | null; matchNumber?: number | null; groupName?: string | null; label?: string | null; legNumber?: number; roundId?: string | null;
  teamA?: { name: string; logoUrl?: string | null }; teamB?: { name: string; logoUrl?: string | null }; tournament?: { id: string; name: string }; round?: { name?: string | null; type?: string } | null;
}

export function MatchRow({ match, teamA, teamB, actions, selected, onSelect, showDate = true, showTournament, className, dense }: {
  match: MatchLike; teamA?: { name: string; logoUrl?: string | null }; teamB?: { name: string; logoUrl?: string | null }; actions?: ReactNode; selected?: boolean; onSelect?: (v: boolean) => void; showDate?: boolean; showTournament?: boolean; className?: string; dense?: boolean;
}) {
  const a = teamA || match.teamA || { name: match.teamAId };
  const b = teamB || match.teamB || { name: match.teamBId };
  const st = matchStatus[match.status] || { label: match.status, tone: "neutral" as const };
  const played = match.status !== "SCHEDULED" && match.status !== "POSTPONED" && match.status !== "CANCELLED";
  const winnerA = played && (match.scoreA ?? 0) > (match.scoreB ?? 0);
  const winnerB = played && (match.scoreB ?? 0) > (match.scoreA ?? 0);
  const meta = [match.label, match.groupName ? `Grupo ${match.groupName}` : null, match.legNumber && match.legNumber > 1 ? "Vuelta" : null].filter(Boolean).join(" · ");

  return (
    <div className={cn("group relative rounded-xl border bg-card transition-all hover:shadow-sm hover:border-primary/30", selected && "border-primary/50 bg-primary/5", dense ? "px-3 py-2" : "px-3 py-2.5 sm:px-4", className)}>
      <div className="flex items-center gap-2 sm:gap-3">
        {onSelect && (
          <input type="checkbox" checked={!!selected} onChange={(e) => onSelect(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))] shrink-0" onClick={(e) => e.stopPropagation()} />
        )}
        {showDate && (
          <div className="hidden sm:flex flex-col items-center w-14 shrink-0 text-center leading-tight">
            <span className="text-[11px] text-muted-foreground">{fmtDate(match.scheduledAt)}</span>
            <span className="text-xs font-semibold">{fmtTime(match.scheduledAt)}</span>
          </div>
        )}
        <Link href={`/dashboard/matches/detalle?id=${match.id}`} className="flex-1 min-w-0 flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
            <span className={cn("text-sm truncate text-right", winnerA ? "font-semibold" : "font-medium", winnerB && "text-muted-foreground")}>{a.name}</span>
            <TeamAvatar name={a.name} logoUrl={a.logoUrl} size="sm" />
          </div>
          <div className="shrink-0 w-[62px] text-center">
            {played ? (
              <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-muted px-2 py-1 text-sm font-bold tabular-nums">
                <span className={cn(winnerA && "text-emerald-600")}>{match.scoreA ?? 0}</span><span className="text-muted-foreground font-normal">-</span><span className={cn(winnerB && "text-emerald-600")}>{match.scoreB ?? 0}</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground font-medium">
                <span className="sm:hidden">{fmtTime(match.scheduledAt)}</span><span className="hidden sm:inline">vs</span>
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <TeamAvatar name={b.name} logoUrl={b.logoUrl} size="sm" />
            <span className={cn("text-sm truncate", winnerB ? "font-semibold" : "font-medium", winnerA && "text-muted-foreground")}>{b.name}</span>
          </div>
        </Link>
        <div className="shrink-0 flex items-center gap-1.5">
          <StatusBadge label={st.label} tone={st.tone} live={st.live} size="xs" className="hidden sm:inline-flex" />
          {actions}
        </div>
      </div>
      {(meta || match.venue || showTournament) && (
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground pl-0 sm:pl-[68px] flex-wrap">
          <span className="sm:hidden">{fmtDate(match.scheduledAt, { weekday: "short", day: "2-digit", month: "short" })}</span>
          {meta && <span className="font-medium text-foreground/70">{meta}</span>}
          {match.venue && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{match.venue}</span>}
          {showTournament && match.tournament && <span className="truncate">{match.tournament.name}</span>}
          <StatusBadge label={st.label} tone={st.tone} live={st.live} size="xs" className="sm:hidden ml-auto" />
        </div>
      )}
    </div>
  );
}
