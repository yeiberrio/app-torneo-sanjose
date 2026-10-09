import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, hint, icon, tone = "neutral", className, onClick }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: "neutral" | "green" | "blue" | "orange" | "purple" | "rose"; className?: string; onClick?: () => void }) {
  const tones: Record<string, string> = {
    neutral: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300",
    green: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300",
    blue: "text-sky-600 bg-sky-50 dark:bg-sky-950/50 dark:text-sky-300",
    orange: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300",
    purple: "text-violet-600 bg-violet-50 dark:bg-violet-950/50 dark:text-violet-300",
    rose: "text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300",
  };
  return (
    <div onClick={onClick} className={cn("rounded-2xl border bg-card p-4 flex items-center gap-3 transition-shadow", onClick && "cursor-pointer hover:shadow-md", className)}>
      {icon && <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", tones[tone])}>{icon}</div>}
      <div className="min-w-0">
        <p className="text-xl font-semibold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">{hint}</p>}
      </div>
    </div>
  );
}
