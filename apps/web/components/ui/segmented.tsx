import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Segmented<T extends string>({ value, onChange, options, className, size = "sm" }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; icon?: ReactNode }[]; className?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("inline-flex items-center rounded-xl bg-muted p-1 gap-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg font-medium transition-all whitespace-nowrap",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
            value === o.value ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}
