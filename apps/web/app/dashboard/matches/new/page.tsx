"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";
import { localToISO } from "@/lib/format";

const NONE = "__none__";

function NewMatchForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [form, setForm] = useState({ tournamentId: params.get("tournamentId") || "", teamAId: "", teamBId: "", date: "", time: "15:00", venue: "", dayNumber: "", matchNumber: "", roundId: "", groupName: "", label: "" });

  useEffect(() => {
    Promise.all([api.get("/tournaments?limit=100"), api.get("/teams?limit=500")]).then(([t, teams]) => { setTournaments(t.data.data || []); setAllTeams(teams.data.data || []); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!form.tournamentId) { setTournament(null); return; }
    api.get(`/tournaments/${form.tournamentId}`).then(r => {
      setTournament(r.data);
      const maxDay = Math.max(0, ...(r.data.matches || []).map((m: any) => m.dayNumber || 0));
      setForm(f => ({ ...f, dayNumber: f.dayNumber || String(maxDay || 1), venue: f.venue || r.data.venues?.[0] || "", date: f.date || (r.data.startDate || "").slice(0, 10) }));
    }).catch(() => setTournament(null));
  }, [form.tournamentId]);

  const teams = tournament ? (tournament.teams || []).map((tt: any) => ({ id: tt.teamId, name: tt.team.name, logoUrl: tt.team.logoUrl, groupName: tt.groupName })) : allTeams;
  const rounds = tournament?.rounds || [];
  const groups = Array.from(new Set(teams.map((t: any) => t.groupName).filter(Boolean))) as string[];
  const sameGroupHint = form.teamAId && form.teamBId && groups.length > 0 && teams.find((t: any) => t.id === form.teamAId)?.groupName !== teams.find((t: any) => t.id === form.teamBId)?.groupName;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tournamentId || !form.teamAId || !form.teamBId || !form.date) { toast.error("Torneo, equipos y fecha son obligatorios"); return; }
    if (form.teamAId === form.teamBId) { toast.error("Los equipos deben ser diferentes"); return; }
    setLoading(true);
    try {
      const payload: any = { tournamentId: form.tournamentId, teamAId: form.teamAId, teamBId: form.teamBId, scheduledAt: localToISO(form.date, form.time) };
      if (form.venue) payload.venue = form.venue;
      if (form.dayNumber) payload.dayNumber = Number(form.dayNumber);
      if (form.matchNumber) payload.matchNumber = Number(form.matchNumber);
      if (form.roundId) payload.roundId = form.roundId;
      if (form.groupName) payload.groupName = form.groupName;
      if (form.label) payload.label = form.label;
      await api.post("/matches", payload);
      toast.success("Partido programado");
      router.push(`/dashboard/tournaments/detalle?id=${form.tournamentId}&tab=fixture`);
    } catch (err: any) { toast.error(err.response?.data?.message || "Error al programar"); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader back={form.tournamentId ? `/dashboard/tournaments/detalle?id=${form.tournamentId}&tab=fixture` : "/dashboard/matches"} title="Programar partido" subtitle="Crea un partido manual dentro de un torneo." />
      <form onSubmit={submit} className="rounded-2xl border bg-card p-5 space-y-4">
        <Field label="Torneo" required>
          <Select value={form.tournamentId} onValueChange={(v) => setForm({ ...form, tournamentId: v, teamAId: "", teamBId: "", roundId: "", groupName: "" })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar torneo" /></SelectTrigger>
            <SelectContent>{tournaments.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
          <Field label="Local" required>
            <Select value={form.teamAId} onValueChange={(v) => setForm({ ...form, teamAId: v })} disabled={!form.tournamentId}>
              <SelectTrigger><SelectValue placeholder="Equipo" /></SelectTrigger>
              <SelectContent>{teams.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}{t.groupName ? ` (${t.groupName})` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Button type="button" variant="outline" size="icon" onClick={() => setForm({ ...form, teamAId: form.teamBId, teamBId: form.teamAId })}><ArrowLeftRight className="h-4 w-4" /></Button>
          <Field label="Visitante" required>
            <Select value={form.teamBId} onValueChange={(v) => setForm({ ...form, teamBId: v })} disabled={!form.tournamentId}>
              <SelectTrigger><SelectValue placeholder="Equipo" /></SelectTrigger>
              <SelectContent>{teams.filter((t: any) => t.id !== form.teamAId).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}{t.groupName ? ` (${t.groupName})` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        {form.teamAId && form.teamBId && (
          <div className="flex items-center justify-center gap-3 text-sm py-1">
            <TeamAvatar name={teams.find((t: any) => t.id === form.teamAId)?.name || ""} logoUrl={teams.find((t: any) => t.id === form.teamAId)?.logoUrl} size="sm" />
            <span className="font-semibold">{teams.find((t: any) => t.id === form.teamAId)?.name}</span><span className="text-muted-foreground">vs</span><span className="font-semibold">{teams.find((t: any) => t.id === form.teamBId)?.name}</span>
            <TeamAvatar name={teams.find((t: any) => t.id === form.teamBId)?.name || ""} logoUrl={teams.find((t: any) => t.id === form.teamBId)?.logoUrl} size="sm" />
          </div>
        )}
        {sameGroupHint && <p className="text-xs text-amber-700 dark:text-amber-300">Los equipos están en grupos distintos; asegúrate de que sea intencional.</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Fecha" required><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Hora"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Sede" className="col-span-2 sm:col-span-1">
            {tournament?.venues?.length ? (
              <Select value={form.venue || NONE} onValueChange={(v) => setForm({ ...form, venue: v === NONE ? "" : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Sin sede</SelectItem>{tournament.venues.map((v: string) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
            ) : <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Cancha San José" />}
          </Field>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Jornada"><Input type="number" min={1} value={form.dayNumber} onChange={(e) => setForm({ ...form, dayNumber: e.target.value })} /></Field>
          <Field label="N° partido"><Input type="number" min={1} value={form.matchNumber} onChange={(e) => setForm({ ...form, matchNumber: e.target.value })} placeholder="Auto" /></Field>
          <Field label="Fase">
            <Select value={form.roundId || NONE} onValueChange={(v) => setForm({ ...form, roundId: v === NONE ? "" : v })} disabled={rounds.length === 0}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Sin fase</SelectItem>{rounds.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name || `Ronda ${r.roundNumber}`}</SelectItem>)}</SelectContent></Select>
          </Field>
          <Field label="Grupo">
            {groups.length > 0 ? <Select value={form.groupName || NONE} onValueChange={(v) => setForm({ ...form, groupName: v === NONE ? "" : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>Sin grupo</SelectItem>{groups.sort().map(g => <SelectItem key={g} value={g}>Grupo {g}</SelectItem>)}</SelectContent></Select> : <Input value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value.toUpperCase() })} maxLength={3} placeholder="A" />}
          </Field>
        </div>
        <Field label="Etiqueta (opcional)" hint="Ej: Final, Clásico, Semifinal ida"><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Programar partido</Button>
          <Button type="button" variant="outline" asChild><Link href="/dashboard/matches">Cancelar</Link></Button>
        </div>
      </form>
    </div>
  );
}

export default function NewMatchPage() { return <Suspense><NewMatchForm /></Suspense>; }
