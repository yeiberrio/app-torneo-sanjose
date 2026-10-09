"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { StandingsTable } from "./standings-table";
import { BracketView } from "./bracket-view";
import { GenerateFixtureDialog } from "./generate-fixture-dialog";
import { roundType as roundTypeLabels } from "@/lib/labels";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Calendar, ChevronRight, Trophy, Layers, ArrowRight, Check, Loader2, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

const emptyForm = { roundNumber: "", name: "", type: "ROUND_ROBIN", teamsAdvancing: "", legs: "1", startDate: "", groupsCount: "", description: "", advanceAll: false };

export function RoundsTab({ tournament, canManage, refresh }: { tournament: any; canManage: boolean; refresh: () => void }) {
  const rounds: any[] = (tournament.rounds || []).slice().sort((a: any, b: any) => a.roundNumber - b.roundNumber);
  const teams = useMemo(() => (tournament.teams || []).map((tt: any) => ({ id: tt.teamId, name: tt.team.name, logoUrl: tt.team.logoUrl, groupName: tt.groupName })), [tournament.teams]);
  const teamMap = useMemo(() => Object.fromEntries(teams.map((t: any) => [t.id, t])), [teams]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [standings, setStandings] = useState<any>(null);
  const [qualified, setQualified] = useState<any>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [genTeamIds, setGenTeamIds] = useState<string[] | undefined>(undefined);
  const [genRound, setGenRound] = useState<any>(null);
  const [nextOpen, setNextOpen] = useState(false);
  const [nextCfg, setNextCfg] = useState({ startDate: "", matchTime: "15:00", slotMinutes: "0", defaultVenue: "" });
  const [needsWinners, setNeedsWinners] = useState<string[]>([]);
  const [winners, setWinners] = useState<Record<string, string>>({});
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ name: "", type: "KNOCKOUT", legs: "1", teamsAdvancing: "" });

  const selected = rounds.find(r => r.id === selectedId) || rounds[0] || null;
  const roundMatches: any[] = useMemo(() => (tournament.matches || []).filter((m: any) => m.roundId === selected?.id), [tournament.matches, selected?.id]);

  useEffect(() => { if (!selectedId && rounds[0]) setSelectedId(rounds[0].id); }, [rounds, selectedId]);

  useEffect(() => {
    if (!selected) { setStandings(null); setQualified(null); return; }
    api.get(`/tournaments/${tournament.id}/rounds/${selected.id}/standings`).then(r => setStandings(r.data)).catch(() => setStandings(null));
    api.get(`/tournaments/${tournament.id}/rounds/${selected.id}/qualified`).then(r => setQualified(r.data)).catch(() => setQualified(null));
  }, [selected?.id, tournament.id, tournament.matches]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, roundNumber: String((rounds[rounds.length - 1]?.roundNumber || 0) + 1), startDate: (tournament.startDate || "").slice(0, 10) }); setFormOpen(true); };
  const openEdit = (r: any) => { setEditing(r); setForm({ roundNumber: String(r.roundNumber), name: r.name || "", type: r.type, teamsAdvancing: r.teamsAdvancing ? String(r.teamsAdvancing) : "", legs: String(r.legs || 1), startDate: r.startDate ? r.startDate.slice(0, 10) : "", groupsCount: r.groupsCount ? String(r.groupsCount) : "", description: r.description || "", advanceAll: !!r.advanceAll }); setFormOpen(true); };

  const saveRound = async () => {
    setBusy(true);
    try {
      const payload: any = { roundNumber: Number(form.roundNumber), name: form.name || undefined, type: form.type, legs: Number(form.legs) || 1, teamsAdvancing: form.teamsAdvancing ? Number(form.teamsAdvancing) : undefined, startDate: form.startDate || undefined, groupsCount: form.groupsCount ? Number(form.groupsCount) : undefined, description: form.description || undefined, advanceAll: form.advanceAll };
      if (editing) await api.patch(`/tournaments/rounds/${editing.id}`, payload);
      else { const res = await api.post(`/tournaments/${tournament.id}/rounds`, payload); setSelectedId(res.data.id); }
      toast.success(editing ? "Ronda actualizada" : "Ronda creada");
      setFormOpen(false); refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || "Error al guardar"); } finally { setBusy(false); }
  };

  const deleteRound = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try { await api.delete(`/tournaments/rounds/${deleteTarget.id}`); toast.success("Ronda eliminada"); setDeleteTarget(null); setSelectedId(null); refresh(); }
    catch (err: any) { toast.error(err.response?.data?.message || "Error al eliminar"); } finally { setBusy(false); }
  };

  const toggleFlag = async (r: any, key: "isActive" | "isCompleted") => {
    try { await api.patch(`/tournaments/rounds/${r.id}`, { [key]: !r[key] }); refresh(); } catch { toast.error("No se pudo actualizar"); }
  };

  const nextPhase = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await api.post(`/tournaments/${tournament.id}/rounds/${selected.id}/next-phase`, { startDate: nextCfg.startDate || undefined, matchTime: nextCfg.matchTime, slotMinutes: Number(nextCfg.slotMinutes) || 0, defaultVenue: nextCfg.defaultVenue || undefined, winners: Object.keys(winners).length ? winners : undefined });
      if (res.data.needsWinners) { setNeedsWinners(res.data.needsWinners); toast.warning(res.data.message); return; }
      toast.success(res.data.message); setNextOpen(false); setNeedsWinners([]); setWinners({}); refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || "Error al generar la fase"); } finally { setBusy(false); }
  };

  /** Crea la siguiente ronda con los clasificados y abre el generador con esos equipos. */
  const createAdvanceRound = async () => {
    if (!qualified?.qualified?.length) return;
    setBusy(true);
    try {
      const res = await api.post(`/tournaments/${tournament.id}/rounds`, { roundNumber: (rounds[rounds.length - 1]?.roundNumber || 0) + 1, name: advanceForm.name || undefined, type: advanceForm.type, legs: Number(advanceForm.legs) || 1, teamsAdvancing: advanceForm.teamsAdvancing ? Number(advanceForm.teamsAdvancing) : undefined });
      toast.success("Ronda creada con los clasificados");
      setAdvanceOpen(false);
      setGenRound({ ...res.data, _count: { matches: 0 } });
      setGenTeamIds(qualified.qualified.map((q: any) => q.teamId || q.id));
      setGenOpen(true);
      setSelectedId(res.data.id);
      refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || "Error al crear la ronda"); } finally { setBusy(false); }
  };

  const finished = roundMatches.filter(m => m.status === "FINISHED").length;
  const progress = roundMatches.length ? Math.round((finished / roundMatches.length) * 100) : 0;
  const isKnockout = selected?.type === "KNOCKOUT";
  const lastPhaseMatches = useMemo(() => { const p = Math.max(0, ...roundMatches.map(m => m.phaseNumber || 1)); return roundMatches.filter(m => (m.phaseNumber || 1) === p); }, [roundMatches]);
  const champion = isKnockout && lastPhaseMatches.length === 1 && lastPhaseMatches[0].status === "FINISHED" ? (lastPhaseMatches[0].winnerTeamId || ((lastPhaseMatches[0].scoreA ?? 0) > (lastPhaseMatches[0].scoreB ?? 0) ? lastPhaseMatches[0].teamAId : (lastPhaseMatches[0].scoreB ?? 0) > (lastPhaseMatches[0].scoreA ?? 0) ? lastPhaseMatches[0].teamBId : null)) : null;

  return (
    <div className="space-y-4">
      {rounds.length === 0 ? (
        <EmptyState icon={<Layers className="h-6 w-6" />} title="Sin fases configuradas" description="Divide el torneo en fases: por ejemplo Fase de grupos → Cuartos → Semifinal → Final. Cada fase tiene su propio fixture, tabla y criterios." action={canManage && <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" />Crear primera fase</Button>} />
      ) : (
        <>
          {/* Stepper */}
          <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar pb-1">
            {rounds.map((r, i) => {
              const total = r._count?.matches ?? 0; const done = r.finishedMatches ?? 0;
              const active = selected?.id === r.id;
              return (
                <button key={r.id} onClick={() => setSelectedId(r.id)} className={cn("relative shrink-0 min-w-[170px] rounded-2xl border p-3 text-left transition-all", active ? "border-primary bg-primary/5 shadow-sm" : "bg-card hover:border-primary/40")}>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-6 w-6 rounded-lg text-xs font-bold flex items-center justify-center", r.isCompleted ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{r.isCompleted ? <Check className="h-3.5 w-3.5" /> : r.roundNumber}</span>
                    <p className="text-sm font-semibold truncate">{r.name || `Ronda ${r.roundNumber}`}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{roundTypeLabels[r.type] || r.type}{r.legs > 1 ? " · ida/vuelta" : ""}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
                  <p className="text-[10px] text-muted-foreground mt-1">{done}/{total} partidos{r.isActive ? " · activa" : ""}</p>
                  {i < rounds.length - 1 && <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 hidden sm:block" />}
                </button>
              );
            })}
            {canManage && <button onClick={openCreate} className="shrink-0 min-w-[120px] rounded-2xl border border-dashed p-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 flex flex-col items-center justify-center gap-1"><Plus className="h-4 w-4" />Nueva fase</button>}
          </div>

          {selected && (
            <div className="rounded-2xl border bg-card">
              <div className="p-4 border-b flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold flex items-center gap-2">{selected.name || `Ronda ${selected.roundNumber}`}<StatusBadge label={roundTypeLabels[selected.type] || selected.type} tone="info" size="xs" />{selected.isCompleted && <StatusBadge label="Completada" tone="success" size="xs" />}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{selected.description || `${roundMatches.length} partidos · ${progress}% jugado`}{selected.teamsAdvancing ? ` · avanzan ${selected.teamsAdvancing}${standings?.hasGroups ? " por grupo" : ""}` : ""}</p>
                </div>
                {canManage && (
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => { setGenRound(selected); setGenTeamIds(undefined); setGenOpen(true); }}><Calendar className="h-4 w-4 mr-1.5" />{roundMatches.length ? "Regenerar fixture" : "Generar fixture"}</Button>
                    {isKnockout && roundMatches.length > 0 && !champion && <Button size="sm" onClick={() => { setNextOpen(true); setNeedsWinners([]); setWinners({}); }}><GitBranch className="h-4 w-4 mr-1.5" />Siguiente fase</Button>}
                    {!isKnockout && qualified?.qualified?.length > 0 && <Button size="sm" onClick={() => { setAdvanceForm({ name: "", type: "KNOCKOUT", legs: "1", teamsAdvancing: "" }); setAdvanceOpen(true); }}><ArrowRight className="h-4 w-4 mr-1.5" />Avanzar clasificados</Button>}
                    <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => openEdit(selected)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-rose-600" onClick={() => setDeleteTarget(selected)} title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-4">
                {canManage && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2"><Switch checked={!!selected.isActive} onCheckedChange={() => toggleFlag(selected, "isActive")} /><span>Fase activa</span></label>
                    <label className="flex items-center gap-2"><Switch checked={!!selected.isCompleted} onCheckedChange={() => toggleFlag(selected, "isCompleted")} /><span>Marcar como completada</span></label>
                  </div>
                )}

                {champion && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-amber-500" />
                    <div><p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300 font-semibold">Campeón</p><p className="font-bold text-lg flex items-center gap-2"><TeamAvatar name={teamMap[champion]?.name || ""} logoUrl={teamMap[champion]?.logoUrl} size="sm" />{teamMap[champion]?.name}</p></div>
                  </div>
                )}

                {isKnockout ? (
                  roundMatches.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Genera la primera fase de la eliminatoria seleccionando los equipos y el tipo de sembrado.</p> : <BracketView matches={roundMatches} teams={teamMap} />
                ) : (
                  standings && (
                    <div className={cn("grid gap-4", standings.hasGroups && Object.keys(standings.groups).length > 1 ? "lg:grid-cols-2" : "")}>
                      {Object.entries(standings.groups).sort(([a], [b]) => a.localeCompare(b)).map(([g, rows]: any) => (
                        <StandingsTable key={g} title={standings.hasGroups ? `Grupo ${g}` : "Tabla de posiciones"} rows={rows} compact qualify={selected.teamsAdvancing || 0} />
                      ))}
                    </div>
                  )
                )}

                {!isKnockout && qualified && (
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold">Clasificados {qualified.complete ? "" : "(proyección)"}</p>
                      <span className="text-xs text-muted-foreground">{qualified.pending > 0 ? `${qualified.pending} partidos pendientes` : "fase completa"}</span>
                    </div>
                    {qualified.qualified.length === 0 ? <p className="text-xs text-muted-foreground">Define "equipos que avanzan" en la configuración de la fase.</p> : (
                      <div className="flex flex-wrap gap-1.5">
                        {qualified.qualified.map((q: any) => (
                          <span key={q.teamId} className="inline-flex items-center gap-1.5 rounded-full bg-card border px-2 py-1 text-xs"><span className="text-[10px] font-bold text-muted-foreground">{q.seed}</span><TeamAvatar name={q.teamName} logoUrl={q.logoUrl} size="xs" />{q.teamName}{q.groupName ? <span className="text-muted-foreground">({q.groupName}{q.position})</span> : null}</span>
                        ))}
                      </div>
                    )}
                    {qualified.bestThirds?.length > 0 && <p className="text-[11px] text-muted-foreground mt-2">Mejores siguientes: {qualified.bestThirds.map((t: any) => `${t.teamName} (${t.points} pts)`).join(", ")}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Crear / editar ronda */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar fase" : "Nueva fase"}</DialogTitle><DialogDescription>Cada fase puede tener un formato distinto: grupos, liga o eliminación directa.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <Field label="Orden" required><Input type="number" min={1} value={form.roundNumber} onChange={(e) => setForm({ ...form, roundNumber: e.target.value })} /></Field>
              <Field label="Nombre"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Fase de grupos, Cuartos de final..." /></Field>
            </div>
            <Field label="Formato" required>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(roundTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Partidos por cruce">
                <Select value={form.legs} onValueChange={(v) => setForm({ ...form, legs: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">Solo ida</SelectItem><SelectItem value="2">Ida y vuelta</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label={form.type === "GROUP_STAGE" ? "Avanzan por grupo" : "Equipos que avanzan"}><Input type="number" min={1} value={form.teamsAdvancing} onChange={(e) => setForm({ ...form, teamsAdvancing: e.target.value })} placeholder="Ej: 2" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de inicio"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
              {form.type === "GROUP_STAGE" && <Field label="N° de grupos"><Input type="number" min={1} value={form.groupsCount} onChange={(e) => setForm({ ...form, groupsCount: e.target.value })} /></Field>}
            </div>
            <Field label="Descripción"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Notas de la fase" /></Field>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button onClick={saveRound} disabled={!form.roundNumber || busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? "Guardar" : "Crear fase"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Siguiente fase (eliminatoria) */}
      <Dialog open={nextOpen} onOpenChange={setNextOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Generar siguiente fase</DialogTitle><DialogDescription>Los ganadores de la fase actual se emparejan en orden de llave (1 vs 2, 3 vs 4...).</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha" hint="Vacío = una semana después"><Input type="date" value={nextCfg.startDate} onChange={(e) => setNextCfg({ ...nextCfg, startDate: e.target.value })} /></Field>
              <Field label="Hora"><Input type="time" value={nextCfg.matchTime} onChange={(e) => setNextCfg({ ...nextCfg, matchTime: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min. entre partidos"><Input type="number" min={0} step={15} value={nextCfg.slotMinutes} onChange={(e) => setNextCfg({ ...nextCfg, slotMinutes: e.target.value })} /></Field>
              <Field label="Sede"><Input value={nextCfg.defaultVenue} onChange={(e) => setNextCfg({ ...nextCfg, defaultVenue: e.target.value })} placeholder={tournament.venues?.[0] || "Opcional"} /></Field>
            </div>
            {needsWinners.length > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Empates sin resolver: indica el ganador (por penales).</p>
                {needsWinners.map(id => { const m = roundMatches.find(x => x.id === id); if (!m) return null; return (
                  <div key={id} className="flex items-center gap-2 text-xs">
                    <span className="flex-1 truncate">{teamMap[m.teamAId]?.name} {m.scoreA}-{m.scoreB} {teamMap[m.teamBId]?.name}</span>
                    <Select value={winners[id] || ""} onValueChange={(v) => setWinners({ ...winners, [id]: v })}>
                      <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Ganador" /></SelectTrigger>
                      <SelectContent><SelectItem value={m.teamAId}>{teamMap[m.teamAId]?.name}</SelectItem><SelectItem value={m.teamBId}>{teamMap[m.teamBId]?.name}</SelectItem></SelectContent>
                    </Select>
                  </div>
                ); })}
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNextOpen(false)}>Cancelar</Button><Button onClick={nextPhase} disabled={busy || (needsWinners.length > 0 && needsWinners.some(id => !winners[id]))}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Generar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avanzar clasificados a nueva ronda */}
      <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Avanzar clasificados</DialogTitle><DialogDescription>Se creará una nueva fase con los {qualified?.qualified?.length || 0} equipos clasificados y podrás generar su fixture de inmediato.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Field label="Nombre de la nueva fase"><Input value={advanceForm.name} onChange={(e) => setAdvanceForm({ ...advanceForm, name: e.target.value })} placeholder={qualified?.qualified?.length === 8 ? "Cuartos de final" : qualified?.qualified?.length === 4 ? "Semifinales" : "Segunda ronda"} /></Field>
            <Field label="Formato">
              <Select value={advanceForm.type} onValueChange={(v) => setAdvanceForm({ ...advanceForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(roundTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Partidos por cruce"><Select value={advanceForm.legs} onValueChange={(v) => setAdvanceForm({ ...advanceForm, legs: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Solo ida</SelectItem><SelectItem value="2">Ida y vuelta</SelectItem></SelectContent></Select></Field>
              <Field label="Avanzan (si aplica)"><Input type="number" min={1} value={advanceForm.teamsAdvancing} onChange={(e) => setAdvanceForm({ ...advanceForm, teamsAdvancing: e.target.value })} /></Field>
            </div>
            {!qualified?.complete && <p className="text-xs text-amber-700 dark:text-amber-300">Aún hay partidos pendientes: los clasificados son una proyección con los resultados actuales.</p>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAdvanceOpen(false)}>Cancelar</Button><Button onClick={createAdvanceRound} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Crear fase y continuar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <GenerateFixtureDialog open={genOpen} onOpenChange={(o) => { setGenOpen(o); if (!o) { setGenRound(null); setGenTeamIds(undefined); } }} tournament={tournament} round={genRound} teams={teams} preselectedTeamIds={genTeamIds} onGenerated={refresh} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} title="Eliminar fase" description="Se eliminarán también sus partidos no jugados. Las fases con partidos jugados no pueden eliminarse." destructive confirmLabel="Sí, eliminar" loading={busy} onConfirm={deleteRound} />
    </div>
  );
}
