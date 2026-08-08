"use client";

import { AlertCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatSlaRemaining, slaProgress } from "@/features/rights/sla";
import type { RightsRequestResponse } from "@/features/rights/types";
import { cn } from "@/lib/utils/cn";

/**
 * SLA countdown (§9.6) — remaining time against the request's due date,
 * escalating from neutral → warn at 75% elapsed → fail when overdue.
 */
export function SlaTimer({ request }: { request: RightsRequestResponse }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const { pct, remainingMs, overdue } = slaProgress(request, now);
  const label = overdue
    ? `Overdue ${formatSlaRemaining(remainingMs)}`
    : formatSlaRemaining(remainingMs);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap text-xs tabular",
        overdue
          ? "font-medium text-fail"
          : pct >= 0.75
            ? "font-medium text-warn"
            : "text-ink-2",
      )}
      title={`SLA window ${Math.round(pct * 100)}% elapsed`}
    >
      {overdue ? (
        <AlertCircle className="size-3.5" aria-hidden />
      ) : (
        <Clock className="size-3.5" aria-hidden />
      )}
      {label}
    </span>
  );
}
