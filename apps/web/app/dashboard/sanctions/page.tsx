"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ShieldCheck, Unlock, Plus, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";

const sanctionTypeLabels: Record<string, string> = {
  YELLOW_ACCUMULATION: "Acumulacion de Amarillas",
  RED_CARD: "Tarjeta Roja",
  CONDUCT: "Conducta",
  ADMINISTRATIVE: "Administrativa",
};

export default function SanctionsPage() {
  const { user } = useAuthStore();
  const canManage = user ? can(user.role, "update", "Sanction") : false;
  const canCreate = user ? can(user.role, "create", "Sanction") : false;
  const canUnlock = user ? can(user.role, "manage", "Sanction") : false;
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [sanctions, setSanctions] = useState<any[]>([]);
  const [allSanctions, setAllSanctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoProcessing, setAutoProcessing] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("active");

  // Unlock dialog state
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [unlockSanctionId, setUnlockSanctionId] = useState("");
  const [unlockReason, setUnlockReason] = useState("");

  // Create manual sanction dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    playerId: "",
    type: "CONDUCT",
    matchesBanned: "1",
    reason: "",
  });
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamForCreate, setSelectedTeamForCreate] = useState("");
  const [teamPlayers, setTeamPlayers] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  // Mark as served dialog
  const [markServedTarget, setMarkServedTarget] = useState<any>(null);

  useEffect(() => {
    api.get("/tournaments?limit=100").then((res) => {
      const list = res.data.data || [];
      setTournaments(list);
      if (list.length > 0) setSelectedTournament(list[0].id);
    }).catch(() => {});
  }, []);

  const fetchSanctions = () => {
    if (!selectedTournament) return;
    setLoading(true);
    Promise.all([
      api.get(`/sanctions/tournament/${selectedTournament}?activeOnly=true`),
      api.get(`/sanctions/tournament/${selectedTournament}?activeOnly=false`),
    ]).then(([activeRes, allRes]) => {
      setSanctions(activeRes.data || []);
      setAllSanctions(allRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSanctions();
  }, [selectedTournament]);

  // Load teams when create dialog opens
  useEffect(() => {
    if (createOpen && selectedTournament) {
      api.get(`/tournaments/${selectedTournament}`).then((res) => {
        const tournamentTeams = (res.data.teams || []).map((tt: any) => tt.team);
        setTeams(tournamentTeams);
      }).catch(() => {});
    }
  }, [createOpen, selectedTournament]);

  // Load players when team selected in create dialog
  useEffect(() => {
    if (selectedTeamForCreate) {
      api.get(`/players?teamId=${selectedTeamForCreate}&limit=100`).then((res) => {
        setTeamPlayers(res.data.data || []);
      }).catch(() => {});
    } else {
      setTeamPlayers([]);
    }
  }, [selectedTeamForCreate]);

  const handleServeMatch = async (id: string) => {
    try {
      const res = await api.patch(`/sanctions/${id}/serve-match`);
      toast.success(`Partido cumplido (${res.data.matchesServed}/${res.data.matchesBanned})`);
      fetchSanctions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al registrar cumplimiento");
    }
  };

  const handleMarkServed = async () => {
    if (!markServedTarget) return;
    try {
      await api.patch(`/sanctions/${markServedTarget.id}/mark-served`);
      toast.success("Sancion marcada como cumplida");
      setMarkServedTarget(null);
      fetchSanctions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error");
    }
  };

  const handleAutoProcess = async () => {
    if (!selectedTournament) return;
    setAutoProcessing(true);
    try {
      const res = await api.post(`/sanctions/tournament/${selectedTournament}/auto-process`);
      toast.success(`Auto-proceso completado: ${res.data.processed} de ${res.data.total} sanciones actualizadas`);
      fetchSanctions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error en auto-proceso");
    } finally {
      setAutoProcessing(false);
    }
  };

  const openUnlockDialog = (sanctionId: string) => {
    setUnlockSanctionId(sanctionId);
    setUnlockReason("");
    setUnlockDialogOpen(true);
  };

  const handleUnlock = async () => {
    try {
      await api.patch(`/sanctions/${unlockSanctionId}/unlock`, { reason: unlockReason });
      toast.success("Jugador desbloqueado exitosamente");
      setUnlockDialogOpen(false);
      fetchSanctions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al desbloquear jugador");
    }
  };

  const handleCreateManual = async () => {
    if (!createForm.playerId || !createForm.reason) {
      toast.error("Jugador y motivo son obligatorios");
      return;
    }
    setCreating(true);
    try {
      await api.post("/sanctions/manual", {
        playerId: createForm.playerId,
        tournamentId: selectedTournament,
        type: createForm.type,
        matchesBanned: Number(createForm.matchesBanned) || 1,
        reason: createForm.reason,
      });
      toast.success("Sancion creada exitosamente");
      setCreateOpen(false);
      setCreateForm({ playerId: "", type: "CONDUCT", matchesBanned: "1", reason: "" });
      setSelectedTeamForCreate("");
      fetchSanctions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al crear sancion");
    } finally {
      setCreating(false);
    }
  };

  const inactiveSanctions = allSanctions.filter(s => !s.isActive);

  const renderSanctionCard = (s: any, showActions = true) => (
    <Card key={s.id} className={!s.isActive ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${s.isActive ? "bg-red-100" : "bg-green-100"}`}>
              {s.isActive ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
            </div>
            <div>
              <p className="font-medium">
                #{s.player?.jerseyNumber || "?"} {s.player?.firstName} {s.player?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{s.player?.team?.name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={s.isActive ? "destructive" : "secondary"} className="text-xs">
                  {sanctionTypeLabels[s.type] || s.type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {s.matchesServed}/{s.matchesBanned} partido(s)
                </Badge>
                {!s.isActive && (
                  <Badge className="text-xs bg-green-100 text-green-800">Cumplida</Badge>
                )}
              </div>
              {s.reason && <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>}
              <p className="text-xs text-muted-foreground mt-0.5">
                Impuesta: {new Date(s.imposedAt).toLocaleDateString("es-CO")}
              </p>
            </div>
          </div>
          {showActions && s.isActive && (
            <div className="flex flex-col gap-1 shrink-0">
              {canManage && s.matchesServed < s.matchesBanned && (
                <Button size="sm" variant="outline" onClick={() => handleServeMatch(s.id)} className="text-xs">
                  +1 Partido cumplido
                </Button>
              )}
              {canManage && (
                <Button size="sm" variant="secondary" onClick={() => setMarkServedTarget(s)} className="text-xs">
                  Marcar cumplida
                </Button>
              )}
              {canUnlock && (
                <Button size="sm" variant="destructive" onClick={() => openUnlockDialog(s.id)} className="text-xs">
                  <Unlock className="h-3 w-3 mr-1" />Desbloquear
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Sanciones</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {tournaments.length > 0 && (
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Seleccionar torneo" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {canManage && selectedTournament && (
            <Button size="sm" variant="outline" onClick={handleAutoProcess} disabled={autoProcessing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${autoProcessing ? "animate-spin" : ""}`} />
              {autoProcessing ? "Procesando..." : "Auto-procesar"}
            </Button>
          )}
          {canCreate && selectedTournament && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />Crear sancion
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="active">
            Activas ({sanctions.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Historial ({inactiveSanctions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {loading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : sanctions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShieldCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">No hay sanciones activas.</p>
                {canManage && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Usa "Auto-procesar" para verificar si hay sanciones cumplidas pendientes de desbloquear.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sanctions.map((s) => renderSanctionCard(s, true))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {inactiveSanctions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No hay sanciones cumplidas en el historial.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {inactiveSanctions.map((s) => renderSanctionCard(s, false))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Unlock dialog */}
      <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desbloquear Jugador</DialogTitle>
            <DialogDescription>
              Esta accion desbloquea al jugador antes de cumplir su sancion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo del desbloqueo</Label>
              <Input
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Ej: Sancion revisada por comite disciplinario"
              />
            </div>
            <Button onClick={handleUnlock} className="w-full" variant="destructive">
              Confirmar Desbloqueo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark as served confirmation */}
      <Dialog open={!!markServedTarget} onOpenChange={(open) => { if (!open) setMarkServedTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar sancion como cumplida</DialogTitle>
            <DialogDescription>
              ¿Confirma que la sancion de <strong>{markServedTarget?.player?.firstName} {markServedTarget?.player?.lastName}</strong> ({markServedTarget?.matchesBanned} partido(s)) ha sido cumplida completamente?
              Esto desbloqueara al jugador.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkServedTarget(null)}>Cancelar</Button>
            <Button onClick={handleMarkServed}>Si, marcar cumplida</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create manual sanction dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) { setCreateForm({ playerId: "", type: "CONDUCT", matchesBanned: "1", reason: "" }); setSelectedTeamForCreate(""); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Sancion Manual</DialogTitle>
            <DialogDescription>
              Registra una sancion por conducta o administrativa para un jugador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Equipo *</Label>
              <Select value={selectedTeamForCreate} onValueChange={(v) => { setSelectedTeamForCreate(v); setCreateForm(f => ({ ...f, playerId: "" })); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTeamForCreate && (
              <div>
                <Label>Jugador *</Label>
                <Select value={createForm.playerId} onValueChange={(v) => setCreateForm(f => ({ ...f, playerId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar jugador" /></SelectTrigger>
                  <SelectContent>
                    {teamPlayers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>#{p.jerseyNumber || "?"} {p.firstName} {p.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de sancion *</Label>
                <Select value={createForm.type} onValueChange={(v) => setCreateForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONDUCT">Conducta</SelectItem>
                    <SelectItem value="ADMINISTRATIVE">Administrativa</SelectItem>
                    <SelectItem value="RED_CARD">Tarjeta Roja</SelectItem>
                    <SelectItem value="YELLOW_ACCUMULATION">Acum. Amarillas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Partidos de suspension *</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={createForm.matchesBanned}
                  onChange={(e) => setCreateForm(f => ({ ...f, matchesBanned: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Motivo *</Label>
              <Textarea
                value={createForm.reason}
                onChange={(e) => setCreateForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Describe el motivo de la sancion..."
                rows={3}
              />
            </div>
            <Button onClick={handleCreateManual} className="w-full" disabled={creating || !createForm.playerId || !createForm.reason}>
              {creating ? "Creando..." : "Crear Sancion"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
