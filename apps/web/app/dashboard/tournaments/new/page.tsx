"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/ui/form-field";
import { PageHeader } from "@/components/ui/page-header";
import { roundType as roundTypeLabels } from "@/lib/labels";
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Grid3x3, GitBranch, ListOrdered, Loader2, MapPin, Plus, Trophy, X, Layers } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

type Phase = { name: string; type: string; legs: number; teamsAdvancing?: number; groupsCount?: number };

const TEMPLATES: { id: string; title: string; description: string; icon: any; type: string; phases: Phase[] }[] = [
  { id: "league", title: "Liga", description: "Todos contra todos. Gana quien sume más puntos.", icon: ListOrdered, type: "LEAGUE", phases: [] },
  { id: "league-playoffs", title: "Liga + finales", description: "Fase regular todos contra todos y luego eliminación de los mejores.", icon: Trophy, type: "CUP", phases: [
    { name: "Fase regular", type: "ROUND_ROBIN", legs: 1, teamsAdvancing: 8 },
    { name: "Cuartos de final", type: "KNOCKOUT", legs: 1 },
  ] },
  { id: "groups-knockout", title: "Grupos + eliminación", description: "Estilo Mundial: grupos, clasifican los primeros y siguen llaves.", icon: Grid3x3, type: "GROUPS", phases: [
    { name: "Fase de grupos", type: "GROUP_STAGE", legs: 1, teamsAdvancing: 2, groupsCount: 4 },
    { name: "Eliminación directa", type: "KNOCKOUT", legs: 1 },
  ] },
  { id: "knockout", title: "Eliminación directa", description: "Llaves desde el inicio. Quien pierde queda fuera.", icon: GitBranch, type: "KNOCKOUT", phases: [
    { name: "Eliminación directa", type: "KNOCKOUT", legs: 1 },
  ] },
  { id: "custom", title: "Personalizado", description: "Arma tus propias fases en el orden que quieras.", icon: Layers, type: "CUP", phases: [
    { name: "Primera fase", type: "ROUND_ROBIN", legs: 1 },
  ] },
];

const STEPS = ["Formato", "Datos", "Reglas", "Confirmar"];

export default function NewTournamentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [templateId, setTemplateId] = useState("league");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [venueInput, setVenueInput] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", city: "Guarne", startDate: "", endDate: "", venues: [] as string[],
    winPoints: "3", drawPoints: "1", lossPoints: "0", maxYellowCards: "3", matchDurationMin: "60",
  });
  const template = useMemo(() => TEMPLATES.find(t => t.id === templateId)!, [templateId]);

  const chooseTemplate = (id: string) => {
    setTemplateId(id);
    setPhases(TEMPLATES.find(t => t.id === id)!.phases.map(p => ({ ...p })));
  };
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const updatePhase = (i: number, patch: Partial<Phase>) => setPhases(ps => ps.map((p, j) => j === i ? { ...p, ...patch } : p));
  const movePhase = (i: number, d: -1 | 1) => setPhases(ps => { const n = [...ps]; const j = i + d; if (j < 0 || j >= n.length) return ps; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const addVenue = () => { const v = venueInput.trim(); if (!v || form.venues.includes(v)) return; set("venues", [...form.venues, v]); setVenueInput(""); };

  const canNext = step === 0 ? true : step === 1 ? !!form.name.trim() && !!form.startDate : true;

  const submit = async () => {
    if (!form.name.trim() || !form.startDate) { toast.error("Nombre y fecha de inicio son obligatorios"); setStep(1); return; }
    setLoading(true);
    try {
      const payload: any = {
        name: form.name.trim(), type: template.type, startDate: form.startDate,
        description: form.description || undefined, city: form.city || undefined, venues: form.venues,
        winPoints: Number(form.winPoints), drawPoints: Number(form.drawPoints), lossPoints: Number(form.lossPoints),
        maxYellowCards: Number(form.maxYellowCards), matchDurationMin: Number(form.matchDurationMin),
      };
      if (form.endDate) payload.endDate = form.endDate;
      if (phases.length > 0) payload.phases = phases.map(p => ({ name: p.name || undefined, type: p.type, legs: p.legs, teamsAdvancing: p.teamsAdvancing || undefined, groupsCount: p.type === "GROUP_STAGE" ? p.groupsCount || undefined : undefined }));
      const res = await api.post("/tournaments", payload);
      toast.success("Torneo creado. Ahora inscribe los equipos.");
      router.push(`/dashboard/tournaments/detalle?id=${res.data.id}&tab=teams`);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg || "Error al crear torneo");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader back="/dashboard/tournaments" title="Nuevo torneo" subtitle="Configura el formato, las fases y las reglas en pocos pasos." />

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-5">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i < step && setStep(i)} className={cn("flex items-center gap-2 text-xs font-medium", i <= step ? "text-foreground" : "text-muted-foreground", i < step && "cursor-pointer")}>
            <span className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold", i < step ? "bg-emerald-500 text-white" : i === step ? "bg-primary text-primary-foreground" : "bg-muted")}>{i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
            <span className="hidden sm:inline">{s}</span>
            {i < STEPS.length - 1 && <span className="w-6 sm:w-10 h-px bg-border" />}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-5">
        {step === 0 && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => chooseTemplate(t.id)} className={cn("text-left rounded-xl border p-4 transition-all", templateId === t.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:border-primary/40")}>
                  <div className="flex items-center gap-2 mb-1"><t.icon className={cn("h-4 w-4", templateId === t.id ? "text-primary" : "text-muted-foreground")} /><p className="font-semibold text-sm">{t.title}</p>{templateId === t.id && <Check className="h-4 w-4 text-primary ml-auto" />}</div>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </button>
              ))}
            </div>

            {phases.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold">Fases del torneo</p><span className="text-xs text-muted-foreground">Podrás editarlas después</span></div>
                {phases.map((p, i) => (
                  <div key={i} className="rounded-xl border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <Input value={p.name} onChange={(e) => updatePhase(i, { name: e.target.value })} className="h-8 text-sm" placeholder="Nombre de la fase" />
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => movePhase(i, -1)} disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => movePhase(i, 1)} disabled={i === phases.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-rose-600" onClick={() => setPhases(ps => ps.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Select value={p.type} onValueChange={(v) => updatePhase(i, { type: v })}>
                        <SelectTrigger className="h-8 text-xs col-span-2 sm:col-span-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(roundTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={String(p.legs)} onValueChange={(v) => updatePhase(i, { legs: Number(v) })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="1">Solo ida</SelectItem><SelectItem value="2">Ida y vuelta</SelectItem></SelectContent>
                      </Select>
                      {p.type !== "KNOCKOUT" && <Input type="number" min={1} className="h-8 text-xs" placeholder={p.type === "GROUP_STAGE" ? "Avanzan x grupo" : "Avanzan"} value={p.teamsAdvancing ?? ""} onChange={(e) => updatePhase(i, { teamsAdvancing: e.target.value ? Number(e.target.value) : undefined })} />}
                      {p.type === "GROUP_STAGE" && <Input type="number" min={1} className="h-8 text-xs" placeholder="N° grupos" value={p.groupsCount ?? ""} onChange={(e) => updatePhase(i, { groupsCount: e.target.value ? Number(e.target.value) : undefined })} />}
                    </div>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => setPhases(ps => [...ps, { name: "", type: "KNOCKOUT", legs: 1 }])}><Plus className="h-4 w-4 mr-1.5" />Agregar fase</Button>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Field label="Nombre del torneo" required><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej: Torneo Fútbol 7 San José 2027" autoFocus /></Field>
            <Field label="Descripción"><Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Categoría, premios, reglas especiales..." /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Ciudad"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
              <Field label="Fecha de inicio" required><Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
              <Field label="Fecha de fin"><Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
            </div>
            <Field label="Sedes / canchas" hint="Al generar el fixture se rotan automáticamente entre estas sedes.">
              <div className="flex gap-2"><Input value={venueInput} onChange={(e) => setVenueInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVenue(); } }} placeholder="Ej: Cancha San José" /><Button type="button" variant="outline" size="icon" onClick={addVenue}><Plus className="h-4 w-4" /></Button></div>
              {form.venues.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{form.venues.map(v => <span key={v} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"><MapPin className="h-3 w-3" />{v}<button type="button" onClick={() => set("venues", form.venues.filter(x => x !== v))} className="hover:text-rose-600"><X className="h-3 w-3" /></button></span>)}</div>}
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">Puntuación</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Victoria"><Input type="number" min={0} value={form.winPoints} onChange={(e) => set("winPoints", e.target.value)} /></Field>
                <Field label="Empate"><Input type="number" min={0} value={form.drawPoints} onChange={(e) => set("drawPoints", e.target.value)} /></Field>
                <Field label="Derrota"><Input type="number" min={0} value={form.lossPoints} onChange={(e) => set("lossPoints", e.target.value)} /></Field>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amarillas acumuladas para suspensión"><Input type="number" min={1} value={form.maxYellowCards} onChange={(e) => set("maxYellowCards", e.target.value)} /></Field>
              <Field label="Duración del partido (min)"><Input type="number" min={10} max={240} value={form.matchDurationMin} onChange={(e) => set("matchDurationMin", e.target.value)} /></Field>
            </div>
            <p className="text-xs text-muted-foreground">Los criterios de desempate se configuran después en la pestaña Desempate. Por defecto se usa diferencia de goles, goles a favor, enfrentamiento directo y juego limpio.</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-muted/40 p-4 space-y-2">
              <p className="text-lg font-semibold">{form.name || "Sin nombre"}</p>
              {form.description && <p className="text-muted-foreground">{form.description}</p>}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-muted-foreground">Formato</span><span>{template.title}</span>
                <span className="text-muted-foreground">Fechas</span><span>{form.startDate || "—"}{form.endDate ? ` a ${form.endDate}` : ""}</span>
                <span className="text-muted-foreground">Ciudad</span><span>{form.city || "—"}</span>
                <span className="text-muted-foreground">Sedes</span><span>{form.venues.join(", ") || "—"}</span>
                <span className="text-muted-foreground">Puntos</span><span>{form.winPoints} / {form.drawPoints} / {form.lossPoints}</span>
                <span className="text-muted-foreground">Suspensión</span><span>{form.maxYellowCards} amarillas</span>
              </div>
            </div>
            {phases.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {phases.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    <span className="rounded-lg border px-2.5 py-1 text-xs"><strong>{i + 1}.</strong> {p.name || roundTypeLabels[p.type]}{p.teamsAdvancing ? ` · avanzan ${p.teamsAdvancing}` : ""}</span>
                    {i < phases.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Siguiente paso: inscribir o importar equipos y generar el fixture de la primera fase.</p>
          </div>
        )}

        <div className="flex justify-between gap-2 mt-6 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={() => step === 0 ? router.push("/dashboard/tournaments") : setStep(step - 1)}><ChevronLeft className="h-4 w-4 mr-1" />{step === 0 ? "Cancelar" : "Atrás"}</Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStep(step + 1)} disabled={!canNext}>Siguiente<ChevronRight className="h-4 w-4 ml-1" /></Button>
          ) : (
            <Button type="button" onClick={submit} disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Crear torneo</Button>
          )}
        </div>
      </div>
    </div>
  );
}
