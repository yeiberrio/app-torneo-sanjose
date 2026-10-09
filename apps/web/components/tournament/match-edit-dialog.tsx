"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/ui/form-field";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { isoToLocal, localToISO } from "@/lib/format";
import { matchStatus } from "@/lib/labels";
import type { MatchLike } from "./match-row";

const NONE = "__none__";

export function MatchEditDialog({ match, open, onOpenChange, teams, rounds, venues = [], onSaved }: {
  match: MatchLike | null; open: boolean; onOpenChange: (o: boolean) => void;
  teams: { id: string; name: string; groupName?: string | null }[]; rounds: { id: string; name?: string | null; roundNumber: number; type: string }[]; venues?: string[]; onSaved: () => void;
}) {
  const [form, setForm] = useState({ teamAId: "", teamBId: "", date: "", time: "", venue: "", dayNumber: "", matchNumber: "", groupName: "", roundId: "", label: "", legNumber: "1", status: "" });
  const [saving, setSaving] = useState(false);
  const [customVenue, setCustomVenue] = useState(false);

  useEffect(() => {
    if (!match) return;
    const { date, time } = isoToLocal(match.scheduledAt);
    setForm({
      teamAId: match.teamAId, teamBId: match.teamBId, date, time, venue: match.venue || "",
      dayNumber: match.dayNumber ? String(match.dayNumber) : "", matchNumber: match.matchNumber ? String(match.matchNumber) : "",
      groupName: match.groupName || "", roundId: match.roundId || "", label: match.label || "", legNumber: String(match.legNumber || 1), status: match.status,
    });
    setCustomVenue(!!match.venue && !venues.includes(match.venue));
  }, [match, venues]);

  const groups = Array.from(new Set(teams.map(t => t.groupName).filter(Boolean))) as string[];
  const finished = match?.status === "FINISHED";

  const save = async () => {
    if (!match) return;
    if (form.teamAId === form.teamBId) { toast.error("Los equipos deben ser diferentes"); return; }
    setSaving(true);
    try {
      const payload: any = {
        teamAId: form.teamAId, teamBId: form.teamBId,
        scheduledAt: localToISO(form.date, form.time || "15:00"),
        venue: form.venue || null,
        dayNumber: form.dayNumber ? Number(form.dayNumber) : undefined,
        matchNumber: form.matchNumber ? Number(form.matchNumber) : undefined,
        groupName: form.groupName || null, roundId: form.roundId || null, label: form.label || null, legNumber: Number(form.legNumber) || 1,
      };
      await api.patch(`/matches/${match.id}`, payload);
      if (!finished && form.status !== match.status && ["SCHEDULED", "POSTPONED", "CANCELLED", "SUSPENDED"].includes(form.status)) {
        await api.patch(`/matches/${match.id}/status`, { status: form.status });
      }
      toast.success("Partido actualizado");
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al guardar");
    } finally { setSaving(false); }
  };

  const swap = () => setForm(f => ({ ...f, teamAId: f.teamBId, teamBId: f.teamAId }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar partido</DialogTitle>
          <DialogDescription>{finished ? "El partido está finalizado: solo se pueden ajustar datos de programación." : "Ajusta equipos, fecha, sede o la fase del partido."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <Field label="Local" required>
              <Select value={form.teamAId} onValueChange={(v) => setForm({ ...form, teamAId: v })} disabled={finished}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}{t.groupName ? ` (${t.groupName})` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Button type="button" variant="outline" size="icon" onClick={swap} title="Invertir localía" disabled={finished}><ArrowLeftRight className="h-4 w-4" /></Button>
            <Field label="Visitante" required>
              <Select value={form.teamBId} onValueChange={(v) => setForm({ ...form, teamBId: v })} disabled={finished}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}{t.groupName ? ` (${t.groupName})` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha" required><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Hora" required><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          </div>
          <Field label="Sede">
            {venues.length > 0 && !customVenue ? (
              <Select value={form.venue || NONE} onValueChange={(v) => { if (v === "__custom__") { setCustomVenue(true); setForm({ ...form, venue: "" }); } else setForm({ ...form, venue: v === NONE ? "" : v }); }}>
                <SelectTrigger><SelectValue placeholder="Sin sede" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin sede</SelectItem>
                  {venues.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  <SelectItem value="__custom__">Otra...</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Cancha / escenario" />
                {venues.length > 0 && <Button type="button" variant="ghost" size="sm" onClick={() => setCustomVenue(false)}>Lista</Button>}
              </div>
            )}
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Jornada"><Input type="number" min={1} value={form.dayNumber} onChange={(e) => setForm({ ...form, dayNumber: e.target.value })} /></Field>
            <Field label="N° partido"><Input type="number" min={1} value={form.matchNumber} onChange={(e) => setForm({ ...form, matchNumber: e.target.value })} /></Field>
            <Field label="Vuelta">
              <Select value={form.legNumber} onValueChange={(v) => setForm({ ...form, legNumber: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">Ida / único</SelectItem><SelectItem value="2">Vuelta</SelectItem></SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ronda / fase">
              <Select value={form.roundId || NONE} onValueChange={(v) => setForm({ ...form, roundId: v === NONE ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Sin ronda" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin ronda</SelectItem>
                  {rounds.map(r => <SelectItem key={r.id} value={r.id}>{r.name || `Ronda ${r.roundNumber}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Grupo">
              {groups.length > 0 ? (
                <Select value={form.groupName || NONE} onValueChange={(v) => setForm({ ...form, groupName: v === NONE ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Sin grupo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin grupo</SelectItem>
                    {groups.sort().map(g => <SelectItem key={g} value={g}>Grupo {g}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value.toUpperCase() })} placeholder="A, B, C..." maxLength={3} />
              )}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Etiqueta" hint="Ej: Cuartos de final 1, Clásico"><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
            <Field label="Estado">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })} disabled={finished || ["IN_PROGRESS", "HALFTIME"].includes(form.status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(matchStatus).filter(([k]) => ["SCHEDULED", "POSTPONED", "CANCELLED", "SUSPENDED"].includes(k) || k === form.status).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
