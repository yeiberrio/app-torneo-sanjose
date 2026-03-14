"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";

export default function NewTournamentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "LEAGUE",
    startDate: "",
    endDate: "",
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
    maxYellowCards: 3,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.startDate) {
      toast.error("Nombre y fecha de inicio son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        type: form.type,
        startDate: form.startDate,
        winPoints: Number(form.winPoints),
        drawPoints: Number(form.drawPoints),
        lossPoints: Number(form.lossPoints),
        maxYellowCards: Number(form.maxYellowCards),
      };
      if (form.endDate) payload.endDate = form.endDate;
      await api.post("/tournaments", payload);
      toast.success("Torneo creado exitosamente");
      router.push("/dashboard/tournaments");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al crear torneo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/tournaments"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Torneo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Torneo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del Torneo *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Torneo San Jose 2026" />
            </div>

            <div>
              <Label htmlFor="type">Tipo de Torneo *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAGUE">Liga (todos contra todos)</SelectItem>
                  <SelectItem value="CUP">Copa (eliminacion directa)</SelectItem>
                  <SelectItem value="GROUPS">Fase de grupos + eliminacion</SelectItem>
                  <SelectItem value="KNOCKOUT">Eliminacion directa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="endDate">Fecha de Fin</Label>
                <Input id="endDate" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="winPoints">Pts Victoria</Label>
                <Input id="winPoints" type="number" min={0} value={form.winPoints} onChange={(e) => setForm({ ...form, winPoints: +e.target.value })} />
              </div>
              <div>
                <Label htmlFor="drawPoints">Pts Empate</Label>
                <Input id="drawPoints" type="number" min={0} value={form.drawPoints} onChange={(e) => setForm({ ...form, drawPoints: +e.target.value })} />
              </div>
              <div>
                <Label htmlFor="lossPoints">Pts Derrota</Label>
                <Input id="lossPoints" type="number" min={0} value={form.lossPoints} onChange={(e) => setForm({ ...form, lossPoints: +e.target.value })} />
              </div>
            </div>

            <div className="w-1/3">
              <Label htmlFor="maxYellowCards">Max Amarillas (suspension)</Label>
              <Input id="maxYellowCards" type="number" min={1} value={form.maxYellowCards} onChange={(e) => setForm({ ...form, maxYellowCards: +e.target.value })} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear Torneo"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/tournaments">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
