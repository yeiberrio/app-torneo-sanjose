"use client";

import { ReactNode, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "@/lib/utils";

/**
 * Barra de filtros: busqueda siempre visible, filtros adicionales colapsables en movil.
 */
export function FilterBar({ search, onSearch, placeholder = "Buscar...", children, activeCount = 0, onClear, right, className }: {
  search: string; onSearch: (v: string) => void; placeholder?: string; children?: ReactNode; activeCount?: number; onClear?: () => void; right?: ReactNode; className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("mb-4 space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} className="pl-9 h-10 rounded-xl bg-card" />
          {search && (
            <button onClick={() => onSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
          )}
        </div>
        {children && (
          <Button variant={open || activeCount > 0 ? "secondary" : "outline"} size="sm" className="h-10 rounded-xl md:hidden" onClick={() => setOpen(!open)}>
            <SlidersHorizontal className="h-4 w-4" />
            {activeCount > 0 && <span className="ml-1.5 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5">{activeCount}</span>}
          </Button>
        )}
        {right && <div className="hidden md:flex items-center gap-2">{right}</div>}
      </div>
      {children && (
        <div className={cn("flex-wrap items-center gap-2", open ? "flex" : "hidden md:flex")}>
          {children}
          {activeCount > 0 && onClear && (
            <Button size="sm" variant="ghost" className="h-9 text-xs" onClick={onClear}><X className="h-3.5 w-3.5 mr-1" />Limpiar</Button>
          )}
        </div>
      )}
      {right && <div className="flex md:hidden items-center gap-2">{right}</div>}
    </div>
  );
}
