"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";

export default function NewTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    foundedYear: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error("El nombre del equipo es obligatorio");
      return;
    }
    setLoading(true);
    try {
      const payload: any = { name: form.name };
      if (form.city) payload.city = form.city;
      if (form.foundedYear) payload.foundedYear = Number(form.foundedYear);
      await api.post("/teams", payload);
      toast.success("Equipo creado exitosamente");
      router.push("/dashboard/teams");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al crear equipo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/teams"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Equipo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Equipo *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Deportivo San Jose" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ej: Guarne" />
              </div>
              <div>
                <Label htmlFor="foundedYear">Ano de Fundacion</Label>
                <Input id="foundedYear" type="number" min={1900} max={2030} value={form.foundedYear} onChange={(e) => setForm({ ...form, foundedYear: e.target.value })} placeholder="Ej: 2020" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Equipo"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/teams">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
