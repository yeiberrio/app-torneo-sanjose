"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Trophy, MapPin, Calendar, Edit, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  position: string;
  status: string;
  nationality: string | null;
}

interface Tournament {
  tournament: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
  groupName?: string;
}

interface Team {
  id: string;
  name: string;
  logoUrl: string | null;
  city: string | null;
  foundedYear: number | null;
  players: Player[];
  tournaments: Tournament[];
}

const positionLabels: Record<string, string> = {
  GOALKEEPER: "Portero",
  DEFENDER: "Defensa",
  MIDFIELDER: "Mediocampista",
  FORWARD: "Delantero",
};

const positionOrder: Record<string, number> = {
  GOALKEEPER: 0,
  DEFENDER: 1,
  MIDFIELDER: 2,
  FORWARD: 3,
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Activo",
  INJURED: "Lesionado",
  SUSPENDED: "Suspendido",
  INACTIVE: "Inactivo",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INJURED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-yellow-100 text-yellow-800",
  INACTIVE: "bg-gray-100 text-gray-800",
};

const tournamentStatusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  IN_PROGRESS: "En curso",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado",
};

const tournamentStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-green-100 text-green-800",
  FINISHED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function TeamDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { user } = useAuthStore();
  const canEditTeam = user ? can(user.role, "update", "Team") : false;
  const canEditPlayer = user ? can(user.role, "update", "Player") : false;
  const canDeletePlayer = user ? can(user.role, "delete", "Player") : false;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit team dialog
  const [editTeamOpen, setEditTeamOpen] = useState(false);
  const [editTeamForm, setEditTeamForm] = useState({ name: "", city: "", foundedYear: "" });

  // Edit player dialog
  const [editPlayerOpen, setEditPlayerOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [editPlayerForm, setEditPlayerForm] = useState({ firstName: "", lastName: "", jerseyNumber: "", position: "" });

  // Logo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const fetchTeam = () => {
    if (!id) return;
    api
      .get(`/teams/${id}`)
      .then((res) => setTeam(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTeam(); }, [id]);

  // Team edit handlers
  const openEditTeam = () => {
    if (!team) return;
    setEditTeamForm({
      name: team.name,
      city: team.city || "",
      foundedYear: String(team.foundedYear ?? ""),
    });
    setEditTeamOpen(true);
  };

  const handleEditTeamSave = async () => {
    if (!team) return;
    try {
      const payload: any = {};
      if (editTeamForm.name !== team.name) payload.name = editTeamForm.name;
      if (editTeamForm.city !== (team.city || "")) payload.city = editTeamForm.city;
      if (editTeamForm.foundedYear !== String(team.foundedYear ?? "")) payload.foundedYear = Number(editTeamForm.foundedYear) || undefined;
      if (Object.keys(payload).length === 0) { setEditTeamOpen(false); return; }
      await api.patch(`/teams/${team.id}`, payload);
      toast.success("Equipo actualizado");
      setEditTeamOpen(false);
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar equipo");
    }
  };

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team) return;
    if (!file.type.startsWith("image/")) { toast.error("Solo se permiten imagenes"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/uploads/image", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const logoUrl = uploadRes.data.url || uploadRes.data.path;
      await api.patch(`/teams/${team.id}`, { logoUrl });
      toast.success("Logo actualizado");
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al subir logo");
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Player edit handlers
  const openEditPlayer = (player: Player) => {
    setEditPlayer(player);
    setEditPlayerForm({
      firstName: player.firstName,
      lastName: player.lastName,
      jerseyNumber: String(player.jerseyNumber ?? ""),
      position: player.position || "",
    });
    setEditPlayerOpen(true);
  };

  const handleEditPlayerSave = async () => {
    if (!editPlayer) return;
    try {
      const payload: any = {};
      if (editPlayerForm.firstName !== editPlayer.firstName) payload.firstName = editPlayerForm.firstName;
      if (editPlayerForm.lastName !== editPlayer.lastName) payload.lastName = editPlayerForm.lastName;
      if (editPlayerForm.jerseyNumber !== String(editPlayer.jerseyNumber ?? "")) payload.jerseyNumber = Number(editPlayerForm.jerseyNumber);
      if (editPlayerForm.position !== editPlayer.position) payload.position = editPlayerForm.position;
      if (Object.keys(payload).length === 0) { setEditPlayerOpen(false); return; }
      await api.patch(`/players/${editPlayer.id}`, payload);
      toast.success("Jugador actualizado");
      setEditPlayerOpen(false);
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar jugador");
    }
  };

  const handleDeletePlayer = async (player: Player) => {
    if (!confirm(`¿Eliminar a ${player.firstName} ${player.lastName}?`)) return;
    try {
      await api.delete(`/players/${player.id}`);
      toast.success("Jugador eliminado");
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al eliminar jugador");
    }
  };

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;
  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Equipo no encontrado.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/teams">Volver a equipos</Link>
        </Button>
      </div>
    );
  }

  const sortedPlayers = [...team.players].sort((a, b) => {
    const posA = positionOrder[a.position] ?? 99;
    const posB = positionOrder[b.position] ?? 99;
    if (posA !== posB) return posA - posB;
    return (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99);
  });

  const playersByPosition = sortedPlayers.reduce<Record<string, Player[]>>((acc, p) => {
    const pos = p.position || "OTHER";
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(p);
    return acc;
  }, {});

  return (
    <div>
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/dashboard/teams">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Link>
      </Button>

      {/* Hidden file input for logo upload */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative group">
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={team.name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {team.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          {canEditTeam && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              disabled={logoUploading}
            >
              <Upload className="h-5 w-5 text-white" />
            </button>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {team.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {team.city}
              </span>
            )}
            {team.foundedYear && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Fundado en {team.foundedYear}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {team.players.length} jugadores
            </span>
          </div>
        </div>
        {canEditTeam && (
          <Button size="sm" variant="outline" onClick={openEditTeam}>
            <Edit className="h-4 w-4 mr-2" />Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jugadores */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Plantilla ({team.players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {team.players.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay jugadores registrados.
                </p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(playersByPosition).map(([position, players]) => (
                    <div key={position}>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                        {positionLabels[position] || position} ({players.length})
                      </h3>
                      <div className="space-y-1">
                        {players.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {player.jerseyNumber ?? "-"}
                              </span>
                              <div>
                                <p className="font-medium text-sm">
                                  {player.firstName} {player.lastName}
                                </p>
                                {player.nationality && (
                                  <p className="text-xs text-muted-foreground">
                                    {player.nationality}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {(canEditPlayer || canDeletePlayer) && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {canEditPlayer && (
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditPlayer(player)}>
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  {canDeletePlayer && (
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeletePlayer(player)}>
                                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              <Badge
                                variant="secondary"
                                className={statusColors[player.status] || ""}
                              >
                                {statusLabels[player.status] || player.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Torneos */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Torneos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!team.tournaments || team.tournaments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No participa en torneos.
                </p>
              ) : (
                <div className="space-y-3">
                  {team.tournaments.map((tt) => (
                    <Link
                      key={tt.tournament.id}
                      href={`/dashboard/tournaments/detalle?id=${tt.tournament.id}`}
                      className="block"
                    >
                      <div className="p-3 rounded-md border hover:bg-muted/50 transition-colors">
                        <p className="font-medium text-sm">{tt.tournament.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={
                              tournamentStatusColors[tt.tournament.status] || ""
                            }
                          >
                            {tournamentStatusLabels[tt.tournament.status] ||
                              tt.tournament.status}
                          </Badge>
                          {tt.groupName && (
                            <Badge variant="outline">Grupo {tt.groupName}</Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit team dialog */}
      <Dialog open={editTeamOpen} onOpenChange={setEditTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Equipo</DialogTitle>
            <DialogDescription>Modifica los datos del equipo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={editTeamForm.name} onChange={(e) => setEditTeamForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input value={editTeamForm.city} onChange={(e) => setEditTeamForm(prev => ({ ...prev, city: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Ano de fundacion</Label>
                <Input type="number" min={1900} max={2100} value={editTeamForm.foundedYear} onChange={(e) => setEditTeamForm(prev => ({ ...prev, foundedYear: e.target.value }))} />
              </div>
            </div>
            <Button onClick={handleEditTeamSave} className="w-full">Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit player dialog */}
      <Dialog open={editPlayerOpen} onOpenChange={setEditPlayerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Jugador</DialogTitle>
            <DialogDescription>Modifica los datos del jugador.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editPlayerForm.firstName} onChange={(e) => setEditPlayerForm(prev => ({ ...prev, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input value={editPlayerForm.lastName} onChange={(e) => setEditPlayerForm(prev => ({ ...prev, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numero de camiseta</Label>
                <Input type="number" min={1} max={99} value={editPlayerForm.jerseyNumber} onChange={(e) => setEditPlayerForm(prev => ({ ...prev, jerseyNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Posicion</Label>
                <Select value={editPlayerForm.position} onValueChange={(v) => setEditPlayerForm(prev => ({ ...prev, position: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(positionLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleEditPlayerSave} className="w-full">Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
