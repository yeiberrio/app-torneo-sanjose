"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ListSkeleton } from "@/components/ui/skeleton";
import { OverviewTab } from "@/components/tournament/overview-tab";
import { TeamsTab } from "@/components/tournament/teams-tab";
import { FixtureTab } from "@/components/tournament/fixture-tab";
import { RoundsTab } from "@/components/tournament/rounds-tab";
import { TiebreakersTab } from "@/components/tournament/tiebreakers-tab";
import { tournamentStatus, tournamentType } from "@/lib/labels";
import { fmtDate } from "@/lib/format";
import { downloadFile } from "@/lib/download";
import { Download, Edit, Check, X, Users, Swords, Layers, CalendarDays, Trophy, Play, Flag, Megaphone } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";

function TournamentDetail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tournamentId = searchParams.get("id");
  const initialTab = searchParams.get("tab") || "overview";
  const { user } = useAuthStore();
  const canManage = user ? can(user.role, "update", "Tournament") : false;

  const [tournament, setTournament] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [standings, setStandings] = useState<any>(null);
  const [trashedCount, setTrashedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [exporting, setExporting] = useState(false);
  const [finalizeStep, setFinalizeStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const fetchTournament = useCallback(() => {
    if (!tournamentId) return;
    api.get(`/tournaments/${tournamentId}`).then((res) => setTournament(res.data)).catch(() => toast.error("Error al cargar torneo")).finally(() => setLoading(false));
    api.get(`/tournaments/${tournamentId}/standings/grouped`).then((res) => setStandings(res.data)).catch(() => {});
  }, [tournamentId]);
  const fetchTrashed = useCallback(() => {
    if (!tournamentId) return;
    api.get(`/tournaments/${tournamentId}/fixture/trash-count`).then((res) => setTrashedCount(typeof res.data === "number" ? res.data : 0)).catch(() => {});
  }, [tournamentId]);

  useEffect(() => {
    fetchTournament(); fetchTrashed();
    api.get("/teams?limit=500").then((res) => setAllTeams(res.data.data || [])).catch(() => {});
  }, [fetchTournament, fetchTrashed]);

  const changeTab = (t: string) => { setTab(t); router.replace(`/dashboard/tournaments/detalle?id=${tournamentId}&tab=${t}`); };

  const saveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === tournament.name) { setEditingName(false); return; }
    try { await api.patch(`/tournaments/${tournamentId}`, { name: nameValue.trim() }); toast.success("Nombre actualizado"); setEditingName(false); fetchTournament(); }
    catch (err: any) { toast.error(err.response?.data?.message || "Error"); }
  };
  const changeStatus = async (status: string) => {
    if (status === "FINISHED") { setFinalizeStep(1); return; }
    try { await api.patch(`/tournaments/${tournamentId}`, { status }); toast.success("Estado actualizado"); fetchTournament(); }
    catch { toast.error("Error al cambiar estado"); }
  };
  const finalize = async () => {
    setBusy(true);
    try { await api.patch(`/tournaments/${tournamentId}`, { status: "FINISHED" }); toast.success("Torneo finalizado"); setFinalizeStep(0); fetchTournament(); }
    catch { toast.error("Error al finalizar"); } finally { setBusy(false); }
  };
  const exportExcel = async () => {
    setExporting(true);
    try { await downloadFile(`/tournaments/${tournamentId}/export-excel`, `torneo_${tournament?.name || tournamentId}.xlsx`); toast.success("Excel exportado"); }
    catch { toast.error("Error al exportar"); } finally { setExporting(false); }
  };

  if (loading) return <div className="space-y-4"><div className="h-8 w-64 skeleton" /><ListSkeleton rows={4} /></div>;
  if (!tournament) return <p className="text-muted-foreground p-6">Torneo no encontrado.</p>;

  const st = tournamentStatus[tournament.status] || { label: tournament.status, tone: "neutral" as const };
  const matches: any[] = tournament.matches || [];
  const finished = matches.filter(m => m.status === "FINISHED").length;
  const live = matches.filter(m => ["IN_PROGRESS", "HALFTIME"].includes(m.status)).length;
  const progress = matches.length ? Math.round((finished / matches.length) * 100) : 0;
  const stats = [
    { icon: Users, label: "Equipos", value: tournament.teams?.length || 0, tone: "text-sky-600 bg-sky-50 dark:bg-sky-950/40" },
    { icon: Swords, label: "Partidos", value: `${finished}/${matches.length}`, tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
    { icon: Layers, label: "Fases", value: tournament.rounds?.length || 0, tone: "text-violet-600 bg-violet-50 dark:bg-violet-950/40" },
    { icon: CalendarDays, label: "Inicio", value: fmtDate(tournament.startDate, { day: "2-digit", month: "short", year: "numeric" }), tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
  ];

  return (
    <div>
      <PageHeader
        back="/dashboard/tournaments"
        title={editingName ? (
          <div className="flex items-center gap-2">
            <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} className="text-xl font-semibold h-10 max-w-md" autoFocus onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }} />
            <Button size="icon" variant="ghost" onClick={saveName}><Check className="h-4 w-4 text-emerald-600" /></Button>
            <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}><X className="h-4 w-4" /></Button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-2 flex-wrap">
            <Trophy className="h-5 w-5 text-amber-500 shrink-0" />{tournament.name}
            {canManage && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setNameValue(tournament.name); setEditingName(true); }}><Edit className="h-3.5 w-3.5 text-muted-foreground" /></Button>}
          </span>
        )}
        subtitle={<span className="inline-flex items-center gap-2 flex-wrap"><StatusBadge label={st.label} tone={st.tone} />{live > 0 && <StatusBadge label={`${live} en juego`} tone="success" live size="xs" />}<span>{tournamentType[tournament.type] || tournament.type}</span>{tournament.city && <span>· {tournament.city}</span>}</span>}
        actions={
          <>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={exportExcel} disabled={exporting}><Download className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">{exporting ? "Exportando..." : "Excel"}</span></Button>
            {canManage && tournament.status === "DRAFT" && <Button size="sm" className="rounded-xl" onClick={() => changeStatus("PUBLISHED")}><Megaphone className="h-4 w-4 mr-1.5" />Publicar</Button>}
            {canManage && tournament.status === "PUBLISHED" && <Button size="sm" className="rounded-xl" onClick={() => changeStatus("IN_PROGRESS")}><Play className="h-4 w-4 mr-1.5" />Iniciar</Button>}
            {canManage && tournament.status === "IN_PROGRESS" && <Button size="sm" variant="outline" className="rounded-xl" onClick={() => changeStatus("FINISHED")}><Flag className="h-4 w-4 mr-1.5" />Finalizar</Button>}
          </>
        }
      >
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border bg-card px-3 py-2.5 flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", s.tone)}><s.icon className="h-4 w-4" /></div>
              <div className="min-w-0"><p className="text-base font-semibold leading-tight truncate">{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></div>
            </div>
          ))}
        </div>
        {matches.length > 0 && (
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} /></div>
            <span className="shrink-0">{progress}% del calendario jugado</span>
          </div>
        )}
      </PageHeader>

      <Tabs value={tab} onValueChange={changeTab}>
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-4">
          <TabsList className="h-10 rounded-xl bg-muted/70 w-max">
            <TabsTrigger value="overview" className="rounded-lg">Resumen</TabsTrigger>
            <TabsTrigger value="teams" className="rounded-lg">Equipos</TabsTrigger>
            <TabsTrigger value="fixture" className="rounded-lg">Partidos</TabsTrigger>
            <TabsTrigger value="rounds" className="rounded-lg">Fases</TabsTrigger>
            <TabsTrigger value="tiebreakers" className="rounded-lg">Desempate</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview"><OverviewTab tournament={tournament} canManage={canManage} refresh={fetchTournament} standings={standings} /></TabsContent>
        <TabsContent value="teams"><TeamsTab tournament={tournament} allTeams={allTeams} canManage={canManage} refresh={fetchTournament} /></TabsContent>
        <TabsContent value="fixture"><FixtureTab tournament={tournament} canManage={canManage} refresh={fetchTournament} trashedCount={trashedCount} onTrashChange={fetchTrashed} /></TabsContent>
        <TabsContent value="rounds"><RoundsTab tournament={tournament} canManage={canManage} refresh={fetchTournament} /></TabsContent>
        <TabsContent value="tiebreakers"><TiebreakersTab tournament={tournament} canManage={canManage} /></TabsContent>
      </Tabs>

      <ConfirmDialog open={finalizeStep === 1} onOpenChange={(o) => !o && setFinalizeStep(0)} title="Finalizar torneo" description={<>¿Finalizar <strong>{tournament.name}</strong>? Los partidos pendientes no se verán afectados, pero no se podrán generar nuevos fixtures.</>} destructive confirmLabel="Sí, continuar" onConfirm={() => setFinalizeStep(2)} />
      <ConfirmDialog open={finalizeStep === 2} onOpenChange={(o) => !o && setFinalizeStep(0)} title="Confirmación final" description="Esta acción marca el torneo como finalizado de forma definitiva." destructive confirmLabel="Confirmar y finalizar" loading={busy} onConfirm={finalize} />
    </div>
  );
}

export default function TournamentDetailPage() {
  return <Suspense fallback={<ListSkeleton rows={4} />}><TournamentDetail /></Suspense>;
}
