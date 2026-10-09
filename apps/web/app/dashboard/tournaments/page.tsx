"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ListSkeleton } from "@/components/ui/skeleton";
import { tournamentStatus, tournamentType } from "@/lib/labels";
import { fmtDate } from "@/lib/format";
import { Plus, Trash2, Trophy, Users, Swords, CalendarDays, ChevronRight, MapPin } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const ALL = "all";

export default function TournamentsPage() {
  const { user } = useAuthStore();
  const canCreate = user ? can(user.role, "create", "Tournament") : false;
  const canDelete = user ? can(user.role, "delete", "Tournament") : false;
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState(ALL);
  const [fType, setFType] = useState(ALL);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = () => { setLoading(true); api.get("/tournaments?limit=100").then((res) => setTournaments(res.data.data || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => tournaments.filter(t => {
    if (fStatus !== ALL && t.status !== fStatus) return false;
    if (fType !== ALL && t.type !== fType) return false;
    if (search.trim() && !t.name.toLowerCase().includes(search.toLowerCase()) && !(t.city || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => { const order: Record<string, number> = { IN_PROGRESS: 0, PUBLISHED: 1, DRAFT: 2, FINISHED: 3, CANCELLED: 4 }; return (order[a.status] ?? 9) - (order[b.status] ?? 9) || new Date(b.startDate).getTime() - new Date(a.startDate).getTime(); }), [tournaments, fStatus, fType, search]);

  const handleDelete = async () => {
    if (!deleteTarget || !password) return;
    setDeleting(true); setDeleteError("");
    try { await api.delete(`/tournaments/${deleteTarget.id}`, { data: { password } }); setDeleteTarget(null); setPassword(""); load(); }
    catch (err: any) { setDeleteError(err.response?.data?.message || "Error al eliminar"); } finally { setDeleting(false); }
  };

  return (
    <div>
      <PageHeader title="Torneos" subtitle={`${tournaments.length} torneos`} actions={
        <>
          {canDelete && <Button variant="ghost" size="sm" className="rounded-xl" asChild><Link href="/dashboard/tournaments/papelera"><Trash2 className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Papelera</span></Link></Button>}
          {canCreate && <Button size="sm" className="rounded-xl" asChild><Link href="/dashboard/tournaments/new"><Plus className="h-4 w-4 mr-1.5" />Nuevo torneo</Link></Button>}
        </>
      } />
      <FilterBar search={search} onSearch={setSearch} placeholder="Buscar torneo..." activeCount={[fStatus, fType].filter(v => v !== ALL).length} onClear={() => { setFStatus(ALL); setFType(ALL); setSearch(""); }}>
        <Select value={fStatus} onValueChange={setFStatus}><SelectTrigger className="h-9 w-[150px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todo estado</SelectItem>{Object.entries(tournamentStatus).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select>
        <Select value={fType} onValueChange={setFType}><SelectTrigger className="h-9 w-[170px] text-xs rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Todo formato</SelectItem>{Object.entries(tournamentType).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
      </FilterBar>

      {loading ? <ListSkeleton rows={3} /> : tournaments.length === 0 ? (
        <EmptyState icon={<Trophy className="h-6 w-6" />} title="Aún no hay torneos" description="Crea tu primer torneo, inscribe equipos y genera el calendario en minutos." action={canCreate && <Button size="sm" asChild><Link href="/dashboard/tournaments/new"><Plus className="h-4 w-4 mr-1.5" />Crear torneo</Link></Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState compact title="Sin resultados" description="Ningún torneo coincide con los filtros." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((t) => {
            const st = tournamentStatus[t.status] || { label: t.status, tone: "neutral" as const };
            return (
              <div key={t.id} className={cn("relative rounded-2xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30", t.status === "IN_PROGRESS" && "border-emerald-300/60 dark:border-emerald-800")}>
                <Link href={`/dashboard/tournaments/detalle?id=${t.id}`} className="block">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">{t.logoUrl ? <img src={t.logoUrl} alt="" className="h-11 w-11 rounded-xl object-cover" /> : <Trophy className="h-5 w-5" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate pr-6">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap"><span>{tournamentType[t.type] || t.type}</span>{t.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{t.city}</span>}</p>
                    </div>
                    <StatusBadge label={st.label} tone={st.tone} size="xs" />
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t._count?.teams ?? 0} equipos</span>
                    <span className="inline-flex items-center gap-1"><Swords className="h-3.5 w-3.5" />{t._count?.matches ?? 0} partidos</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(t.startDate, { day: "2-digit", month: "short", year: "numeric" })}</span>
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground/50" />
                  </div>
                </Link>
                {canDelete && <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground/60 hover:text-rose-600" onClick={() => { setDeleteTarget(t); setPassword(""); setDeleteError(""); }}><Trash2 className="h-3.5 w-3.5" /></Button>}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setPassword(""); setDeleteError(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Eliminar torneo</DialogTitle><DialogDescription>Para mover <strong>{deleteTarget?.name}</strong> a la papelera confirma tu contraseña.</DialogDescription></DialogHeader>
          <Field label="Contraseña" required><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleDelete()} autoFocus /></Field>
          {deleteError && <p className="text-xs text-rose-600">{deleteError}</p>}
          <DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button><Button variant="destructive" onClick={handleDelete} disabled={!password || deleting}>{deleting ? "Eliminando..." : "Eliminar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
