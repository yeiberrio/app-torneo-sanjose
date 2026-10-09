"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ListSkeleton } from "@/components/ui/skeleton";
import { MatchRow } from "@/components/tournament/match-row";
import { MatchEditDialog } from "@/components/tournament/match-edit-dialog";
import { matchStatus } from "@/lib/labels";
import { fmtLong } from "@/lib/format";
import { Plus, Swords, ChevronDown, ChevronRight, Pencil, CalendarDays, Radio } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";

const ALL = "all";
const NONE = "__none__";

export default function MatchesPage() {
  const { user } = useAuthStore();
  const canManage = user ? can(user.role, "update", "Match") : false;
  const [matches, setMatches] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [selectedTournament, setSelectedTournament] = useState<string>(ALL);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState(ALL);
  const [fTeam, setFTeam] = useState(ALL);
  const [fRound, setFRound] = useState(ALL);
  const [fGroup, setFGroup] = useState(ALL);
  const [fVenue, setFVenue] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [quick, setQuick] = useState<"all" | "today" | "week" | "live" | "pending" | "played">("all");
  const [groupBy, setGroupBy] = useState<"day" | "date" | "none">("day");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const lastInit = useRef("");
  const [editMatch, setEditMatch] = useState<any>(null);

  useEffect(() => {
    api.get("/tournaments?limit=100").then((res) => {
      const list = res.data.data || []; setTournaments(list);
      const active = list.find((t: any) => t.status === "IN_PROGRESS");
      if (active) setSelectedTournament(active.id);
    }).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const params = selectedTournament !== ALL ? `?tournamentId=${selectedTournament}&limit=1000` : "?limit=1000";
    api.get(`/matches${params}`).then((res) => setMatches(res.data.data || [])).catch(() => {}).finally(() => setLoading(false));
    if (selectedTournament !== ALL) api.get(`/tournaments/${selectedTournament}`).then(r => setTournament(r.data)).catch(() => setTournament(null));
    else setTournament(null);
  };
  useEffect(() => { load(); }, [selectedTournament]);

  const teams = useMemo(() => { const m = new Map<string, any>(); matches.forEach(x => { if (x.teamA) m.set(x.teamAId, x.teamA); if (x.teamB) m.set(x.teamBId, x.teamB); }); return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name)); }, [matches]);
  const rounds = useMemo(() => { const m = new Map<string, any>(); matches.forEach(x => { if (x.round) m.set(x.round.id, x.round); }); return Array.from(m.values()).sort((a, b) => a.roundNumber - b.roundNumber); }, [matches]);
  const groups = useMemo(() => Array.from(new Set(matches.map(m => m.groupName).filter(Boolean))).sort() as string[], [matches]);
  const venues = useMemo(() => Array.from(new Set(matches.map(m => m.venue).filter(Boolean))).sort() as string[], [matches]);

  const filtered = useMemo(() => {
    const now = new Date(); const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); const endToday = startToday + 86400000; const endWeek = startToday + 7 * 86400000;
    return matches.filter(m => {
      const t = new Date(m.scheduledAt).getTime();
      if (quick === "today" && (t < startToday || t >= endToday)) return false;
      if (quick === "week" && (t < startToday || t >= endWeek)) return false;
      if (quick === "live" && !["IN_PROGRESS", "HALFTIME"].includes(m.status)) return false;
      if (quick === "pending" && !["SCHEDULED", "POSTPONED"].includes(m.status)) return false;
      if (quick === "played" && m.status !== "FINISHED") return false;
      if (fStatus !== ALL && m.status !== fStatus) return false;
      if (fTeam !== ALL && m.teamAId !== fTeam && m.teamBId !== fTeam) return false;
      if (fRound !== ALL && (m.roundId || NONE) !== fRound) return false;
      if (fGroup !== ALL && (m.groupName || NONE) !== fGroup) return false;
      if (fVenue !== ALL && (m.venue || NONE) !== fVenue) return false;
      if (from && t < new Date(from + "T00:00:00").getTime()) return false;
      if (to && t > new Date(to + "T23:59:59").getTime()) return false;
      if (search.trim()) { const q = search.toLowerCase(); if (![m.teamA?.name, m.teamB?.name, m.venue, m.tournament?.name, m.label].some(s => (s || "").toLowerCase().includes(q))) return false; }
      return true;
    });
  }, [matches, quick, fStatus, fTeam, fRound, fGroup, fVenue, from, to, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; sort: number; matches: any[]; sub?: string }>();
    filtered.forEach(m => {
      let key = "all", label = "Partidos", sort = 0, sub: string | undefined;
      if (groupBy === "day") { key = m.dayNumber ? `${m.tournamentId}-${m.dayNumber}` : "none"; label = m.dayNumber ? `Fecha ${m.dayNumber}` : "Sin jornada"; sort = m.dayNumber || 9999; sub = fmtLong(m.scheduledAt); }
      else if (groupBy === "date") { const d = new Date(m.scheduledAt); key = d.toISOString().slice(0, 10); label = fmtLong(m.scheduledAt); sort = d.getTime(); }
      if (!map.has(key)) map.set(key, { label, sort, matches: [], sub });
      map.get(key)!.matches.push(m);
    });
    map.forEach(g => g.matches.sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
    return Array.from(map.entries()).sort((a, b) => a[1].sort - b[1].sort);
  }, [filtered, groupBy]);

  useEffect(() => {
    if (matches.length === 0 || groupBy === "none") return;
    const k = `${selectedTournament}-${matches.length}-${groupBy}`;
    if (lastInit.current === k) return; lastInit.current = k;
    const now = Date.now(); let best: string | null = null, dist = Infinity;
    grouped.forEach(([key, g]) => { const avg = g.matches.reduce((s: number, m: any) => s + new Date(m.scheduledAt).getTime(), 0) / g.matches.length; const d = Math.abs(avg - now); if (d < dist) { dist = d; best = key; } });
    setCollapsed(new Set(grouped.map(([key]) => key).filter(key => key !== best)));
  }, [matches, grouped, groupBy, selectedTournament]);

  const activeFilters = [fStatus, fTeam, fRound, fGroup, fVenue].filter(v => v !== ALL).length + (from ? 1 : 0) + (to ? 1 : 0);
  const clear = () => { setFStatus(ALL); setFTeam(ALL); setFRound(ALL); setFGroup(ALL); setFVenue(ALL); setFrom(""); setTo(""); setSearch(""); setQuick("all"); };
  const liveCount = matches.filter(m => ["IN_PROGRESS", "HALFTIME"].includes(m.status)).length;
  const editTeams = tournament ? (tournament.teams || []).map((tt: any) => ({ id: tt.teamId, name: tt.team.name, groupName: tt.groupName })) : teams.map(t => ({ id: t.id, name: t.name }));

  return (
    <div>
      <PageHeader title="Partidos" subtitle={<span className="inline-flex items-center gap-2">{matches.length} partidos{liveCount > 0 && <StatusBadge label={`${liveCount} en juego`} tone="success" live size="xs" />}</span>} actions={
        <>
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger className="h-9 w-[200px] rounded-xl text-sm"><SelectValue placeholder="Torneo" /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>Todos los torneos</SelectItem>{tournaments.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          {canManage && <Button size="sm" className="rounded-xl" asChild><Link href={`/dashboard/matches/new${selectedTournament !== ALL ? `?tournamentId=${selectedTournament}` : ""}`}><Plus className="h-4 w-4 mr-1.5" />Programar</Link></Button>}
        </>
      } />

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        {([["all", "Todos"], ["today", "Hoy"], ["week", "Esta semana"], ["live", "En juego"], ["pending", "Pendientes"], ["played", "Jugados"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setQuick(k)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${quick === k ? "bg-foreground text-background border-foreground" : "bg-card hover:bg-muted"}`}>{k === "live" && <Radio className="inline h-3 w-3 mr-1" />}{l}</button>
        ))}
      </div>

      <FilterBar search={search} onSearch={setSearch} placeholder="Equipo, sede, torneo o etiqueta..." activeCount={activeFilters} onClear={clear}
        right={<Segmented value={groupBy} onChange={setGroupBy} options={[{ value: "day", label: "Jornada" }, { value: "date", label: "Día" }, { value: "none", label: "Lista" }]} />}>
        <Select value={fStatus} onValueChange={setFStatus}><SelectTrigger className="h-9 w-[140px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todo estado</SelectItem>{Object.entries(matchStatus).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select>
        <Select value={fTeam} onValueChange={setFTeam}><SelectTrigger className="h-9 w-[160px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todo equipo</SelectItem>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
        {rounds.length > 0 && <Select value={fRound} onValueChange={setFRound}><SelectTrigger className="h-9 w-[150px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Toda fase</SelectItem>{rounds.map(r => <SelectItem key={r.id} value={r.id}>{r.name || `Ronda ${r.roundNumber}`}</SelectItem>)}<SelectItem value={NONE}>Sin fase</SelectItem></SelectContent></Select>}
        {groups.length > 0 && <Select value={fGroup} onValueChange={setFGroup}><SelectTrigger className="h-9 w-[120px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todo grupo</SelectItem>{groups.map(g => <SelectItem key={g} value={g}>Grupo {g}</SelectItem>)}</SelectContent></Select>}
        {venues.length > 1 && <Select value={fVenue} onValueChange={setFVenue}><SelectTrigger className="h-9 w-[150px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Toda sede</SelectItem>{venues.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>}
        <div className="flex items-center gap-1 text-xs"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-[130px] text-xs rounded-xl" /><span className="text-muted-foreground">a</span><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-[130px] text-xs rounded-xl" /></div>
        <span className="text-xs text-muted-foreground ml-auto hidden md:inline">{filtered.length} partidos</span>
      </FilterBar>

      {loading ? <ListSkeleton rows={6} /> : filtered.length === 0 ? (
        <EmptyState icon={<Swords className="h-6 w-6" />} title={matches.length === 0 ? "No hay partidos programados" : "Sin resultados"} description={matches.length === 0 ? "Genera el fixture desde un torneo o programa un partido manual." : "Ningún partido coincide con los filtros."} action={matches.length === 0 ? (canManage && <Button size="sm" asChild><Link href="/dashboard/matches/new"><Plus className="h-4 w-4 mr-1.5" />Programar partido</Link></Button>) : <Button size="sm" variant="outline" onClick={clear}>Limpiar filtros</Button>} />
      ) : (
        <div className="space-y-2">
          {groupBy !== "none" && grouped.length > 1 && <div className="flex justify-end gap-1"><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCollapsed(new Set())}>Expandir todo</Button><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCollapsed(new Set(grouped.map(([k]) => k)))}>Colapsar todo</Button></div>}
          {grouped.map(([key, g]) => {
            const c = groupBy !== "none" && collapsed.has(key);
            const live = g.matches.some((m: any) => ["IN_PROGRESS", "HALFTIME"].includes(m.status));
            const done = g.matches.every((m: any) => ["FINISHED", "CANCELLED"].includes(m.status));
            return (
              <div key={key}>
                {groupBy !== "none" && (
                  <button onClick={() => setCollapsed(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; })} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors mb-1.5 text-left">
                    {c ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    <span className="font-semibold text-sm">{g.label}</span>
                    {g.sub && <span className="text-xs text-muted-foreground hidden sm:inline">· {g.sub}</span>}
                    <span className="ml-auto text-xs text-muted-foreground">{g.matches.length}</span>
                    {live && <StatusBadge label="En juego" tone="success" live size="xs" />}{done && !live && <StatusBadge label="Completa" tone="neutral" size="xs" />}
                  </button>
                )}
                {!c && <div className="space-y-1.5 mb-3">{g.matches.map((m: any) => <MatchRow key={m.id} match={m} showTournament={selectedTournament === ALL} actions={canManage && <Button size="icon" variant="ghost" className="h-7 w-7 opacity-70 sm:opacity-0 sm:group-hover:opacity-100" onClick={() => setEditMatch(m)}><Pencil className="h-3.5 w-3.5" /></Button>} />)}</div>}
              </div>
            );
          })}
        </div>
      )}

      <MatchEditDialog match={editMatch} open={!!editMatch} onOpenChange={(o) => !o && setEditMatch(null)} teams={editTeams} rounds={tournament?.rounds || rounds} venues={tournament?.venues || []} onSaved={load} />
    </div>
  );
}
