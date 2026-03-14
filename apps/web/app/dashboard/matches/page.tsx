"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Swords } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

const statusLabels: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: "Programado", className: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: { label: "En juego", className: "bg-green-100 text-green-800" },
  HALFTIME: { label: "Entretiempo", className: "bg-yellow-100 text-yellow-800" },
  FINISHED: { label: "Finalizado", className: "bg-gray-100 text-gray-800" },
  SUSPENDED: { label: "Suspendido", className: "bg-red-100 text-red-800" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-800" },
  POSTPONED: { label: "Aplazado", className: "bg-orange-100 text-orange-800" },
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/tournaments?limit=100").then((res) => {
      setTournaments(res.data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = selectedTournament !== "all" ? `?tournamentId=${selectedTournament}` : "";
    api.get(`/matches${params}`).then((res) => {
      setMatches(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedTournament]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Partidos</h1>
        <div className="flex gap-3">
          {tournaments.length > 0 && (
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar por torneo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los torneos</SelectItem>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button asChild><Link href="/dashboard/matches/new"><Plus className="h-4 w-4 mr-2" />Programar</Link></Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay partidos programados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => {
            const status = statusLabels[m.status] || { label: m.status, className: "bg-gray-100 text-gray-800" };
            return (
              <Link key={m.id} href={`/dashboard/matches/detalle?id=${m.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-center min-w-[70px]">
                        <p className="text-xs text-muted-foreground">
                          {m.dayNumber ? `Jornada ${m.dayNumber}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.scheduledAt).toLocaleDateString("es-CO", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.scheduledAt).toLocaleTimeString("es-CO", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-1 justify-center">
                        <span className="font-semibold text-right flex-1 truncate">
                          {m.teamA?.name || m.teamAId}
                        </span>
                        <div className="text-xl font-bold text-primary min-w-[60px] text-center">
                          {m.status === "SCHEDULED" ? "vs" : `${m.scoreA ?? 0} - ${m.scoreB ?? 0}`}
                        </div>
                        <span className="font-semibold text-left flex-1 truncate">
                          {m.teamB?.name || m.teamBId}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4">
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>

                  {m.venue && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">{m.venue}</p>
                  )}
                </CardContent>
              </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
