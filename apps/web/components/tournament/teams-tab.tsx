"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/form-field";
import { Switch } from "@/components/ui/switch";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ImportDialog } from "@/components/import-dialog";
import { Plus, Shuffle, Upload, X, Users, Search, LayoutGrid, Shield } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const NONE = "__none__";
const LETTERS = "ABCDEFGHIJKLMNOP".split("");

export function TeamsTab({ tournament, allTeams, canManage, refresh }: { tournament: any; allTeams: any[]; canManage: boolean; refresh: () => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [addIds, setAddIds] = useState<string[]>([]);
  const [addGroup, setAddGroup] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [distOpen, setDistOpen] = useState(false);
  const [dist, setDist] = useState({ groupsCount: "4", method: "random", keepExisting: false });
  const [removeTarget, setRemoveTarget] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const entries: any[] = tournament.teams || [];
  const inIds = new Set(entries.map((t: any) => t.teamId));
  const available = allTeams.filter(t => !inIds.has(t.id) && (!addSearch || t.name.toLowerCase().includes(addSearch.toLowerCase())));
  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const e of entries) {
      if (search && !e.team.name.toLowerCase().includes(search.toLowerCase())) continue;
      const g = e.groupName || "";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)));
  }, [entries, search]);
  const existingGroups = Array.from(new Set(entries.map((e: any) => e.groupName).filter(Boolean))).sort() as string[];
  const groupOptions = Array.from(new Set([...existingGroups, ...LETTERS.slice(0, Math.max(4, existingGroups.length + 1))])).sort();
  const isGroupsType = tournament.type === "GROUPS" || (tournament.rounds || []).some((r: any) => r.type === "GROUP_STAGE");

  const setGroup = async (teamId: string, groupName: string | null) => {
    try {
      await api.patch(`/tournaments/${tournament.id}/teams/${teamId}/group`, { groupName });
      refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || "No se pudo asignar el grupo"); }
  };

  const addTeams = async () => {
    if (addIds.length === 0) return;
    setBusy(true);
    try {
      await api.post(`/tournaments/${tournament.id}/teams/bulk`, { teamIds: addIds, groupName: addGroup || undefined });
      toast.success(`${addIds.length} equipo(s) inscritos`);
      setAddOpen(false); setAddIds([]); setAddGroup(""); refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || "Error al inscribir"); } finally { setBusy(false); }
  };

  const distribute = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/tournaments/${tournament.id}/groups/distribute`, { groupsCount: Number(dist.groupsCount), method: dist.method, keepExisting: dist.keepExisting });
      toast.success(res.data.message); setDistOpen(false); refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || "Error al distribuir"); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!removeTarget) return;
    setBusy(true);
    try {
      await api.delete(`/tournaments/${tournament.id}/teams/${removeTarget.teamId}`);
      toast.success("Equipo retirado del torneo"); setRemoveTarget(null); refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || "Error al retirar"); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar equipo inscrito..." className="pl-9 h-9 rounded-xl" />
        </div>
        <span className="text-xs text-muted-foreground">{entries.length} inscritos{existingGroups.length > 0 ? ` · ${existingGroups.length} grupos` : ""}</span>
        {canManage && (
          <div className="flex gap-2 ml-auto flex-wrap">
            {entries.length >= 2 && <Button size="sm" variant="outline" onClick={() => setDistOpen(true)}><Shuffle className="h-4 w-4 mr-1.5" />Grupos</Button>}
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-1.5" />Importar</Button>
            <Button size="sm" onClick={() => setAddOpen(true)} disabled={allTeams.length - entries.length === 0}><Plus className="h-4 w-4 mr-1.5" />Inscribir</Button>
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState icon={<Shield className="h-6 w-6" />} title="Aún no hay equipos inscritos" description="Inscribe equipos existentes o impórtalos desde un Excel para empezar a armar el torneo." action={canManage && (<><Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-1.5" />Importar Excel</Button><Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Inscribir</Button></>)} />
      ) : (
        <div className={cn("grid gap-4", groups.length > 1 ? "md:grid-cols-2 xl:grid-cols-3" : "")}>
          {groups.map(([g, list]) => (
            <div key={g || "none"} className="rounded-2xl border bg-card overflow-hidden">
              <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center gap-2">
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold", g ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{g || <LayoutGrid className="h-3.5 w-3.5" />}</div>
                <p className="text-sm font-semibold">{g ? `Grupo ${g}` : isGroupsType ? "Sin grupo asignado" : "Equipos"}</p>
                <span className="ml-auto text-xs text-muted-foreground">{list.length}</span>
              </div>
              <div className="divide-y">
                {list.map((tt: any) => (
                  <div key={tt.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30">
                    <Link href={`/dashboard/teams/detalle?id=${tt.teamId}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <TeamAvatar name={tt.team.name} logoUrl={tt.team.logoUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{tt.team.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{tt.team._count?.players ?? "—"} jugadores{tt.team.city ? ` · ${tt.team.city}` : ""}</p>
                      </div>
                    </Link>
                    {canManage && (
                      <>
                        <Select value={tt.groupName || NONE} onValueChange={(v) => setGroup(tt.teamId, v === NONE ? null : v)}>
                          <SelectTrigger className="h-8 w-[76px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>—</SelectItem>
                            {groupOptions.map(l => <SelectItem key={l} value={l}>Gr. {l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-rose-600" onClick={() => setRemoveTarget(tt)} title="Retirar del torneo"><X className="h-4 w-4" /></Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inscribir */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Inscribir equipos</DialogTitle><DialogDescription>Selecciona uno o varios equipos registrados.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={addSearch} onChange={(e) => setAddSearch(e.target.value)} placeholder="Buscar..." className="pl-9 h-9" /></div>
            <div className="rounded-xl border max-h-64 overflow-y-auto divide-y">
              {available.map(t => (
                <label key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
                  <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--primary))]" checked={addIds.includes(t.id)} onChange={(e) => setAddIds(ids => e.target.checked ? [...ids, t.id] : ids.filter(x => x !== t.id))} />
                  <TeamAvatar name={t.name} logoUrl={t.logoUrl} size="xs" />
                  <span className="flex-1 truncate">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t._count?.players ?? 0} jug.</span>
                </label>
              ))}
              {available.length === 0 && <p className="p-4 text-sm text-center text-muted-foreground">No hay equipos disponibles. <Link href="/dashboard/teams/new" className="text-primary underline">Crear equipo</Link></p>}
            </div>
            {isGroupsType && (
              <Field label="Asignar al grupo (opcional)">
                <Select value={addGroup || NONE} onValueChange={(v) => setAddGroup(v === NONE ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value={NONE}>Sin grupo</SelectItem>{groupOptions.map(l => <SelectItem key={l} value={l}>Grupo {l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button><Button onClick={addTeams} disabled={addIds.length === 0 || busy}>Inscribir {addIds.length || ""}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Distribuir grupos */}
      <Dialog open={distOpen} onOpenChange={setDistOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Distribuir en grupos</DialogTitle><DialogDescription>Reparte los {entries.length} equipos inscritos de forma balanceada.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Field label="Cantidad de grupos"><Input type="number" min={1} max={16} value={dist.groupsCount} onChange={(e) => setDist({ ...dist, groupsCount: e.target.value })} /></Field>
            <Field label="Método">
              <Select value={dist.method} onValueChange={(v) => setDist({ ...dist, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Sorteo aleatorio</SelectItem>
                  <SelectItem value="sequential">Por orden alfabético</SelectItem>
                  <SelectItem value="snake">Serpiente (A,B,C,C,B,A...)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <label className="flex items-center justify-between text-sm"><span>Conservar grupos ya asignados</span><Switch checked={dist.keepExisting} onCheckedChange={(v) => setDist({ ...dist, keepExisting: v })} /></label>
            <p className="text-xs text-muted-foreground">≈ {Math.ceil(entries.length / Math.max(1, Number(dist.groupsCount)))} equipos por grupo.</p>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDistOpen(false)}>Cancelar</Button><Button onClick={distribute} disabled={busy}><Shuffle className="h-4 w-4 mr-1.5" />Distribuir</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)} title="Retirar equipo" description={<>¿Retirar a <strong>{removeTarget?.team?.name}</strong> del torneo? Sus partidos programados quedarán sin efecto.</>} destructive confirmLabel="Sí, retirar" loading={busy} onConfirm={remove} />
      <ImportDialog entity="teams" open={importOpen} onOpenChange={setImportOpen} tournamentId={tournament.id} onImported={refresh} />
    </div>
  );
}
