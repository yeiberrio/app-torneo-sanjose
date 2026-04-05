"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trophy, Users, Swords, X, Calendar, Trash2, ListOrdered, Settings2, GripVertical, Edit, Check, Download } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";

const statusLabels: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Borrador", className: "bg-yellow-100 text-yellow-800" },
  PUBLISHED: { label: "Publicado", className: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "En curso", className: "bg-green-100 text-green-800" },
  HALFTIME: { label: "Entretiempo", className: "bg-orange-100 text-orange-800" },
  FINISHED: { label: "Finalizado", className: "bg-gray-100 text-gray-800" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-800" },
  POSTPONED: { label: "Aplazado", className: "bg-purple-100 text-purple-800" },
  SUSPENDED: { label: "Suspendido", className: "bg-red-100 text-red-800" },
  SCHEDULED: { label: "Programado", className: "bg-blue-100 text-blue-800" },
};

const typeLabels: Record<string, string> = {
  LEAGUE: "Liga",
  CUP: "Copa",
  GROUPS: "Grupos + Eliminacion",
  KNOCKOUT: "Eliminacion directa",
};

const roundTypeLabels: Record<string, string> = {
  ROUND_ROBIN: "Todos contra todos",
  KNOCKOUT: "Eliminacion directa",
  POINTS_CLASSIFICATION: "Clasificacion por puntos",
  GROUP_STAGE: "Fase de grupos",
};

const tiebreakerLabels: Record<string, string> = {
  HEAD_TO_HEAD: "Enfrentamiento directo",
  GOAL_DIFFERENCE: "Diferencia de goles",
  GOALS_FOR: "Goles a favor",
  GOALS_AGAINST: "Goles en contra",
  FAIR_PLAY: "Juego limpio",
  PENALTY_SHOOTOUT: "Tiros penales",
  LOTS_DRAWING: "Sorteo",
  AWAY_GOALS: "Goles de visitante",
  WINS: "Victorias",
  DRAWS: "Empates",
};

const allTiebreakerOptions = Object.keys(tiebreakerLabels);

export default function TournamentDetailPage() {
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("id");
  const { user } = useAuthStore();
  const canManage = user ? can(user.role, "update", "Tournament") : false;

  const [tournament, setTournament] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [addTeamId, setAddTeamId] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [fixtureDialogOpen, setFixtureDialogOpen] = useState(false);
  const [fixtureLoading, setFixtureLoading] = useState(false);
  const [fixtureConfig, setFixtureConfig] = useState({
    legs: "1",
    intervalDays: "7",
    matchTime: "15:00",
    startDate: "",
    defaultVenue: "",
  });
  const [loading, setLoading] = useState(true);

  // Rounds state
  const [rounds, setRounds] = useState<any[]>([]);
  const [roundDialogOpen, setRoundDialogOpen] = useState(false);
  const [roundForm, setRoundForm] = useState({
    roundNumber: "",
    name: "",
    type: "ROUND_ROBIN",
    teamsAdvancing: "",
    legs: "1",
  });

  // Tiebreakers state
  const [tiebreakers, setTiebreakers] = useState<any[]>([]);
  const [tiebreakerDialogOpen, setTiebreakerDialogOpen] = useState(false);
  const [tiebreakerList, setTiebreakerList] = useState<{ criteria: string; priority: number }[]>([]);

  // Edit tournament name state
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  // Export state
  const [exporting, setExporting] = useState(false);

  // Delete confirmations
  const [deleteFixtureOpen, setDeleteFixtureOpen] = useState(false);
  const [deletingFixture, setDeletingFixture] = useState(false);
  const [deleteRoundTarget, setDeleteRoundTarget] = useState<string | null>(null);
  const [deletingRound, setDeletingRound] = useState(false);

  // Match day filter
  const [filterDay, setFilterDay] = useState<string>("all");

  const fetchTournament = () => {
    if (!tournamentId) return;
    api.get(`/tournaments/${tournamentId}`).then((res) => {
      setTournament(res.data);
    }).catch(() => toast.error("Error al cargar torneo")).finally(() => setLoading(false));
  };

  const fetchRounds = () => {
    if (!tournamentId) return;
    api.get(`/tournaments/${tournamentId}/rounds`).then((res) => {
      setRounds(res.data || []);
    }).catch(() => {});
  };

  const fetchTiebreakers = () => {
    if (!tournamentId) return;
    api.get(`/tournaments/${tournamentId}/tiebreakers`).then((res) => {
      setTiebreakers(res.data || []);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchTournament();
    fetchRounds();
    fetchTiebreakers();
    api.get("/teams?limit=100").then((res) => setAllTeams(res.data.data || [])).catch(() => {});
  }, [tournamentId]);

  const handleAddTeam = async () => {
    if (!addTeamId) return;
    try {
      await api.post(`/tournaments/${tournamentId}/teams/${addTeamId}`);
      toast.success("Equipo agregado al torneo");
      setAddDialogOpen(false);
      setAddTeamId("");
      fetchTournament();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al agregar equipo");
    }
  };

  const handleRemoveTeam = async (teamId: string) => {
    try {
      await api.delete(`/tournaments/${tournamentId}/teams/${teamId}`);
      toast.success("Equipo removido del torneo");
      fetchTournament();
    } catch {
      toast.error("Error al remover equipo");
    }
  };

  const handleGenerateFixture = async () => {
    setFixtureLoading(true);
    try {
      const res = await api.post(`/tournaments/${tournamentId}/generate-fixture`, {
        legs: Number(fixtureConfig.legs),
        intervalDays: Number(fixtureConfig.intervalDays),
        matchTime: fixtureConfig.matchTime,
        startDate: fixtureConfig.startDate || undefined,
        defaultVenue: fixtureConfig.defaultVenue || undefined,
      });
      toast.success(res.data.message || "Fixture generado exitosamente");
      setFixtureDialogOpen(false);
      fetchTournament();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al generar fixture");
    } finally {
      setFixtureLoading(false);
    }
  };

  const handleDeleteFixture = async () => {
    setDeletingFixture(true);
    try {
      const res = await api.delete(`/tournaments/${tournamentId}/fixture`);
      toast.success(res.data.message || "Fixture eliminado");
      setDeleteFixtureOpen(false);
      fetchTournament();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al eliminar fixture");
    } finally {
      setDeletingFixture(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/tournaments/${tournamentId}/export-excel`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `torneo_${tournament?.name || tournamentId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel exportado exitosamente");
    } catch {
      toast.error("Error al exportar Excel");
    } finally {
      setExporting(false);
    }
  };

  const handleSaveName = async () => {
    if (!editNameValue.trim() || editNameValue.trim() === tournament?.name) {
      setEditingName(false);
      return;
    }
    try {
      await api.patch(`/tournaments/${tournamentId}`, { name: editNameValue.trim() });
      toast.success("Nombre del torneo actualizado");
      setEditingName(false);
      fetchTournament();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar nombre");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.patch(`/tournaments/${tournamentId}`, { status: newStatus });
      toast.success("Estado actualizado");
      fetchTournament();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  // Rounds handlers
  const handleCreateRound = async () => {
    try {
      await api.post(`/tournaments/${tournamentId}/rounds`, {
        roundNumber: Number(roundForm.roundNumber),
        name: roundForm.name || undefined,
        type: roundForm.type,
        teamsAdvancing: roundForm.teamsAdvancing ? Number(roundForm.teamsAdvancing) : undefined,
        legs: Number(roundForm.legs),
      });
      toast.success("Ronda creada");
      setRoundDialogOpen(false);
      setRoundForm({ roundNumber: "", name: "", type: "ROUND_ROBIN", teamsAdvancing: "", legs: "1" });
      fetchRounds();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al crear ronda");
    }
  };

  const handleDeleteRound = async () => {
    if (!deleteRoundTarget) return;
    setDeletingRound(true);
    try {
      await api.delete(`/tournaments/rounds/${deleteRoundTarget}`);
      toast.success("Ronda eliminada");
      setDeleteRoundTarget(null);
      fetchRounds();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al eliminar ronda");
    } finally {
      setDeletingRound(false);
    }
  };

  // Tiebreakers handlers
  const openTiebreakerConfig = () => {
    if (tiebreakers.length > 0) {
      setTiebreakerList(tiebreakers.map((t: any) => ({ criteria: t.criteria, priority: t.priority })));
    } else {
      setTiebreakerList([
        { criteria: "GOAL_DIFFERENCE", priority: 1 },
        { criteria: "GOALS_FOR", priority: 2 },
        { criteria: "HEAD_TO_HEAD", priority: 3 },
      ]);
    }
    setTiebreakerDialogOpen(true);
  };

  const handleSaveTiebreakers = async () => {
    try {
      await api.post(`/tournaments/${tournamentId}/tiebreakers`, {
        tiebreakers: tiebreakerList,
      });
      toast.success("Criterios de desempate guardados");
      setTiebreakerDialogOpen(false);
      fetchTiebreakers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al guardar criterios");
    }
  };

  const addTiebreakerItem = () => {
    const used = new Set(tiebreakerList.map((t) => t.criteria));
    const next = allTiebreakerOptions.find((o) => !used.has(o));
    if (!next) return;
    setTiebreakerList([...tiebreakerList, { criteria: next, priority: tiebreakerList.length + 1 }]);
  };

  const removeTiebreakerItem = (index: number) => {
    const updated = tiebreakerList.filter((_, i) => i !== index).map((t, i) => ({ ...t, priority: i + 1 }));
    setTiebreakerList(updated);
  };

  const moveTiebreaker = (index: number, direction: "up" | "down") => {
    const newList = [...tiebreakerList];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newList.length) return;
    [newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]];
    setTiebreakerList(newList.map((t, i) => ({ ...t, priority: i + 1 })));
  };

  if (loading) return <p className="text-muted-foreground p-6">Cargando...</p>;
  if (!tournament) return <p className="text-muted-foreground p-6">Torneo no encontrado.</p>;

  const tournamentTeamIds = new Set(tournament.teams?.map((t: any) => t.teamId) || []);
  const availableTeams = allTeams.filter((t) => !tournamentTeamIds.has(t.id));
  const status = statusLabels[tournament.status] || { label: tournament.status, className: "" };

  // Get unique day numbers for match filter
  const dayNumbers = Array.from(new Set((tournament.matches || []).map((m: any) => m.dayNumber).filter(Boolean)) as Set<number>).sort((a, b) => a - b);
  const filteredMatches = filterDay === "all"
    ? (tournament.matches || [])
    : (tournament.matches || []).filter((m: any) => String(m.dayNumber) === filterDay);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tournaments"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  className="text-2xl font-bold h-10"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <Button size="icon" variant="ghost" onClick={handleSaveName}>
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{tournament.name}</h1>
                {canManage && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditNameValue(tournament.name); setEditingName(true); }}>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={status.className}>{status.label}</Badge>
            <span className="text-sm text-muted-foreground">{typeLabels[tournament.type] || tournament.type}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={exporting}>
            <Download className="h-4 w-4 mr-1" />
            {exporting ? "Exportando..." : "Excel"}
          </Button>
          {canManage && (
            <>
              {tournament.status === "DRAFT" && (
                <Button size="sm" onClick={() => handleStatusChange("PUBLISHED")}>Publicar</Button>
              )}
              {tournament.status === "PUBLISHED" && (
                <Button size="sm" onClick={() => handleStatusChange("IN_PROGRESS")}>Iniciar</Button>
              )}
              {tournament.status === "IN_PROGRESS" && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange("FINISHED")}>Finalizar</Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{typeLabels[tournament.type] || tournament.type}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Equipos</p>
              <p className="font-medium">{tournament.teams?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Swords className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Partidos</p>
              <p className="font-medium">{tournament.matches?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Puntos</p>
            <p className="font-medium">{tournament.winPoints}V / {tournament.drawPoints}E / {tournament.lossPoints}D</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">Equipos</TabsTrigger>
          <TabsTrigger value="matches">Partidos</TabsTrigger>
          <TabsTrigger value="rounds">Rondas</TabsTrigger>
          <TabsTrigger value="tiebreakers">Desempate</TabsTrigger>
        </TabsList>

        <TabsContent value="teams">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Equipos Inscritos</CardTitle>
              {canManage && availableTeams.length > 0 && (
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-2" />Agregar</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar Equipo al Torneo</DialogTitle>
                      <DialogDescription>Selecciona un equipo para inscribirlo.</DialogDescription>
                    </DialogHeader>
                    <Select value={addTeamId} onValueChange={setAddTeamId}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                      <SelectContent>
                        {availableTeams.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddTeam} disabled={!addTeamId}>Agregar</Button>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {(!tournament.teams || tournament.teams.length === 0) ? (
                <p className="text-muted-foreground text-sm text-center py-6">No hay equipos inscritos.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tournament.teams.map((tt: any) => (
                    <div key={tt.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {tt.team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{tt.team.name}</p>
                          {tt.groupName && <p className="text-xs text-muted-foreground">Grupo {tt.groupName}</p>}
                        </div>
                      </div>
                      {canManage && (
                        <Button size="icon" variant="ghost" onClick={() => handleRemoveTeam(tt.teamId)}>
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Partidos</CardTitle>
              <div className="flex gap-2 items-center flex-wrap">
                {dayNumbers.length > 1 && (
                  <Select value={filterDay} onValueChange={setFilterDay}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="Jornada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las jornadas</SelectItem>
                      {dayNumbers.map((d: any) => (
                        <SelectItem key={d} value={String(d)}>Jornada {d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {canManage && (
                  <>
                    {tournament.teams?.length >= 2 && (
                      <Dialog open={fixtureDialogOpen} onOpenChange={setFixtureDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Calendar className="h-4 w-4 mr-2" />Generar Fixture
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Generar Fixture</DialogTitle>
                            <DialogDescription>
                              Configura las opciones para generar el fixture automaticamente.
                              Tipo: {typeLabels[tournament.type] || tournament.type} | {tournament.teams?.length || 0} equipos
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {(tournament.type === "LEAGUE" || tournament.type === "GROUPS") && (
                              <div className="space-y-2">
                                <Label>Modalidad</Label>
                                <Select value={fixtureConfig.legs} onValueChange={(v) => setFixtureConfig(prev => ({ ...prev, legs: v }))}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Solo ida</SelectItem>
                                    <SelectItem value="2">Ida y vuelta</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label>Fecha de inicio</Label>
                              <Input
                                type="date"
                                value={fixtureConfig.startDate}
                                onChange={(e) => setFixtureConfig(prev => ({ ...prev, startDate: e.target.value }))}
                                placeholder="Usa la fecha del torneo si no se especifica"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Dias entre jornadas</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={fixtureConfig.intervalDays}
                                  onChange={(e) => setFixtureConfig(prev => ({ ...prev, intervalDays: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Hora de partidos</Label>
                                <Input
                                  type="time"
                                  value={fixtureConfig.matchTime}
                                  onChange={(e) => setFixtureConfig(prev => ({ ...prev, matchTime: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Sede por defecto (opcional)</Label>
                              <Input
                                value={fixtureConfig.defaultVenue}
                                onChange={(e) => setFixtureConfig(prev => ({ ...prev, defaultVenue: e.target.value }))}
                                placeholder="Ej: Cancha Municipal"
                              />
                            </div>
                            <Button onClick={handleGenerateFixture} disabled={fixtureLoading} className="w-full">
                              {fixtureLoading ? "Generando..." : "Generar Fixture"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {tournament.matches?.length > 0 && (
                      <Button size="sm" variant="destructive" onClick={() => setDeleteFixtureOpen(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />Eliminar Fixture
                      </Button>
                    )}
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/matches/new`}><Plus className="h-4 w-4 mr-2" />Manual</Link>
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredMatches.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No hay partidos programados.</p>
              ) : (
                <div className="space-y-2">
                  {filteredMatches.map((m: any) => {
                    const teamA = tournament.teams?.find((tt: any) => tt.teamId === m.teamAId)?.team;
                    const teamB = tournament.teams?.find((tt: any) => tt.teamId === m.teamBId)?.team;
                    return (
                      <Link key={m.id} href={`/dashboard/matches/detalle?id=${m.id}`}>
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="text-xs text-muted-foreground min-w-[60px]">
                              {m.dayNumber ? `J${m.dayNumber}` : ""}<br />
                              {new Date(m.scheduledAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                            </div>
                            <span className="font-medium">{teamA?.name || m.teamAId}</span>
                            <span className="text-primary font-bold">
                              {m.status === "SCHEDULED" ? "vs" : `${m.scoreA ?? 0} - ${m.scoreB ?? 0}`}
                            </span>
                            <span className="font-medium">{teamB?.name || m.teamBId}</span>
                          </div>
                          <Badge variant="outline" className={
                            m.status === "FINISHED" ? "bg-gray-100 text-gray-800" :
                            m.status === "IN_PROGRESS" ? "bg-green-100 text-green-800" :
                            "bg-blue-100 text-blue-800"
                          }>
                            {statusLabels[m.status]?.label || m.status}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rounds tab */}
        <TabsContent value="rounds">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5" />
                Rondas del Torneo
              </CardTitle>
              {canManage && (
                <Dialog open={roundDialogOpen} onOpenChange={setRoundDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nueva Ronda</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Ronda</DialogTitle>
                      <DialogDescription>Define una nueva ronda o fase del torneo.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Numero de ronda *</Label>
                          <Input
                            type="number"
                            min={1}
                            value={roundForm.roundNumber}
                            onChange={(e) => setRoundForm(prev => ({ ...prev, roundNumber: e.target.value }))}
                            placeholder="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Vueltas (ida/vuelta)</Label>
                          <Select value={roundForm.legs} onValueChange={(v) => setRoundForm(prev => ({ ...prev, legs: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Solo ida</SelectItem>
                              <SelectItem value="2">Ida y vuelta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Nombre (opcional)</Label>
                        <Input
                          value={roundForm.name}
                          onChange={(e) => setRoundForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ej: Fase de Grupos, Cuartos de Final"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de ronda *</Label>
                        <Select value={roundForm.type} onValueChange={(v) => setRoundForm(prev => ({ ...prev, type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(roundTypeLabels).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Equipos que avanzan (opcional)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={roundForm.teamsAdvancing}
                          onChange={(e) => setRoundForm(prev => ({ ...prev, teamsAdvancing: e.target.value }))}
                          placeholder="Ej: 8"
                        />
                      </div>
                      <Button onClick={handleCreateRound} disabled={!roundForm.roundNumber} className="w-full">
                        Crear Ronda
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {rounds.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">
                  No hay rondas configuradas. {canManage && "Crea una para organizar las fases del torneo."}
                </p>
              ) : (
                <div className="space-y-3">
                  {rounds.sort((a: any, b: any) => a.roundNumber - b.roundNumber).map((round: any) => (
                    <div key={round.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {round.roundNumber}
                        </div>
                        <div>
                          <p className="font-medium">{round.name || `Ronda ${round.roundNumber}`}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs">{roundTypeLabels[round.type] || round.type}</Badge>
                            {round.legs > 1 && <span className="text-xs text-muted-foreground">Ida y vuelta</span>}
                            {round.teamsAdvancing && <span className="text-xs text-muted-foreground">Avanzan {round.teamsAdvancing}</span>}
                          </div>
                        </div>
                      </div>
                      {canManage && (
                        <Button size="icon" variant="ghost" onClick={() => setDeleteRoundTarget(round.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tiebreakers tab */}
        <TabsContent value="tiebreakers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Criterios de Desempate
              </CardTitle>
              {canManage && (
                <Button size="sm" onClick={openTiebreakerConfig}>
                  <Settings2 className="h-4 w-4 mr-2" />Configurar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {tiebreakers.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">
                  No hay criterios de desempate configurados. {canManage && "Se usara el orden por defecto (diferencia de goles, goles a favor)."}
                </p>
              ) : (
                <div className="space-y-2">
                  {tiebreakers.sort((a: any, b: any) => a.priority - b.priority).map((tb: any) => (
                    <div key={tb.id || tb.criteria} className="flex items-center gap-3 p-3 border rounded-lg">
                      <span className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {tb.priority}
                      </span>
                      <span className="font-medium text-sm">{tiebreakerLabels[tb.criteria] || tb.criteria}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tiebreaker config dialog */}
          <Dialog open={tiebreakerDialogOpen} onOpenChange={setTiebreakerDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configurar Criterios de Desempate</DialogTitle>
                <DialogDescription>Ordena los criterios por prioridad. El primero se evalua primero.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {tiebreakerList.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                    <span className="text-xs font-bold text-muted-foreground w-5">{index + 1}</span>
                    <Select
                      value={item.criteria}
                      onValueChange={(v) => {
                        const updated = [...tiebreakerList];
                        updated[index] = { ...updated[index], criteria: v };
                        setTiebreakerList(updated);
                      }}
                    >
                      <SelectTrigger className="flex-1 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allTiebreakerOptions.map((opt) => (
                          <SelectItem key={opt} value={opt} disabled={tiebreakerList.some((t, i) => i !== index && t.criteria === opt)}>
                            {tiebreakerLabels[opt]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveTiebreaker(index, "up")} disabled={index === 0}>
                        <span className="text-xs">▲</span>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => moveTiebreaker(index, "down")} disabled={index === tiebreakerList.length - 1}>
                        <span className="text-xs">▼</span>
                      </Button>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeTiebreakerItem(index)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {tiebreakerList.length < allTiebreakerOptions.length && (
                <Button variant="outline" size="sm" onClick={addTiebreakerItem}>
                  <Plus className="h-4 w-4 mr-2" />Agregar criterio
                </Button>
              )}
              <Button onClick={handleSaveTiebreakers} className="w-full">
                Guardar Criterios
              </Button>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Delete fixture confirmation */}
      <Dialog open={deleteFixtureOpen} onOpenChange={setDeleteFixtureOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar fixture</DialogTitle>
            <DialogDescription>
              ¿Desea eliminar todos los partidos no jugados del torneo <strong>"{tournament.name}"</strong>?
              Los partidos ya finalizados no se veran afectados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFixtureOpen(false)} disabled={deletingFixture}>
              No, cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteFixture} disabled={deletingFixture}>
              {deletingFixture ? "Eliminando..." : "Si, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete round confirmation */}
      <Dialog open={!!deleteRoundTarget} onOpenChange={(open) => { if (!open) setDeleteRoundTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar ronda</DialogTitle>
            <DialogDescription>
              ¿Desea eliminar esta ronda del torneo?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRoundTarget(null)} disabled={deletingRound}>
              No, cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteRound} disabled={deletingRound}>
              {deletingRound ? "Eliminando..." : "Si, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
