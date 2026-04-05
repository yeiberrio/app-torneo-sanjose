"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Target, AlertTriangle, BarChart3, TrendingUp, Shield, Search, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import api from "@/lib/api";
import Link from "next/link";

interface Tournament { id: string; name: string; status: string; }
interface Standing { teamId: string; teamName: string; logoUrl: string | null; played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number; goalDifference: number; points: number; yellowCards: number; redCards: number; }
interface Scorer { playerId: string; firstName: string; lastName: string; jerseyNumber: number | null; teamName: string; goals: number; }
interface CardEntry { playerId: string; firstName: string; lastName: string; jerseyNumber: number | null; teamName: string; yellowCards: number; redCards: number; }
interface FairPlayEntry { teamId: string; teamName: string; played: number; yellowCards: number; redCards: number; totalCards: number; avgCardsPerMatch: number; }
interface Summary { totalMatches: number; finishedMatches: number; pendingMatches: number; totalTeams: number; totalPlayers: number; totalGoals: number; avgGoalsPerMatch: number; }

export default function StatisticsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [standings, setStandings] = useState<Standing[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [cards, setCards] = useState<CardEntry[]>([]);
  const [fairPlay, setFairPlay] = useState<FairPlayEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [standingsSearch, setStandingsSearch] = useState("");
  const [scorersSearch, setScorersSearch] = useState("");
  const [scorersTeamFilter, setScorersTeamFilter] = useState("all");
  const [cardsSearch, setCardsSearch] = useState("");
  const [cardsTeamFilter, setCardsTeamFilter] = useState("all");
  const [cardsTypeFilter, setCardsTypeFilter] = useState("all");

  useEffect(() => {
    api.get("/tournaments?limit=100").then((res) => {
      const list = res.data.data || [];
      setTournaments(list);
      if (list.length > 0) setSelectedTournament(list[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedTournament) return;
    setLoading(true);
    Promise.all([
      api.get(`/statistics/${selectedTournament}/standings`),
      api.get(`/statistics/${selectedTournament}/top-scorers?limit=100`),
      api.get(`/statistics/${selectedTournament}/top-cards?limit=100`),
      api.get(`/statistics/${selectedTournament}/fair-play`),
      api.get(`/statistics/${selectedTournament}/summary`),
    ]).then(([standingsRes, scorersRes, cardsRes, fairPlayRes, summaryRes]) => {
      setStandings(standingsRes.data);
      setScorers(scorersRes.data);
      setCards(cardsRes.data);
      setFairPlay(fairPlayRes.data);
      setSummary(summaryRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedTournament]);

  // Filtered data
  const teamNames = useMemo(() => Array.from(new Set(cards.map(c => c.teamName))).sort(), [cards]);

  const filteredStandings = useMemo(() => {
    if (!standingsSearch.trim()) return standings;
    const q = standingsSearch.toLowerCase();
    return standings.filter(s => s.teamName.toLowerCase().includes(q));
  }, [standings, standingsSearch]);

  const filteredScorers = useMemo(() => {
    let result = scorers;
    if (scorersSearch.trim()) {
      const q = scorersSearch.toLowerCase();
      result = result.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.teamName.toLowerCase().includes(q));
    }
    if (scorersTeamFilter !== "all") result = result.filter(s => s.teamName === scorersTeamFilter);
    return result;
  }, [scorers, scorersSearch, scorersTeamFilter]);

  const filteredCards = useMemo(() => {
    let result = cards;
    if (cardsSearch.trim()) {
      const q = cardsSearch.toLowerCase();
      result = result.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.teamName.toLowerCase().includes(q));
    }
    if (cardsTeamFilter !== "all") result = result.filter(c => c.teamName === cardsTeamFilter);
    if (cardsTypeFilter === "yellow") result = result.filter(c => c.yellowCards > 0);
    if (cardsTypeFilter === "red") result = result.filter(c => c.redCards > 0);
    return result;
  }, [cards, cardsSearch, cardsTeamFilter, cardsTypeFilter]);

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Estadisticas</h1>
        {tournaments.length > 0 && (
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger className="w-[280px]"><SelectValue placeholder="Seleccionar torneo" /></SelectTrigger>
            <SelectContent>
              {tournaments.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedTournament ? (
        <Card><CardContent className="p-12 text-center"><BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Crea un torneo para ver estadisticas.</p></CardContent></Card>
      ) : loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Equipos", value: summary.totalTeams },
                { label: "Partidos jugados", value: `${summary.finishedMatches}/${summary.totalMatches}` },
                { label: "Goles totales", value: summary.totalGoals },
                { label: "Goles/partido", value: summary.avgGoalsPerMatch },
              ].map((s, i) => (
                <Card key={s.label} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "backwards" }}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Tabs defaultValue="standings">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="standings"><Trophy className="h-4 w-4 mr-1" />Posiciones</TabsTrigger>
              <TabsTrigger value="scorers"><Target className="h-4 w-4 mr-1" />Goleadores</TabsTrigger>
              <TabsTrigger value="cards"><AlertTriangle className="h-4 w-4 mr-1" />Tarjetas</TabsTrigger>
              <TabsTrigger value="fairplay"><Shield className="h-4 w-4 mr-1" />Juego Limpio</TabsTrigger>
              <TabsTrigger value="charts"><TrendingUp className="h-4 w-4 mr-1" />Graficas</TabsTrigger>
            </TabsList>

            {/* Standings */}
            <TabsContent value="standings">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Tabla de Posiciones</CardTitle>
                  <div className="relative w-52">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Buscar equipo..." value={standingsSearch} onChange={(e) => setStandingsSearch(e.target.value)} className="pl-8 h-8 text-xs" />
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredStandings.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Sin datos.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
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
                          {filteredStandings.map((row, i) => (
                            <tr key={row.teamId} className={`border-b hover:bg-muted/50 ${i < 4 ? "bg-green-50/50" : ""}`}>
                              <td className="py-2 px-2 font-medium">{standings.indexOf(row) + 1}</td>
                              <td className="py-2 px-2 font-medium">
                                <Link href={`/dashboard/teams/detalle?id=${row.teamId}`} className="hover:text-primary hover:underline">{row.teamName}</Link>
                              </td>
                              <td className="text-center py-2 px-1">{row.played}</td>
                              <td className="text-center py-2 px-1">{row.won}</td>
                              <td className="text-center py-2 px-1">{row.drawn}</td>
                              <td className="text-center py-2 px-1">{row.lost}</td>
                              <td className="text-center py-2 px-1">{row.goalsFor}</td>
                              <td className="text-center py-2 px-1">{row.goalsAgainst}</td>
                              <td className="text-center py-2 px-1">
                                <span className={row.goalDifference > 0 ? "text-green-600" : row.goalDifference < 0 ? "text-red-600" : ""}>{row.goalDifference > 0 ? "+" : ""}{row.goalDifference}</span>
                              </td>
                              <td className="text-center py-2 px-2 font-bold text-primary">{row.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scorers */}
            <TabsContent value="scorers">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                  <CardTitle>Tabla de Goleadores</CardTitle>
                  <div className="flex gap-2 items-center">
                    <div className="relative w-48">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="Buscar..." value={scorersSearch} onChange={(e) => setScorersSearch(e.target.value)} className="pl-8 h-8 text-xs" />
                    </div>
                    {teamNames.length > 1 && (
                      <Select value={scorersTeamFilter} onValueChange={setScorersTeamFilter}>
                        <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Equipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {teamNames.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    )}
                    <span className="text-xs text-muted-foreground">{filteredScorers.length}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredScorers.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Sin goleadores.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-2 px-2">#</th>
                            <th className="text-left py-2 px-2">Jugador</th>
                            <th className="text-left py-2 px-2">Equipo</th>
                            <th className="text-center py-2 px-2">Dorsal</th>
                            <th className="text-center py-2 px-2 font-bold">Goles</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredScorers.map((s, i) => (
                            <tr key={s.playerId} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-2 font-medium">{i + 1}</td>
                              <td className="py-2 px-2 font-medium">
                                <Link href={`/dashboard/players/detalle?id=${s.playerId}`} className="hover:text-primary hover:underline">{s.firstName} {s.lastName}</Link>
                              </td>
                              <td className="py-2 px-2 text-muted-foreground">{s.teamName}</td>
                              <td className="text-center py-2 px-2">{s.jerseyNumber ?? "-"}</td>
                              <td className="text-center py-2 px-2 font-bold text-primary">{s.goals}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cards */}
            <TabsContent value="cards">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                  <CardTitle>Tabla de Tarjetas</CardTitle>
                  <div className="flex gap-2 items-center flex-wrap">
                    <div className="relative w-48">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="Buscar..." value={cardsSearch} onChange={(e) => setCardsSearch(e.target.value)} className="pl-8 h-8 text-xs" />
                    </div>
                    {teamNames.length > 1 && (
                      <Select value={cardsTeamFilter} onValueChange={setCardsTeamFilter}>
                        <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Equipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {teamNames.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    )}
                    <Select value={cardsTypeFilter} onValueChange={setCardsTypeFilter}>
                      <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="yellow">Solo amarillas</SelectItem>
                        <SelectItem value="red">Solo rojas</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">{filteredCards.length}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredCards.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Sin tarjetas.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-2 px-2">#</th>
                            <th className="text-left py-2 px-2">Jugador</th>
                            <th className="text-left py-2 px-2">Equipo</th>
                            <th className="text-center py-2 px-2">🟨 Amarillas</th>
                            <th className="text-center py-2 px-2">🟥 Rojas</th>
                            <th className="text-center py-2 px-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCards.map((c, i) => (
                            <tr key={c.playerId} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-2 font-medium">{i + 1}</td>
                              <td className="py-2 px-2 font-medium">
                                <Link href={`/dashboard/players/detalle?id=${c.playerId}`} className="hover:text-primary hover:underline">{c.firstName} {c.lastName}</Link>
                              </td>
                              <td className="py-2 px-2 text-muted-foreground">{c.teamName}</td>
                              <td className="text-center py-2 px-2">
                                {c.yellowCards > 0 && <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">{c.yellowCards}</Badge>}
                              </td>
                              <td className="text-center py-2 px-2">
                                {c.redCards > 0 && <Badge variant="destructive">{c.redCards}</Badge>}
                              </td>
                              <td className="text-center py-2 px-2 font-medium">{c.yellowCards + c.redCards}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fair Play */}
            <TabsContent value="fairplay">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-green-600" />Clasificacion de Juego Limpio</CardTitle>
                </CardHeader>
                <CardContent>
                  {fairPlay.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">Sin datos.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-2 px-2">#</th>
                            <th className="text-left py-2 px-2">Equipo</th>
                            <th className="text-center py-2 px-2">PJ</th>
                            <th className="text-center py-2 px-2">🟨</th>
                            <th className="text-center py-2 px-2">🟥</th>
                            <th className="text-center py-2 px-2">Puntos</th>
                            <th className="text-center py-2 px-2">Prom/partido</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fairPlay.map((fp, i) => (
                            <tr key={fp.teamId} className={`border-b hover:bg-muted/50 ${i === 0 ? "bg-green-50/50" : ""}`}>
                              <td className="py-2 px-2 font-medium">
                                {i === 0 ? <span className="text-green-600 font-bold">1</span> : i + 1}
                              </td>
                              <td className="py-2 px-2 font-medium">
                                <Link href={`/dashboard/teams/detalle?id=${fp.teamId}`} className="hover:text-primary hover:underline">{fp.teamName}</Link>
                                {i === 0 && <Badge className="ml-2 text-xs bg-green-100 text-green-800">Mas limpio</Badge>}
                              </td>
                              <td className="text-center py-2 px-2">{fp.played}</td>
                              <td className="text-center py-2 px-2">{fp.yellowCards}</td>
                              <td className="text-center py-2 px-2">{fp.redCards}</td>
                              <td className="text-center py-2 px-2 font-bold">{fp.totalCards}</td>
                              <td className="text-center py-2 px-2">{fp.avgCardsPerMatch}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-xs text-muted-foreground mt-3">Puntos de juego limpio: 1 por amarilla, 3 por roja. Menor puntaje = equipo mas limpio.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Charts */}
            <TabsContent value="charts">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Points */}
                <Card>
                  <CardHeader><CardTitle>Puntos por Equipo</CardTitle></CardHeader>
                  <CardContent>
                    {standings.length === 0 ? <p className="text-muted-foreground text-sm">Sin datos.</p> : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={standings.map(s => ({ name: s.teamName.length > 12 ? s.teamName.substring(0, 12) + "..." : s.teamName, points: s.points }))}>
                          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={60} /><YAxis /><Tooltip />
                          <Bar dataKey="points" fill="hsl(var(--primary))" name="Puntos" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Goals */}
                <Card>
                  <CardHeader><CardTitle>Goles a Favor vs En Contra</CardTitle></CardHeader>
                  <CardContent>
                    {standings.length === 0 ? <p className="text-muted-foreground text-sm">Sin datos.</p> : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={standings.map(s => ({ name: s.teamName.length > 12 ? s.teamName.substring(0, 12) + "..." : s.teamName, gf: s.goalsFor, gc: s.goalsAgainst }))}>
                          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={60} /><YAxis /><Tooltip /><Legend />
                          <Bar dataKey="gf" fill="#22c55e" name="Goles a favor" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="gc" fill="#ef4444" name="Goles en contra" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Fair Play chart */}
                <Card>
                  <CardHeader><CardTitle>Tarjetas por Equipo (Juego Limpio)</CardTitle></CardHeader>
                  <CardContent>
                    {fairPlay.length === 0 ? <p className="text-muted-foreground text-sm">Sin datos.</p> : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={fairPlay.map(fp => ({ name: fp.teamName.length > 12 ? fp.teamName.substring(0, 12) + "..." : fp.teamName, amarillas: fp.yellowCards, rojas: fp.redCards }))}>
                          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={10} angle={-20} textAnchor="end" height={60} /><YAxis /><Tooltip /><Legend />
                          <Bar dataKey="amarillas" fill="#eab308" name="Amarillas" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="rojas" fill="#ef4444" name="Rojas" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Top 10 yellow cards by player */}
                <Card>
                  <CardHeader><CardTitle>Top 10 Tarjetas Amarillas (Jugadores)</CardTitle></CardHeader>
                  <CardContent>
                    {cards.length === 0 ? <p className="text-muted-foreground text-sm">Sin datos.</p> : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[...cards].sort((a, b) => b.yellowCards - a.yellowCards).slice(0, 10).map(c => ({ name: c.lastName.split(" ")[0], amarillas: c.yellowCards, rojas: c.redCards }))} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={90} fontSize={11} /><Tooltip /><Legend />
                          <Bar dataKey="amarillas" fill="#eab308" name="Amarillas" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="rojas" fill="#ef4444" name="Rojas" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Results pie */}
                <Card>
                  <CardHeader><CardTitle>Resultados Generales</CardTitle></CardHeader>
                  <CardContent>
                    {standings.length === 0 ? <p className="text-muted-foreground text-sm">Sin datos.</p> : (() => {
                      const totalWins = standings.reduce((s, r) => s + r.won, 0);
                      const totalDraws = standings.reduce((s, r) => s + r.drawn, 0) / 2;
                      const pieData = [{ name: "Victorias", value: totalWins }, { name: "Empates", value: Math.round(totalDraws) }];
                      return (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                              {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i]} />))}
                            </Pie><Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Top 10 scorers */}
                <Card>
                  <CardHeader><CardTitle>Top 10 Goleadores</CardTitle></CardHeader>
                  <CardContent>
                    {scorers.length === 0 ? <p className="text-muted-foreground text-sm">Sin datos.</p> : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={scorers.slice(0, 10).map(s => ({ name: s.lastName.split(" ")[0], goals: s.goals }))} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="name" type="category" width={90} fontSize={11} /><Tooltip />
                          <Bar dataKey="goals" fill="hsl(var(--primary))" name="Goles" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
