"use client";

import { CalendarClock } from "lucide-react";
import type { RoadmapJson } from "@/features/framework/types";
import { dueState, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * Vertical roadmap stepper (plan §9.3) — phases with control rows and real
 * due dates from the backend-built roadmap JSON. Shared by the wizard preview
 * and the /framework/roadmap page.
 */
export function RoadmapPhases({ roadmap }: { roadmap: RoadmapJson }) {
  const phases = roadmap.phases ?? [];
  return (
    <div className="space-y-6">
      {phases.map((phase, index) => (
        <section key={phase.name} className="relative pl-5">
          {/* Stepper rail */}
          <span
            aria-hidden
            className="absolute left-0 top-2.5 h-full w-px bg-border"
          />
          <span
            aria-hidden
            className={cn(
              "absolute left-0 top-0 flex size-4 -translate-x-1/2 items-center justify-center rounded-full border-2 border-surface bg-accent",
            )}
          >
            <span className="size-1 rounded-full bg-surface" />
          </span>

          <header className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h3 className="text-sm font-semibold text-ink">{phase.name}</h3>
            <span className="micro-label text-ink-3">
              Phase {index + 1} · {(phase.controls ?? []).length} control
              {(phase.controls ?? []).length === 1 ? "" : "s"}
            </span>
          </header>

          <ul className="space-y-1.5">
            {(phase.controls ?? []).map((control) => {
              const due = dueState(control.dueAt);
              return (
                <li
                  key={control.code}
                  className="flex items-center gap-3 rounded-sm border border-border bg-surface px-3 py-2"
                >
                  <span className="shrink-0 font-mono text-xs font-medium text-accent">
                    {control.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                    {control.title}
                  </span>
                  <span
                    className={cn(
                      "hidden items-center gap-1.5 text-xs sm:flex",
                      due.tone === "overdue"
                        ? "text-fail"
                        : due.tone === "due-soon"
                          ? "text-warn"
                          : "text-ink-3",
                    )}
                    title={formatDate(control.dueAt)}
                  >
                    <CalendarClock className="size-3" aria-hidden />
                    <span className="tabular">{due.label}</span>
                  </span>
                  <span className="tabular text-xs text-ink-3 sm:hidden">
                    {due.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
