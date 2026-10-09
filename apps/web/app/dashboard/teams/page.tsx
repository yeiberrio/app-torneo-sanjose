"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { ListSkeleton } from "@/components/ui/skeleton";
import { ImportDialog } from "@/components/import-dialog";
import { Plus, Edit, Trash2, Upload, Shield, LayoutGrid, List, Users, MapPin, ChevronRight, Camera, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const ALL = "all";

export default function TeamsPage() {
  const { user } = useAuthStore();
  const canCreate = user ? can(user.role, "create", "Team") : false;
  const canEdit = user ? can(user.role, "update", "Team") : false;
  const canDelete = user ? can(user.role, "delete", "Team") : false;

  const [teams, setTeams] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [fCity, setFCity] = useState(ALL);
  const [fTournament, setFTournament] = useState(ALL);
  const [fPlayers, setFPlayers] = useState(ALL);
  const [sort, setSort] = useState("name");
  const [editTeam, setEditTeam] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", city: "", foundedYear: "" });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [logoTeamId, setLogoTeamId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchTeams = () => api.get("/teams?limit=500").then((res) => setTeams(res.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { fetchTeams(); api.get("/tournaments?limit=100").then(r => setTournaments(r.data.data || [])).catch(() => {}); }, []);

  useEffect(() => { try { const v = localStorage.getItem("teams:view"); if (v === "list" || v === "grid") setView(v); } catch {} }, []);
  const changeView = (v: "grid" | "list") => { setView(v); try { localStorage.setItem("teams:view", v); } catch {} };

  const cities = useMemo(() => Array.from(new Set(teams.map(t => t.city).filter(Boolean))).sort() as string[], [teams]);
  const filtered = useMemo(() => {
    let r = teams;
    if (search.trim()) { const q = search.toLowerCase(); r = r.filter(t => t.name.toLowerCase().includes(q) || (t.city || "").toLowerCase().includes(q)); }
    if (fCity !== ALL) r = r.filter(t => (t.city || "") === fCity);
    if (fTournament !== ALL) r = r.filter(t => (t.tournaments || []).some((tt: any) => tt.tournamentId === fTournament));
    if (fPlayers === "with") r = r.filter(t => (t._count?.players || 0) > 0);
    if (fPlayers === "without") r = r.filter(t => (t._count?.players || 0) === 0);
    r = [...r].sort((a, b) => sort === "players" ? (b._count?.players || 0) - (a._count?.players || 0) : sort === "recent" ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : a.name.localeCompare(b.name));
    return r;
  }, [teams, search, fCity, fTournament, fPlayers, sort]);
  const activeFilters = [fCity, fTournament, fPlayers].filter(v => v !== ALL).length;
  const clear = () => { setFCity(ALL); setFTournament(ALL); setFPlayers(ALL); setSearch(""); };

  const openEdit = (t: any, e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setEditTeam(t); setEditForm({ name: t.name || "", city: t.city || "", foundedYear: String(t.foundedYear ?? "") }); };
  const saveEdit = async () => {
    if (!editTeam) return;
    try { await api.patch(`/teams/${editTeam.id}`, { name: editForm.name, city: editForm.city || undefined, foundedYear: editForm.foundedYear ? Number(editForm.foundedYear) : undefined }); toast.success("Equipo actualizado"); setEditTeam(null); fetchTeams(); }
    catch (err: any) { toast.error(err.response?.data?.message || "Error al actualizar"); }
  };
  const remove = async () => {
    if (!deleteTarget) return; setBusy(true);
    try { await api.delete(`/teams/${deleteTarget.id}`); toast.success(`"${deleteTarget.name}" movido a la papelera`); setDeleteTarget(null); fetchTeams(); }
    catch (err: any) { toast.error(err.response?.data?.message || "Error al eliminar"); } finally { setBusy(false); }
  };
  const triggerLogo = (id: string, e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setLogoTeamId(id); fileRef.current?.click(); };
  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !logoTeamId) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB"); return; }
    try { const fd = new FormData(); fd.append("file", file); const up = await api.post("/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } }); await api.patch(`/teams/${logoTeamId}`, { logoUrl: up.data.url }); toast.success("Logo actualizado"); fetchTeams(); }
    catch (err: any) { toast.error(err.response?.data?.message || "Error al subir logo"); } finally { setLogoTeamId(null); if (fileRef.current) fileRef.current.value = ""; }
  };

  const Actions = ({ t }: { t: any }) => (
    <div className="flex items-center gap-0.5 shrink-0">
      {canEdit && <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => openEdit(t, e)}><Edit className="h-3.5 w-3.5" /></Button>}
      {canDelete && <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-rose-600" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(t); }}><Trash2 className="h-3.5 w-3.5" /></Button>}
    </div>
  );

  return (
    <div>
      <PageHeader title="Equipos" subtitle={`${teams.length} registrados`} actions={
        <>
          {canDelete && <Button variant="ghost" size="sm" className="rounded-xl" asChild><Link href="/dashboard/teams/papelera"><Trash2 className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Papelera</span></Link></Button>}
          {canCreate && <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Importar</span></Button>}
          {canCreate && <Button size="sm" className="rounded-xl" asChild><Link href="/dashboard/teams/new"><Plus className="h-4 w-4 mr-1.5" />Nuevo</Link></Button>}
        </>
      } />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />

      <FilterBar search={search} onSearch={setSearch} placeholder="Buscar equipo o ciudad..." activeCount={activeFilters} onClear={clear}
        right={<Segmented value={view} onChange={changeView} options={[{ value: "grid", label: <LayoutGrid className="h-4 w-4" /> }, { value: "list", label: <List className="h-4 w-4" /> }]} />}>
        {cities.length > 1 && <Select value={fCity} onValueChange={setFCity}><SelectTrigger className="h-9 w-[140px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Toda ciudad</SelectItem>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>}
        {tournaments.length > 0 && <Select value={fTournament} onValueChange={setFTournament}><SelectTrigger className="h-9 w-[180px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todo torneo</SelectItem>{tournaments.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select>}
        <Select value={fPlayers} onValueChange={setFPlayers}><SelectTrigger className="h-9 w-[150px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Con o sin plantilla</SelectItem><SelectItem value="with">Con jugadores</SelectItem><SelectItem value="without">Sin jugadores</SelectItem></SelectContent></Select>
        <Select value={sort} onValueChange={setSort}><SelectTrigger className="h-9 w-[150px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="name">Orden: nombre</SelectItem><SelectItem value="players">Orden: jugadores</SelectItem><SelectItem value="recent">Orden: recientes</SelectItem></SelectContent></Select>
        <span className="text-xs text-muted-foreground ml-auto hidden md:inline">{filtered.length} de {teams.length}</span>
      </FilterBar>

      {loading ? <ListSkeleton /> : teams.length === 0 ? (
        <EmptyState icon={<Shield className="h-6 w-6" />} title="No hay equipos registrados" description="Crea equipos uno a uno o importa varios desde un archivo Excel con la plantilla." action={canCreate && (<><Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><FileSpreadsheet className="h-4 w-4 mr-1.5" />Importar Excel</Button><Button size="sm" asChild><Link href="/dashboard/teams/new"><Plus className="h-4 w-4 mr-1.5" />Nuevo equipo</Link></Button></>)} />
      ) : filtered.length === 0 ? (
        <EmptyState compact title="Sin resultados" description="Ningún equipo coincide con los filtros." action={<Button size="sm" variant="outline" onClick={clear}>Limpiar filtros</Button>} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((t) => (
            <Link key={t.id} href={`/dashboard/teams/detalle?id=${t.id}`} className="group rounded-2xl border bg-card p-4 flex items-center gap-4 transition-all hover:shadow-md hover:border-primary/30">
              <div className="relative shrink-0">
                <TeamAvatar name={t.name} logoUrl={t.logoUrl} size="lg" />
                {canEdit && <button onClick={(e) => triggerLogo(t.id, e)} className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" title="Cambiar logo"><Camera className="h-4 w-4 text-white" /></button>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{t.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5"><span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{t._count?.players || 0}</span>{t.city && <span className="inline-flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{t.city}</span>}</p>
                {t.tournaments?.length > 0 && <p className="text-[11px] text-muted-foreground/80 truncate mt-1">{t.tournaments.map((tt: any) => tt.tournament?.name + (tt.groupName ? ` (${tt.groupName})` : "")).join(" · ")}</p>}
              </div>
              <Actions t={t} />
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-card divide-y overflow-hidden">
          {filtered.map((t) => (
            <Link key={t.id} href={`/dashboard/teams/detalle?id=${t.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors">
              <TeamAvatar name={t.name} logoUrl={t.logoUrl} size="sm" />
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{t.name}</p><p className="text-[11px] text-muted-foreground truncate">{t.city || "Sin ciudad"}{t.foundedYear ? ` · ${t.foundedYear}` : ""}</p></div>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1 w-14 justify-end"><Users className="h-3 w-3" />{t._count?.players || 0}</span>
              <Actions t={t} />
            </Link>
          ))}
        </div>
      )}

      <Dialog open={!!editTeam} onOpenChange={(o) => !o && setEditTeam(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editar equipo</DialogTitle><DialogDescription>Modifica los datos básicos.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <Field label="Nombre" required><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ciudad"><Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} /></Field>
              <Field label="Año fundación"><Input type="number" min={1900} max={2100} value={editForm.foundedYear} onChange={(e) => setEditForm({ ...editForm, foundedYear: e.target.value })} /></Field>
            </div>
            <Button onClick={saveEdit} className="w-full">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} title="Eliminar equipo" description={<>¿Mover <strong>{deleteTarget?.name}</strong> a la papelera? Podrás restaurarlo después.</>} destructive confirmLabel="Sí, eliminar" loading={busy} onConfirm={remove} />
      <ImportDialog entity="teams" open={importOpen} onOpenChange={setImportOpen} onImported={fetchTeams} />
    </div>
  );
}
