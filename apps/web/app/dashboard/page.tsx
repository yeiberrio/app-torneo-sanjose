"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Users, Swords, BarChart3, Target, Shield } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface Standing {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface Scorer {
  playerId: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  teamName: string;
  goals: number;
}

interface Summary {
  totalMatches: number;
  finishedMatches: number;
  pendingMatches: number;
  totalTeams: number;
  totalPlayers: number;
  totalGoals: number;
  avgGoalsPerMatch: number;
}

const quickLinks = [
  { href: "/dashboard/tournaments", label: "Torneos", icon: Trophy, color: "text-green-600 bg-green-100", key: "tournaments" },
  { href: "/dashboard/teams", label: "Equipos", icon: Shield, color: "text-blue-600 bg-blue-100", key: "teams" },
  { href: "/dashboard/matches", label: "Partidos", icon: Swords, color: "text-orange-600 bg-orange-100", key: "matches" },
  { href: "/dashboard/players", label: "Jugadores", icon: Users, color: "text-purple-600 bg-purple-100", key: "players" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [standings, setStandings] = useState<Standing[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [stats, setStats] = useState({ tournaments: 0, teams: 0, matches: 0, players: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  // Fetch tournaments list
  useEffect(() => {
    api.get("/tournaments?limit=100").then((res) => {
      const list = res.data.data || [];
      setTournaments(list);
      // Auto-select the first active/in-progress tournament, or the first one
      const active = list.find((t: Tournament) => t.status === "IN_PROGRESS") || list[0];
      if (active) setSelectedTournament(active.id);
    }).catch(() => {});

    // Fetch upcoming matches
    api.get("/matches?limit=5").then((res) => {
      const all = res.data.data || [];
      const upcoming = all.filter((m: any) => m.status === "SCHEDULED" || m.status === "IN_PROGRESS");
      setUpcomingMatches(upcoming.slice(0, 5));
    }).catch(() => {});

    // Fetch global counts
    Promise.all([
      api.get("/tournaments?limit=1").then((r) => r.data.total || 0).catch(() => 0),
      api.get("/teams?limit=1").then((r) => r.data.total || 0).catch(() => 0),
      api.get("/matches?limit=1").then((r) => r.data.total || 0).catch(() => 0),
      api.get("/players?limit=1").then((r) => r.data.total || 0).catch(() => 0),
    ]).then(([tournaments, teams, matches, players]) => {
      setStats({ tournaments, teams, matches, players });
    });
  }, []);

  // Fetch standings + scorers for selected tournament
  useEffect(() => {
    if (!selectedTournament) return;
    setLoadingStats(true);

    Promise.all([
      api.get(`/statistics/${selectedTournament}/standings`),
      api.get(`/statistics/${selectedTournament}/top-scorers?limit=5`),
      api.get(`/statistics/${selectedTournament}/summary`),
    ]).then(([standingsRes, scorersRes, summaryRes]) => {
      setStandings(standingsRes.data);
      setScorers(scorersRes.data);
      setSummary(summaryRes.data);
    }).catch(() => {}).finally(() => setLoadingStats(false));
  }, [selectedTournament]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bienvenido, {user?.firstName}!</h1>
        <p className="text-muted-foreground mt-1">Panel de control de SportManager Pro</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickLinks.map((link, i) => {
          const Icon = link.icon;
          const count = stats[link.key as keyof typeof stats] || 0;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="card-hover cursor-pointer animate-slide-up" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "backwards" }}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${link.color} transition-transform group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{link.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Tournament selector */}
      {tournaments.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Torneo:</span>
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Seleccionar torneo" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                  {t.status === "IN_PROGRESS" ? " (En curso)" : t.status === "FINISHED" ? " (Finalizado)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tournament summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-fade-in">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{summary.totalTeams}</p>
              <p className="text-xs text-muted-foreground">Equipos inscritos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{summary.finishedMatches}<span className="text-sm font-normal text-muted-foreground">/{summary.totalMatches}</span></p>
              <p className="text-xs text-muted-foreground">Partidos jugados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{summary.totalGoals}</p>
              <p className="text-xs text-muted-foreground">Goles totales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{summary.avgGoalsPerMatch}</p>
              <p className="text-xs text-muted-foreground">Promedio goles/partido</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main content: Standings + Scorers + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Standings - takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Tabla de Posiciones
            </CardTitle>
            {selectedTournament && (
              <Link href="/dashboard/statistics" className="text-xs text-primary hover:underline">
                Ver completa
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {!selectedTournament ? (
              <p className="text-muted-foreground text-sm text-center py-4">Selecciona un torneo para ver posiciones.</p>
            ) : loadingStats ? (
              <p className="text-muted-foreground text-sm text-center py-4">Cargando...</p>
            ) : standings.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No hay datos de posiciones aun. Los partidos deben estar finalizados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left py-2 px-2">#</th>
                      <th className="text-left py-2 px-2">Equipo</th>
                      <th className="text-center py-2 px-1">PJ</th>
                      <th className="text-center py-2 px-1">PG</th>
                      <th className="text-center py-2 px-1">PE</th>
                      <th className="text-center py-2 px-1">PP</th>
                      <th className="text-center py-2 px-1">GF</th>
                      <th className="text-center py-2 px-1">GC</th>
                      <th className="text-center py-2 px-1">DG</th>
                      <th className="text-center py-2 px-2 font-bold">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.slice(0, 8).map((row, i) => (
                      <tr key={row.teamId} className={`border-b hover:bg-muted/50 ${i < 4 ? "bg-green-50/50 dark:bg-green-950/20" : ""}`}>
                        <td className="py-2 px-2 font-medium text-xs">{i + 1}</td>
                        <td className="py-2 px-2 font-medium text-xs truncate max-w-[120px]">{row.teamName}</td>
                        <td className="text-center py-2 px-1 text-xs">{row.played}</td>
                        <td className="text-center py-2 px-1 text-xs">{row.won}</td>
                        <td className="text-center py-2 px-1 text-xs">{row.drawn}</td>
                        <td className="text-center py-2 px-1 text-xs">{row.lost}</td>
                        <td className="text-center py-2 px-1 text-xs">{row.goalsFor}</td>
                        <td className="text-center py-2 px-1 text-xs">{row.goalsAgainst}</td>
                        <td className="text-center py-2 px-1 text-xs">
                          <span className={row.goalDifference > 0 ? "text-green-600" : row.goalDifference < 0 ? "text-red-600" : ""}>
                            {row.goalDifference > 0 ? "+" : ""}{row.goalDifference}
                          </span>
                        </td>
                        <td className="text-center py-2 px-2 font-bold text-primary text-xs">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {standings.length > 8 && (
                  <div className="text-center mt-2">
                    <Link href="/dashboard/statistics" className="text-xs text-primary hover:underline">
                      Ver los {standings.length} equipos
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column: Scorers + Upcoming */}
        <div className="space-y-6">
          {/* Top Scorers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-orange-500" />
                Goleadores
              </CardTitle>
              {selectedTournament && (
                <Link href="/dashboard/statistics" className="text-xs text-primary hover:underline">
                  Ver todos
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {!selectedTournament ? (
                <p className="text-muted-foreground text-sm text-center py-4">Selecciona un torneo.</p>
              ) : loadingStats ? (
                <p className="text-muted-foreground text-sm text-center py-4">Cargando...</p>
              ) : scorers.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">Sin goleadores registrados.</p>
              ) : (
                <div className="space-y-2">
                  {scorers.map((s, i) => (
                    <div key={s.playerId} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <span className={`text-sm font-bold w-6 text-center ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.teamName} {s.jerseyNumber ? `#${s.jerseyNumber}` : ""}</p>
                      </div>
                      <Badge variant="secondary" className="font-bold text-sm">
                        {s.goals}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Matches */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Swords className="h-4 w-4 text-blue-500" />
                Proximos Partidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingMatches.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No hay partidos programados.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingMatches.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-xs font-medium">
                          <span className="truncate">{m.teamA?.name || m.teamAId}</span>
                          <span className="text-muted-foreground shrink-0">vs</span>
                          <span className="truncate">{m.teamB?.name || m.teamBId}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(m.scheduledAt).toLocaleDateString("es-CO", {
                            weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {m.status === "IN_PROGRESS" && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 text-xs ml-2">En juego</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
