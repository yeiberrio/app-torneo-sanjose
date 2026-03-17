"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";

const positionLabels: Record<string, string> = {
  GOALKEEPER: "Portero",
  DEFENDER: "Defensa",
  MIDFIELDER: "Mediocampista",
  FORWARD: "Delantero",
};

export default function PlayersPage() {
  const { user } = useAuthStore();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const canCreate = user ? can(user.role, 'create', 'Player') : false;
  const canEdit = user ? can(user.role, 'update', 'Player') : false;
  const canDelete = user ? can(user.role, 'delete', 'Player') : false;

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    jerseyNumber: "",
    position: "",
  });

  const fetchPlayers = () => {
    api.get("/players").then((res) => {
      setPlayers(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlayers(); }, []);

  const openEdit = (player: any) => {
    setEditPlayer(player);
    setEditForm({
      firstName: player.firstName || "",
      lastName: player.lastName || "",
      jerseyNumber: String(player.jerseyNumber ?? ""),
      position: player.position || "",
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editPlayer) return;
    try {
      const payload: any = {};
      if (editForm.firstName !== editPlayer.firstName) payload.firstName = editForm.firstName;
      if (editForm.lastName !== editPlayer.lastName) payload.lastName = editForm.lastName;
      if (editForm.jerseyNumber !== String(editPlayer.jerseyNumber ?? "")) payload.jerseyNumber = Number(editForm.jerseyNumber);
      if (editForm.position !== editPlayer.position) payload.position = editForm.position;
      if (Object.keys(payload).length === 0) {
        setEditOpen(false);
        return;
      }
      await api.patch(`/players/${editPlayer.id}`, payload);
      toast.success("Jugador actualizado");
      setEditOpen(false);
      fetchPlayers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar jugador");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al jugador ${name}? Esta accion no se puede deshacer.`)) return;
    try {
      await api.delete(`/players/${id}`);
      toast.success("Jugador eliminado");
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al eliminar jugador");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Jugadores</h1>
        {canCreate && <Button asChild><Link href="/dashboard/players/new"><Plus className="h-4 w-4 mr-2" />Nuevo Jugador</Link></Button>}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : players.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay jugadores registrados.</p>
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
                <th className="text-left p-3 font-medium">Estado</th>
                {(canEdit || canDelete) && <th className="text-right p-3 font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">{p.jerseyNumber || "-"}</td>
                  <td className="p-3 font-medium">{p.firstName} {p.lastName}</td>
                  <td className="p-3">{p.team?.name || "-"}</td>
                  <td className="p-3">{positionLabels[p.position] || p.position || "-"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {p.status}
                    </span>
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(p.id, `${p.firstName} ${p.lastName}`)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit player dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Jugador</DialogTitle>
            <DialogDescription>Modifica los datos del jugador.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numero de camiseta</Label>
                <Input type="number" min={1} max={99} value={editForm.jerseyNumber} onChange={(e) => setEditForm(prev => ({ ...prev, jerseyNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Posicion</Label>
                <Select value={editForm.position} onValueChange={(v) => setEditForm(prev => ({ ...prev, position: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(positionLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleEditSave} className="w-full">Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
