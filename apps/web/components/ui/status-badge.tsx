import { cn } from "@/lib/utils";
import { toneClasses, Tone } from "@/lib/labels";

export function StatusBadge({ label, tone = "neutral", live, className, size = "sm" }: { label: string; tone?: Tone; live?: boolean; className?: string; size?: "xs" | "sm" }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap", size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs", toneClasses[tone], className)}>
      {live && <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 animate-ping" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" /></span>}
      {label}
    </span>
  );
}
