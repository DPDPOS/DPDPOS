import { RIGHTS_REQUEST_SLA_DAYS } from "./types";

export const SLA_MS_PER_DAY = 24 * 60 * 60 * 1000;

/** SLA window (days) for a request type; unknown types default to 30. */
export function slaDaysFor(requestType: string): number {
  const days = RIGHTS_REQUEST_SLA_DAYS[
    requestType as keyof typeof RIGHTS_REQUEST_SLA_DAYS
  ];
  return days ?? 30;
}

export interface SlaRequestShape {
  requestType: string;
  openedAt: string;
  dueAt: string | null;
}

/**
 * Effective due date — the backend computes `dueAt` on create from the type's
 * SLA; when it is missing we fall back to `openedAt + SLA days`.
 */
export function slaDueFor(request: SlaRequestShape): Date {
  if (request.dueAt) return new Date(request.dueAt);
  return new Date(
    new Date(request.openedAt).getTime() +
      slaDaysFor(request.requestType) * SLA_MS_PER_DAY,
  );
}

export interface SlaProgress {
  /** Fraction of the SLA window elapsed, clamped to 0..1. */
  pct: number;
  /** Remaining time in ms — negative when overdue. */
  remainingMs: number;
  overdue: boolean;
  totalMs: number;
}

export function slaProgress(
  request: SlaRequestShape,
  now = Date.now(),
): SlaProgress {
  const opened = new Date(request.openedAt).getTime();
  const due = slaDueFor(request).getTime();
  const totalMs = Math.max(1, due - opened);
  const remainingMs = due - now;
  const pct = Math.min(1, Math.max(0, 1 - remainingMs / totalMs));
  return { pct, remainingMs, overdue: remainingMs < 0, totalMs };
}

/** "12d 4h" · "3h 20m" · "45m" — sign is carried by the caller. */
export function formatSlaRemaining(remainingMs: number): string {
  const abs = Math.abs(remainingMs);
  const days = Math.floor(abs / SLA_MS_PER_DAY);
  const hours = Math.floor((abs % SLA_MS_PER_DAY) / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
