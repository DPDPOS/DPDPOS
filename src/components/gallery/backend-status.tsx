"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { queryKeys } from "@/lib/api/queryKeys";
import { cn } from "@/lib/utils/cn";

/**
 * Phase 0 demo — wires the API client + envelope + query keys to a real
 * backend endpoint (GET /api/v1/healthz via the /api rewrite).
 */
export function BackendStatus() {
  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api<{ status: string }>("/healthz"),
    staleTime: 15_000,
    retry: 0,
  });

  const ok = data?.status === "ok";
  const label = ok
    ? `API · ${data.status}`
    : isError
      ? error instanceof ApiError
        ? `API · ${error.message}`
        : "API unreachable"
      : "API · checking…";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border px-2.5 py-1.5 text-xs font-medium",
        ok
          ? "border-pass/20 bg-pass-bg text-pass"
          : "border-fail/20 bg-fail-bg text-fail",
      )}
      title="Backend health (GET /api/v1/healthz)"
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          ok ? "bg-pass" : "bg-fail",
          isFetching && "animate-pulse",
        )}
      />
      <span className="tabular">{label}</span>
      <button
        type="button"
        onClick={() => void refetch()}
        className="focus-ring rounded-sm p-0.5 opacity-70 transition-opacity hover:opacity-100"
        aria-label="Retry health check"
      >
        <RefreshCw className={cn("size-3", isFetching && "animate-spin")} aria-hidden />
      </button>
    </div>
  );
}
