import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({ icon, title, description, action, className, compact }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-dashed bg-card/50 text-center", compact ? "p-6" : "p-10", className)}>
      {icon && <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">{icon}</div>}
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center gap-2">{action}</div>}
    </div>
  );
}
