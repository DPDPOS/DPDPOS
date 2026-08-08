"use client";

import { Drawer } from "@/components/ui/drawer";
import { ErrorState } from "@/components/ui/error-state";
import { JsonDiff } from "@/components/ui/json-diff";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditEntityHistory } from "@/features/audit/hooks";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";

interface EntityTimelineDrawerProps {
  target: { entityType: string; entityId: string } | null;
  onClose: () => void;
}

export function EntityTimelineDrawer({ target, onClose }: EntityTimelineDrawerProps) {
  const { data, isPending, isError, error, refetch } = useAuditEntityHistory(
    target?.entityType ?? null,
    target?.entityId ?? null,
  );

  return (
    <Drawer
      open={target !== null}
      onClose={onClose}
      title="Entity history"
      description={
        target ? `${target.entityType}:${target.entityId}` : undefined
      }
    >
      {!target ? null : isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          message={
            error instanceof ApiError ? error.message : "Could not load entity history"
          }
          retry={() => void refetch()}
        />
      ) : data && data.length > 0 ? (
        <ol className="relative space-y-0 border-l border-border pl-4">
          {data.map((entry) => {
            const created = entry.beforeJson === null || entry.beforeJson === undefined;
            return (
              <li key={entry.id} className="relative pb-5 last:pb-0">
                <span
                  aria-hidden
                  className="absolute -left-[21px] top-1.5 size-2 rounded-full border border-border bg-surface"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] font-medium text-ink">
                    {entry.actionType.replace(/([a-z0-9])([A-Z])/g, "$1 $2")}
                  </span>
                  {created ? (
                    <span className="rounded-sm bg-pass-bg px-1 font-mono text-[10px] uppercase text-pass">
                      Created
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 tabular font-mono text-[10px] text-ink-3">
                  {formatDateTime(entry.createdAt)}
                  {entry.correlationId ? ` · ${entry.correlationId.slice(0, 8)}…` : ""}
                </p>
                <div className="mt-2">
                  <JsonDiff before={entry.beforeJson} after={entry.afterJson} />
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-[13px] leading-relaxed text-ink-2">
          No recorded history for this record. The backend derives entity types
          from event names — some modules (e.g. rights requests) emit events
          that don&apos;t map to a timeline, so this stays empty there.
        </p>
      )}
    </Drawer>
  );
}
