/**
 * Date/relative-time formatting — tabular numerals everywhere (§4.2).
 */

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** "2026-06-12T09:41:00Z" → "12 Jun 2026". Returns "—" for null/empty. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

/** Like formatDate but includes time ("12 Jun 2026, 09:41"). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return timeFormatter.format(date);
}

export interface DueState {
  /** "overdue" | "due-soon" (≤ 14 days) | "on-track" | "none" */
  tone: "overdue" | "due-soon" | "on-track" | "none";
  label: string;
}

/** Relative due date: "in 12d" / "3d overdue" / "due today". */
export function dueState(iso: string | null | undefined): DueState {
  if (!iso) return { tone: "none", label: "—" };
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return { tone: "none", label: "—" };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round(
    (due.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (days < 0) {
    const n = Math.abs(days);
    return { tone: "overdue", label: `${n}d overdue` };
  }
  if (days === 0) return { tone: "due-soon", label: "due today" };
  if (days === 1) return { tone: "due-soon", label: "due tomorrow" };
  if (days <= 14) return { tone: "due-soon", label: `in ${days}d` };
  return { tone: "on-track", label: `in ${days}d` };
}
