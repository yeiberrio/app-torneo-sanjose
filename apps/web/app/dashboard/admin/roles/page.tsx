"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, ShieldCheck, Trash2, Users, Settings, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const MODULES = [
  "dashboard", "tournaments", "teams", "players", "matches",
  "statistics", "sanctions", "news", "users", "roles",
];

const moduleLabels: Record<string, string> = {
  dashboard: "Dashboard", tournaments: "Torneos", teams: "Equipos",
  players: "Jugadores", matches: "Partidos", statistics: "Estadisticas",
  sanctions: "Sanciones", news: "Noticias", users: "Usuarios", roles: "Roles",
};

const ROLES_ENUM = [
  "ADMIN", "ORGANIZER", "REFEREE", "SCOREKEEPER",
  "DIRECTOR", "PLAYER", "OBSERVER", "JOURNALIST", "CITIZEN", "BETTOR",
];

const ACTIONS = ["viewModule", "create", "read", "edit", "delete"];
const actionLabels: Record<string, string> = {
  viewModule: "Ver", create: "Crear", read: "Leer", edit: "Editar", delete: "Eliminar",
};

interface Permission { id: string; module: string; viewModule: boolean; create: boolean; read: boolean; edit: boolean; delete: boolean; }
interface CustomRole { id: string; name: string; description?: string; isSystem: boolean; permissions: Permission[]; _count: { users: number }; }
interface DefaultPerm { id: string; role: string; module: string; viewModule: boolean; create: boolean; read: boolean; edit: boolean; delete: boolean; }

export default function RolesPage() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"custom" | "default">("custom");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<CustomRole | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Default permissions state
  const [selectedRole, setSelectedRole] = useState(ROLES_ENUM[0]);
  const [defaults, setDefaults] = useState<DefaultPerm[]>([]);
  const [defaultsLoading, setDefaultsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRoles = () => {
    setLoading(true);
    api.get("/roles").then((res) => setRoles(res.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRoles(); }, []);

  useEffect(() => {
    if (tab !== "default") return;
    setDefaultsLoading(true);
    api.get(`/roles/defaults/${selectedRole}`)
      .then((res) => setDefaults(res.data || []))
      .catch(() => setDefaults([]))
      .finally(() => setDefaultsLoading(false));
  }, [tab, selectedRole]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/roles/${deleteTarget.id}`);
      toast.success(`Rol "${deleteTarget.name}" eliminado`);
      setDeleteTarget(null);
      fetchRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al eliminar rol");
    } finally {
      setDeleting(false);
    }
  };

  const toggleDefault = (module: string, field: string) => {
    setDefaults((prev) =>
      prev.map((p) => p.module === module ? { ...p, [field]: !(p as any)[field] } : p)
    );
  };

  const initDefaults = () => {
    // Initialize all modules if empty
    if (defaults.length === 0) {
      setDefaults(MODULES.map(m => ({
        id: "", role: selectedRole, module: m,
        viewModule: false, create: false, read: false, edit: false, delete: false,
      })));
    }
  };

  useEffect(() => { if (tab === "default" && defaults.length === 0) initDefaults(); }, [defaults, tab]);

  const saveDefaults = async () => {
    setSaving(true);
    try {
      const permissions = (defaults.length > 0 ? defaults : MODULES.map(m => ({
        module: m, viewModule: false, create: false, read: false, edit: false, delete: false,
      }))).map((d) => ({
        module: d.module, viewModule: d.viewModule, create: d.create,
        read: d.read, edit: d.edit, delete: d.delete,
      }));
      const updated = await api.patch(`/roles/defaults/${selectedRole}`, { permissions });
      setDefaults(updated.data || []);
      toast.success("Permisos guardados");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const getPermission = (role: CustomRole, module: string) =>
    role.permissions.find((p) => p.module === module);

  const getDefault = (module: string) =>
    defaults.find((p) => p.module === module);

  const PermCell = ({ value }: { value: boolean }) => (
    <span className={`inline-block h-4 w-4 rounded-sm ${value ? "bg-green-500" : "bg-gray-200"}`} />
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Roles y Permisos</h1>
          <p className="text-sm text-muted-foreground">Gestiona los roles del sistema y permisos granulares</p>
        </div>
        <Link href="/dashboard/admin/roles/nuevo">
          <Button><Plus className="h-4 w-4 mr-2" />Nuevo Rol</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-6">
        <button onClick={() => setTab("custom")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "custom" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <ShieldCheck className="inline-block h-4 w-4 mr-1" />Roles Personalizados
        </button>
        <button onClick={() => setTab("default")} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "default" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Settings className="inline-block h-4 w-4 mr-1" />Permisos por Rol
        </button>
      </div>

      {/* Custom Roles Tab */}
      {tab === "custom" && (
        <>
          {loading ? (
            <div className="space-y-4">{[1,2].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>
          ) : roles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay roles personalizados. Crea uno para empezar.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        {role.isSystem && <Badge className="bg-blue-100 text-blue-800 text-xs">Sistema</Badge>}
                        <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />{role._count.users} usuario(s)</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/admin/roles/detalle?id=${role.id}`}>
                          <Button size="sm" variant="outline">{role.isSystem ? "Ver" : "Editar"}</Button>
                        </Link>
                        {!role.isSystem && (
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteTarget(role)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {role.description && <p className="text-sm text-muted-foreground">{role.description}</p>}
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="pb-2 pr-4 text-left font-medium">Modulo</th>
                            {ACTIONS.map(a => (<th key={a} className="pb-2 px-2 text-center font-medium">{actionLabels[a]}</th>))}
                          </tr>
                        </thead>
                        <tbody>
                          {MODULES.map((mod) => {
                            const p = getPermission(role, mod);
                            return (
                              <tr key={mod} className="border-b last:border-0">
                                <td className="py-1.5 pr-4 font-medium">{moduleLabels[mod] || mod}</td>
                                {ACTIONS.map(a => (
                                  <td key={a} className="py-1.5 px-2 text-center"><PermCell value={(p as any)?.[a] ?? false} /></td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Default Permissions Tab */}
      {tab === "default" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Permisos por defecto</CardTitle>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES_ENUM.map(r => (<SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Estos permisos se aplican a todos los usuarios con el rol {selectedRole.replace(/_/g, " ")} que no tienen un rol personalizado.
            </p>
          </CardHeader>
          <CardContent>
            {defaultsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-8 rounded" />)}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pb-2 pr-4 text-left font-medium">Modulo</th>
                        {ACTIONS.map(a => (<th key={a} className="pb-2 px-3 text-center font-medium">{actionLabels[a]}</th>))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map((mod) => {
                        const d = getDefault(mod);
                        return (
                          <tr key={mod} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{moduleLabels[mod] || mod}</td>
                            {ACTIONS.map(a => (
                              <td key={a} className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={(d as any)?.[a] ?? false}
                                  onChange={() => {
                                    if (!d) {
                                      // Add this module
                                      setDefaults(prev => [...prev, {
                                        id: "", role: selectedRole, module: mod,
                                        viewModule: a === "viewModule", create: a === "create",
                                        read: a === "read", edit: a === "edit", delete: a === "delete",
                                      }]);
                                    } else {
                                      toggleDefault(mod, a);
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <Button onClick={saveDefaults} disabled={saving}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar rol</DialogTitle>
            <DialogDescription>
              ¿Desea eliminar el rol <strong>"{deleteTarget?.name}"</strong>?
              Los usuarios con este rol perderan sus permisos personalizados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Si, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
