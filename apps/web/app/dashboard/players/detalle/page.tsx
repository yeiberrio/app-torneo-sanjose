"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, User, Shield, Target, AlertTriangle,
  Clock, Calendar, MapPin, Ruler, Weight,
} from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

const positionLabels: Record<string, string> = {
  GOALKEEPER: "Portero",
  DEFENDER: "Defensa",
  MIDFIELDER: "Mediocampista",
  FORWARD: "Delantero",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Activo", color: "bg-green-100 text-green-800" },
  SUSPENDED: { label: "Suspendido", color: "bg-red-100 text-red-800" },
  INJURED: { label: "Lesionado", color: "bg-orange-100 text-orange-800" },
  INACTIVE: { label: "Inactivo", color: "bg-gray-100 text-gray-800" },
};

const matchStatusLabels: Record<string, string> = {
  SCHEDULED: "Programado", IN_PROGRESS: "En juego", HALFTIME: "Entretiempo",
  FINISHED: "Finalizado", SUSPENDED: "Suspendido", CANCELLED: "Cancelado", POSTPONED: "Aplazado",
};

const sanctionTypeLabels: Record<string, string> = {
  YELLOW_ACCUMULATION: "Acumulacion Amarillas",
  RED_CARD: "Tarjeta Roja",
  CONDUCT: "Conducta",
  ADMINISTRATIVE: "Administrativa",
};

const eventTypeIcons: Record<string, string> = {
  GOAL: "⚽", OWN_GOAL: "⚽🔴", YELLOW_CARD: "🟨", BLUE_CARD: "🟦",
  RED_CARD: "🟥", YELLOW_RED_CARD: "🟨🟥", SUBSTITUTION_IN: "🔼",
  SUBSTITUTION_OUT: "🔽", FOUL: "⚠️", PENALTY_SCORED: "⚽🎯", PENALTY_MISSED: "❌",
};

const eventTypeLabels: Record<string, string> = {
  GOAL: "Gol", OWN_GOAL: "Autogol", YELLOW_CARD: "Amarilla", BLUE_CARD: "Azul",
  RED_CARD: "Roja", YELLOW_RED_CARD: "Doble Amarilla", SUBSTITUTION_IN: "Entra",
  SUBSTITUTION_OUT: "Sale", FOUL: "Falta", PENALTY_SCORED: "Penal anotado", PENALTY_MISSED: "Penal fallado",
};

export default function PlayerDetailPage() {
  const searchParams = useSearchParams();
  const playerId = searchParams.get("id");
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) return;
    api.get(`/players/${playerId}`)
      .then((res) => setPlayer(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) return <p className="text-muted-foreground p-6">Cargando jugador...</p>;
  if (!player) return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Jugador no encontrado.</p>
      <Button asChild variant="outline" className="mt-4"><Link href="/dashboard/players">Volver</Link></Button>
    </div>
  );

  const teamMap: Record<string, string> = player._teamMap || {};
  const stats = player.stats || [];
  const events = player.events || [];
  const sanctions = player.sanctions || [];
  const st = player.status ? statusLabels[player.status] : null;

  // Count events by type
  const eventCounts: Record<string, number> = {};
  events.forEach((e: any) => { eventCounts[e.type] = (eventCounts[e.type] || 0) + 1; });

  // Build match-level data from events (since MatchPlayerStat is often empty)
  const matchEventsMap: Record<string, { matchId: string; match: any; goals: number; ownGoals: number; yellowCards: number; blueCards: number; redCards: number; fouls: number; penaltyScored: number; penaltyMissed: number }> = {};
  events.forEach((e: any) => {
    const mid = e.match?.id || e.matchId;
    if (!mid) return;
    if (!matchEventsMap[mid]) {
      matchEventsMap[mid] = { matchId: mid, match: e.match, goals: 0, ownGoals: 0, yellowCards: 0, blueCards: 0, redCards: 0, fouls: 0, penaltyScored: 0, penaltyMissed: 0 };
    }
    const m = matchEventsMap[mid];
    if (e.type === "GOAL") m.goals++;
    else if (e.type === "OWN_GOAL") m.ownGoals++;
    else if (e.type === "YELLOW_CARD") m.yellowCards++;
    else if (e.type === "BLUE_CARD") m.blueCards++;
    else if (e.type === "RED_CARD") m.redCards++;
    else if (e.type === "YELLOW_RED_CARD") m.redCards++;
    else if (e.type === "FOUL") m.fouls++;
    else if (e.type === "PENALTY_SCORED") { m.penaltyScored++; m.goals++; }
    else if (e.type === "PENALTY_MISSED") m.penaltyMissed++;
  });
  const matchEventsList = Object.values(matchEventsMap);

  // Calculate totals from events
  const totals = {
    matchesPlayed: matchEventsList.length,
    goals: (eventCounts["GOAL"] || 0) + (eventCounts["PENALTY_SCORED"] || 0),
    ownGoals: eventCounts["OWN_GOAL"] || 0,
    assists: stats.reduce((a: number, s: any) => a + (s.assists || 0), 0),
    yellowCards: eventCounts["YELLOW_CARD"] || 0,
    blueCards: eventCounts["BLUE_CARD"] || 0,
    redCards: (eventCounts["RED_CARD"] || 0) + (eventCounts["YELLOW_RED_CARD"] || 0),
    fouls: eventCounts["FOUL"] || 0,
    minutesPlayed: stats.reduce((a: number, s: any) => a + (s.minutesPlayed || 0), 0),
    penaltyScored: eventCounts["PENALTY_SCORED"] || 0,
    penaltyMissed: eventCounts["PENALTY_MISSED"] || 0,
  };

  // Age calculation
  const age = player.birthDate ? Math.floor((Date.now() - new Date(player.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  const getOpponent = (match: any) => {
    const isTeamA = match.teamAId === player.teamId;
    const oppId = isTeamA ? match.teamBId : match.teamAId;
    return teamMap[oppId] || "Rival";
  };

  const getResult = (match: any) => {
    if (match.status !== "FINISHED") return null;
    const isTeamA = match.teamAId === player.teamId;
    const gf = isTeamA ? match.scoreA : match.scoreB;
    const ga = isTeamA ? match.scoreB : match.scoreA;
    if (gf > ga) return { label: "V", color: "text-green-600 bg-green-50" };
    if (gf < ga) return { label: "D", color: "text-red-600 bg-red-50" };
    return { label: "E", color: "text-yellow-600 bg-yellow-50" };
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/dashboard/players"><ArrowLeft className="h-4 w-4 mr-2" />Volver a jugadores</Link>
      </Button>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            {player.photoUrl ? (
              <img src={player.photoUrl} alt={player.firstName} className="h-24 w-24 rounded-2xl object-cover shadow-md" />
            ) : (
              <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold shadow-md">
                {player.jerseyNumber || <User className="h-10 w-10" />}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{player.firstName} {player.lastName}</h1>
                {player.jerseyNumber && (
                  <span className="text-2xl font-bold text-primary">#{player.jerseyNumber}</span>
                )}
                {st && <Badge className={`${st.color} text-xs`}>{st.label}</Badge>}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {player.position && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    {positionLabels[player.position] || player.position}
                  </span>
                )}
                {player.team && (
                  <Link href={`/dashboard/teams/detalle?id=${player.team.id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Shield className="h-3.5 w-3.5" />
                    {player.team.name}
                  </Link>
                )}
                {age !== null && (
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{age} anos</span>
                )}
                {player.nationality && (
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{player.nationality}</span>
                )}
                {player.heightCm && (
                  <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{player.heightCm} cm</span>
                )}
                {player.weightKg && (
                  <span className="flex items-center gap-1"><Weight className="h-3.5 w-3.5" />{player.weightKg} kg</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats summary */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3 mb-6">
        {[
          { label: "Partidos", value: totals.matchesPlayed, icon: "🏟️" },
          { label: "Goles", value: totals.goals, icon: "⚽" },
          { label: "Autogoles", value: totals.ownGoals, icon: "⚽🔴", hide: totals.ownGoals === 0 },
          { label: "Asistencias", value: totals.assists, icon: "👟" },
          { label: "Amarillas", value: totals.yellowCards, icon: "🟨" },
          { label: "Azules", value: totals.blueCards, icon: "🟦", hide: totals.blueCards === 0 },
          { label: "Rojas", value: totals.redCards, icon: "🟥" },
          { label: "Faltas", value: totals.fouls, icon: "⚠️" },
          { label: "Penales", value: `${totals.penaltyScored}/${totals.penaltyScored + totals.penaltyMissed}`, icon: "🎯", hide: totals.penaltyScored + totals.penaltyMissed === 0 },
          { label: "Minutos", value: totals.minutesPlayed, icon: "⏱️", hide: totals.minutesPlayed === 0 },
        ].filter(s => !s.hide).map((stat) => (
          <Card key={stat.label} className="animate-scale-in">
            <CardContent className="p-3 text-center">
              <p className="text-lg mb-0.5">{stat.icon}</p>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matches">
        <TabsList className="mb-4">
          <TabsTrigger value="matches">Partidos ({matchEventsList.length})</TabsTrigger>
          <TabsTrigger value="events">Eventos ({events.length})</TabsTrigger>
          <TabsTrigger value="sanctions">Sanciones ({sanctions.length})</TabsTrigger>
        </TabsList>

        {/* Matches tab */}
        <TabsContent value="matches">
          {matchEventsList.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Sin partidos registrados.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {matchEventsList.map((me) => {
                const m = me.match;
                if (!m) return null;
                const opponent = getOpponent(m);
                const result = getResult(m);
                const isTeamA = m.teamAId === player.teamId;
                return (
                  <Link key={me.matchId} href={`/dashboard/matches/detalle?id=${me.matchId}`}>
                    <Card className="card-hover cursor-pointer">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${result ? result.color : "bg-blue-50 text-blue-600"}`}>
                            {result ? result.label : "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">vs {opponent}</span>
                              {m.status === "FINISHED" && (
                                <span className="text-muted-foreground">
                                  ({isTeamA ? m.scoreA : m.scoreB} - {isTeamA ? m.scoreB : m.scoreA})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>{new Date(m.scheduledAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-xs flex-wrap justify-end">
                            {me.goals > 0 && <Badge variant="secondary" className="text-xs">⚽ {me.goals}</Badge>}
                            {me.ownGoals > 0 && <Badge variant="secondary" className="text-xs">⚽🔴 {me.ownGoals}</Badge>}
                            {me.yellowCards > 0 && <Badge className="text-xs bg-yellow-100 text-yellow-800">🟨 {me.yellowCards}</Badge>}
                            {me.blueCards > 0 && <Badge className="text-xs bg-blue-100 text-blue-800">🟦 {me.blueCards}</Badge>}
                            {me.redCards > 0 && <Badge className="text-xs bg-red-100 text-red-800">🟥 {me.redCards}</Badge>}
                            {me.fouls > 0 && <Badge variant="outline" className="text-xs">⚠️ {me.fouls}</Badge>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Events tab */}
        <TabsContent value="events">
          {events.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Sin eventos registrados.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                {/* Event type summary */}
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
                  {Object.entries(eventCounts).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="text-sm">
                      {eventTypeIcons[type] || "📌"} {eventTypeLabels[type] || type}: {count}
                    </Badge>
                  ))}
                </div>

                {/* Event list */}
                <div className="space-y-2">
                  {events.map((e: any) => {
                    const opponent = e.match ? getOpponent(e.match) : "";
                    return (
                      <div key={e.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <span className="text-lg w-8 text-center">{eventTypeIcons[e.type] || "📌"}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{eventTypeLabels[e.type] || e.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.minute ? `Min ${e.minute}' · ` : ""}
                            vs {opponent}
                            {e.match?.scheduledAt && ` · ${new Date(e.match.scheduledAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}`}
                          </p>
                          {e.description && <p className="text-xs text-muted-foreground italic">{e.description}</p>}
                        </div>
                        {e.minute && (
                          <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{e.minute}'</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sanctions tab */}
        <TabsContent value="sanctions">
          {sanctions.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Sin sanciones registradas.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {sanctions.map((s: any) => (
                <Card key={s.id} className={!s.isActive ? "opacity-60" : ""}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${s.isActive ? "bg-red-100" : "bg-green-100"}`}>
                      <AlertTriangle className={`h-5 w-5 ${s.isActive ? "text-red-600" : "text-green-600"}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={s.isActive ? "destructive" : "secondary"} className="text-xs">
                          {sanctionTypeLabels[s.type] || s.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {s.matchesServed}/{s.matchesBanned} partido(s)
                        </Badge>
                        {!s.isActive && <Badge className="text-xs bg-green-100 text-green-800">Cumplida</Badge>}
                      </div>
                      {s.reason && <p className="text-sm text-muted-foreground mt-1">{s.reason}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        Impuesta: {new Date(s.imposedAt).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
