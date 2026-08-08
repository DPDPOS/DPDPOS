"use client";

import { Archive, Building2, Eye, Pencil, Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ApiError } from "@/lib/api/errors";
import type { DataAssetResponse } from "@/features/dataAssets/types";
import { useDataAssets } from "@/features/dataAssets/hooks";
import { useDepartments } from "@/features/departments/hooks";
import { useUsers } from "@/features/users/hooks";
import { useProcessingActivities } from "@/features/processingActivities/hooks";
import { dpiaRequiredFor } from "@/features/processingActivities/types";
import { SensitivityChip } from "./sensitivity-chip";
import { AssetStatusChip } from "./asset-status-chip";
import { DpiaChip } from "./dpia";
import {
  ArchiveAssetDialog,
  CreateAssetDrawer,
  EditAssetDrawer,
} from "./asset-forms";
import { CreateActivityDrawer } from "./activity-forms";

const PAGE_SIZE = 10;

function DepartmentName({ departmentId }: { departmentId: string | null }) {
  const departments = useDepartments();
  const dept = departments.data?.items.find((d) => d.id === departmentId);
  if (!departmentId) return <span className="text-xs text-ink-3">Unassigned</span>;
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-ink">
      <Building2 className="size-3 text-ink-3" aria-hidden />
      {dept?.name ?? departmentId.slice(0, 8)}
    </span>
  );
}

function OwnerName({ ownerUserId }: { ownerUserId: string | null }) {
  const users = useUsers();
  const user = users.data?.items.find((u) => u.id === ownerUserId);
  if (!ownerUserId) return <span className="text-xs text-ink-3">Unassigned</span>;
  if (!user) return <span className="font-mono text-xs text-ink-2">{ownerUserId.slice(0, 8)}</span>;
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-ink">
      <UserRound className="size-3 text-ink-3" aria-hidden />
      {user.name}
    </span>
  );
}

export function InventoryView() {
  const assets = useDataAssets();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<DataAssetResponse | null>(null);
  const [archiving, setArchiving] = useState<DataAssetResponse | null>(null);
  const [detail, setDetail] = useState<DataAssetResponse | null>(null);

  const columns: TableColumn<DataAssetResponse>[] = [
    {
      key: "assetName",
      header: "Asset",
      accessor: (row) => (
        <span className="font-mono text-[13px] font-medium text-accent">
          {row.assetName}
        </span>
      ),
      sortValue: (row) => row.assetName,
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      accessor: (row) => <span className="text-[13px] text-ink">{row.assetType}</span>,
      sortValue: (row) => row.assetType,
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      accessor: (row) => <span className="text-[13px] text-ink-2">{row.category}</span>,
      sortValue: (row) => row.category,
      sortable: true,
    },
    {
      key: "sensitivity",
      header: "Sensitivity",
      accessor: (row) => <SensitivityChip sensitivity={row.sensitivity} />,
      sortValue: (row) => row.sensitivity,
      sortable: true,
    },
    {
      key: "department",
      header: "Department",
      accessor: (row) => <DepartmentName departmentId={row.departmentId} />,
    },
    {
      key: "owner",
      header: "Owner",
      accessor: (row) => <OwnerName ownerUserId={row.ownerUserId} />,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => <AssetStatusChip status={row.status} />,
      sortValue: (row) => row.status,
      sortable: true,
    },
    {
      key: "retention",
      header: "Retention",
      accessor: (row) => (
        <span className="text-[13px] text-ink-2">{row.retentionPeriod ?? "—"}</span>
      ),
      sortValue: (row) => row.retentionPeriod ?? "",
      sortable: true,
      className: "hidden xl:table-cell",
    },
    {
      key: "storage",
      header: "Storage",
      accessor: (row) => (
        <span className="font-mono text-xs text-ink-3">{row.storageLocation ?? "—"}</span>
      ),
      sortValue: (row) => row.storageLocation ?? "",
      sortable: true,
      className: "hidden 2xl:table-cell",
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">Operations · Data map</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Inventory
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            {assets.isLoading
              ? "Loading…"
              : `${assets.data?.length ?? 0} data assets`}
          </p>
        </div>
        <Can perm="data_asset:create">
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-3.5" aria-hidden />
            New asset
          </Button>
        </Can>
      </header>

      {assets.isError ? (
        <ErrorState
          title="Couldn't load data assets"
          message={assets.error instanceof ApiError ? assets.error.message : undefined}
          retry={() => void assets.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={assets.data ?? []}
          rowKey={(row) => row.id}
          loading={assets.isLoading}
          defaultPageSize={PAGE_SIZE}
          onRowClick={setDetail}
          emptyTitle="No data assets yet"
          emptyBody="Start the data map — record the first asset, then link processing activities to it."
          emptyAction={
            <Can perm="data_asset:create">
              <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
                <Plus className="size-3.5" aria-hidden />
                New asset
              </Button>
            </Can>
          }
          rowActions={(row) => (
            <div className="flex items-center justify-end gap-0.5">
              <button
                type="button"
                onClick={() => setDetail(row)}
                className="focus-ring rounded-sm p-1 text-ink-3 opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
                aria-label={`View ${row.assetName}`}
              >
                <Eye className="size-3.5" aria-hidden />
              </button>
              <Can perm="data_asset:update">
                <button
                  type="button"
                  onClick={() => setEditing(row)}
                  className="focus-ring rounded-sm p-1 text-ink-3 opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
                  aria-label={`Edit ${row.assetName}`}
                >
                  <Pencil className="size-3.5" aria-hidden />
                </button>
              </Can>
              <Can perm="data_asset:delete">
                <button
                  type="button"
                  onClick={() => setArchiving(row)}
                  className="focus-ring rounded-sm p-1 text-ink-3 opacity-0 transition-opacity hover:bg-surface-2 hover:text-fail group-hover:opacity-100"
                  aria-label={`Archive ${row.assetName}`}
                >
                  <Archive className="size-3.5" aria-hidden />
                </button>
              </Can>
            </div>
          )}
        />
      )}

      <CreateAssetDrawer open={creating} onClose={() => setCreating(false)} />
      <EditAssetDrawer asset={editing} onClose={() => setEditing(null)} />
      <ArchiveAssetDialog asset={archiving} onClose={() => setArchiving(null)} />
      <AssetDetailDrawer asset={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

/* Asset detail drawer ---------------------------------------------------------- */

function AssetDetailDrawer({
  asset,
  onClose,
}: {
  asset: DataAssetResponse | null;
  onClose: () => void;
}) {
  const activities = useProcessingActivities(asset?.id, !!asset);
  const [creatingActivity, setCreatingActivity] = useState(false);
  const [editing, setEditing] = useState(false);

  const dpiaRelevant = dpiaRequiredFor(asset?.sensitivity);

  return (
    <Drawer
      open={!!asset}
      onClose={onClose}
      title={asset?.assetName ?? "Asset"}
      description={asset ? `${asset.assetType} · ${asset.category}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Can perm="data_asset:update">
            <Button onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" aria-hidden />
              Edit asset
            </Button>
          </Can>
        </>
      }
    >
      {asset ? (
        <div className="space-y-5">
          {/* Identity bar ------------------------------------------------------ */}
          <div className="flex flex-wrap items-center gap-2">
            <SensitivityChip sensitivity={asset.sensitivity} />
            <AssetStatusChip status={asset.status} />
            <span className="font-mono text-xs text-ink-3">{asset.id.slice(0, 8)}</span>
          </div>

          {dpiaRelevant ? (
            <div className="rounded-sm border border-warn/25 bg-warn-bg/50 px-3 py-2.5 text-xs leading-relaxed text-ink-2">
              High-risk personal data — processing against this asset may
              trigger a DPIA (DPDP Act s.17). Check the activity map for a
              DPIA-likely flag.
            </div>
          ) : null}

          {asset.description ? (
            <p className="text-[13px] leading-relaxed text-ink-2">
              {asset.description}
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
            <div>
              <dt className="micro-label">Department</dt>
              <dd className="mt-0.5 text-ink">
                <DepartmentName departmentId={asset.departmentId} />
              </dd>
            </div>
            <div>
              <dt className="micro-label">Owner</dt>
              <dd className="mt-0.5 text-ink">
                <OwnerName ownerUserId={asset.ownerUserId} />
              </dd>
            </div>
            <div>
              <dt className="micro-label">Storage location</dt>
              <dd className="mt-0.5 font-mono text-xs text-ink">
                {asset.storageLocation ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="micro-label">Retention</dt>
              <dd className="mt-0.5 text-ink">{asset.retentionPeriod ?? "—"}</dd>
            </div>
          </dl>

          {/* Linked processing activities -------------------------------------- */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Processing activities
                </h3>
                <p className="mt-0.5 text-xs text-ink-3">
                  {activities.isLoading
                    ? "Loading…"
                    : `${activities.data?.length ?? 0} linked`}
                </p>
              </div>
              <Can perm="processing_activity:create">
                <Button size="sm" onClick={() => setCreatingActivity(true)}>
                  <Plus className="size-3.5" aria-hidden />
                  New activity
                </Button>
              </Can>
            </div>

            {activities.data && activities.data.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {activities.data.map((activity) => (
                  <li
                    key={activity.id}
                    className="rounded-sm border border-border bg-surface-2 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">
                          {activity.purpose}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-xs text-ink-3">
                          {activity.legalBasis ?? "No legal basis recorded"}
                          {activity.processorName
                            ? ` · ${activity.processorName}`
                            : ""}
                        </p>
                      </div>
                      {dpiaRelevant ? <DpiaChip /> : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : activities.isLoading ? null : (
              <EmptyState
                title="No activities linked"
                body="Add a processing activity to start the activity map for this asset."
              />
            )}
          </div>
        </div>
      ) : null}

      {/* keyed so the form re-initialises when a different row is opened */}
      <CreateActivityDrawer
        key={asset?.id ?? "closed"}
        open={creatingActivity}
        onClose={() => setCreatingActivity(false)}
        defaultAssetId={asset?.id}
      />
      <EditAssetDrawer asset={editing ? asset : null} onClose={() => setEditing(false)} />
    </Drawer>
  );
}
