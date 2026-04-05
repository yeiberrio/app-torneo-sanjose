"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, UserCheck } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminPage() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/users/pending-approvals").then((res) => {
      setPendingRequests(res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleApproval = async (requestId: string, approved: boolean) => {
    try {
      await api.patch(`/users/approve-role/${requestId}`, { approved });
      toast.success(approved ? "Rol aprobado" : "Solicitud rechazada");
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      toast.error("Error al procesar solicitud");
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Administracion</h1>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link href="/dashboard/admin/roles">
          <Card className="card-hover cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Roles y Permisos</p>
                <p className="text-sm text-muted-foreground">Gestiona roles personalizados y permisos por modulo</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">Solicitudes Pendientes</p>
              <p className="text-sm text-muted-foreground">{pendingRequests.length} solicitud(es) por revisar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Solicitudes de Rol Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No hay solicitudes pendientes.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{req.user.firstName} {req.user.lastName}</p>
                    <p className="text-sm text-muted-foreground">{req.user.email}</p>
                    <p className="text-sm">Solicita: <span className="font-medium text-primary">{req.requestedRole}</span></p>
                    {req.justification && <p className="text-sm text-muted-foreground mt-1">"{req.justification}"</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApproval(req.id, true)}>Aprobar</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleApproval(req.id, false)}>Rechazar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
