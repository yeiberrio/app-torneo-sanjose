"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StandingsTable } from "./standings-table";
import { MatchRow } from "./match-row";
import { tournamentType } from "@/lib/labels";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2, MapPin, Plus, X, Save } from "lucide-react";
import Link from "next/link";

export function OverviewTab({ tournament, canManage, refresh, standings }: { tournament: any; canManage: boolean; refresh: () => void; standings: any }) {
  const [form, setForm] = useState<any>({});
  const [venueInput, setVenueInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm({
      name: tournament.name, type: tournament.type, description: tournament.description || "", city: tournament.city || "",
      startDate: (tournament.startDate || "").slice(0, 10), endDate: (tournament.endDate || "").slice(0, 10),
      winPoints: String(tournament.winPoints), drawPoints: String(tournament.drawPoints), lossPoints: String(tournament.lossPoints),
      maxYellowCards: String(tournament.maxYellowCards), matchDurationMin: String(tournament.matchDurationMin || 60), venues: tournament.venues || [],
    });
    setDirty(false);
  }, [tournament]);

  const set = (k: string, v: any) => { setForm((f: any) => ({ ...f, [k]: v })); setDirty(true); };
  const addVenue = () => { const v = venueInput.trim(); if (!v || form.venues.includes(v)) return; set("venues", [...form.venues, v]); setVenueInput(""); };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/tournaments/${tournament.id}`, {
        name: form.name, type: form.type, description: form.description || undefined, city: form.city || undefined, startDate: form.startDate, endDate: form.endDate || undefined,
        winPoints: Number(form.winPoints), drawPoints: Number(form.drawPoints), lossPoints: Number(form.lossPoints), maxYellowCards: Number(form.maxYellowCards), matchDurationMin: Number(form.matchDurationMin), venues: form.venues,
      });
      toast.success("Configuración guardada"); refresh();
    } catch (err: any) { toast.error(err.response?.data?.message || "Error al guardar"); } finally { setSaving(false); }
  };

  const matches: any[] = tournament.matches || [];
  const teamMap = Object.fromEntries((tournament.teams || []).map((tt: any) => [tt.teamId, { name: tt.team.name, logoUrl: tt.team.logoUrl }]));
  const now = Date.now();
  const upcoming = matches.filter(m => ["SCHEDULED", "IN_PROGRESS", "HALFTIME"].includes(m.status)).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).filter(m => new Date(m.scheduledAt).getTime() > now - 3 * 3600000).slice(0, 5);
  const recent = matches.filter(m => m.status === "FINISHED").sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()).slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        {standings && (
          <div className={standings.hasGroups && Object.keys(standings.groups).length > 1 ? "grid gap-4 md:grid-cols-2" : ""}>
            {Object.entries(standings.groups).sort(([a], [b]) => a.localeCompare(b)).map(([g, rows]: any) => (
              <StandingsTable key={g} title={standings.hasGroups ? `Grupo ${g}` : "Tabla de posiciones"} rows={rows} compact maxRows={standings.hasGroups ? 6 : 10} linkTo="/dashboard/statistics" />
            ))}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b bg-muted/40 text-sm font-semibold">Próximos partidos</div>
            <div className="p-2 space-y-1.5">{upcoming.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">Nada programado.</p> : upcoming.map(m => <MatchRow key={m.id} match={m} teamA={teamMap[m.teamAId]} teamB={teamMap[m.teamBId]} dense />)}</div>
          </div>
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b bg-muted/40 text-sm font-semibold">Últimos resultados</div>
            <div className="p-2 space-y-1.5">{recent.length === 0 ? <p className="text-xs text-muted-foreground text-center py-4">Aún sin resultados.</p> : recent.map(m => <MatchRow key={m.id} match={m} teamA={teamMap[m.teamAId]} teamB={teamMap[m.teamBId]} dense />)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card">
        <div className="px-4 py-2.5 border-b bg-muted/40 flex items-center justify-between"><p className="text-sm font-semibold">Configuración</p>{canManage && dirty && <Button size="sm" className="h-7 text-xs" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}Guardar</Button>}</div>
        <div className="p-4 space-y-3">
          {!canManage ? (
            <dl className="text-sm space-y-2">
              {tournament.description && <p className="text-muted-foreground">{tournament.description}</p>}
              <div className="flex justify-between"><dt className="text-muted-foreground">Formato</dt><dd>{tournamentType[tournament.type]}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Ciudad</dt><dd>{tournament.city || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Puntos</dt><dd>{tournament.winPoints} / {tournament.drawPoints} / {tournament.lossPoints}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Duración partido</dt><dd>{tournament.matchDurationMin} min</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Sedes</dt><dd className="text-right">{(tournament.venues || []).join(", ") || "—"}</dd></div>
            </dl>
          ) : (
            <>
              <Field label="Nombre" required><Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Descripción"><Textarea rows={2} value={form.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="Categoría, reglas especiales, premios..." /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Formato">
                  <Select value={form.type || ""} onValueChange={(v) => set("type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(tournamentType).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
                </Field>
                <Field label="Ciudad"><Input value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Inicio"><Input type="date" value={form.startDate || ""} onChange={(e) => set("startDate", e.target.value)} /></Field>
                <Field label="Fin"><Input type="date" value={form.endDate || ""} onChange={(e) => set("endDate", e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Pts victoria"><Input type="number" min={0} value={form.winPoints || ""} onChange={(e) => set("winPoints", e.target.value)} /></Field>
                <Field label="Pts empate"><Input type="number" min={0} value={form.drawPoints || ""} onChange={(e) => set("drawPoints", e.target.value)} /></Field>
                <Field label="Pts derrota"><Input type="number" min={0} value={form.lossPoints || ""} onChange={(e) => set("lossPoints", e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amarillas para suspensión"><Input type="number" min={1} value={form.maxYellowCards || ""} onChange={(e) => set("maxYellowCards", e.target.value)} /></Field>
                <Field label="Duración partido (min)"><Input type="number" min={10} value={form.matchDurationMin || ""} onChange={(e) => set("matchDurationMin", e.target.value)} /></Field>
              </div>
              <Field label="Sedes / canchas" hint="Se usan al generar el fixture y al editar partidos.">
                <div className="flex gap-2"><Input value={venueInput} onChange={(e) => setVenueInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVenue(); } }} placeholder="Agregar sede" /><Button type="button" variant="outline" size="icon" onClick={addVenue}><Plus className="h-4 w-4" /></Button></div>
                <div className="flex flex-wrap gap-1.5 mt-2">{(form.venues || []).map((v: string) => <span key={v} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"><MapPin className="h-3 w-3" />{v}<button onClick={() => set("venues", form.venues.filter((x: string) => x !== v))} className="hover:text-rose-600"><X className="h-3 w-3" /></button></span>)}</div>
              </Field>
              {dirty && <Button className="w-full" onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar cambios</Button>}
            </>
          )}
          <div className="pt-2 border-t text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/dashboard/statistics" className="hover:text-primary">Estadísticas completas</Link>
            <Link href="/dashboard/sanctions" className="hover:text-primary">Sanciones</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
