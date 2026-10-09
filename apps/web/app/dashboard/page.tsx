"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StandingsTable } from "@/components/tournament/standings-table";
import { MatchRow } from "@/components/tournament/match-row";
import { ImportDialog } from "@/components/import-dialog";
import { tournamentStatus } from "@/lib/labels";
import { Trophy, Users, Swords, Shield, Target, Plus, Upload, CalendarDays, ArrowRight, Goal } from "lucide-react";
import api from "@/lib/api";
import { can } from "@/lib/permissions";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const canManage = user ? can(user.role, "update", "Tournament") : false;
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [standings, setStandings] = useState<any>(null);
  const [scorers, setScorers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [stats, setStats] = useState({ tournaments: 0, teams: 0, matches: 0, players: 0 });
  const [importOpen, setImportOpen] = useState<"teams" | "players" | null>(null);

  useEffect(() => {
    api.get("/tournaments?limit=100").then((res) => { const list = res.data.data || []; setTournaments(list); const active = list.find((t: any) => t.status === "IN_PROGRESS") || list[0]; if (active) setSelected(active.id); }).catch(() => {});
    Promise.all([
      api.get("/tournaments?limit=1").then((r) => r.data.total || 0).catch(() => 0),
      api.get("/teams?limit=1").then((r) => r.data.total || 0).catch(() => 0),
      api.get("/matches?limit=1").then((r) => r.data.total || 0).catch(() => 0),
      api.get("/players?limit=1").then((r) => r.data.total || 0).catch(() => 0),
    ]).then(([t, te, m, p]) => setStats({ tournaments: t, teams: te, matches: m, players: p }));
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/tournaments/${selected}/standings/grouped`).then(r => setStandings(r.data)).catch(() => setStandings(null));
    api.get(`/statistics/${selected}/top-scorers?limit=5`).then(r => setScorers(r.data)).catch(() => setScorers([]));
    api.get(`/statistics/${selected}/summary`).then(r => setSummary(r.data)).catch(() => setSummary(null));
    api.get(`/matches?tournamentId=${selected}&limit=1000`).then(r => setMatches(r.data.data || [])).catch(() => setMatches([]));
  }, [selected]);

  const tournament = tournaments.find(t => t.id === selected);
  const now = Date.now();
  const live = useMemo(() => matches.filter(m => ["IN_PROGRESS", "HALFTIME"].includes(m.status)), [matches]);
  const upcoming = useMemo(() => matches.filter(m => m.status === "SCHEDULED" && new Date(m.scheduledAt).getTime() > now - 2 * 3600000).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).slice(0, 5), [matches, now]);
  const recent = useMemo(() => matches.filter(m => m.status === "FINISHED").sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()).slice(0, 4), [matches]);
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"; })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{user?.firstName} 👋</h1>
        </div>
        {canManage && (
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setImportOpen("teams")}><Upload className="h-4 w-4 mr-1.5" />Importar equipos</Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setImportOpen("players")}><Upload className="h-4 w-4 mr-1.5" />Importar jugadores</Button>
            <Button size="sm" className="rounded-xl" asChild><Link href="/dashboard/tournaments/new"><Plus className="h-4 w-4 mr-1.5" />Torneo</Link></Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/dashboard/tournaments"><StatCard label="Torneos" value={stats.tournaments} icon={<Trophy className="h-5 w-5" />} tone="green" className="h-full hover:shadow-md" /></Link>
        <Link href="/dashboard/teams"><StatCard label="Equipos" value={stats.teams} icon={<Shield className="h-5 w-5" />} tone="blue" className="h-full hover:shadow-md" /></Link>
        <Link href="/dashboard/matches"><StatCard label="Partidos" value={stats.matches} icon={<Swords className="h-5 w-5" />} tone="orange" className="h-full hover:shadow-md" /></Link>
        <Link href="/dashboard/players"><StatCard label="Jugadores" value={stats.players} icon={<Users className="h-5 w-5" />} tone="purple" className="h-full hover:shadow-md" /></Link>
      </div>

      {tournaments.length > 0 && (
        <div className="rounded-2xl border bg-card p-4 flex flex-wrap items-center gap-3">
          <Trophy className="h-5 w-5 text-amber-500" />
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="h-9 w-[260px] rounded-xl"><SelectValue placeholder="Seleccionar torneo" /></SelectTrigger>
            <SelectContent>{tournaments.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          {tournament && <StatusBadge label={tournamentStatus[tournament.status]?.label || tournament.status} tone={tournamentStatus[tournament.status]?.tone || "neutral"} />}
          {live.length > 0 && <StatusBadge label={`${live.length} en juego`} tone="success" live />}
          {summary && <div className="ml-auto flex gap-4 text-xs text-muted-foreground"><span><strong className="text-foreground">{summary.finishedMatches}</strong>/{summary.totalMatches} jugados</span><span><strong className="text-foreground">{summary.totalGoals}</strong> goles</span><span><strong className="text-foreground">{summary.avgGoalsPerMatch}</strong> por partido</span></div>}
          {tournament && <Button size="sm" variant="ghost" className="rounded-xl" asChild><Link href={`/dashboard/tournaments/detalle?id=${tournament.id}`}>Abrir<ArrowRight className="h-4 w-4 ml-1" /></Link></Button>}
        </div>
      )}

      {live.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>En juego ahora</p>
          {live.map(m => <MatchRow key={m.id} match={m} />)}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {!selected ? <EmptyState compact title="Selecciona un torneo" /> : !standings ? <EmptyState compact title="Sin posiciones" description="Los partidos deben estar finalizados." /> : (
            <div className={standings.hasGroups && Object.keys(standings.groups).length > 1 ? "grid gap-4 md:grid-cols-2" : ""}>
              {Object.entries(standings.groups).sort(([a], [b]) => a.localeCompare(b)).map(([g, rows]: any) => (
                <StandingsTable key={g} title={standings.hasGroups ? `Grupo ${g}` : "Tabla de posiciones"} rows={rows} compact maxRows={standings.hasGroups ? 5 : 8} linkTo="/dashboard/statistics" />
              ))}
            </div>
          )}
          {recent.length > 0 && (
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="px-4 py-2.5 border-b bg-muted/40 text-sm font-semibold">Últimos resultados</div>
              <div className="p-2 space-y-1.5">{recent.map(m => <MatchRow key={m.id} match={m} dense />)}</div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between"><p className="text-sm font-semibold inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-sky-500" />Próximos partidos</p><Link href="/dashboard/matches" className="text-xs text-primary hover:underline">Ver todos</Link></div>
            <div className="p-2 space-y-1.5">{upcoming.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">Nada programado.</p> : upcoming.map(m => <MatchRow key={m.id} match={m} dense />)}</div>
          </div>
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between"><p className="text-sm font-semibold inline-flex items-center gap-2"><Target className="h-4 w-4 text-amber-500" />Goleadores</p><Link href="/dashboard/statistics" className="text-xs text-primary hover:underline">Ver todos</Link></div>
            <div className="divide-y">
              {scorers.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">Sin goles registrados.</p> : scorers.map((s: any, i: number) => (
                <Link key={s.playerId} href={`/dashboard/players/detalle?id=${s.playerId}`} className="flex items-center gap-3 px-4 py-2 hover:bg-muted/40">
                  <span className={`text-sm font-bold w-5 text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{s.firstName} {s.lastName}</p><p className="text-[11px] text-muted-foreground truncate">{s.teamName}{s.jerseyNumber ? ` · #${s.jerseyNumber}` : ""}</p></div>
                  <span className="inline-flex items-center gap-1 text-sm font-bold"><Goal className="h-3.5 w-3.5 text-muted-foreground" />{s.goals}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ImportDialog entity={importOpen || "teams"} open={!!importOpen} onOpenChange={(o) => !o && setImportOpen(null)} />
    </div>
  );
}
