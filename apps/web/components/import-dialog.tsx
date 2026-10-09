"use client";

import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Download, FileSpreadsheet, Upload, CheckCircle2, AlertCircle, SkipForward, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { cn } from "@/lib/utils";

type Entity = "teams" | "players";
type RowResult = { row: number; status: "created" | "updated" | "skipped" | "error"; message?: string; data?: any };
type ImportResult = { dryRun: boolean; format?: string; summary: { total: number; created: number; updated?: number; skipped: number; errors: number }; rows: RowResult[] };

const statusMeta: Record<RowResult["status"], { label: string; icon: any; className: string }> = {
  created: { label: "Nuevo", icon: CheckCircle2, className: "text-emerald-600" },
  updated: { label: "Actualiza", icon: RefreshCw, className: "text-sky-600" },
  skipped: { label: "Omitido", icon: SkipForward, className: "text-amber-600" },
  error: { label: "Error", icon: AlertCircle, className: "text-rose-600" },
};

export function ImportDialog({ entity, open, onOpenChange, tournamentId, teamId, onImported }: {
  entity: Entity; open: boolean; onOpenChange: (o: boolean) => void; tournamentId?: string; teamId?: string; onImported?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [createMissingTeams, setCreateMissingTeams] = useState(false);
  const [filter, setFilter] = useState<"all" | RowResult["status"]>("all");

  const label = entity === "teams" ? "equipos" : "jugadores";

  const reset = () => { setFile(null); setPreview(null); setResult(null); setFilter("all"); if (fileRef.current) fileRef.current.value = ""; };
  const close = (o: boolean) => { if (!o) reset(); onOpenChange(o); };

  const buildUrl = (dryRun: boolean) => {
    const params = new URLSearchParams();
    params.set("dryRun", String(dryRun));
    if (entity === "teams" && tournamentId) params.set("tournamentId", tournamentId);
    if (entity === "players") {
      if (teamId) params.set("teamId", teamId);
      if (createMissingTeams) params.set("createMissingTeams", "true");
    }
    return `/${entity}/import?${params.toString()}`;
  };

  const upload = async (dryRun: boolean) => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post(buildUrl(dryRun), fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (dryRun) setPreview(res.data);
      else {
        setResult(res.data);
        toast.success(`${res.data.summary.created} ${label} importados`);
        onImported?.();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "No se pudo procesar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const onFile = (f: File | null) => {
    setFile(f);
    setPreview(null);
    setResult(null);
  };

  const template = async () => {
    try {
      const url = entity === "teams" ? "/teams/import/template" : `/players/import/template${teamId ? `?teamId=${teamId}` : ""}`;
      await downloadFile(url, `plantilla_${label}.xlsx`);
    } catch { toast.error("No se pudo descargar la plantilla"); }
  };

  const shown = result || preview;
  const rows = shown ? shown.rows.filter(r => filter === "all" || r.status === filter) : [];

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-emerald-600" />Carga masiva de {label}</DialogTitle>
          <DialogDescription>Descarga la plantilla, diligénciala y súbela. Verás una vista previa antes de confirmar.</DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Paso 1 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-4 bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">1. Plantilla</p>
              <p className="text-sm text-muted-foreground mb-3">Formato .xlsx con las columnas requeridas{entity === "players" ? " y la lista de equipos existentes" : ""}.</p>
              <Button size="sm" variant="outline" onClick={template}><Download className="h-4 w-4 mr-2" />Descargar plantilla</Button>
            </div>
            <div className="rounded-xl border p-4 bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">2. Archivo</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0] || null); }}
                className={cn("rounded-lg border-2 border-dashed p-3 text-center cursor-pointer transition-colors text-sm", file ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30" : "hover:border-primary/50")}
              >
                <Upload className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                {file ? <span className="font-medium">{file.name}</span> : <span className="text-muted-foreground">Clic o arrastra el Excel aquí</span>}
              </div>
              {entity === "players" && !teamId && (
                <label className="flex items-center justify-between gap-3 mt-3 text-xs">
                  <span>Crear equipos que no existan</span>
                  <Switch checked={createMissingTeams} onCheckedChange={setCreateMissingTeams} />
                </label>
              )}
            </div>
          </div>

          {/* Paso 3: vista previa / resultado */}
          {shown && (
            <div className="rounded-xl border overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 border-b">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mr-auto">
                  {result ? "Resultado" : "Vista previa"} · {shown.summary.total} filas{shown.format === "bloques" ? " · formato por bloques detectado" : ""}
                </p>
                {(["all", "created", "updated", "skipped", "error"] as const).map(k => {
                  const count = k === "all" ? shown.summary.total : (shown.summary as any)[k === "error" ? "errors" : k] ?? 0;
                  if (k !== "all" && !count) return null;
                  return (
                    <button key={k} onClick={() => setFilter(k)} className={cn("rounded-full px-2.5 py-0.5 text-xs border transition-colors", filter === k ? "bg-foreground text-background border-foreground" : "bg-card hover:bg-muted")}>
                      {k === "all" ? "Todas" : statusMeta[k].label} <span className="opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left p-2 w-12">Fila</th>
                      <th className="text-left p-2 w-24">Estado</th>
                      {entity === "players" && <th className="text-left p-2">Equipo</th>}
                      <th className="text-left p-2">{entity === "teams" ? "Equipo" : "Jugador"}</th>
                      <th className="text-left p-2">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const meta = statusMeta[r.status]; const Icon = meta.icon;
                      return (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-2 text-muted-foreground">{r.row}</td>
                          <td className={cn("p-2 font-medium", meta.className)}><span className="inline-flex items-center gap-1"><Icon className="h-3.5 w-3.5" />{meta.label}</span></td>
                          {entity === "players" && <td className="p-2">{r.data?.teamName || r.data?.teamId || "—"}</td>}
                          <td className="p-2 font-medium">
                            {entity === "teams" ? (r.data?.name || "—") : [r.data?.firstName, r.data?.lastName].filter(Boolean).join(" ") || "—"}
                            {entity === "players" && r.data?.jerseyNumber ? <span className="text-muted-foreground"> #{r.data.jerseyNumber}</span> : null}
                            {entity === "teams" && r.data?.groupName ? <span className="text-muted-foreground"> · Grupo {r.data.groupName}</span> : null}
                          </td>
                          <td className="p-2 text-muted-foreground">{r.message || (entity === "teams" ? r.data?.city : [r.data?.position, r.data?.documentNumber].filter(Boolean).join(" · ")) || ""}</td>
                        </tr>
                      );
                    })}
                    {rows.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Sin filas para este filtro.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 gap-2">
          {result ? (
            <Button onClick={() => close(false)}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => close(false)} disabled={loading}>Cancelar</Button>
              {!preview ? (
                <Button onClick={() => upload(true)} disabled={!file || loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Validar archivo</Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => setPreview(null)} disabled={loading}>Cambiar archivo</Button>
                  <Button onClick={() => upload(false)} disabled={loading || (preview.summary.created + (preview.summary.updated || 0)) === 0}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Importar {preview.summary.created + (preview.summary.updated || 0)} {label}
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
