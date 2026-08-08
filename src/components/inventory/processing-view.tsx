"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/ui/error-state";
import { ApiError } from "@/lib/api/errors";
import type { ProcessingActivityResponse } from "@/features/processingActivities/types";
import { dpiaRequiredFor } from "@/features/processingActivities/types";
import {
  useDeleteProcessingActivity,
  useProcessingActivities,
} from "@/features/processingActivities/hooks";
import { useDataAssets } from "@/features/dataAssets/hooks";
import { DpiaChip } from "./dpia";
import { SensitivityChip } from "./sensitivity-chip";
import { CreateActivityDrawer, EditActivityDrawer } from "./activity-forms";
import { cn } from "@/lib/utils/cn";

type DpiaFilter = "ALL" | "DPIA";

const FILTERS: { value: DpiaFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DPIA", label: "DPIA required" },
];

export function ProcessingView() {
  const activities = useProcessingActivities();
  const assets = useDataAssets();
  const [filter, setFilter] = useState<DpiaFilter>("ALL");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ProcessingActivityResponse | null>(null);
  const [deleting, setDeleting] = useState<ProcessingActivityResponse | null>(null);

  const assetById = useMemo(
    () => new Map((assets.data ?? []).map((asset) => [asset.id, asset])),
    [assets.data],
  );

  const rows = useMemo(() => {
    const all = activities.data ?? [];
    if (filter === "ALL") return all;
    return all.filter((activity) =>
      dpiaRequiredFor(assetById.get(activity.dataAssetId)?.sensitivity),
    );
  }, [activities.data, filter, assetById]);

  const columns: TableColumn<ProcessingActivityResponse>[] = [
    {
      key: "purpose",
      header: "Purpose",
      accessor: (row) => (
        <span className="block max-w-md">
          <span className="block truncate text-[13px] font-medium text-ink">
            {row.purpose}
          </span>
          {row.notes ? (
            <span className="block truncate text-xs text-ink-3">{row.notes}</span>
          ) : null}
        </span>
      ),
      sortValue: (row) => row.purpose,
      sortable: true,
    },
    {
      key: "asset",
      header: "Data asset",
      accessor: (row) => {
        const asset = assetById.get(row.dataAssetId);
        return (
          <span className="flex flex-col">
            <span className="font-mono text-xs font-medium text-accent">
              {asset?.assetName ?? row.dataAssetId.slice(0, 8)}
            </span>
            {asset ? (
              <span className="mt-0.5">
                <SensitivityChip sensitivity={asset.sensitivity} />
              </span>
            ) : null}
          </span>
        );
      },
      sortValue: (row) => assetById.get(row.dataAssetId)?.assetName ?? "",
      sortable: true,
    },
    {
      key: "legalBasis",
      header: "Legal basis",
      accessor: (row) => (
        <span className="font-mono text-xs text-ink-2">{row.legalBasis ?? "—"}</span>
      ),
      sortValue: (row) => row.legalBasis ?? "",
      sortable: true,
      className: "hidden lg:table-cell",
    },
    {
      key: "processor",
      header: "Processor",
      accessor: (row) => (
        <span className="text-[13px] text-ink-2">{row.processorName ?? "—"}</span>
      ),
      sortValue: (row) => row.processorName ?? "",
      sortable: true,
      className: "hidden xl:table-cell",
    },
    {
      key: "retention",
      header: "Retention",
      accessor: (row) => (
        <span className="text-[13px] text-ink-2">{row.retentionRule ?? "—"}</span>
      ),
      sortValue: (row) => row.retentionRule ?? "",
      sortable: true,
      className: "hidden 2xl:table-cell",
    },
    {
      key: "dpia",
      header: "DPIA",
      accessor: (row) => {
        const asset = assetById.get(row.dataAssetId);
        return dpiaRequiredFor(asset?.sensitivity) ? <DpiaChip /> : (
          <span className="text-xs text-ink-3">—</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">Operations · Data map</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Processing
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            {activities.isLoading
              ? "Loading…"
              : `${activities.data?.length ?? 0} processing activities`}
          </p>
        </div>
        <Can perm="processing_activity:create">
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-3.5" aria-hidden />
            New activity
          </Button>
        </Can>
      </header>

      {/* DPIA filter ---------------------------------------------------------- */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by DPIA requirement">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={cn(
              "focus-ring rounded-sm border px-2.5 py-1 text-[13px] font-medium transition-colors",
              filter === item.value
                ? "border-accent/40 bg-accent-soft text-accent"
                : "border-border bg-surface text-ink-2 hover:border-border-strong hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activities.isError ? (
        <ErrorState
          title="Couldn't load processing activities"
          message={activities.error instanceof ApiError ? activities.error.message : undefined}
          retry={() => void activities.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          loading={activities.isLoading || assets.isLoading}
          defaultPageSize={10}
          emptyTitle={
            filter === "DPIA"
              ? "No DPIA-required activities"
              : "No processing activities yet"
          }
          emptyBody={
            filter === "DPIA"
              ? "Activities on HIGH or CRITICAL assets show here."
              : "Link the first activity to a data asset to start the map."
          }
          emptyAction={
            filter === "ALL" ? (
              <Can perm="processing_activity:create">
                <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
                  <Plus className="size-3.5" aria-hidden />
                  New activity
                </Button>
              </Can>
            ) : undefined
          }
          rowActions={(row) => (
            <div className="flex items-center justify-end gap-0.5">
              <Can perm="processing_activity:update">
                <button
                  type="button"
                  onClick={() => setEditing(row)}
                  className="focus-ring rounded-sm p-1 text-ink-3 opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
                  aria-label={`Edit ${row.purpose}`}
                >
                  <Pencil className="size-3.5" aria-hidden />
                </button>
              </Can>
              <Can perm="processing_activity:delete">
                <button
                  type="button"
                  onClick={() => setDeleting(row)}
                  className="focus-ring rounded-sm p-1 text-ink-3 opacity-0 transition-opacity hover:bg-surface-2 hover:text-fail group-hover:opacity-100"
                  aria-label={`Delete ${row.purpose}`}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </Can>
            </div>
          )}
        />
      )}

      <CreateActivityDrawer open={creating} onClose={() => setCreating(false)} />
      <EditActivityDrawer activity={editing} onClose={() => setEditing(null)} />
      <DeleteActivityDialog activity={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

/* Delete confirm --------------------------------------------------------------- */

function DeleteActivityDialog({
  activity,
  onClose,
}: {
  activity: ProcessingActivityResponse | null;
  onClose: () => void;
}) {
  const remove = useDeleteProcessingActivity();

  const submit = async () => {
    if (!activity) return;
    await remove.mutateAsync(activity.id);
    onClose();
  };

  return (
    <Dialog
      open={!!activity}
      onClose={onClose}
      title="Remove processing activity?"
      description="This action can't be undone from this screen."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={remove.isPending}
            variant="danger"
          >
            {remove.isPending ? "Removing…" : "Remove activity"}
          </Button>
        </>
      }
    >
      {activity ? (
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-ink-2">
            <span className="font-medium text-ink">{activity.purpose}</span>{" "}
            will be removed from the activity map.
          </p>
          <p className="flex items-start gap-2 rounded-sm border border-info/20 bg-info-bg/40 px-3 py-2 text-xs leading-relaxed text-ink-2">
            <Trash2 className="mt-0.5 size-3.5 shrink-0 text-info" aria-hidden />
            The record is <span className="font-medium text-ink">soft-deleted</span> —
            it stays in the audit trail so past processing is traceable.
          </p>
          {remove.isError ? (
            <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
              {remove.error instanceof ApiError ? remove.error.message : "Remove failed."}
            </p>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
