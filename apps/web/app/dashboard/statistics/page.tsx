"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, AlertTriangle, BarChart3, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import api from "@/lib/api";

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface Standing {
  teamId: string;
  teamName: string;
  logoUrl: string | null;
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

interface CardEntry {
  playerId: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  teamName: string;
  yellowCards: number;
  redCards: number;
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

export default function StatisticsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [standings, setStandings] = useState<Standing[]>([]);
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [cards, setCards] = useState<CardEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

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
      api.get(`/statistics/${selectedTournament}/top-scorers`),
      api.get(`/statistics/${selectedTournament}/top-cards`),
      api.get(`/statistics/${selectedTournament}/summary`),
    ]).then(([standingsRes, scorersRes, cardsRes, summaryRes]) => {
      setStandings(standingsRes.data);
      setScorers(scorersRes.data);
      setCards(cardsRes.data);
      setSummary(summaryRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedTournament]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Estadisticas</h1>
        {tournaments.length > 0 && (
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Seleccionar torneo" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedTournament ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Crea un torneo para ver estadisticas.</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <p className="text-muted-foreground">Cargando estadisticas...</p>
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{summary.totalTeams}</p>
                  <p className="text-sm text-muted-foreground">Equipos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{summary.finishedMatches}/{summary.totalMatches}</p>
                  <p className="text-sm text-muted-foreground">Partidos jugados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{summary.totalGoals}</p>
                  <p className="text-sm text-muted-foreground">Goles totales</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{summary.avgGoalsPerMatch}</p>
                  <p className="text-sm text-muted-foreground">Goles/partido</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="standings">
            <TabsList className="mb-4">
              <TabsTrigger value="standings">
                <Trophy className="h-4 w-4 mr-2" />Posiciones
              </TabsTrigger>
              <TabsTrigger value="scorers">
                <Target className="h-4 w-4 mr-2" />Goleadores
              </TabsTrigger>
              <TabsTrigger value="cards">
                <AlertTriangle className="h-4 w-4 mr-2" />Tarjetas
              </TabsTrigger>
              <TabsTrigger value="charts">
                <TrendingUp className="h-4 w-4 mr-2" />Graficas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="standings">
              <Card>
                <CardHeader>
                  <CardTitle>Tabla de Posiciones</CardTitle>
                </CardHeader>
                <CardContent>
                  {standings.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay datos de posiciones aun.</p>
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
                          {standings.map((row, i) => (
                            <tr key={row.teamId} className={`border-b hover:bg-muted/50 ${i < 4 ? 'bg-green-50/50' : ''}`}>
                              <td className="py-2 px-2 font-medium">{i + 1}</td>
                              <td className="py-2 px-2 font-medium">{row.teamName}</td>
                              <td className="text-center py-2 px-1">{row.played}</td>
                              <td className="text-center py-2 px-1">{row.won}</td>
                              <td className="text-center py-2 px-1">{row.drawn}</td>
                              <td className="text-center py-2 px-1">{row.lost}</td>
                              <td className="text-center py-2 px-1">{row.goalsFor}</td>
                              <td className="text-center py-2 px-1">{row.goalsAgainst}</td>
                              <td className="text-center py-2 px-1">
                                <span className={row.goalDifference > 0 ? 'text-green-600' : row.goalDifference < 0 ? 'text-red-600' : ''}>
                                  {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
                                </span>
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

            <TabsContent value="scorers">
              <Card>
                <CardHeader>
                  <CardTitle>Tabla de Goleadores</CardTitle>
                </CardHeader>
                <CardContent>
                  {scorers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay goleadores registrados aun.</p>
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
                          {scorers.map((s, i) => (
                            <tr key={s.playerId} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-2 font-medium">{i + 1}</td>
                              <td className="py-2 px-2 font-medium">{s.firstName} {s.lastName}</td>
                              <td className="py-2 px-2 text-muted-foreground">{s.teamName}</td>
                              <td className="text-center py-2 px-2">{s.jerseyNumber ?? '-'}</td>
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

            <TabsContent value="cards">
              <Card>
                <CardHeader>
                  <CardTitle>Tabla de Tarjetas</CardTitle>
                </CardHeader>
                <CardContent>
                  {cards.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay tarjetas registradas aun.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-2 px-2">#</th>
                            <th className="text-left py-2 px-2">Jugador</th>
                            <th className="text-left py-2 px-2">Equipo</th>
                            <th className="text-center py-2 px-2">Amarillas</th>
                            <th className="text-center py-2 px-2">Rojas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cards.map((c, i) => (
                            <tr key={c.playerId} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-2 font-medium">{i + 1}</td>
                              <td className="py-2 px-2 font-medium">{c.firstName} {c.lastName}</td>
                              <td className="py-2 px-2 text-muted-foreground">{c.teamName}</td>
                              <td className="text-center py-2 px-2">
                                {c.yellowCards > 0 && (
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                    {c.yellowCards}
                                  </Badge>
                                )}
                              </td>
                              <td className="text-center py-2 px-2">
                                {c.redCards > 0 && (
                                  <Badge variant="destructive">{c.redCards}</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Points bar chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Puntos por Equipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {standings.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Sin datos.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={standings.map((s) => ({ name: s.teamName.split(' ').pop(), points: s.points, gf: s.goalsFor }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="points" fill="hsl(var(--primary))" name="Puntos" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Goals bar chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Goles a Favor vs En Contra</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {standings.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Sin datos.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={standings.map((s) => ({ name: s.teamName.split(' ').pop(), gf: s.goalsFor, gc: s.goalsAgainst }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="gf" fill="#22c55e" name="Goles a favor" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="gc" fill="#ef4444" name="Goles en contra" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Win/Draw/Loss pie chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resultados Generales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {standings.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Sin datos.</p>
                    ) : (() => {
                      const totalWins = standings.reduce((s, r) => s + r.won, 0);
                      const totalDraws = standings.reduce((s, r) => s + r.drawn, 0) / 2;
                      const pieData = [
                        { name: "Victorias", value: totalWins },
                        { name: "Empates", value: totalDraws },
                      ];
                      const COLORS = ["#22c55e", "#eab308"];
                      return (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                              {pieData.map((_, i) => (
                                <Cell key={i} fill={COLORS[i]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Top scorers bar chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Goleadores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scorers.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Sin datos.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={scorers.slice(0, 10).map((s) => ({ name: `${s.lastName.split(' ')[0]}`, goals: s.goals }))} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={90} fontSize={12} />
                          <Tooltip />
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
