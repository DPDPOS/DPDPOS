"use client";

import { ChevronDown, Copy, Download, FilterX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAuditLogs, useAuditLogsPage } from "@/features/audit/hooks";
import { AUDIT_ENTITY_TYPES, type AuditLogRecord, type ListAuditLogsQuery } from "@/features/audit/types";
import { useUsers } from "@/features/users/hooks";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import { EntityTimelineDrawer } from "./entity-timeline-drawer";
import { AuditExportDialog } from "./export-dialog";

/**
 * Cursor page size. The backend defaults to 50 rows per page; the demo build
 * uses a small page so the load-more affordance is actually exercisable with
 * the seeded fixture (6 rows).
 */
const PAGE_SIZE = 4;

/** actionType is a CamelCase event name — show a compact version. */
function shortAction(action: string): string {
  return action.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

export function AuditView() {
  const [filters, setFilters] = useState<Omit<ListAuditLogsQuery, "cursor" | "limit">>({});
  const [applied, setApplied] = useState<Omit<ListAuditLogsQuery, "cursor" | "limit">>({});
  // Load-more pages accumulate here; the first page comes straight from the
  // query so a filter change naturally replaces the list (no effect sync).
  const [extraRows, setExtraRows] = useState<AuditLogRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{ entityType: string; entityId: string } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isPending, isError, error, refetch, isFetching } = useAuditLogs({
    ...applied,
    limit: PAGE_SIZE,
  });
  const loadMore = useAuditLogsPage();
  const { data: users } = useUsers();

  const userById = useMemo(
    () => new Map((users?.items ?? []).map((user) => [user.id, user.name])),
    [users],
  );

  // Derived rows — base page from the query, appended pages in extraRows.
  // Dedup against the base page, not against extraRows itself.
  const rows = useMemo(() => {
    if (!data) return extraRows;
    const seen = new Set(data.data.map((row) => row.id));
    return [...data.data, ...extraRows.filter((row) => !seen.has(row.id))];
  }, [data, extraRows]);

  // Cursor for the next page: the query's own cursor while the list is still
  // the first page, the accumulated state cursor once pages have been appended.
  const effectiveCursor = extraRows.length === 0 ? (data?.nextCursor ?? null) : nextCursor;

  const apply = () => {
    setExtraRows([]);
    setNextCursor(null);
    setApplied(filters);
  };

  const reset = () => {
    setFilters({});
    setApplied({});
    setExtraRows([]);
    setNextCursor(null);
  };

  const onLoadMore = async () => {
    if (!effectiveCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await loadMore({ ...applied, limit: PAGE_SIZE }, effectiveCursor);
      setExtraRows((current) => {
        const seen = new Set(current.map((row) => row.id));
        return [...current, ...page.data.filter((row) => !seen.has(row.id))];
      });
      setNextCursor(page.nextCursor);
    } catch {
      // Load-more failure leaves the list intact; the button remains clickable.
    } finally {
      setLoadingMore(false);
    }
  };

  const copyCorrelationId = async (id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row?.correlationId) return;
    try {
      await navigator.clipboard.writeText(row.correlationId);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard unavailable — non-fatal.
    }
  };
  // Clear the transient copy feedback if the view unmounts mid-timeout.
  useEffect(() => () => setCopiedId(null), []);

  const filterDirty = JSON.stringify(filters) !== JSON.stringify(applied);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Audit log</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            Immutable, timestamped activity trail. Rows are append-only — the
            record cannot be edited or deleted.
          </p>
        </div>
        <Can perm="audit:export">
          <Button size="sm" variant="secondary" onClick={() => setExportOpen(true)}>
            <Download className="size-3.5" aria-hidden />
            Export
          </Button>
        </Can>
      </header>

      {/* Filter bar ------------------------------------------------------------ */}
      <form
        className="flex flex-wrap items-end gap-3 rounded-sm border border-border bg-surface p-3"
        onSubmit={(event) => {
          event.preventDefault();
          apply();
        }}
      >
        <Field label="Entity type" htmlFor="audit-entity-type" className="w-44">
          <Input
            id="audit-entity-type"
            list="audit-entity-types"
            value={filters.entityType ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, entityType: event.target.value || undefined }))
            }
            placeholder="e.g. Violation"
          />
          <datalist id="audit-entity-types">
            {AUDIT_ENTITY_TYPES.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </Field>

        <Field label="Action" htmlFor="audit-action-type" className="w-44">
          <Input
            id="audit-action-type"
            value={filters.actionType ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, actionType: event.target.value || undefined }))
            }
            placeholder="e.g. ViolationCreated"
          />
        </Field>

        <Field label="Actor" htmlFor="audit-actor" className="w-48">
          <Select
            id="audit-actor"
            value={filters.actorUserId ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, actorUserId: event.target.value || undefined }))
            }
          >
            <option value="">Anyone</option>
            {(users?.items ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="From" htmlFor="audit-date-from" className="w-40">
          <Input
            id="audit-date-from"
            type="datetime-local"
            value={filters.dateFrom ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, dateFrom: event.target.value || undefined }))
            }
          />
        </Field>

        <Field label="To" htmlFor="audit-date-to" className="w-40">
          <Input
            id="audit-date-to"
            type="datetime-local"
            value={filters.dateTo ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, dateTo: event.target.value || undefined }))
            }
          />
        </Field>

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={isFetching && !filterDirty}>
            {isFetching ? <Spinner size="sm" label="Filtering" /> : "Apply"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={reset}
            disabled={!filterDirty}
          >
            <FilterX className="size-3.5" aria-hidden />
            Reset
          </Button>
        </div>
      </form>

      {/* Log stream ------------------------------------------------------------- */}
      {isError ? (
        <ErrorState
          message={error instanceof ApiError ? error.message : "Could not load the audit log"}
          retry={() => void refetch()}
        />
      ) : isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-sm border border-border bg-surface p-10 text-center">
          <p className="text-[13px] font-medium text-ink">No audit events</p>
          <p className="mt-1 text-xs text-ink-2">
            {applied.entityType || applied.actionType || applied.actorUserId
              ? "No events match the current filters."
              : "The log starts empty — every privileged action is recorded here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-border bg-surface">
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li
                key={row.id}
                className="grid grid-cols-[9rem_1fr_auto] items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-2/50 sm:grid-cols-[9rem_10rem_1fr_auto]"
              >
                <span className="tabular font-mono text-[11px] text-ink-2">
                  {formatDateTime(row.createdAt)}
                </span>
                <span className="hidden truncate text-[13px] text-ink sm:block">
                  {row.actorUserId ? (userById.get(row.actorUserId) ?? "Unknown actor") : "System"}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="max-w-44 truncate font-mono text-[10px]">
                      {shortAction(row.actionType)}
                    </Badge>
                    {row.entityType && row.entityId ? (
                      <button
                        type="button"
                        onClick={() =>
                          setHistoryTarget({ entityType: row.entityType as string, entityId: row.entityId as string })
                        }
                        className="focus-ring truncate font-mono text-[11px] text-accent transition-colors hover:underline"
                        title="Show entity history"
                      >
                        {row.entityType}:{row.entityId.slice(0, 8)}…
                      </button>
                    ) : (
                      <span className="text-xs text-ink-3">—</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {row.correlationId ? (
                    <button
                      type="button"
                      onClick={() => void copyCorrelationId(row.id)}
                      className="focus-ring flex items-center gap-1 rounded-sm px-1 py-0.5 font-mono text-[10px] text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                      title="Copy correlation id"
                    >
                      {copiedId === row.id ? (
                        "Copied"
                      ) : (
                        <>
                          <Copy className="size-2.5" aria-hidden />
                          {row.correlationId.slice(0, 8)}…
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          {/* Load-more (cursor pagination, not a pager) */}
          <div className="flex items-center justify-center border-t border-border p-3">
            {effectiveCursor ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void onLoadMore()}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Spinner size="sm" label="Loading" />
                ) : (
                  <ChevronDown className="size-3.5" aria-hidden />
                )}
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            ) : (
              <p className="text-xs text-ink-3">End of the audit trail</p>
            )}
          </div>
        </div>
      )}

      <EntityTimelineDrawer target={historyTarget} onClose={() => setHistoryTarget(null)} />
      <AuditExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
