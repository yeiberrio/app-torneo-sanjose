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

export default function NewPlayerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [form, setForm] = useState({
    teamId: "",
    firstName: "",
    lastName: "",
    jerseyNumber: "",
    position: "",
    birthDate: "",
    documentType: "",
    documentNumber: "",
    nationality: "Colombiana",
    heightCm: "",
    weightKg: "",
    gender: "",
  });

  useEffect(() => {
    api.get("/teams?limit=100").then((res) => setTeams(res.data.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teamId || !form.firstName || !form.lastName) {
      toast.error("Equipo, nombre y apellido son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        teamId: form.teamId,
        firstName: form.firstName,
        lastName: form.lastName,
      };
      if (form.jerseyNumber) payload.jerseyNumber = Number(form.jerseyNumber);
      if (form.position) payload.position = form.position;
      if (form.birthDate) payload.birthDate = form.birthDate;
      if (form.documentType) payload.documentType = form.documentType;
      if (form.documentNumber) payload.documentNumber = form.documentNumber;
      if (form.nationality) payload.nationality = form.nationality;
      if (form.heightCm) payload.heightCm = Number(form.heightCm);
      if (form.weightKg) payload.weightKg = Number(form.weightKg);
      if (form.gender) payload.gender = form.gender;
      await api.post("/players", payload);
      toast.success("Jugador registrado exitosamente");
      router.push("/dashboard/players");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al crear jugador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/players"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuevo Jugador</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Jugador</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Equipo *</Label>
              <Select value={form.teamId} onValueChange={(v) => setForm({ ...form, teamId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre *</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Carlos" />
              </div>
              <div>
                <Label htmlFor="lastName">Apellido *</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Gomez" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="jerseyNumber">Dorsal</Label>
                <Input id="jerseyNumber" type="number" min={1} max={99} value={form.jerseyNumber} onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })} placeholder="10" />
              </div>
              <div>
                <Label>Posicion</Label>
                <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GOALKEEPER">Portero</SelectItem>
                    <SelectItem value="DEFENDER">Defensa</SelectItem>
                    <SelectItem value="MIDFIELDER">Mediocampista</SelectItem>
                    <SelectItem value="FORWARD">Delantero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Genero</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Masculino</SelectItem>
                    <SelectItem value="FEMALE">Femenino</SelectItem>
                    <SelectItem value="NON_BINARY">No binario</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_SAY">Prefiere no decir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <Input id="birthDate" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="nationality">Nacionalidad</Label>
                <Input id="nationality" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Documento</Label>
                <Select value={form.documentType} onValueChange={(v) => setForm({ ...form, documentType: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CEDULA_CIUDADANIA">Cedula de Ciudadania</SelectItem>
                    <SelectItem value="CEDULA_EXTRANJERIA">Cedula de Extranjeria</SelectItem>
                    <SelectItem value="TARJETA_IDENTIDAD">Tarjeta de Identidad</SelectItem>
                    <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="documentNumber">Numero de Documento</Label>
                <Input id="documentNumber" value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="heightCm">Estatura (cm)</Label>
                <Input id="heightCm" type="number" min={100} max={230} value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} placeholder="175" />
              </div>
              <div>
                <Label htmlFor="weightKg">Peso (kg)</Label>
                <Input id="weightKg" type="number" min={30} max={200} value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="72" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Registrando..." : "Registrar Jugador"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/players">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
