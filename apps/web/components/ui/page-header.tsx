import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, back, actions, children, className }: { title: ReactNode; subtitle?: ReactNode; back?: string; actions?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-5", className)}>
      <div className="flex items-start gap-3">
        {back && (
          <Button variant="ghost" size="icon" asChild className="shrink-0 -ml-2 mt-0.5">
            <Link href={back}><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xl sm:text-2xl font-semibold tracking-tight leading-tight">{title}</div>
          {subtitle && <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
