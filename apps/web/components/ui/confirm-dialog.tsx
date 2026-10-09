"use client";

import { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar", destructive, loading, onConfirm, children }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: ReactNode; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; loading?: boolean; onConfirm: () => void; children?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>{cancelLabel}</Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>{loading ? "Procesando..." : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
