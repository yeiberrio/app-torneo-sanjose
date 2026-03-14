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
import { ArrowLeft, Plus, Clock, CircleDot, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";
import { io, Socket } from "socket.io-client";

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
  RED_CARD: { label: "Tarjeta Roja", icon: "🟥" },
  YELLOW_RED_CARD: { label: "Doble Amarilla", icon: "🟨🟥" },
  SUBSTITUTION_IN: { label: "Entra", icon: "🔼" },
  SUBSTITUTION_OUT: { label: "Sale", icon: "🔽" },
  FOUL: { label: "Falta", icon: "⚠️" },
  PENALTY_SCORED: { label: "Penal anotado", icon: "⚽🎯" },
  PENALTY_MISSED: { label: "Penal fallado", icon: "❌" },
};

const statusFlow: Record<string, string[]> = {
  SCHEDULED: ["IN_PROGRESS"],
  IN_PROGRESS: ["HALFTIME", "FINISHED", "SUSPENDED"],
  HALFTIME: ["IN_PROGRESS"],
  SUSPENDED: ["IN_PROGRESS", "CANCELLED"],
};

export default function MatchDetailPage() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("id");
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
  const [wsConnected, setWsConnected] = useState(false);
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
      });
    }).catch(() => toast.error("Error al cargar partido")).finally(() => setLoading(false));
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
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {wsConnected ? (
            <><Wifi className="h-3.5 w-3.5 text-green-500" /><span className="text-green-600">En vivo</span></>
          ) : (
            <><WifiOff className="h-3.5 w-3.5 text-red-500" /><span className="text-red-600">Sin conexion</span></>
          )}
        </div>
      </div>

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
          {nextStatuses.length > 0 && (
            <div className="flex justify-center gap-2 mt-4">
              {nextStatuses.map((s) => (
                <Button key={s} size="sm" variant={s === "FINISHED" ? "default" : "outline"} onClick={() => handleStatusChange(s)}>
                  {statusLabels[s]?.label || s}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events timeline + Add event button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Eventos del Partido</h2>
        {match.status !== "FINISHED" && match.status !== "CANCELLED" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Agregar Evento</Button>
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
                          #{p.jerseyNumber || "?"} {p.firstName} {p.lastName}
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
