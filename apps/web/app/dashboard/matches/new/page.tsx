"use client";

import { useEffect, useState } from "react";
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

export default function NewMatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [form, setForm] = useState({
    tournamentId: "",
    teamAId: "",
    teamBId: "",
    scheduledAt: "",
    scheduledTime: "15:00",
    venue: "",
    dayNumber: "",
    matchNumber: "",
  });

  useEffect(() => {
    Promise.all([
      api.get("/tournaments?limit=100"),
      api.get("/teams?limit=100"),
    ]).then(([tRes, teamRes]) => {
      setTournaments(tRes.data.data || []);
      setTeams(teamRes.data.data || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tournamentId || !form.teamAId || !form.teamBId || !form.scheduledAt) {
      toast.error("Torneo, equipos y fecha son obligatorios");
      return;
    }
    if (form.teamAId === form.teamBId) {
      toast.error("Los equipos deben ser diferentes");
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        tournamentId: form.tournamentId,
        teamAId: form.teamAId,
        teamBId: form.teamBId,
        scheduledAt: `${form.scheduledAt}T${form.scheduledTime}:00.000Z`,
      };
      if (form.venue) payload.venue = form.venue;
      if (form.dayNumber) payload.dayNumber = Number(form.dayNumber);
      if (form.matchNumber) payload.matchNumber = Number(form.matchNumber);
      await api.post("/matches", payload);
      toast.success("Partido programado exitosamente");
      router.push("/dashboard/matches");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al programar partido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/matches"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Programar Partido</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Partido</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Torneo *</Label>
              <Select value={form.tournamentId} onValueChange={(v) => setForm({ ...form, tournamentId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar torneo" /></SelectTrigger>
                <SelectContent>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Equipo Local *</Label>
                <Select value={form.teamAId} onValueChange={(v) => setForm({ ...form, teamAId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Equipo Visitante *</Label>
                <Select value={form.teamBId} onValueChange={(v) => setForm({ ...form, teamBId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                  <SelectContent>
                    {teams.filter((t) => t.id !== form.teamAId).map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="scheduledAt">Fecha *</Label>
                <Input id="scheduledAt" type="date" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="scheduledTime">Hora</Label>
                <Input id="scheduledTime" type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="venue">Sede / Cancha</Label>
                <Input id="venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Cancha San Jose" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dayNumber">Jornada</Label>
                <Input id="dayNumber" type="number" min={1} value={form.dayNumber} onChange={(e) => setForm({ ...form, dayNumber: e.target.value })} placeholder="1" />
              </div>
              <div>
                <Label htmlFor="matchNumber">Numero de Partido</Label>
                <Input id="matchNumber" type="number" min={1} value={form.matchNumber} onChange={(e) => setForm({ ...form, matchNumber: e.target.value })} placeholder="1" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Programando..." : "Programar Partido"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/matches">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
