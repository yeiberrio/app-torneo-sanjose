"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tiebreaker as labels } from "@/lib/labels";
import api from "@/lib/api";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, X, Scale } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

const ALL = Object.keys(labels);
const DEFAULTS = ["GOAL_DIFFERENCE", "GOALS_FOR", "HEAD_TO_HEAD", "FAIR_PLAY"];

export function TiebreakersTab({ tournament, canManage }: { tournament: any; canManage: boolean }) {
  const rounds: any[] = tournament.rounds || [];
  const [scope, setScope] = useState<string>("general");
  const [list, setList] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const roundId = scope === "general" ? undefined : scope;
    api.get(`/tournaments/${tournament.id}/tiebreakers${roundId ? `?roundId=${roundId}` : ""}`).then(r => { const l = (r.data || []).sort((a: any, b: any) => a.priority - b.priority).map((t: any) => t.criteria); setList(l); setSaved(l); }).catch(() => {});
  }, [scope, tournament.id]);

  const dirty = JSON.stringify(list) !== JSON.stringify(saved);
  const move = (i: number, d: -1 | 1) => setList(l => { const n = [...l]; const j = i + d; if (j < 0 || j >= n.length) return l; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const save = async () => {
    setSaving(true);
    try {
      await api.post(`/tournaments/${tournament.id}/tiebreakers`, { roundId: scope === "general" ? undefined : scope, tiebreakers: list.map((c, i) => ({ criteria: c, priority: i + 1 })) });
      setSaved(list); toast.success("Criterios guardados");
    } catch (err: any) { toast.error(err.response?.data?.message || "Error al guardar"); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">Orden en que se desempatan equipos con los mismos puntos.</p>
        {rounds.length > 0 && (
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-9 w-[200px] text-xs rounded-xl ml-auto"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="general">Todo el torneo</SelectItem>{rounds.map(r => <SelectItem key={r.id} value={r.id}>{r.name || `Ronda ${r.roundNumber}`}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>
      {list.length === 0 ? (
        <EmptyState compact icon={<Scale className="h-5 w-5" />} title="Sin criterios personalizados" description={`Se usa el orden FIFA por defecto: ${DEFAULTS.map(d => labels[d]).join(" → ")}.`} action={canManage && <Button size="sm" variant="outline" onClick={() => setList(DEFAULTS)}>Personalizar</Button>} />
      ) : (
        <div className="rounded-2xl border bg-card divide-y">
          {list.map((c, i) => (
            <div key={c} className="flex items-center gap-3 px-3 py-2">
              <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
              {canManage ? (
                <Select value={c} onValueChange={(v) => setList(l => l.map((x, j) => j === i ? v : x))}>
                  <SelectTrigger className="h-9 flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL.map(o => <SelectItem key={o} value={o} disabled={list.includes(o) && o !== c}>{labels[o]}</SelectItem>)}</SelectContent>
                </Select>
              ) : <span className="flex-1 text-sm font-medium">{labels[c]}</span>}
              {canManage && (
                <div className="flex">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(i, 1)} disabled={i === list.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-rose-600" onClick={() => setList(l => l.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {canManage && (
        <div className="flex gap-2">
          {list.length < ALL.length && <Button size="sm" variant="outline" onClick={() => setList(l => [...l, ALL.find(o => !l.includes(o))!])}><Plus className="h-4 w-4 mr-1.5" />Agregar criterio</Button>}
          {dirty && <Button size="sm" onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1.5" />Guardar</Button>}
        </div>
      )}
    </div>
  );
}
