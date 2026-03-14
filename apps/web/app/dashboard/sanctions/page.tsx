"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
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
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [sanctions, setSanctions] = useState<any[]>([]);
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
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay sanciones activas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sanctions.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.imposedAt).toLocaleDateString("es-CO")}
                  </span>
                  {canManage && (
                    <Button size="sm" variant="outline" onClick={() => handleDeactivate(s.id)}>
                      Cumplida
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
