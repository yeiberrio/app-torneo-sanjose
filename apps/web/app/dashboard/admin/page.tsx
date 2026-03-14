"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";

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
    <div>
      <h1 className="text-2xl font-bold mb-6">Administracion</h1>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Rol Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Cargando...</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay solicitudes pendientes.</p>
          ) : (
            <div className="space-y-4">
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
