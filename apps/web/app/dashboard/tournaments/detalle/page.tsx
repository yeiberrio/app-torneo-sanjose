"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trophy, Users, Swords, X, Calendar, Trash2 } from "lucide-react";
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

  const fetchTournament = () => {
    if (!tournamentId) return;
    api.get(`/tournaments/${tournamentId}`).then((res) => {
      setTournament(res.data);
    }).catch(() => toast.error("Error al cargar torneo")).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTournament();
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
    if (!confirm("¿Eliminar todos los partidos no jugados? Esta accion no se puede deshacer.")) return;
    try {
      const res = await api.delete(`/tournaments/${tournamentId}/fixture`);
      toast.success(res.data.message || "Fixture eliminado");
      fetchTournament();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al eliminar fixture");
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

  if (loading) return <p className="text-muted-foreground p-6">Cargando...</p>;
  if (!tournament) return <p className="text-muted-foreground p-6">Torneo no encontrado.</p>;

  const tournamentTeamIds = new Set(tournament.teams?.map((t: any) => t.teamId) || []);
  const availableTeams = allTeams.filter((t) => !tournamentTeamIds.has(t.id));
  const status = statusLabels[tournament.status] || { label: tournament.status, className: "" };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tournaments"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={status.className}>{status.label}</Badge>
            <span className="text-sm text-muted-foreground">{typeLabels[tournament.type] || tournament.type}</span>
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            {tournament.status === "DRAFT" && (
              <Button size="sm" onClick={() => handleStatusChange("PUBLISHED")}>Publicar</Button>
            )}
            {tournament.status === "PUBLISHED" && (
              <Button size="sm" onClick={() => handleStatusChange("IN_PROGRESS")}>Iniciar</Button>
            )}
            {tournament.status === "IN_PROGRESS" && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange("FINISHED")}>Finalizar</Button>
            )}
          </div>
        )}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Partidos</CardTitle>
              {canManage && (
                <div className="flex gap-2">
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
                    <Button size="sm" variant="destructive" onClick={handleDeleteFixture}>
                      <Trash2 className="h-4 w-4 mr-2" />Eliminar Fixture
                    </Button>
                  )}
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/matches/new`}><Plus className="h-4 w-4 mr-2" />Manual</Link>
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {(!tournament.matches || tournament.matches.length === 0) ? (
                <p className="text-muted-foreground text-sm text-center py-6">No hay partidos programados.</p>
              ) : (
                <div className="space-y-2">
                  {tournament.matches.map((m: any) => {
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
      </Tabs>
    </div>
  );
}
