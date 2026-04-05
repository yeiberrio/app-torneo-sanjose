"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Clock, CircleDot, Wifi, WifiOff, CalendarClock, Edit, Trash2, ShieldAlert, ShieldBan, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";

const statusLabels: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: "Programado", className: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "En juego", className: "bg-green-100 text-green-800" },
  HALFTIME: { label: "Entretiempo", className: "bg-yellow-100 text-yellow-800" },
  FINISHED: { label: "Finalizado", className: "bg-gray-100 text-gray-800" },
  SUSPENDED: { label: "Suspendido", className: "bg-red-100 text-red-800" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-800" },
  POSTPONED: { label: "Aplazado", className: "bg-orange-100 text-orange-800" },
};

const eventTypeLabels: Record<string, { label: string; icon: string }> = {
  GOAL: { label: "Gol", icon: "⚽" },
  OWN_GOAL: { label: "Autogol", icon: "⚽🔴" },
  YELLOW_CARD: { label: "Tarjeta Amarilla", icon: "🟨" },
  BLUE_CARD: { label: "Tarjeta Azul", icon: "🟦" },
  RED_CARD: { label: "Tarjeta Roja", icon: "🟥" },
  YELLOW_RED_CARD: { label: "Doble Amarilla", icon: "🟨🟥" },
  SUBSTITUTION_IN: { label: "Entra", icon: "🔼" },
  SUBSTITUTION_OUT: { label: "Sale", icon: "🔽" },
  FOUL: { label: "Falta", icon: "⚠️" },
  PENALTY_SCORED: { label: "Penal anotado", icon: "⚽🎯" },
  PENALTY_MISSED: { label: "Penal fallado", icon: "❌" },
};

const statusFlow: Record<string, string[]> = {
  SCHEDULED: ["IN_PROGRESS", "POSTPONED", "CANCELLED"],
  IN_PROGRESS: ["HALFTIME", "FINISHED", "SUSPENDED"],
  HALFTIME: ["IN_PROGRESS"],
  SUSPENDED: ["IN_PROGRESS", "CANCELLED", "POSTPONED"],
  POSTPONED: ["SCHEDULED"],
  CANCELLED: ["SCHEDULED"],
};

export default function MatchDetailPage() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("id");
  const { user } = useAuthStore();
  const canManageMatch = user ? can(user.role, "update", "Match") : false;
  const canManageEvents = user ? can(user.role, "create", "MatchEvent") : false;
  const canDeleteEvents = user ? can(user.role, "delete", "MatchEvent") : false;

  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playersA, setPlayersA] = useState<any[]>([]);
  const [playersB, setPlayersB] = useState<any[]>([]);
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    teamId: "",
    playerId: "",
    type: "GOAL",
    minute: "",
    description: "",
  });

  // Player-centric event entry state
  const [playerEventOpen, setPlayerEventOpen] = useState(false);
  const [selectedTeamForPlayer, setSelectedTeamForPlayer] = useState("");
  const [selectedPlayerForEvents, setSelectedPlayerForEvents] = useState("");
  const [playerEventForm, setPlayerEventForm] = useState({
    goals: 0,
    ownGoals: 0,
    yellowCards: 0,
    blueCards: 0,
    redCards: 0,
    fouls: 0,
    penaltyScored: 0,
    penaltyMissed: 0,
    minuteGoals: "" as string,
    minuteCards: "" as string,
  });
  const [savingPlayerEvents, setSavingPlayerEvents] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({
    scheduledAt: "",
    venue: "",
  });

  // Edit finished match state
  const [editMatchOpen, setEditMatchOpen] = useState(false);
  const [editMatchForm, setEditMatchForm] = useState({
    scoreA: "",
    scoreB: "",
  });

  // Blocked players state
  const [blockedPlayerIds, setBlockedPlayerIds] = useState<Set<string>>(new Set());

  const socketRef = useRef<Socket | null>(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!matchId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const socket = io(`${apiUrl}/matches`, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setWsConnected(true);
      socket.emit("joinMatch", matchId);
    });

    socket.on("disconnect", () => setWsConnected(false));

    socket.on("scoreUpdate", (data: { scoreA: number; scoreB: number }) => {
      setMatch((prev: any) => prev ? { ...prev, scoreA: data.scoreA, scoreB: data.scoreB } : prev);
    });

    socket.on("statusUpdate", (data: { status: string }) => {
      setMatch((prev: any) => prev ? { ...prev, status: data.status } : prev);
    });

    socket.on("matchEvent", (event: any) => {
      setMatch((prev: any) => {
        if (!prev) return prev;
        const exists = prev.events?.some((e: any) => e.id === event.id);
        if (exists) return prev;
        return { ...prev, events: [...(prev.events || []), event].sort((a: any, b: any) => (a.minute || 0) - (b.minute || 0)) };
      });
      toast.info("Nuevo evento en el partido");
    });

    return () => {
      socket.emit("leaveMatch", matchId);
      socket.disconnect();
    };
  }, [matchId]);

  const fetchMatch = () => {
    if (!matchId) return;
    api.get(`/matches/${matchId}`).then((res) => {
      setMatch(res.data);
      // Fetch team names and players
      Promise.all([
        api.get(`/teams/${res.data.teamAId}`).catch(() => ({ data: { name: res.data.teamAId, players: [] } })),
        api.get(`/teams/${res.data.teamBId}`).catch(() => ({ data: { name: res.data.teamBId, players: [] } })),
      ]).then(([aRes, bRes]) => {
        setTeamAName(aRes.data.name);
        setTeamBName(bRes.data.name);
        setPlayersA(aRes.data.players || []);
        setPlayersB(bRes.data.players || []);

        // Check blocked players if tournament exists
        if (res.data.tournamentId) {
          const allPlayers = [...(aRes.data.players || []), ...(bRes.data.players || [])];
          checkBlockedPlayers(allPlayers, res.data.tournamentId);
        }
      });
    }).catch(() => toast.error("Error al cargar partido")).finally(() => setLoading(false));
  };

  const checkBlockedPlayers = async (players: any[], tournamentId: string) => {
    const blocked = new Set<string>();
    for (const player of players) {
      try {
        const res = await api.get(`/sanctions/player/${player.id}/${tournamentId}/status`);
        if (res.data.isBlocked) {
          blocked.add(player.id);
        }
      } catch {
        // silently ignore
      }
    }
    setBlockedPlayerIds(blocked);
  };

  useEffect(() => { fetchMatch(); }, [matchId]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.patch(`/matches/${matchId}/status`, { status: newStatus });
      toast.success(`Estado cambiado a ${statusLabels[newStatus]?.label || newStatus}`);
      fetchMatch();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.teamId || !eventForm.type) {
      toast.error("Equipo y tipo de evento son obligatorios");
      return;
    }
    try {
      const payload: any = {
        teamId: eventForm.teamId,
        type: eventForm.type,
      };
      if (eventForm.playerId) payload.playerId = eventForm.playerId;
      if (eventForm.minute) payload.minute = Number(eventForm.minute);
      if (eventForm.description) payload.description = eventForm.description;
      await api.post(`/matches/${matchId}/events`, payload);
      toast.success("Evento registrado");
      setDialogOpen(false);
      setEventForm({ teamId: "", playerId: "", type: "GOAL", minute: "", description: "" });
      fetchMatch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al registrar evento");
    }
  };

  const getPlayerExistingEvents = () => {
    if (!match?.events || !selectedPlayerForEvents) return { yellowCards: 0, blueCards: 0, redCards: 0 };
    const playerEvents = match.events.filter((e: any) => e.playerId === selectedPlayerForEvents);
    return {
      yellowCards: playerEvents.filter((e: any) => e.type === "YELLOW_CARD").length,
      blueCards: playerEvents.filter((e: any) => e.type === "BLUE_CARD").length,
      redCards: playerEvents.filter((e: any) => e.type === "RED_CARD").length,
    };
  };

  const handleSavePlayerEvents = async () => {
    if (!selectedPlayerForEvents || !selectedTeamForPlayer) {
      toast.error("Selecciona equipo y jugador");
      return;
    }
    setSavingPlayerEvents(true);
    try {
      const events: { type: string; minute?: number }[] = [];

      for (let i = 0; i < playerEventForm.goals; i++) {
        events.push({ type: "GOAL" });
      }
      for (let i = 0; i < playerEventForm.ownGoals; i++) {
        events.push({ type: "OWN_GOAL" });
      }
      for (let i = 0; i < playerEventForm.yellowCards; i++) {
        events.push({ type: "YELLOW_CARD" });
      }
      for (let i = 0; i < playerEventForm.blueCards; i++) {
        events.push({ type: "BLUE_CARD" });
      }
      for (let i = 0; i < playerEventForm.redCards; i++) {
        events.push({ type: "RED_CARD" });
      }
      for (let i = 0; i < playerEventForm.fouls; i++) {
        events.push({ type: "FOUL" });
      }
      for (let i = 0; i < playerEventForm.penaltyScored; i++) {
        events.push({ type: "PENALTY_SCORED" });
      }
      for (let i = 0; i < playerEventForm.penaltyMissed; i++) {
        events.push({ type: "PENALTY_MISSED" });
      }

      if (events.length === 0) {
        toast.error("No hay eventos para registrar");
        setSavingPlayerEvents(false);
        return;
      }

      let errorCount = 0;
      for (const ev of events) {
        try {
          await api.post(`/matches/${matchId}/events`, {
            teamId: selectedTeamForPlayer,
            playerId: selectedPlayerForEvents,
            type: ev.type,
            minute: ev.minute || undefined,
          });
        } catch (err: any) {
          errorCount++;
          toast.error(err.response?.data?.message || `Error al registrar ${ev.type}`);
        }
      }

      if (errorCount === 0) {
        toast.success(`${events.length} evento(s) registrados correctamente`);
      } else {
        toast.warning(`${events.length - errorCount} de ${events.length} eventos registrados`);
      }

      fetchMatch();
      resetPlayerEventForm();
    } catch {
      toast.error("Error al guardar eventos");
    } finally {
      setSavingPlayerEvents(false);
    }
  };

  const resetPlayerEventForm = () => {
    setPlayerEventForm({
      goals: 0, ownGoals: 0, yellowCards: 0, blueCards: 0,
      redCards: 0, fouls: 0, penaltyScored: 0, penaltyMissed: 0,
      minuteGoals: "", minuteCards: "",
    });
  };

  const handleSaveAndSelectAnother = async () => {
    await handleSavePlayerEvents();
    setSelectedPlayerForEvents("");
    resetPlayerEventForm();
  };

  const handleSaveAndGoBack = async () => {
    await handleSavePlayerEvents();
    setPlayerEventOpen(false);
    setSelectedPlayerForEvents("");
    setSelectedTeamForPlayer("");
    resetPlayerEventForm();
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    try {
      await api.delete(`/matches/${matchId}/events/${eventId}`);
      toast.success("Evento eliminado");
      fetchMatch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al eliminar evento");
    }
  };

  const handleReschedule = async () => {
    try {
      const payload: any = {};
      if (rescheduleForm.scheduledAt) payload.scheduledAt = rescheduleForm.scheduledAt;
      if (rescheduleForm.venue) payload.venue = rescheduleForm.venue;
      if (match.status === "POSTPONED" || match.status === "CANCELLED") {
        payload.status = "SCHEDULED";
      }
      await api.patch(`/matches/${matchId}`, payload);
      toast.success("Partido reprogramado exitosamente");
      setRescheduleOpen(false);
      setRescheduleForm({ scheduledAt: "", venue: "" });
      fetchMatch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al reprogramar partido");
    }
  };

  const handleEditFinishedMatch = async () => {
    try {
      const payload: any = {};
      if (editMatchForm.scoreA !== "") payload.scoreA = Number(editMatchForm.scoreA);
      if (editMatchForm.scoreB !== "") payload.scoreB = Number(editMatchForm.scoreB);
      await api.patch(`/matches/${matchId}`, payload);
      toast.success("Partido actualizado");
      setEditMatchOpen(false);
      fetchMatch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al editar partido");
    }
  };

  const openEditFinishedMatch = () => {
    setEditMatchForm({
      scoreA: String(match.scoreA ?? 0),
      scoreB: String(match.scoreB ?? 0),
    });
    setEditMatchOpen(true);
  };

  const handleDeleteMatch = async () => {
    if (!confirm("¿Eliminar este partido? Esta accion no se puede deshacer.")) return;
    try {
      await api.delete(`/matches/${matchId}`);
      toast.success("Partido eliminado");
      window.location.href = "/dashboard/matches";
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al eliminar partido");
    }
  };

  const selectedTeamPlayers = eventForm.teamId === match?.teamAId ? playersA : eventForm.teamId === match?.teamBId ? playersB : [];

  if (loading) return <p className="text-muted-foreground p-6">Cargando partido...</p>;
  if (!match) return <p className="text-muted-foreground p-6">Partido no encontrado.</p>;

  const status = statusLabels[match.status] || { label: match.status, className: "bg-gray-100" };
  const nextStatuses = statusFlow[match.status] || [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/matches"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold flex-1">Planilla de Partido</h1>
        <div className="flex items-center gap-2">
          {canManageMatch && (
            <Button size="sm" variant="destructive" onClick={handleDeleteMatch}>
              <Trash2 className="h-4 w-4 mr-1" />Eliminar
            </Button>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {wsConnected ? (
              <><Wifi className="h-3.5 w-3.5 text-green-500" /><span className="text-green-600">En vivo</span></>
            ) : (
              <><WifiOff className="h-3.5 w-3.5 text-red-500" /><span className="text-red-600">Sin conexion</span></>
            )}
          </div>
        </div>
      </div>

      {/* Blocked players warning */}
      {blockedPlayerIds.size > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <ShieldBan className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Jugadores sancionados en este partido:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {[...playersA, ...playersB].filter(p => blockedPlayerIds.has(p.id)).map(p => (
                <Badge key={p.id} variant="destructive" className="text-xs">
                  #{p.jerseyNumber || "?"} {p.firstName} {p.lastName}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scoreboard */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center mb-2">
            <Badge variant="outline" className={status.className}>{status.label}</Badge>
            {match.tournament && (
              <p className="text-xs text-muted-foreground mt-1">{match.tournament.name}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-8 my-6">
            <div className="text-center flex-1">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mx-auto mb-2">
                {teamAName.substring(0, 2).toUpperCase()}
              </div>
              <p className="font-semibold text-lg">{teamAName}</p>
              <p className="text-xs text-muted-foreground">Local</p>
            </div>

            <div className="text-center">
              <div className="text-5xl font-bold text-primary">
                {match.scoreA ?? 0} - {match.scoreB ?? 0}
              </div>
              {match.venue && (
                <p className="text-xs text-muted-foreground mt-2">{match.venue}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(match.scheduledAt).toLocaleDateString("es-CO", {
                  weekday: "long", day: "2-digit", month: "long", year: "numeric",
                })}
              </p>
            </div>

            <div className="text-center flex-1">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mx-auto mb-2">
                {teamBName.substring(0, 2).toUpperCase()}
              </div>
              <p className="font-semibold text-lg">{teamBName}</p>
              <p className="text-xs text-muted-foreground">Visitante</p>
            </div>
          </div>

          {/* Status actions */}
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {nextStatuses.map((s) => (
              <Button key={s} size="sm"
                variant={s === "FINISHED" ? "default" : s === "CANCELLED" ? "destructive" : "outline"}
                onClick={() => handleStatusChange(s)}
              >
                {statusLabels[s]?.label || s}
              </Button>
            ))}
            {canManageMatch && match.status === "FINISHED" && (
              <Button size="sm" variant="outline" onClick={openEditFinishedMatch}>
                <Edit className="h-4 w-4 mr-2" />Editar Marcador
              </Button>
            )}
            <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <CalendarClock className="h-4 w-4 mr-2" />Reprogramar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reprogramar Partido</DialogTitle>
                  <DialogDescription>Cambia la fecha, hora o sede del partido.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nueva fecha y hora</Label>
                    <Input
                      type="datetime-local"
                      value={rescheduleForm.scheduledAt}
                      onChange={(e) => setRescheduleForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sede</Label>
                    <Input
                      value={rescheduleForm.venue}
                      onChange={(e) => setRescheduleForm(prev => ({ ...prev, venue: e.target.value }))}
                      placeholder={match.venue || "Sede del partido"}
                    />
                  </div>
                  <Button onClick={handleReschedule} className="w-full">
                    Reprogramar Partido
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Edit finished match dialog */}
      <Dialog open={editMatchOpen} onOpenChange={setEditMatchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Marcador</DialogTitle>
            <DialogDescription>Corrige el marcador de un partido finalizado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{teamAName} (Local)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editMatchForm.scoreA}
                  onChange={(e) => setEditMatchForm(prev => ({ ...prev, scoreA: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{teamBName} (Visitante)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editMatchForm.scoreB}
                  onChange={(e) => setEditMatchForm(prev => ({ ...prev, scoreB: e.target.value }))}
                />
              </div>
            </div>
            <Button onClick={handleEditFinishedMatch} className="w-full">Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Events timeline + Add event buttons */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Eventos del Partido</h2>
        {canManageEvents && match.status !== "CANCELLED" && (
          <div className="flex gap-2">
            <Dialog open={playerEventOpen} onOpenChange={(open) => {
              setPlayerEventOpen(open);
              if (!open) { setSelectedPlayerForEvents(""); setSelectedTeamForPlayer(""); resetPlayerEventForm(); }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default"><Users className="h-4 w-4 mr-2" />Registrar por Jugador</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registrar Eventos por Jugador</DialogTitle>
                  <DialogDescription>Selecciona un jugador y registra todos sus eventos del partido.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Team selector */}
                  <div>
                    <Label>Equipo *</Label>
                    <Select value={selectedTeamForPlayer} onValueChange={(v) => { setSelectedTeamForPlayer(v); setSelectedPlayerForEvents(""); resetPlayerEventForm(); }}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={match.teamAId}>{teamAName}</SelectItem>
                        <SelectItem value={match.teamBId}>{teamBName}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Player selector */}
                  {selectedTeamForPlayer && (
                    <div>
                      <Label>Jugador *</Label>
                      <Select value={selectedPlayerForEvents} onValueChange={(v) => { setSelectedPlayerForEvents(v); resetPlayerEventForm(); }}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar jugador" /></SelectTrigger>
                        <SelectContent>
                          {(selectedTeamForPlayer === match.teamAId ? playersA : playersB).map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {blockedPlayerIds.has(p.id) ? "🚫 " : ""}#{p.jerseyNumber || "?"} {p.firstName} {p.lastName}
                              {blockedPlayerIds.has(p.id) ? " (SANCIONADO)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Event counters when player is selected */}
                  {selectedPlayerForEvents && (() => {
                    const existing = getPlayerExistingEvents();
                    const maxYellow = 2 - existing.yellowCards;
                    const maxBlue = 1 - existing.blueCards;
                    const maxRed = 1 - existing.redCards;
                    const selectedPlayer = [...playersA, ...playersB].find(p => p.id === selectedPlayerForEvents);

                    return (
                      <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                        <p className="text-sm font-medium">
                          Eventos para #{selectedPlayer?.jerseyNumber || "?"} {selectedPlayer?.firstName} {selectedPlayer?.lastName}
                        </p>

                        {/* Show existing events for this player */}
                        {(existing.yellowCards > 0 || existing.blueCards > 0 || existing.redCards > 0) && (
                          <div className="text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 rounded p-2">
                            Ya registrados: {existing.yellowCards > 0 ? `${existing.yellowCards} amarilla(s) ` : ""}
                            {existing.blueCards > 0 ? `${existing.blueCards} azul ` : ""}
                            {existing.redCards > 0 ? `${existing.redCards} roja ` : ""}
                          </div>
                        )}

                        {/* Goals */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">⚽ Goles</Label>
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, goals: Math.max(0, f.goals - 1) }))}>-</Button>
                              <span className="w-8 text-center font-bold">{playerEventForm.goals}</span>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, goals: f.goals + 1 }))}>+</Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">⚽🔴 Autogoles</Label>
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, ownGoals: Math.max(0, f.ownGoals - 1) }))}>-</Button>
                              <span className="w-8 text-center font-bold">{playerEventForm.ownGoals}</span>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, ownGoals: f.ownGoals + 1 }))}>+</Button>
                            </div>
                          </div>
                        </div>

                        {/* Cards */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">🟨 Amarillas <span className="text-muted-foreground">(max {maxYellow})</span></Label>
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, yellowCards: Math.max(0, f.yellowCards - 1) }))}>-</Button>
                              <span className="w-8 text-center font-bold">{playerEventForm.yellowCards}</span>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" disabled={playerEventForm.yellowCards >= maxYellow} onClick={() => setPlayerEventForm(f => ({ ...f, yellowCards: Math.min(maxYellow, f.yellowCards + 1) }))}>+</Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">🟦 Azul <span className="text-muted-foreground">(max {maxBlue})</span></Label>
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, blueCards: Math.max(0, f.blueCards - 1) }))}>-</Button>
                              <span className="w-8 text-center font-bold">{playerEventForm.blueCards}</span>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" disabled={playerEventForm.blueCards >= maxBlue} onClick={() => setPlayerEventForm(f => ({ ...f, blueCards: Math.min(maxBlue, f.blueCards + 1) }))}>+</Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">🟥 Roja <span className="text-muted-foreground">(max {maxRed})</span></Label>
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, redCards: Math.max(0, f.redCards - 1) }))}>-</Button>
                              <span className="w-8 text-center font-bold">{playerEventForm.redCards}</span>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" disabled={playerEventForm.redCards >= maxRed} onClick={() => setPlayerEventForm(f => ({ ...f, redCards: Math.min(maxRed, f.redCards + 1) }))}>+</Button>
                            </div>
                          </div>
                        </div>

                        {/* Fouls & penalties */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">⚠️ Faltas</Label>
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, fouls: Math.max(0, f.fouls - 1) }))}>-</Button>
                              <span className="w-8 text-center font-bold">{playerEventForm.fouls}</span>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, fouls: f.fouls + 1 }))}>+</Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">⚽🎯 Penal anotado</Label>
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, penaltyScored: Math.max(0, f.penaltyScored - 1) }))}>-</Button>
                              <span className="w-8 text-center font-bold">{playerEventForm.penaltyScored}</span>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, penaltyScored: f.penaltyScored + 1 }))}>+</Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">❌ Penal fallado</Label>
                            <div className="flex items-center gap-2">
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, penaltyMissed: Math.max(0, f.penaltyMissed - 1) }))}>-</Button>
                              <span className="w-8 text-center font-bold">{playerEventForm.penaltyMissed}</span>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => setPlayerEventForm(f => ({ ...f, penaltyMissed: f.penaltyMissed + 1 }))}>+</Button>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button onClick={handleSaveAndSelectAnother} disabled={savingPlayerEvents} variant="outline" className="flex-1">
                            {savingPlayerEvents ? "Guardando..." : "Guardar y otro jugador"}
                          </Button>
                          <Button onClick={handleSaveAndGoBack} disabled={savingPlayerEvents} className="flex-1">
                            {savingPlayerEvents ? "Guardando..." : "Guardar y volver"}
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </DialogContent>
            </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />Evento individual</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Evento</DialogTitle>
                <DialogDescription>Agrega un evento al partido (gol, tarjeta, sustitucion, etc.)</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <Label>Equipo *</Label>
                  <Select value={eventForm.teamId} onValueChange={(v) => setEventForm({ ...eventForm, teamId: v, playerId: "" })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={match.teamAId}>{teamAName}</SelectItem>
                      <SelectItem value={match.teamBId}>{teamBName}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo de Evento *</Label>
                  <Select value={eventForm.type} onValueChange={(v) => setEventForm({ ...eventForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(eventTypeLabels).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.icon} {val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Jugador</Label>
                  <Select value={eventForm.playerId} onValueChange={(v) => setEventForm({ ...eventForm, playerId: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar jugador" /></SelectTrigger>
                    <SelectContent>
                      {selectedTeamPlayers.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {blockedPlayerIds.has(p.id) ? "🚫 " : ""}#{p.jerseyNumber || "?"} {p.firstName} {p.lastName}
                          {blockedPlayerIds.has(p.id) ? " (SANCIONADO)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minute">Minuto</Label>
                    <Input id="minute" type="number" min={0} max={120} value={eventForm.minute} onChange={(e) => setEventForm({ ...eventForm, minute: e.target.value })} placeholder="45" />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripcion</Label>
                    <Input id="description" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Opcional" />
                  </div>
                </div>

                <Button type="submit" className="w-full">Registrar Evento</Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          {(!match.events || match.events.length === 0) ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay eventos registrados.</p>
          ) : (
            <div className="space-y-2">
              {match.events.map((event: any) => {
                const evLabel = eventTypeLabels[event.type] || { label: event.type, icon: "📌" };
                const isTeamA = event.teamId === match.teamAId;
                return (
                  <div key={event.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isTeamA ? "border-l-4 border-l-blue-500" : "border-r-4 border-r-red-500"}`}>
                    <div className="flex items-center gap-2 min-w-[60px]">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-mono font-medium">{event.minute ? `${event.minute}'` : "--'"}</span>
                    </div>
                    <span className="text-lg">{evLabel.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {evLabel.label}
                        {event.player && (
                          <span className="text-muted-foreground"> - #{event.player.jerseyNumber || "?"} {event.player.firstName} {event.player.lastName}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{isTeamA ? teamAName : teamBName}</p>
                      {event.description && <p className="text-xs text-muted-foreground italic">{event.description}</p>}
                    </div>
                    {canDeleteEvents && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player stats */}
      {match.playerStats && match.playerStats.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Estadisticas de Jugadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-2">Jugador</th>
                    <th className="text-center py-2 px-1">Goles</th>
                    <th className="text-center py-2 px-1">Asist.</th>
                    <th className="text-center py-2 px-1">TA</th>
                    <th className="text-center py-2 px-1">TR</th>
                    <th className="text-center py-2 px-1">Faltas</th>
                    <th className="text-center py-2 px-1">Min</th>
                  </tr>
                </thead>
                <tbody>
                  {match.playerStats.map((ps: any) => (
                    <tr key={ps.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">
                        {blockedPlayerIds.has(ps.playerId) && <ShieldAlert className="h-3.5 w-3.5 text-red-500 inline mr-1" />}
                        #{ps.player?.jerseyNumber || "?"} {ps.player?.firstName} {ps.player?.lastName}
                      </td>
                      <td className="text-center py-2 px-1">{ps.goals || 0}</td>
                      <td className="text-center py-2 px-1">{ps.assists || 0}</td>
                      <td className="text-center py-2 px-1">{ps.yellowCards || 0}</td>
                      <td className="text-center py-2 px-1">{ps.redCards || 0}</td>
                      <td className="text-center py-2 px-1">{ps.fouls || 0}</td>
                      <td className="text-center py-2 px-1">{ps.minutesPlayed || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
