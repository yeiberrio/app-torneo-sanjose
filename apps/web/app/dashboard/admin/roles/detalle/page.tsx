"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Save } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";

const MODULES = [
  "dashboard", "tournaments", "teams", "players", "matches",
  "statistics", "sanctions", "news", "users", "roles",
];

const moduleLabels: Record<string, string> = {
  dashboard: "Dashboard", tournaments: "Torneos", teams: "Equipos",
  players: "Jugadores", matches: "Partidos", statistics: "Estadisticas",
  sanctions: "Sanciones", news: "Noticias", users: "Usuarios", roles: "Roles",
};

const ACTIONS = ["viewModule", "create", "read", "edit", "delete"];
const actionLabels: Record<string, string> = {
  viewModule: "Ver", create: "Crear", read: "Leer", edit: "Editar", delete: "Eliminar",
};

interface Permission { id: string; module: string; viewModule: boolean; create: boolean; read: boolean; edit: boolean; delete: boolean; }
interface CustomRole { id: string; name: string; description?: string; isSystem: boolean; permissions: Permission[]; _count: { users: number }; }

export default function RoleDetailPage() {
  const searchParams = useSearchParams();
  const roleId = searchParams.get("id");
  const [role, setRole] = useState<CustomRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!roleId) return;
    api.get(`/roles/${roleId}`)
      .then((res) => {
        setRole(res.data);
        // Build permissions state
        const perms: Record<string, Record<string, boolean>> = {};
        for (const mod of MODULES) {
          const existing = res.data.permissions?.find((p: any) => p.module === mod);
          perms[mod] = {
            viewModule: existing?.viewModule ?? false,
            create: existing?.create ?? false,
            read: existing?.read ?? false,
            edit: existing?.edit ?? false,
            delete: existing?.delete ?? false,
          };
        }
        setPermissions(perms);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roleId]);

  const toggle = (module: string, action: string) => {
    setPermissions(prev => ({
      ...prev,
      [module]: { ...prev[module], [action]: !prev[module][action] },
    }));
    setHasChanges(true);
  };

  const toggleModule = (module: string) => {
    const allOn = ACTIONS.every(a => permissions[module]?.[a]);
    setPermissions(prev => ({
      ...prev,
      [module]: Object.fromEntries(ACTIONS.map(a => [a, !allOn])),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!roleId) return;
    setSaving(true);
    try {
      const perms = MODULES.map(m => ({ module: m, ...permissions[m] }));
      const res = await api.patch(`/roles/${roleId}/permissions`, { permissions: perms });
      setRole(res.data);
      setHasChanges(false);
      toast.success("Permisos actualizados");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>;
  if (!role) return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Rol no encontrado.</p>
      <Button asChild variant="outline" className="mt-4"><Link href="/dashboard/admin/roles">Volver</Link></Button>
    </div>
  );

  const isReadOnly = role.isSystem;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/roles"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{role.name}</h1>
            {role.isSystem && <Badge className="bg-blue-100 text-blue-800 text-xs">Sistema</Badge>}
            <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />{role._count.users} usuario(s)</Badge>
          </div>
          {role.description && <p className="text-sm text-muted-foreground mt-1">{role.description}</p>}
        </div>
        {!isReadOnly && hasChanges && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />{saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permisos</CardTitle>
          {isReadOnly && <p className="text-sm text-muted-foreground">Los roles del sistema no se pueden modificar.</p>}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 pr-4 text-left font-medium">Modulo</th>
                  {ACTIONS.map(a => (<th key={a} className="pb-2 px-3 text-center font-medium">{actionLabels[a]}</th>))}
                  {!isReadOnly && <th className="pb-2 px-3 text-center font-medium">Todos</th>}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod) => (
                  <tr key={mod} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2.5 pr-4 font-medium">{moduleLabels[mod] || mod}</td>
                    {ACTIONS.map(a => (
                      <td key={a} className="py-2.5 px-3 text-center">
                        {isReadOnly ? (
                          <span className={`inline-block h-4 w-4 rounded-sm ${permissions[mod]?.[a] ? "bg-green-500" : "bg-gray-200"}`} />
                        ) : (
                          <input type="checkbox" checked={permissions[mod]?.[a] ?? false} onChange={() => toggle(mod, a)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        )}
                      </td>
                    ))}
                    {!isReadOnly && (
                      <td className="py-2.5 px-3 text-center">
                        <input type="checkbox" checked={ACTIONS.every(a => permissions[mod]?.[a])} onChange={() => toggleModule(mod)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
