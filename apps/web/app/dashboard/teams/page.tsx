"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus, Users, ChevronRight, Edit, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";

export default function TeamsPage() {
  const { user } = useAuthStore();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const canCreate = user ? can(user.role, 'create', 'Team') : false;
  const canEdit = user ? can(user.role, 'update', 'Team') : false;
  const canDelete = user ? can(user.role, 'delete', 'Team') : false;

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", city: "", foundedYear: "" });

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Logo upload state
  const [logoTeamId, setLogoTeamId] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTeams = () => {
    api.get("/teams").then((res) => {
      setTeams(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTeams(); }, []);

  const openEdit = (team: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditTeam(team);
    setEditForm({
      name: team.name || "",
      city: team.city || "",
      foundedYear: String(team.foundedYear ?? ""),
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editTeam) return;
    try {
      const payload: any = {};
      if (editForm.name !== editTeam.name) payload.name = editForm.name;
      if (editForm.city !== (editTeam.city || "")) payload.city = editForm.city;
      if (editForm.foundedYear !== String(editTeam.foundedYear ?? "")) payload.foundedYear = Number(editForm.foundedYear) || undefined;
      if (Object.keys(payload).length === 0) {
        setEditOpen(false);
        return;
      }
      await api.patch(`/teams/${editTeam.id}`, payload);
      toast.success("Equipo actualizado");
      setEditOpen(false);
      fetchTeams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al actualizar equipo");
    }
  };

  const openDeleteConfirm = (team: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(team);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/teams/${deleteTarget.id}`);
      toast.success(`Equipo "${deleteTarget.name}" movido a la papelera`);
      setDeleteTarget(null);
      fetchTeams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al eliminar equipo");
    } finally {
      setDeleting(false);
    }
  };

  const triggerLogoUpload = (teamId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLogoTeamId(teamId);
    fileInputRef.current?.click();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !logoTeamId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imagenes (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post("/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const logoUrl = uploadRes.data.url || uploadRes.data.path;
      await api.patch(`/teams/${logoTeamId}`, { logoUrl });
      toast.success("Logo actualizado");
      fetchTeams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al subir logo");
    } finally {
      setLogoUploading(false);
      setLogoTeamId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Equipos</h1>
        <div className="flex gap-2">
          {canDelete && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/teams/papelera">
                <Trash2 className="h-4 w-4 mr-2" />
                Papelera
              </Link>
            </Button>
          )}
          {canCreate && <Button asChild><Link href="/dashboard/teams/new"><Plus className="h-4 w-4 mr-2" />Nuevo Equipo</Link></Button>}
        </div>
      </div>

      {/* Hidden file input for logo upload */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay equipos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <a key={team.id} href={`/dashboard/teams/detalle?id=${team.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Logo or initials */}
                    <div className="relative group">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      {canEdit && (
                        <button
                          onClick={(e) => triggerLogoUpload(team.id, e)}
                          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          disabled={logoUploading}
                        >
                          <Upload className="h-4 w-4 text-white" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{team.name}</p>
                      <p className="text-sm text-muted-foreground">{team.city || "Sin ciudad"} | {team._count?.players || 0} jugadores</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => openEdit(team, e)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => openDeleteConfirm(team, e)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      )}

      {/* Edit team dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Equipo</DialogTitle>
            <DialogDescription>Modifica los datos del equipo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input value={editForm.city} onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Ano de fundacion</Label>
                <Input type="number" min={1900} max={2100} value={editForm.foundedYear} onChange={(e) => setEditForm(prev => ({ ...prev, foundedYear: e.target.value }))} />
              </div>
            </div>
            <Button onClick={handleEditSave} className="w-full">Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar equipo</DialogTitle>
            <DialogDescription>
              ¿Desea eliminar el equipo <strong>"{deleteTarget?.name}"</strong>?
              El equipo sera movido a la papelera y podra restaurarlo despues si lo necesita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              No, cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Si, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
