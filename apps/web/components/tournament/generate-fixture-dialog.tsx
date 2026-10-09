"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/ui/form-field";
import { TeamAvatar } from "@/components/ui/team-avatar";
import { Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { roundType as roundTypeLabels, tournamentType as tournamentTypeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

export interface RoundLite { id: string; name?: string | null; roundNumber: number; type: string; legs?: number; startDate?: string | null; _count?: { matches: number } }

export function GenerateFixtureDialog({ open, onOpenChange, tournament, round, teams, preselectedTeamIds, onGenerated }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  tournament: { id: string; type: string; startDate: string; venues?: string[]; teams?: any[] };
  round?: RoundLite | null;
  teams: { id: string; name: string; logoUrl?: string | null; groupName?: string | null }[];
  preselectedTeamIds?: string[];
  onGenerated: () => void;
}) {
  const mode = round ? round.type : tournament.type;
  const isKnockout = mode === "KNOCKOUT" || mode === "CUP";
  const isGroups = mode === "GROUPS" || mode === "GROUP_STAGE";
  const hasExisting = (round?._count?.matches || 0) > 0;

  const [cfg, setCfg] = useState({ legs: "1", intervalDays: "7", matchTime: "15:00", slotMinutes: "0", startDate: "", defaultVenue: "", shuffle: false, replace: false, pairing: "seeded" as "seeded" | "random" | "manual" });
  const [selected, setSelected] = useState<string[]>([]);
  const [pairs, setPairs] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = preselectedTeamIds && preselectedTeamIds.length > 0 ? preselectedTeamIds : teams.map(t => t.id);
    setSelected(base);
    setCfg(c => ({ ...c, legs: String(round?.legs || 1), startDate: (round?.startDate || tournament.startDate || "").slice(0, 10), defaultVenue: "", replace: false }));
    setConfirm(false);
  }, [open, round, preselectedTeamIds, teams, tournament.startDate]);

  useEffect(() => {
    // Emparejamientos manuales iniciales
    const p: string[][] = [];
    for (let i = 0; i + 1 < selected.length; i += 2) p.push([selected[i], selected[i + 1]]);
    setPairs(p);
  }, [selected]);

  const teamMap = useMemo(() => Object.fromEntries(teams.map(t => [t.id, t])), [teams]);
  const groupsCount = useMemo(() => new Set(teams.filter(t => selected.includes(t.id)).map(t => t.groupName || "A")).size, [teams, selected]);

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const move = (idx: number, dir: -1 | 1) => setSelected(s => { const n = [...s]; const j = idx + dir; if (j < 0 || j >= n.length) return s; [n[idx], n[j]] = [n[j], n[idx]]; return n; });

  const estimate = (() => {
    const n = selected.length;
    const legs = Number(cfg.legs);
    if (isKnockout) return Math.floor(n / 2) * legs;
    if (isGroups) {
      const byGroup: Record<string, number> = {};
      for (const id of selected) { const g = teamMap[id]?.groupName || "A"; byGroup[g] = (byGroup[g] || 0) + 1; }
      return Object.values(byGroup).reduce((s, k) => s + (k * (k - 1) / 2) * legs, 0);
    }
    return (n * (n - 1) / 2) * legs;
  })();

  const generate = async () => {
    setLoading(true);
    try {
      const payload: any = {
        roundId: round?.id, legs: Number(cfg.legs), intervalDays: Number(cfg.intervalDays), matchTime: cfg.matchTime,
        slotMinutes: Number(cfg.slotMinutes) || 0, startDate: cfg.startDate || undefined, defaultVenue: cfg.defaultVenue || undefined,
        shuffle: cfg.shuffle, replace: cfg.replace, teamIds: selected,
      };
      if (isKnockout) { payload.pairing = cfg.pairing; if (cfg.pairing === "manual") payload.pairs = pairs; }
      const res = await api.post(`/tournaments/${tournament.id}/generate-fixture`, payload);
      toast.success(res.data.message || "Fixture generado");
      onOpenChange(false);
      onGenerated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error al generar fixture");
    } finally { setLoading(false); setConfirm(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar fixture {round ? `· ${round.name || `Ronda ${round.roundNumber}`}` : ""}</DialogTitle>
          <DialogDescription>
            Modalidad: <strong>{round ? roundTypeLabels[round.type] || round.type : tournamentTypeLabels[tournament.type] || tournament.type}</strong> · {selected.length} equipos{isGroups ? ` · ${groupsCount} grupo(s)` : ""} · ~{estimate} partidos
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            {!isKnockout && (
              <Field label="Modalidad">
                <Select value={cfg.legs} onValueChange={(v) => setCfg({ ...cfg, legs: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">Solo ida</SelectItem><SelectItem value="2">Ida y vuelta</SelectItem></SelectContent>
                </Select>
              </Field>
            )}
            {isKnockout && (
              <>
                <Field label="Emparejamiento">
                  <Select value={cfg.pairing} onValueChange={(v: any) => setCfg({ ...cfg, pairing: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seeded">Sembrado (1° vs último, 2° vs penúltimo...)</SelectItem>
                      <SelectItem value="random">Sorteo aleatorio</SelectItem>
                      <SelectItem value="manual">Manual (defino las llaves)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Partidos por llave">
                  <Select value={cfg.legs} onValueChange={(v) => setCfg({ ...cfg, legs: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Partido único</SelectItem><SelectItem value="2">Ida y vuelta</SelectItem></SelectContent>
                  </Select>
                </Field>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha inicio"><Input type="date" value={cfg.startDate} onChange={(e) => setCfg({ ...cfg, startDate: e.target.value })} /></Field>
              <Field label="Hora"><Input type="time" value={cfg.matchTime} onChange={(e) => setCfg({ ...cfg, matchTime: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Días entre jornadas"><Input type="number" min={1} max={60} value={cfg.intervalDays} onChange={(e) => setCfg({ ...cfg, intervalDays: e.target.value })} /></Field>
              <Field label="Minutos entre partidos" hint="0 = misma hora"><Input type="number" min={0} step={15} value={cfg.slotMinutes} onChange={(e) => setCfg({ ...cfg, slotMinutes: e.target.value })} /></Field>
            </div>
            <Field label="Sede por defecto" hint={tournament.venues?.length ? "Vacío = rotar entre las sedes del torneo" : undefined}>
              {tournament.venues && tournament.venues.length > 0 ? (
                <Select value={cfg.defaultVenue || "__rotate__"} onValueChange={(v) => setCfg({ ...cfg, defaultVenue: v === "__rotate__" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__rotate__">Rotar sedes del torneo</SelectItem>
                    {tournament.venues.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={cfg.defaultVenue} onChange={(e) => setCfg({ ...cfg, defaultVenue: e.target.value })} placeholder="Ej: Cancha Municipal" />
              )}
            </Field>
            {!isKnockout && (
              <label className="flex items-center justify-between text-sm"><span>Mezclar orden de equipos</span><Switch checked={cfg.shuffle} onCheckedChange={(v) => setCfg({ ...cfg, shuffle: v })} /></label>
            )}
            {hasExisting && (
              <label className="flex items-center justify-between text-sm rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-2.5">
                <span>Reemplazar los {round?._count?.matches} partidos no jugados de esta ronda</span>
                <Switch checked={cfg.replace} onCheckedChange={(v) => setCfg({ ...cfg, replace: v })} />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Equipos participantes{isKnockout && cfg.pairing === "seeded" ? " (orden = sembrado)" : ""}</p>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(teams.map(t => t.id))}>Todos</Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected([])}>Ninguno</Button>
              </div>
            </div>
            <div className="rounded-xl border max-h-[320px] overflow-y-auto divide-y">
              {teams.map((t) => {
                const idx = selected.indexOf(t.id);
                const on = idx >= 0;
                return (
                  <div key={t.id} className={cn("flex items-center gap-2 px-2.5 py-1.5 text-sm", !on && "opacity-50")}>
                    <input type="checkbox" checked={on} onChange={() => toggle(t.id)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                    {on && isKnockout && <span className="w-5 text-[11px] text-muted-foreground text-right">{idx + 1}</span>}
                    <TeamAvatar name={t.name} logoUrl={t.logoUrl} size="xs" />
                    <span className="truncate flex-1">{t.name}</span>
                    {t.groupName && <span className="text-[10px] rounded bg-muted px-1.5 py-0.5">{t.groupName}</span>}
                    {on && isKnockout && cfg.pairing !== "random" && (
                      <div className="flex">
                        <button type="button" onClick={() => move(idx, -1)} className="p-1 text-muted-foreground hover:text-foreground"><ArrowUp className="h-3 w-3" /></button>
                        <button type="button" onClick={() => move(idx, 1)} className="p-1 text-muted-foreground hover:text-foreground"><ArrowDown className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {isKnockout && cfg.pairing === "manual" && (
              <div className="rounded-xl border p-2 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Llaves</p>
                {pairs.map((p, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 text-xs">
                    <Select value={p[0]} onValueChange={(v) => setPairs(ps => ps.map((x, j) => j === i ? [v, x[1]] : x))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{selected.map(id => <SelectItem key={id} value={id}>{teamMap[id]?.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <span className="text-muted-foreground">vs</span>
                    <Select value={p[1]} onValueChange={(v) => setPairs(ps => ps.map((x, j) => j === i ? [x[0], v] : x))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{selected.map(id => <SelectItem key={id} value={id}>{teamMap[id]?.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          {!confirm ? (
            <Button onClick={() => setConfirm(true)} disabled={selected.length < 2 || (hasExisting && !cfg.replace)}>Continuar</Button>
          ) : (
            <Button onClick={generate} disabled={loading} variant={hasExisting ? "destructive" : "default"}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar: crear ~{estimate} partidos
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
