"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/form-field";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Segmented } from "@/components/ui/segmented";
import { MatchRow, MatchLike } from "./match-row";
import { MatchEditDialog } from "./match-edit-dialog";
import { GenerateFixtureDialog } from "./generate-fixture-dialog";
import { matchStatus } from "@/lib/labels";
import { fmtLong, localToISO } from "@/lib/format";
import api from "@/lib/api";
import { toast } from "sonner";
import { Calendar, ChevronDown, ChevronRight, Pencil, ArrowLeftRight, Plus, Trash2, RotateCcw, ListOrdered, CalendarClock, Swords, Layers, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL = "all";
const NONE = "__none__";

export function FixtureTab({ tournament, canManage, refresh, trashedCount, onTrashChange }: { tournament: any; canManage: boolean; refresh: () => void; trashedCount: number; onTrashChange: () => void }) {
  const matches: any[] = tournament.matches || [];
  const teams = useMemo(() => (tournament.teams || []).map((tt: any) => ({ id: tt.teamId, name: tt.team.name, logoUrl: tt.team.logoUrl, groupName: tt.groupName })), [tournament.teams]);
  const teamMap = useMemo(() => Object.fromEntries(teams.map((t: any) => [t.id, t])), [teams]);
  const rounds: any[] = tournament.rounds || [];

  // Filtros
  const [search, setSearch] = useState("");
  const [fDay, setFDay] = useState(ALL);
  const [fStatus, setFStatus] = useState(ALL);
  const [fGroup, setFGroup] = useState(ALL);
  const [fRound, setFRound] = useState(ALL);
  const [fTeam, setFTeam] = useState(ALL);
  const [fVenue, setFVenue] = useState(ALL);
  const [groupBy, setGroupBy] = useState<"day" | "round" | "group" | "none">("day");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Edicion
  const [editMatch, setEditMatch] = useState<MatchLike | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [genRound, setGenRound] = useState<any>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState({ date: "", time: "", venue: "", dayNumber: "", groupName: "", roundId: "", status: "", shiftDays: "" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => Array.from(new Set(matches.map(m => m.dayNumber).filter(Boolean))).sort((a: any, b: any) => a - b) as number[], [matches]);
  const groups = useMemo(() => Array.from(new Set(matches.map(m => m.groupName).filter(Boolean))).sort() as string[], [matches]);
  const venues = useMemo(() => Array.from(new Set(matches.map(m => m.venue).filter(Boolean))).sort() as string[], [matches]);

  const filtered = useMemo(() => matches.filter(m => {
    if (fDay !== ALL && String(m.dayNumber) !== fDay) return false;
    if (fStatus !== ALL && (fStatus === "pending" ? !["SCHEDULED", "POSTPONED"].includes(m.status) : fStatus === "live" ? !["IN_PROGRESS", "HALFTIME"].includes(m.status) : m.status !== fStatus)) return false;
    if (fGroup !== ALL && (m.groupName || NONE) !== fGroup) return false;
    if (fRound !== ALL && (m.roundId || NONE) !== fRound) return false;
    if (fTeam !== ALL && m.teamAId !== fTeam && m.teamBId !== fTeam) return false;
    if (fVenue !== ALL && (m.venue || NONE) !== fVenue) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const a = teamMap[m.teamAId]?.name || ""; const b = teamMap[m.teamBId]?.name || "";
      if (![a, b, m.venue || "", m.label || ""].some(s => s.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [matches, fDay, fStatus, fGroup, fRound, fTeam, fVenue, search, teamMap]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; sort: number; matches: any[]; sub?: string }>();
    for (const m of filtered) {
      let key = "all", label = "Todos los partidos", sort = 0, sub: string | undefined;
      if (groupBy === "day") { key = m.dayNumber ? String(m.dayNumber) : "none"; label = m.dayNumber ? `Fecha ${m.dayNumber}` : "Sin jornada"; sort = m.dayNumber || 9999; sub = fmtLong(m.scheduledAt); }
      else if (groupBy === "round") { key = m.roundId || "none"; const r = rounds.find(x => x.id === m.roundId); label = r ? (r.name || `Ronda ${r.roundNumber}`) : "Sin ronda"; sort = r?.roundNumber || 9999; }
      else if (groupBy === "group") { key = m.groupName || "none"; label = m.groupName ? `Grupo ${m.groupName}` : "Sin grupo"; sort = m.groupName ? m.groupName.charCodeAt(0) : 9999; }
      if (!map.has(key)) map.set(key, { label, sort, matches: [], sub });
      map.get(key)!.matches.push(m);
    }
    map.forEach((g) => g.matches.sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime() || (a.matchNumber || 0) - (b.matchNumber || 0)));
    return Array.from(map.entries()).sort((a, b) => a[1].sort - b[1].sort);
  }, [filtered, groupBy, rounds]);

  // Expandir solo la jornada mas cercana a hoy
  useEffect(() => {
    if (initialized || matches.length === 0 || groupBy !== "day") return;
    const now = Date.now();
    let best: string | null = null, bestDist = Infinity;
    const byDay = new Map<string, number[]>();
    matches.forEach(m => { const k = m.dayNumber ? String(m.dayNumber) : "none"; (byDay.get(k) || byDay.set(k, []).get(k)!).push(new Date(m.scheduledAt).getTime()); });
    byDay.forEach((ts, k) => { const avg = ts.reduce((a, b) => a + b, 0) / ts.length; const d = Math.abs(avg - now); if (d < bestDist) { bestDist = d; best = k; } });
    const c = new Set<string>(); byDay.forEach((_, k) => { if (k !== best) c.add(k); });
    setCollapsed(c); setInitialized(true);
  }, [matches, initialized, groupBy]);

  const activeFilters = [fDay, fStatus, fGroup, fRound, fTeam, fVenue].filter(v => v !== ALL).length;
  const clearFilters = () => { setFDay(ALL); setFStatus(ALL); setFGroup(ALL); setFRound(ALL); setFTeam(ALL); setFVenue(ALL); setSearch(""); };
  const toggle = (k: string) => setCollapsed(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const swap = async (m: any) => {
    try { await api.post(`/tournaments/${tournament.id}/matches/${m.id}/swap`); toast.success("Localía invertida"); refresh(); }
    catch (err: any) { toast.error(err.response?.data?.message || "No se pudo invertir"); }
  };

  const applyBulk = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const items = ids.map(id => {
        const m = matches.find(x => x.id === id);
        const item: any = { id };
        if (bulk.date) item.scheduledAt = localToISO(bulk.date, bulk.time || new Date(m.scheduledAt).toTimeString().slice(0, 5));
        else if (bulk.time) { const d = new Date(m.scheduledAt); const [h, mi] = bulk.time.split(":").map(Number); d.setHours(h, mi, 0, 0); item.scheduledAt = d.toISOString(); }
        else if (bulk.shiftDays) { const d = new Date(m.scheduledAt); d.setDate(d.getDate() + Number(bulk.shiftDays)); item.scheduledAt = d.toISOString(); }
        if (bulk.venue) item.venue = bulk.venue === NONE ? null : bulk.venue;
        if (bulk.dayNumber) item.dayNumber = Number(bulk.dayNumber);
        if (bulk.groupName) item.groupName = bulk.groupName === NONE ? null : bulk.groupName;
        if (bulk.roundId) item.roundId = bulk.roundId === NONE ? null : bulk.roundId;
        if (bulk.status) item.status = bulk.status;
        return item;
      });
      const res = await api.patch(`/tournaments/${tournament.id}/fixture/bulk`, { matches: items });
      toast.success(res.data.message);
      setBulkOpen(false); setSelected(new Set()); setSelectMode(false);
      setBulk({ date: "", time: "", venue: "", dayNumber: "", groupName: "", roundId: "", status: "", shiftDays: "" });
      refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || "Error al aplicar cambios"); } finally { setBusy(false); }
  };

  const renumber = async () => {
    try { const res = await api.post(`/tournaments/${tournament.id}/fixture/renumber`); toast.success(res.data.message); refresh(); }
    catch (err: any) { toast.error(err.response?.data?.message || "Error"); }
  };
  const deleteFixture = async () => {
    setBusy(true);
    try { const res = await api.delete(`/tournaments/${tournament.id}/fixture`); toast.success(res.data.message); setDeleteOpen(false); refresh(); onTrashChange(); }
    catch (err: any) { toast.error(err.response?.data?.message || "Error"); } finally { setBusy(false); }
  };
  const restoreFixture = async () => {
    setBusy(true);
    try { const res = await api.post(`/tournaments/${tournament.id}/fixture/restore`); toast.success(res.data.message); setRestoreOpen(false); refresh(); onTrashChange(); }
    catch (err: any) { toast.error(err.response?.data?.message || "Error"); } finally { setBusy(false); }
  };

  const selectAllVisible = () => setSelected(new Set(filtered.map(m => m.id)));
  const counts = { total: filtered.length, finished: filtered.filter(m => m.status === "FINISHED").length, live: filtered.filter(m => ["IN_PROGRESS", "HALFTIME"].includes(m.status)).length };

  return (
    <div className="space-y-3">
      {/* Acciones */}
      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
          {teams.length >= 2 && (
            <Select value={genRound?.id || "__t__"} onValueChange={(v) => { setGenRound(v === "__t__" ? null : rounds.find(r => r.id === v)); setGenOpen(true); }}>
              <SelectTrigger className="h-9 w-auto gap-2 rounded-xl bg-primary text-primary-foreground border-0 hover:bg-primary/90 [&>svg]:text-primary-foreground"><Calendar className="h-4 w-4" /><span>Generar fixture</span></SelectTrigger>
              <SelectContent>
                <SelectItem value="__t__">Según tipo del torneo</SelectItem>
                {rounds.map(r => <SelectItem key={r.id} value={r.id}>Ronda {r.roundNumber}: {r.name || r.type}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" variant="outline" className="rounded-xl" asChild><Link href={`/dashboard/matches/new?tournamentId=${tournament.id}`}><Plus className="h-4 w-4 mr-1.5" />Partido manual</Link></Button>
          {matches.length > 0 && (
            <>
              <Button size="sm" variant={selectMode ? "secondary" : "outline"} className="rounded-xl" onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}><CheckSquare className="h-4 w-4 mr-1.5" />{selectMode ? "Salir de selección" : "Editar varios"}</Button>
              <Button size="sm" variant="ghost" className="rounded-xl" onClick={renumber} title="Renumerar jornadas y partidos por fecha"><ListOrdered className="h-4 w-4 mr-1.5" />Renumerar</Button>
              <Button size="sm" variant="ghost" className="rounded-xl text-rose-600 hover:text-rose-700" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4 mr-1.5" />Eliminar no jugados</Button>
            </>
          )}
          {trashedCount > 0 && <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => setRestoreOpen(true)}><RotateCcw className="h-4 w-4 mr-1.5" />Restaurar ({trashedCount})</Button>}
        </div>
      )}

      {/* Barra de seleccion */}
      {selectMode && (
        <div className="sticky top-14 lg:top-0 z-20 rounded-xl border bg-card/95 backdrop-blur px-3 py-2 flex flex-wrap items-center gap-2 shadow-sm">
          <span className="text-sm font-medium">{selected.size} seleccionados</span>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={selectAllVisible}>Seleccionar visibles ({filtered.length})</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setSelected(new Set())}>Ninguno</Button>
          <Button size="sm" className="h-8 ml-auto" disabled={selected.size === 0} onClick={() => setBulkOpen(true)}><CalendarClock className="h-4 w-4 mr-1.5" />Reprogramar / mover</Button>
        </div>
      )}

      {/* Filtros */}
      <FilterBar search={search} onSearch={setSearch} placeholder="Buscar equipo, sede o etiqueta..." activeCount={activeFilters} onClear={clearFilters}
        right={<Segmented value={groupBy} onChange={setGroupBy} options={[{ value: "day", label: "Fecha" }, { value: "round", label: "Ronda" }, { value: "group", label: "Grupo" }, { value: "none", label: "Lista" }]} />}>
        <Select value={fStatus} onValueChange={setFStatus}><SelectTrigger className="h-9 w-[140px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todo estado</SelectItem><SelectItem value="pending">Pendientes</SelectItem><SelectItem value="live">En juego</SelectItem>{Object.entries(matchStatus).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select>
        {days.length > 1 && <Select value={fDay} onValueChange={setFDay}><SelectTrigger className="h-9 w-[120px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Toda fecha</SelectItem>{days.map(d => <SelectItem key={d} value={String(d)}>Fecha {d}</SelectItem>)}</SelectContent></Select>}
        {rounds.length > 0 && <Select value={fRound} onValueChange={setFRound}><SelectTrigger className="h-9 w-[150px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Toda ronda</SelectItem>{rounds.map(r => <SelectItem key={r.id} value={r.id}>{r.name || `Ronda ${r.roundNumber}`}</SelectItem>)}<SelectItem value={NONE}>Sin ronda</SelectItem></SelectContent></Select>}
        {groups.length > 0 && <Select value={fGroup} onValueChange={setFGroup}><SelectTrigger className="h-9 w-[120px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todo grupo</SelectItem>{groups.map(g => <SelectItem key={g} value={g}>Grupo {g}</SelectItem>)}<SelectItem value={NONE}>Sin grupo</SelectItem></SelectContent></Select>}
        <Select value={fTeam} onValueChange={setFTeam}><SelectTrigger className="h-9 w-[160px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todo equipo</SelectItem>{teams.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
        {venues.length > 1 && <Select value={fVenue} onValueChange={setFVenue}><SelectTrigger className="h-9 w-[150px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Toda sede</SelectItem>{venues.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>}
        <span className="text-xs text-muted-foreground ml-auto hidden md:inline">{counts.total} partidos · {counts.finished} jugados{counts.live ? ` · ${counts.live} en juego` : ""}</span>
      </FilterBar>

      {matches.length === 0 ? (
        <EmptyState icon={<Swords className="h-6 w-6" />} title="Todavía no hay partidos" description={canManage ? "Genera el fixture automáticamente según el tipo de torneo o la ronda, o programa partidos manualmente." : "El organizador aún no ha publicado el calendario."} action={canManage && teams.length >= 2 && <Button size="sm" onClick={() => { setGenRound(null); setGenOpen(true); }}><Calendar className="h-4 w-4 mr-1.5" />Generar fixture</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState compact title="Sin resultados" description="Ningún partido coincide con los filtros." action={<Button size="sm" variant="outline" onClick={clearFilters}>Limpiar filtros</Button>} />
      ) : (
        <div className="space-y-2">
          {groupBy !== "none" && grouped.length > 1 && (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCollapsed(new Set())}>Expandir todo</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCollapsed(new Set(grouped.map(([k]) => k)))}>Colapsar todo</Button>
            </div>
          )}
          {grouped.map(([key, g]) => {
            const isCollapsed = groupBy !== "none" && collapsed.has(key);
            const done = g.matches.every(m => ["FINISHED", "CANCELLED"].includes(m.status));
            const live = g.matches.some(m => ["IN_PROGRESS", "HALFTIME"].includes(m.status));
            return (
              <div key={key}>
                {groupBy !== "none" && (
                  <button onClick={() => toggle(key)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors mb-1.5 text-left">
                    {isCollapsed ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="font-semibold text-sm">{g.label}</span>
                    {g.sub && <span className="text-xs text-muted-foreground hidden sm:inline">· {g.sub}</span>}
                    <span className="ml-auto text-xs text-muted-foreground">{g.matches.length}</span>
                    {live && <StatusBadge label="En juego" tone="success" live size="xs" />}
                    {done && !live && <StatusBadge label="Completa" tone="neutral" size="xs" />}
                  </button>
                )}
                {!isCollapsed && (
                  <div className="space-y-1.5 mb-3">
                    {g.matches.map(m => (
                      <MatchRow key={m.id} match={m} teamA={teamMap[m.teamAId]} teamB={teamMap[m.teamBId]} selected={selected.has(m.id)} onSelect={selectMode ? (v) => setSelected(prev => { const n = new Set(prev); v ? n.add(m.id) : n.delete(m.id); return n; }) : undefined}
                        actions={canManage && !selectMode && (
                          <div className="flex opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Editar" onClick={() => setEditMatch(m)}><Pencil className="h-3.5 w-3.5" /></Button>
                            {m.status !== "FINISHED" && <Button size="icon" variant="ghost" className="h-7 w-7 hidden sm:inline-flex" title="Invertir localía" onClick={() => swap(m)}><ArrowLeftRight className="h-3.5 w-3.5" /></Button>}
                          </div>
                        )} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <MatchEditDialog match={editMatch} open={!!editMatch} onOpenChange={(o) => !o && setEditMatch(null)} teams={teams} rounds={rounds} venues={tournament.venues || []} onSaved={refresh} />
      <GenerateFixtureDialog open={genOpen} onOpenChange={(o) => { setGenOpen(o); if (!o) setGenRound(null); }} tournament={tournament} round={genRound} teams={teams} onGenerated={() => { setInitialized(false); refresh(); onTrashChange(); }} />

      {/* Bulk dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Modificar {selected.size} partidos</DialogTitle><DialogDescription>Solo se aplican los campos que diligencies; el resto se conserva.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nueva fecha"><Input type="date" value={bulk.date} onChange={(e) => setBulk({ ...bulk, date: e.target.value })} /></Field>
              <Field label="Nueva hora"><Input type="time" value={bulk.time} onChange={(e) => setBulk({ ...bulk, time: e.target.value })} /></Field>
            </div>
            <Field label="O desplazar días" hint="Ej: 7 mueve una semana adelante, -1 un día atrás"><Input type="number" value={bulk.shiftDays} onChange={(e) => setBulk({ ...bulk, shiftDays: e.target.value })} disabled={!!bulk.date} /></Field>
            <Field label="Sede">
              <Select value={bulk.venue || "__keep__"} onValueChange={(v) => setBulk({ ...bulk, venue: v === "__keep__" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="__keep__">Sin cambio</SelectItem>{[...(tournament.venues || []), ...venues].filter((v, i, a) => a.indexOf(v) === i).map((v: string) => <SelectItem key={v} value={v}>{v}</SelectItem>)}<SelectItem value={NONE}>Quitar sede</SelectItem></SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Jornada"><Input type="number" min={1} value={bulk.dayNumber} onChange={(e) => setBulk({ ...bulk, dayNumber: e.target.value })} placeholder="Sin cambio" /></Field>
              <Field label="Grupo">
                <Select value={bulk.groupName || "__keep__"} onValueChange={(v) => setBulk({ ...bulk, groupName: v === "__keep__" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="__keep__">Sin cambio</SelectItem>{"ABCDEFGH".split("").map(l => <SelectItem key={l} value={l}>Grupo {l}</SelectItem>)}<SelectItem value={NONE}>Quitar grupo</SelectItem></SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ronda">
                <Select value={bulk.roundId || "__keep__"} onValueChange={(v) => setBulk({ ...bulk, roundId: v === "__keep__" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="__keep__">Sin cambio</SelectItem>{rounds.map(r => <SelectItem key={r.id} value={r.id}>{r.name || `Ronda ${r.roundNumber}`}</SelectItem>)}<SelectItem value={NONE}>Quitar ronda</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label="Estado">
                <Select value={bulk.status || "__keep__"} onValueChange={(v) => setBulk({ ...bulk, status: v === "__keep__" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="__keep__">Sin cambio</SelectItem><SelectItem value="SCHEDULED">Programado</SelectItem><SelectItem value="POSTPONED">Aplazado</SelectItem><SelectItem value="SUSPENDED">Suspendido</SelectItem><SelectItem value="CANCELLED">Cancelado</SelectItem></SelectContent>
                </Select>
              </Field>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBulkOpen(false)} disabled={busy}>Cancelar</Button><Button onClick={applyBulk} disabled={busy}>Aplicar a {selected.size}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Eliminar partidos no jugados" description="Los partidos programados, aplazados o cancelados se moverán a la papelera. Los jugados no se tocan." destructive confirmLabel="Sí, eliminar" loading={busy} onConfirm={deleteFixture} />
      <ConfirmDialog open={restoreOpen} onOpenChange={setRestoreOpen} title="Restaurar partidos" description={`Se restaurarán ${trashedCount} partidos de la papelera.`} confirmLabel="Restaurar" loading={busy} onConfirm={restoreFixture} />
    </div>
  );
}
