import { ReactNode } from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

export function Field({ label, hint, children, className, required }: { label: string; hint?: string; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
    </div>
  );
}
