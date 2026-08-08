"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * DiffView/JsonDiff primitive (§8.2, §9.12) — renders a before → after diff of
 * two JSON values. Scalar changes become a field table (before / after);
 * nested objects expand inline; create-only entries (before == null) show a
 * single "added" row; delete-only entries (after == null) show "removed".
 */
interface DiffEntry {
  path: string;
  before: unknown;
  after: unknown;
  kind: "changed" | "added" | "removed" | "unchanged";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function flattenDiff(before: unknown, after: unknown, path = ""): DiffEntry[] {
  // Create / delete at the root.
  if (before === null || before === undefined) {
    // A created record expands into its fields so the reader sees exactly what
    // was recorded (a single "(record)" entry would hide the contents).
    if (isPlainObject(after)) {
      return Object.entries(after).map(([key, value]) => ({
        path: path ? `${path}.${key}` : key,
        before: undefined,
        after: value,
        kind: "added" as const,
      }));
    }
    return [{ path: path || "(record)", before, after, kind: "added" }];
  }
  if (after === null || after === undefined) {
    return [{ path: path || "(record)", before, after, kind: "removed" }];
  }

  // Both scalars (or arrays treated as scalars) — simple change.
  if (!isPlainObject(before) || !isPlainObject(after)) {
    const same =
      JSON.stringify(before) === JSON.stringify(after) ||
      (before === after);
    return [
      {
        path: path || "(value)",
        before,
        after,
        kind: same ? "unchanged" : "changed",
      },
    ];
  }

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const entries: DiffEntry[] = [];
  for (const key of keys) {
    const subPath = path ? `${path}.${key}` : key;
    const beforeValue = before[key];
    const afterValue = after[key];
    const bothObjects = isPlainObject(beforeValue) && isPlainObject(afterValue);
    const same = JSON.stringify(beforeValue) === JSON.stringify(afterValue);

    if (bothObjects && !same) {
      entries.push(...flattenDiff(beforeValue, afterValue, subPath));
    } else if (beforeValue === undefined || beforeValue === null) {
      entries.push({ path: subPath, before: beforeValue, after: afterValue, kind: "added" });
    } else if (afterValue === undefined || afterValue === null) {
      entries.push({ path: subPath, before: beforeValue, after: afterValue, kind: "removed" });
    } else if (!same) {
      entries.push({ path: subPath, before: beforeValue, after: afterValue, kind: "changed" });
    }
  }
  return entries;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (isPlainObject(value) || Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

export function JsonDiff({ before, after }: { before: unknown; after: unknown }) {
  const entries = useMemo(() => flattenDiff(before, after), [before, after]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const changed = entries.filter((entry) => entry.kind !== "unchanged");
  const summary =
    changed.length === 0
      ? "No changes"
      : `${changed.length} change${changed.length === 1 ? "" : "s"}`;

  if (changed.length === 0) {
    return (
      <p className="text-xs text-ink-3">
        No field changes were recorded for this event.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-ink-2">
        {summary}
        {before === null || before === undefined ? " · record created" : ""}
      </p>
      <ul className="divide-y divide-border rounded-sm border border-border bg-surface-2/60">
        {changed.map((entry) => {
          const isOpen = expanded[entry.path] ?? false;
          const nested = isPlainObject(entry.before) || isPlainObject(entry.after);
          return (
            <li key={entry.path} className="px-2.5 py-1.5">
              <div className="flex items-center gap-2">
                {nested ? (
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((current) => ({
                        ...current,
                        [entry.path]: !isOpen,
                      }))
                    }
                    aria-label={`Toggle ${entry.path}`}
                    className="focus-ring rounded-sm p-0.5 text-ink-3 transition-colors hover:text-ink"
                  >
                    <ChevronRight
                      className={cn(
                        "size-3 transition-transform duration-150",
                        isOpen && "rotate-90",
                      )}
                      aria-hidden
                    />
                  </button>
                ) : (
                  <span className="w-4" aria-hidden />
                )}
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink">
                  {entry.path}
                </code>
                <span
                  className={cn(
                    "rounded-sm px-1 font-mono text-[10px] uppercase",
                    entry.kind === "added" && "bg-pass-bg text-pass",
                    entry.kind === "removed" && "bg-fail-bg text-fail",
                    entry.kind === "changed" && "bg-warn-bg text-warn",
                  )}
                >
                  {entry.kind}
                </span>
              </div>
              {isOpen ? (
                <pre className="mt-1.5 overflow-x-auto rounded-sm border border-border bg-surface p-2 font-mono text-[11px] leading-relaxed text-ink-2">
                  {formatValue(entry.before)} → {formatValue(entry.after)}
                </pre>
              ) : nested ? null : (
                <div className="mt-1 grid grid-cols-2 gap-2 pl-6">
                  <div className="min-w-0">
                    <p className="micro-label text-ink-3">Before</p>
                    <p className="truncate font-mono text-[11px] text-ink-2">
                      {formatValue(entry.before)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="micro-label text-ink-3">After</p>
                    <p className="truncate font-mono text-[11px] text-ink">
                      {formatValue(entry.after)}
                    </p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
