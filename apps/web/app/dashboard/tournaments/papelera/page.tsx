"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";

export default function TrashPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadTrash = () => {
    setLoading(true);
    api
      .get("/tournaments/trash/list")
      .then((res) => setTournaments(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const handleRestore = async (id: string) => {
    setRestoring(id);
    try {
      await api.post(`/tournaments/${id}/restore`);
      loadTrash();
    } catch {
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tournaments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Papelera de Torneos</h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : tournaments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">La papelera esta vacia.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => (
            <Card key={t.id} className="border-dashed opacity-75">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="line-through text-muted-foreground">
                    {t.name}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-muted-foreground mb-3">
                  <span>{t.type}</span>
                  <span className="text-xs">
                    Eliminado:{" "}
                    {new Date(t.deletedAt).toLocaleDateString("es-CO")}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  {t._count?.teams || 0} equipos |{" "}
                  {t._count?.matches || 0} partidos
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={restoring === t.id}
                  onClick={() => handleRestore(t.id)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {restoring === t.id ? "Restaurando..." : "Restaurar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
