"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";

const positionLabels: Record<string, string> = {
  GOALKEEPER: "Portero",
  DEFENDER: "Defensa",
  MIDFIELDER: "Mediocampista",
  FORWARD: "Delantero",
};

export default function PlayersTrashPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadTrash = () => {
    setLoading(true);
    api
      .get("/players/trash/list")
      .then((res) => setPlayers(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const handleRestore = async (id: string, name: string) => {
    setRestoring(id);
    try {
      await api.post(`/players/${id}/restore`);
      toast.success(`Jugador "${name}" restaurado`);
      loadTrash();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al restaurar");
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/players">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Papelera de Jugadores</h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : players.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">La papelera esta vacia.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">#</th>
                <th className="text-left p-3 font-medium">Nombre</th>
                <th className="text-left p-3 font-medium">Equipo</th>
                <th className="text-left p-3 font-medium">Posicion</th>
                <th className="text-left p-3 font-medium">Eliminado</th>
                <th className="text-right p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-b opacity-75">
                  <td className="p-3">{p.jerseyNumber || "-"}</td>
                  <td className="p-3 font-medium line-through text-muted-foreground">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="p-3">{p.team?.name || "-"}</td>
                  <td className="p-3">{positionLabels[p.position] || p.position || "-"}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(p.deletedAt).toLocaleDateString("es-CO")}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={restoring === p.id}
                      onClick={() => handleRestore(p.id, `${p.firstName} ${p.lastName}`)}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      {restoring === p.id ? "..." : "Restaurar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
