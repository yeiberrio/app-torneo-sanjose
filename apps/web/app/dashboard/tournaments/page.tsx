"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";

export default function TournamentsPage() {
  const { user } = useAuthStore();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const canCreate = user ? can(user.role, 'create', 'Tournament') : false;

  useEffect(() => {
    api.get("/tournaments").then((res) => {
      setTournaments(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Torneos</h1>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/tournaments/new"><Plus className="h-4 w-4 mr-2" />Nuevo Torneo</Link>
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : tournaments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No hay torneos creados aun.</p>
            {canCreate && (
              <Button className="mt-4" asChild>
                <Link href="/dashboard/tournaments/new">Crear primer torneo</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/dashboard/tournaments/detalle?id=${t.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t.type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${t.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' : t.status === 'FINISHED' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {t._count?.teams || 0} equipos | {t._count?.matches || 0} partidos
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
