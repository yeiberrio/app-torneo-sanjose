"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Swords, ChevronDown, ChevronRight, Search, Filter, X } from "lucide-react";
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

  // Filters
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Collapsed state per day
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get("/tournaments?limit=100").then((res) => {
      setTournaments(res.data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = selectedTournament !== "all" ? `?tournamentId=${selectedTournament}&limit=500` : "?limit=500";
    api.get(`/matches${params}`).then((res) => {
      setMatches(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedTournament]);

  // Determine which days should be auto-expanded
  const getCurrentAndNextDay = (matchList: any[]): Set<string> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysWithMatches = new Map<number, Date>();
    matchList.forEach(m => {
      if (m.dayNumber) {
        const d = new Date(m.scheduledAt);
        if (!daysWithMatches.has(m.dayNumber) || d < daysWithMatches.get(m.dayNumber)!) {
          daysWithMatches.set(m.dayNumber, d);
        }
      }
    });

    // Find current day (has unfinished matches or is closest to today)
    let currentDay: number | null = null;
    let nextDay: number | null = null;
    const sortedDays = Array.from(daysWithMatches.entries()).sort((a, b) => a[0] - b[0]);

    for (const [dayNum, date] of sortedDays) {
      const dayMatches = matchList.filter(m => m.dayNumber === dayNum);
      const hasUnfinished = dayMatches.some(m => m.status !== "FINISHED" && m.status !== "CANCELLED");
      if (hasUnfinished) {
        if (!currentDay) currentDay = dayNum;
        else if (!nextDay) { nextDay = dayNum; break; }
      }
    }

    // If no unfinished found, show last two days
    if (!currentDay && sortedDays.length > 0) {
      currentDay = sortedDays[sortedDays.length - 1][0];
      if (sortedDays.length > 1) nextDay = sortedDays[sortedDays.length - 2][0];
    }

    const expanded = new Set<string>();
    if (currentDay) expanded.add(String(currentDay));
    if (nextDay) expanded.add(String(nextDay));
    // Also expand "no day" matches
    expanded.add("sin-fecha");
    return expanded;
  };

  // Filter matches
  const filteredMatches = useMemo(() => {
    let result = matches;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(m =>
        (m.teamA?.name || "").toLowerCase().includes(q) ||
        (m.teamB?.name || "").toLowerCase().includes(q) ||
        (m.venue || "").toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") {
      result = result.filter(m => m.status === filterStatus);
    }
    return result;
  }, [matches, searchText, filterStatus]);

  // Group matches by dayNumber
  const groupedMatches = useMemo(() => {
    const groups = new Map<string, { label: string; matches: any[]; sortKey: number }>();

    filteredMatches.forEach(m => {
      const key = m.dayNumber ? String(m.dayNumber) : "sin-fecha";
      if (!groups.has(key)) {
        groups.set(key, {
          label: m.dayNumber ? `Fecha ${m.dayNumber}` : "Sin fecha asignada",
          matches: [],
          sortKey: m.dayNumber || 9999,
        });
      }
      groups.get(key)!.matches.push(m);
    });

    // Sort matches within each group by scheduledAt
    groups.forEach(g => g.matches.sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));

    return Array.from(groups.entries()).sort((a, b) => a[1].sortKey - b[1].sortKey);
  }, [filteredMatches]);

  // Auto-expand current and next day on first load
  useEffect(() => {
    if (matches.length > 0 && collapsedDays.size === 0) {
      const expanded = getCurrentAndNextDay(matches);
      const allDays = new Set(matches.map(m => m.dayNumber ? String(m.dayNumber) : "sin-fecha"));
      const collapsed = new Set<string>();
      allDays.forEach(d => {
        if (!expanded.has(d)) collapsed.add(d);
      });
      setCollapsedDays(collapsed);
    }
  }, [matches]);

  const toggleDay = (dayKey: string) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayKey)) next.delete(dayKey);
      else next.add(dayKey);
      return next;
    });
  };

  const expandAll = () => setCollapsedDays(new Set());
  const collapseAll = () => {
    const all = new Set(groupedMatches.map(([key]) => key));
    setCollapsedDays(all);
  };

  const hasActiveFilters = searchText.trim() !== "" || filterStatus !== "all";

  const clearFilters = () => {
    setSearchText("");
    setFilterStatus("all");
  };

  // Stats for the header
  const totalMatches = filteredMatches.length;
  const finishedCount = filteredMatches.filter(m => m.status === "FINISHED").length;
  const inProgressCount = filteredMatches.filter(m => m.status === "IN_PROGRESS" || m.status === "HALFTIME").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">Partidos</h1>
        <div className="flex gap-2 items-center flex-wrap">
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
          <Button size="sm" variant={showFilters ? "secondary" : "outline"} onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-1" />Filtros
          </Button>
          <Button asChild size="sm"><Link href="/dashboard/matches/new"><Plus className="h-4 w-4 mr-1" />Programar</Link></Button>
        </div>
      </div>

      {/* Stats bar */}
      {selectedTournament !== "all" && !loading && totalMatches > 0 && (
        <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
          <span>{totalMatches} partidos</span>
          <span>{finishedCount} finalizados</span>
          {inProgressCount > 0 && <span className="text-green-600 font-medium">{inProgressCount} en juego</span>}
          <span>{groupedMatches.length} fecha(s)</span>
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar equipo o sede..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />Limpiar
                </Button>
              )}
              <div className="flex gap-1 ml-auto">
                <Button size="sm" variant="ghost" onClick={expandAll} className="text-xs">Expandir todo</Button>
                <Button size="sm" variant="ghost" onClick={collapseAll} className="text-xs">Colapsar todo</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : filteredMatches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {hasActiveFilters ? "No se encontraron partidos con los filtros aplicados." : "No hay partidos programados."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="mt-2" onClick={clearFilters}>Limpiar filtros</Button>
            )}
          </CardContent>
        </Card>
      ) : selectedTournament !== "all" && groupedMatches.length > 0 ? (
        // Grouped by day view
        <div className="space-y-3">
          {groupedMatches.map(([dayKey, group]) => {
            const isCollapsed = collapsedDays.has(dayKey);
            const dayFinished = group.matches.every((m: any) => m.status === "FINISHED" || m.status === "CANCELLED");
            const dayInProgress = group.matches.some((m: any) => m.status === "IN_PROGRESS" || m.status === "HALFTIME");

            return (
              <div key={dayKey}>
                {/* Day header */}
                <button
                  onClick={() => toggleDay(dayKey)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors mb-1"
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  <span className="font-semibold text-sm">{group.label}</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-muted-foreground">{group.matches.length} partido(s)</span>
                    {dayInProgress && <Badge className="text-xs bg-green-100 text-green-800">En juego</Badge>}
                    {dayFinished && !dayInProgress && <Badge variant="secondary" className="text-xs">Completada</Badge>}
                  </div>
                </button>

                {/* Day matches */}
                {!isCollapsed && (
                  <div className="space-y-2 ml-2 border-l-2 border-muted pl-3">
                    {group.matches.map((m: any) => {
                      const status = statusLabels[m.status] || { label: m.status, className: "bg-gray-100 text-gray-800" };
                      return (
                        <Link key={m.id} href={`/dashboard/matches/detalle?id=${m.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="text-center min-w-[55px]">
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(m.scheduledAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(m.scheduledAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-1 justify-center">
                                    <span className="font-medium text-sm text-right flex-1 truncate">{m.teamA?.name || m.teamAId}</span>
                                    <div className="text-lg font-bold text-primary min-w-[50px] text-center">
                                      {m.status === "SCHEDULED" ? "vs" : `${m.scoreA ?? 0} - ${m.scoreB ?? 0}`}
                                    </div>
                                    <span className="font-medium text-sm text-left flex-1 truncate">{m.teamB?.name || m.teamBId}</span>
                                  </div>
                                </div>
                                <Badge variant="outline" className={`${status.className} text-xs ml-2`}>{status.label}</Badge>
                              </div>
                              {m.venue && <p className="text-xs text-muted-foreground mt-1 text-center">{m.venue}</p>}
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Flat list when no tournament selected
        <div className="space-y-2">
          {filteredMatches.map((m) => {
            const status = statusLabels[m.status] || { label: m.status, className: "bg-gray-100 text-gray-800" };
            return (
              <Link key={m.id} href={`/dashboard/matches/detalle?id=${m.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-center min-w-[70px]">
                          <p className="text-xs text-muted-foreground">{m.dayNumber ? `Fecha ${m.dayNumber}` : ""}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(m.scheduledAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(m.scheduledAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-1 justify-center">
                          <span className="font-semibold text-right flex-1 truncate">{m.teamA?.name || m.teamAId}</span>
                          <div className="text-xl font-bold text-primary min-w-[60px] text-center">
                            {m.status === "SCHEDULED" ? "vs" : `${m.scoreA ?? 0} - ${m.scoreB ?? 0}`}
                          </div>
                          <span className="font-semibold text-left flex-1 truncate">{m.teamB?.name || m.teamBId}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-1">
                        <Badge variant="outline" className={status.className}>{status.label}</Badge>
                        {m.tournament && <span className="text-xs text-muted-foreground">{m.tournament.name}</span>}
                      </div>
                    </div>
                    {m.venue && <p className="text-xs text-muted-foreground mt-2 text-center">{m.venue}</p>}
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
