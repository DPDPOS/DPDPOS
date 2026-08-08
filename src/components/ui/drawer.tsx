"use client";

import { X } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { useFocusTrap } from "./use-focus-trap";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Right slide-over (plan §4.2 — "drawers slide in from the right", 150–200ms
 * ease-out). Stays mounted so the slide transition runs both ways.
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef, onClose);

  return (
    <div
      className={cn("fixed inset-0 z-50", !open && "pointer-events-none")}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={cn(
          "absolute inset-0 cursor-default bg-ink/30 transition-opacity duration-200 ease-out",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-xl shadow-ink/10 transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs leading-relaxed text-ink-2">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring -mr-1 rounded-sm p-1 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? (
          <footer className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
