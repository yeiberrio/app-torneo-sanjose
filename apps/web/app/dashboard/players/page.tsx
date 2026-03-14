"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";

export default function PlayersPage() {
  const { user } = useAuthStore();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const canCreate = user ? can(user.role, 'create', 'Player') : false;

  useEffect(() => {
    api.get("/players").then((res) => {
      setPlayers(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Jugadores</h1>
        {canCreate && <Button asChild><Link href="/dashboard/players/new"><Plus className="h-4 w-4 mr-2" />Nuevo Jugador</Link></Button>}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : players.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><p className="text-muted-foreground">No hay jugadores registrados.</p></CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">#</th>
                <th className="text-left p-3 font-medium">Nombre</th>
                <th className="text-left p-3 font-medium">Equipo</th>
                <th className="text-left p-3 font-medium">Posicion</th>
                <th className="text-left p-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">{p.jerseyNumber || "-"}</td>
                  <td className="p-3 font-medium">{p.firstName} {p.lastName}</td>
                  <td className="p-3">{p.team?.name || "-"}</td>
                  <td className="p-3">{p.position || "-"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {p.status}
                    </span>
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
