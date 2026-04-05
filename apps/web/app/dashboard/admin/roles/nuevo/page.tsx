"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
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

export default function NewRolePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(
    Object.fromEntries(MODULES.map(m => [m, { viewModule: false, create: false, read: false, edit: false, delete: false }]))
  );
  const [saving, setSaving] = useState(false);

  const toggle = (module: string, action: string) => {
    setPermissions(prev => ({
      ...prev,
      [module]: { ...prev[module], [action]: !prev[module][action] },
    }));
  };

  const toggleModule = (module: string) => {
    const allOn = ACTIONS.every(a => permissions[module][a]);
    setPermissions(prev => ({
      ...prev,
      [module]: Object.fromEntries(ACTIONS.map(a => [a, !allOn])),
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("El nombre del rol es obligatorio"); return; }
    setSaving(true);
    try {
      const perms = MODULES.map(m => {
        const p = permissions[m];
        return { module: m, viewModule: p.viewModule, create: p.create, read: p.read, edit: p.edit, delete: p.delete };
      }).filter(p => p.viewModule || p.create || p.read || p.edit || p.delete);

      await api.post("/roles", { name: name.trim(), description: description.trim() || undefined, permissions: perms });
      toast.success("Rol creado exitosamente");
      router.push("/dashboard/admin/roles");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al crear rol");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/roles"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Crear Nuevo Rol</h1>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Informacion del Rol</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del rol *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Coordinador de cancha" />
          </div>
          <div className="space-y-2">
            <Label>Descripcion (opcional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe las responsabilidades de este rol..." rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Permisos</CardTitle>
          <p className="text-sm text-muted-foreground">Configura que puede hacer este rol en cada modulo</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 pr-4 text-left font-medium">Modulo</th>
                  {ACTIONS.map(a => (<th key={a} className="pb-2 px-3 text-center font-medium">{actionLabels[a]}</th>))}
                  <th className="pb-2 px-3 text-center font-medium">Todos</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod) => (
                  <tr key={mod} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{moduleLabels[mod] || mod}</td>
                    {ACTIONS.map(a => (
                      <td key={a} className="py-2.5 px-3 text-center">
                        <input type="checkbox" checked={permissions[mod][a]} onChange={() => toggle(mod, a)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-center">
                      <input type="checkbox" checked={ACTIONS.every(a => permissions[mod][a])} onChange={() => toggleModule(mod)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "Creando..." : "Crear Rol"}
        </Button>
        <Button variant="outline" asChild><Link href="/dashboard/admin/roles">Cancelar</Link></Button>
      </div>
    </div>
  );
}
