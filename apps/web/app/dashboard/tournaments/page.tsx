"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { can } from "@/lib/permissions";

export default function TournamentsPage() {
  const { user } = useAuthStore();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const canCreate = user ? can(user.role, "create", "Tournament") : false;
  const canDelete = user ? can(user.role, "delete", "Tournament") : false;

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadTournaments = () => {
    setLoading(true);
    api
      .get("/tournaments")
      .then((res) => setTournaments(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget || !password) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/tournaments/${deleteTarget.id}`, {
        data: { password },
      });
      setDeleteTarget(null);
      setPassword("");
      loadTournaments();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Error al eliminar el torneo";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Torneos</h1>
        <div className="flex gap-2">
          {canDelete && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/tournaments/papelera">
                <Trash2 className="h-4 w-4 mr-2" />
                Papelera
              </Link>
            </Button>
          )}
          {canCreate && (
            <Button asChild>
              <Link href="/dashboard/tournaments/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Torneo
              </Link>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : tournaments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No hay torneos creados aun.
            </p>
            {canCreate && (
              <Button className="mt-4" asChild>
                <Link href="/dashboard/tournaments/new">
                  Crear primer torneo
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tournaments.map((t) => (
            <Card
              key={t.id}
              className="card-hover relative group"
            >
              <Link href={`/dashboard/tournaments/detalle?id=${t.id}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t.type}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        t.status === "IN_PROGRESS"
                          ? "bg-green-100 text-green-800"
                          : t.status === "FINISHED"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {t._count?.teams || 0} equipos |{" "}
                    {t._count?.matches || 0} partidos
                  </div>
                </CardContent>
              </Link>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteTarget(t);
                    setDeleteError("");
                    setPassword("");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setPassword("");
            setDeleteError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar torneo</DialogTitle>
            <DialogDescription>
              El torneo <strong>{deleteTarget?.name}</strong> sera movido a la
              papelera. Podras restaurarlo despues si lo necesitas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="delete-password">
                Ingresa tu contraseña para confirmar
              </Label>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDelete();
                }}
              />
            </div>
            {deleteError && (
              <p className="text-sm text-destructive">{deleteError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || !password}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
