"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";

const categories = [
  { value: "GENERAL", label: "General" },
  { value: "MATCH_RECAP", label: "Resumen de Partido" },
  { value: "TRANSFER", label: "Fichaje" },
  { value: "INJURY", label: "Lesion" },
  { value: "TOURNAMENT", label: "Torneo" },
  { value: "ANNOUNCEMENT", label: "Anuncio" },
];

export default function NewNewsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    imageUrl: "",
    category: "GENERAL",
    tournamentId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/tournaments?limit=100").then((res) => {
      setTournaments(res.data.data || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error("Titulo y contenido son obligatorios");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        title: form.title,
        content: form.content,
        category: form.category,
      };
      if (form.summary) payload.summary = form.summary;
      if (form.imageUrl) payload.imageUrl = form.imageUrl;
      if (form.tournamentId) payload.tournamentId = form.tournamentId;
      const res = await api.post("/news", payload);
      toast.success("Noticia creada exitosamente");
      router.push(`/dashboard/news/detalle?id=${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al crear noticia");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/news"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Nueva Noticia</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacion de la Noticia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titulo *</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titulo de la noticia" />
            </div>

            <div>
              <Label htmlFor="summary">Resumen</Label>
              <Textarea id="summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Breve resumen de la noticia" rows={2} />
            </div>

            <div>
              <Label htmlFor="content">Contenido *</Label>
              <Textarea id="content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Contenido completo de la noticia" rows={8} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Torneo (opcional)</Label>
                <Select value={form.tournamentId} onValueChange={(v) => setForm({ ...form, tournamentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Ningun torneo" /></SelectTrigger>
                  <SelectContent>
                    {tournaments.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">URL de Imagen (opcional)</Label>
              <Input id="imageUrl" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creando..." : "Crear Noticia"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
