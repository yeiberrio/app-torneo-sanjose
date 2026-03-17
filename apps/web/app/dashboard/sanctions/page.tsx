"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ShieldCheck, Unlock } from "lucide-react";
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
  const canUnlock = user ? can(user.role, "manage", "Sanction") : false;
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [sanctions, setSanctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Unlock dialog state
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [unlockSanctionId, setUnlockSanctionId] = useState("");
  const [unlockReason, setUnlockReason] = useState("");

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
    api.get(`/sanctions/tournament/${selectedTournament}`).then((res) => {
      setSanctions(res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedTournament]);

  const handleDeactivate = async (id: string) => {
    try {
      await api.patch(`/sanctions/${id}/deactivate`);
      toast.success("Sancion desactivada (cumplida)");
      setSanctions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Error al desactivar sancion");
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
      setSanctions((prev) => prev.filter((s) => s.id !== unlockSanctionId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al desbloquear jugador");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Sanciones</h1>
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

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : sanctions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-muted-foreground">No hay sanciones activas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sanctions.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      #{s.player?.jerseyNumber || "?"} {s.player?.firstName} {s.player?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{s.player?.team?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="destructive" className="text-xs">
                        {sanctionTypeLabels[s.type] || s.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {s.matchesBanned} partido(s) de suspension
                      </span>
                    </div>
                    {s.reason && <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.imposedAt).toLocaleDateString("es-CO")}
                  </span>
                  {canManage && (
                    <Button size="sm" variant="outline" onClick={() => handleDeactivate(s.id)}>
                      Cumplida
                    </Button>
                  )}
                  {canUnlock && (
                    <Button size="sm" variant="destructive" onClick={() => openUnlockDialog(s.id)}>
                      <Unlock className="h-3.5 w-3.5 mr-1" />Desbloquear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Unlock dialog */}
      <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desbloquear Jugador</DialogTitle>
            <DialogDescription>
              Esta accion desbloquea al jugador antes de cumplir su sancion. Solo disponible para Super Admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo del desbloqueo (opcional)</Label>
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
    </div>
  );
}
