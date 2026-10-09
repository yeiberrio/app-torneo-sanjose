"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ListSkeleton } from "@/components/ui/skeleton";
import { ImportDialog } from "@/components/import-dialog";
import { position as positionLabels, positionShort, playerStatus, documentType } from "@/lib/labels";
import { Plus, Trash2, Edit, Users, Upload, List, Layers, ChevronDown, ChevronRight, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const ALL = "all";
const NONE = "__none__";

export default function PlayersPage() {
  const { user } = useAuthStore();
  const canCreate = user ? can(user.role, "create", "Player") : false;
  const canEdit = user ? can(user.role, "update", "Player") : false;
  const canDelete = user ? can(user.role, "delete", "Player") : false;

  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fPosition, setFPosition] = useState(ALL);
  const [fTeam, setFTeam] = useState(ALL);
  const [fStatus, setFStatus] = useState(ALL);
  const [fDoc, setFDoc] = useState(ALL);
  const [sort, setSort] = useState("name");
  const [view, setView] = useState<"table" | "team">("table");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editPlayer, setEditPlayer] = useState<any>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", jerseyNumber: "", position: "", teamId: "", status: "", documentNumber: "" });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const fetchPlayers = () => api.get("/players?limit=2000").then((res) => setPlayers(res.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { fetchPlayers(); api.get("/teams?limit=500").then(r => setTeams(r.data.data || [])).catch(() => {}); }, []);

  const filtered = useMemo(() => {
    let r = players;
    if (search.trim()) { const q = search.toLowerCase(); r = r.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) || (p.team?.name || "").toLowerCase().includes(q) || String(p.jerseyNumber || "") === q || (p.documentNumber || "").includes(q)); }
    if (fPosition !== ALL) r = r.filter(p => (p.position || NONE) === fPosition);
    if (fTeam !== ALL) r = r.filter(p => p.teamId === fTeam);
    if (fStatus !== ALL) r = r.filter(p => p.status === fStatus);
    if (fDoc === "with") r = r.filter(p => !!p.documentNumber);
    if (fDoc === "without") r = r.filter(p => !p.documentNumber);
    return [...r].sort((a, b) => sort === "number" ? (a.jerseyNumber || 999) - (b.jerseyNumber || 999) : sort === "team" ? (a.team?.name || "").localeCompare(b.team?.name || "") || (a.jerseyNumber || 999) - (b.jerseyNumber || 999) : sort === "recent" ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
  }, [players, search, fPosition, fTeam, fStatus, fDoc, sort]);

  const byTeam = useMemo(() => {
    const map = new Map<string, { team: any; players: any[] }>();
    for (const p of filtered) { const k = p.teamId; if (!map.has(k)) map.set(k, { team: p.team || { name: "Sin equipo" }, players: [] }); map.get(k)!.players.push(p); }
    return Array.from(map.entries()).sort((a, b) => a[1].team.name.localeCompare(b[1].team.name));
  }, [filtered]);

  const activeFilters = [fPosition, fTeam, fStatus, fDoc].filter(v => v !== ALL).length;
  const clear = () => { setFPosition(ALL); setFTeam(ALL); setFStatus(ALL); setFDoc(ALL); setSearch(""); };

  const openEdit = (p: any) => { setEditPlayer(p); setEditForm({ firstName: p.firstName || "", lastName: p.lastName || "", jerseyNumber: String(p.jerseyNumber ?? ""), position: p.position || "", teamId: p.teamId, status: p.status, documentNumber: p.documentNumber || "" }); };
  const saveEdit = async () => {
    if (!editPlayer) return;
    try {
      const payload: any = { firstName: editForm.firstName, lastName: editForm.lastName, jerseyNumber: editForm.jerseyNumber ? Number(editForm.jerseyNumber) : undefined, position: editForm.position || undefined, teamId: editForm.teamId, status: editForm.status, documentNumber: editForm.documentNumber || undefined };
      await api.patch(`/players/${editPlayer.id}`, payload); toast.success("Jugador actualizado"); setEditPlayer(null); fetchPlayers();
    } catch (err: any) { toast.error(err.response?.data?.message || "Error al actualizar"); }
  };
  const remove = async () => {
    if (!deleteTarget) return; setBusy(true);
    try { await api.delete(`/players/${deleteTarget.id}`); toast.success("Jugador movido a la papelera"); setDeleteTarget(null); fetchPlayers(); }
    catch (err: any) { toast.error(err.response?.data?.message || "Error"); } finally { setBusy(false); }
  };

  const PlayerLine = ({ p, showTeam }: { p: any; showTeam: boolean }) => {
    const st = playerStatus[p.status] || { label: p.status, tone: "neutral" as const };
    return (
      <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 transition-colors">
        <span className="w-7 text-center text-xs font-bold text-muted-foreground tabular-nums">{p.jerseyNumber || "–"}</span>
        <Link href={`/dashboard/players/detalle?id=${p.id}`} className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate hover:text-primary">{p.firstName} {p.lastName}</p>
          <p className="text-[11px] text-muted-foreground truncate">{showTeam ? (p.team?.name || "Sin equipo") : ""}{showTeam && p.position ? " · " : ""}{p.position ? positionLabels[p.position] : ""}{p.documentNumber ? ` · ${p.documentNumber}` : ""}</p>
        </Link>
        {p.position && <span className="hidden sm:inline-flex text-[10px] font-semibold rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">{positionShort[p.position]}</span>}
        <StatusBadge label={st.label} tone={st.tone} size="xs" />
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-0.5">
            {canEdit && <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}><Edit className="h-3.5 w-3.5" /></Button>}
            {canDelete && <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-rose-600" onClick={() => setDeleteTarget(p)}><Trash2 className="h-3.5 w-3.5" /></Button>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Jugadores" subtitle={`${players.length} registrados en ${teams.length} equipos`} actions={
        <>
          {canDelete && <Button variant="ghost" size="sm" className="rounded-xl" asChild><Link href="/dashboard/players/papelera"><Trash2 className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Papelera</span></Link></Button>}
          {canCreate && <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Importar</span></Button>}
          {canCreate && <Button size="sm" className="rounded-xl" asChild><Link href="/dashboard/players/new"><Plus className="h-4 w-4 mr-1.5" />Nuevo</Link></Button>}
        </>
      } />

      <FilterBar search={search} onSearch={setSearch} placeholder="Nombre, equipo, # o documento..." activeCount={activeFilters} onClear={clear}
        right={<Segmented value={view} onChange={setView} options={[{ value: "table", label: <List className="h-4 w-4" /> }, { value: "team", label: <Layers className="h-4 w-4" /> }]} />}>
        <Select value={fTeam} onValueChange={setFTeam}><SelectTrigger className="h-9 w-[170px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todo equipo</SelectItem>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>
        <Select value={fPosition} onValueChange={setFPosition}><SelectTrigger className="h-9 w-[150px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Toda posición</SelectItem>{Object.entries(positionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}<SelectItem value={NONE}>Sin posición</SelectItem></SelectContent></Select>
        <Select value={fStatus} onValueChange={setFStatus}><SelectTrigger className="h-9 w-[130px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todo estado</SelectItem>{Object.entries(playerStatus).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select>
        <Select value={fDoc} onValueChange={setFDoc}><SelectTrigger className="h-9 w-[140px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Documento: todos</SelectItem><SelectItem value="with">Con documento</SelectItem><SelectItem value="without">Sin documento</SelectItem></SelectContent></Select>
        <Select value={sort} onValueChange={setSort}><SelectTrigger className="h-9 w-[150px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="name">Orden: apellido</SelectItem><SelectItem value="number">Orden: número</SelectItem><SelectItem value="team">Orden: equipo</SelectItem><SelectItem value="recent">Orden: recientes</SelectItem></SelectContent></Select>
        <span className="text-xs text-muted-foreground ml-auto hidden md:inline">{filtered.length} de {players.length}</span>
      </FilterBar>

      {loading ? <ListSkeleton rows={8} /> : players.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="No hay jugadores registrados" description="Importa las plantillas completas desde Excel (también acepta el formato por bloques de Jugadores.xlsx) o registra jugadores uno a uno." action={canCreate && (<><Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><FileSpreadsheet className="h-4 w-4 mr-1.5" />Importar Excel</Button><Button size="sm" asChild><Link href="/dashboard/players/new"><Plus className="h-4 w-4 mr-1.5" />Nuevo jugador</Link></Button></>)} />
      ) : filtered.length === 0 ? (
        <EmptyState compact title="Sin resultados" description="Ningún jugador coincide con los filtros." action={<Button size="sm" variant="outline" onClick={clear}>Limpiar filtros</Button>} />
      ) : view === "table" ? (
        <div className="rounded-2xl border bg-card divide-y overflow-hidden">{filtered.map(p => <PlayerLine key={p.id} p={p} showTeam />)}</div>
      ) : (
        <div className="space-y-2">
          {byTeam.map(([teamId, g]) => {
            const c = collapsed.has(teamId);
            return (
              <div key={teamId} className="rounded-2xl border bg-card overflow-hidden">
                <button onClick={() => setCollapsed(prev => { const n = new Set(prev); n.has(teamId) ? n.delete(teamId) : n.add(teamId); return n; })} className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted/40 hover:bg-muted text-left">
                  {c ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  <TeamAvatar name={g.team.name} logoUrl={g.team.logoUrl} size="xs" />
                  <span className="text-sm font-semibold">{g.team.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{g.players.length} jugadores</span>
                </button>
                {!c && <div className="divide-y">{g.players.map(p => <PlayerLine key={p.id} p={p} showTeam={false} />)}</div>}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editPlayer} onOpenChange={(o) => !o && setEditPlayer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar jugador</DialogTitle><DialogDescription>Puedes cambiar también el equipo o el estado.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre" required><Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} /></Field>
              <Field label="Apellido" required><Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} /></Field>
            </div>
            <Field label="Equipo"><Select value={editForm.teamId} onValueChange={(v) => setEditForm({ ...editForm, teamId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Número"><Input type="number" min={0} max={999} value={editForm.jerseyNumber} onChange={(e) => setEditForm({ ...editForm, jerseyNumber: e.target.value })} /></Field>
              <Field label="Posición" className="col-span-2"><Select value={editForm.position || NONE} onValueChange={(v) => setEditForm({ ...editForm, position: v === NONE ? "" : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Sin posición</SelectItem>{Object.entries(positionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Documento"><Input value={editForm.documentNumber} onChange={(e) => setEditForm({ ...editForm, documentNumber: e.target.value })} /></Field>
              <Field label="Estado"><Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(playerStatus).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></Field>
            </div>
            <Button onClick={saveEdit} className="w-full">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} title="Eliminar jugador" description={<>¿Mover a <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> a la papelera?</>} destructive confirmLabel="Sí, eliminar" loading={busy} onConfirm={remove} />
      <ImportDialog entity="players" open={importOpen} onOpenChange={setImportOpen} onImported={fetchPlayers} />
    </div>
  );
}
