"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { ApiError } from "@/lib/api/errors";
import { humanizeStatus } from "@/lib/constants/status-maps";
import { formatDate } from "@/lib/utils/format";
import {
  VIOLATION_SEVERITIES,
  VIOLATION_STATUSES,
  isViolationTerminal,
  type ViolationResponse,
  type ViolationSeverity,
  type ViolationStatus,
} from "@/features/violations/types";
import { useViolations } from "@/features/violations/hooks";
import { useUsers } from "@/features/users/hooks";
import { CreateViolationDrawer } from "./create-violation-drawer";
import { ViolationDetailDrawer } from "./violation-detail-drawer";

type StatusFilter = "ALL" | ViolationStatus;
type ViewMode = "table" | "board";

/** Board columns — non-terminal statuses plus one collapsed terminal column. */
const BOARD_COLUMNS: ViolationStatus[] = [
  "OPEN",
  "TRIAGE",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING_EVIDENCE",
  "VALIDATED",
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  ...VIOLATION_STATUSES.map((status) => ({
    value: status as StatusFilter,
    label: status,
  })),
];

function readViewFromUrl(): ViewMode {
  if (typeof window === "undefined") return "table";
  const fromUrl = new URLSearchParams(window.location.search).get("view");
  return fromUrl === "board" || fromUrl === "table" ? fromUrl : "table";
}

export function ViolationsView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [view, setView] = useState<ViewMode>(readViewFromUrl);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // View preference persists in the URL (?view=board|table, plan §9.8).
  // Skip the write when the URL already reflects the view — no churn on load.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("view") === view) return;
    url.searchParams.set("view", view);
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams}`);
  }, [view]);

  const { data, isPending, isError, error, refetch } = useViolations({
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    ...(severityFilter !== "ALL"
      ? { severity: severityFilter as ViolationSeverity }
      : {}),
    ...(assigneeFilter !== "ALL" ? { assignedTo: assigneeFilter } : {}),
  });

  const { data: users } = useUsers();
  const userById = useMemo(
    () => new Map((users?.items ?? []).map((user) => [user.id, user.name])),
    [users],
  );

  const columns: TableColumn<ViolationResponse>[] = [
    {
      key: "title",
      header: "Violation",
      accessor: (row) => (
        <span className="text-[13px] font-medium text-ink">{row.title}</span>
      ),
      sortValue: (row) => row.title,
      sortable: true,
    },
    {
      key: "severity",
      header: "Severity",
      accessor: (row) => <StatusChip status={row.severity} />,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => <StatusChip status={row.status} />,
    },
    {
      key: "assignee",
      header: "Assignee",
      accessor: (row) => userById.get(row.assignedTo ?? "") ?? "—",
    },
    {
      key: "due",
      header: "Due",
      accessor: (row) => (
        <span
          className={`tabular text-[13px] ${
            row.dueAt && !isViolationTerminal(row.status)
              ? new Date(row.dueAt) < new Date()
                ? "text-fail"
                : "text-ink-2"
              : "text-ink-3"
          }`}
        >
          {row.dueAt ? formatDate(row.dueAt) : "—"}
        </span>
      ),
      sortValue: (row) => row.dueAt ?? "",
      sortable: true,
    },
    {
      key: "version",
      header: "V",
      align: "right",
      accessor: (row) => <Badge variant="outline">v{row.version}</Badge>,
    },
  ];

  const openViolation = (id: string) => setSelectedId(id);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Violations</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            Non-compliance queue — triage, assign, validate and close. Every
            action is gated by the violation lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <Segmented<ViewMode>
              name="Violations view"
              value={view}
              onChange={setView}
              options={[
                { value: "table", label: "Table" },
                { value: "board", label: "Board" },
              ]}
            />
          </div>
          <Can perm="violation:create">
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" aria-hidden />
              New violation
            </Button>
          </Can>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              aria-pressed={statusFilter === value}
              className={`focus-ring rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === value
                  ? "border-border-strong bg-surface-2 text-ink"
                  : "border-border bg-surface text-ink-2 hover:text-ink"
              }`}
            >
              {label === "ALL" ? "All" : label.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Select
            aria-label="Filter by severity"
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
            className="w-44"
          >
            <option value="ALL">All severities</option>
            {VIOLATION_SEVERITIES.map((severity) => (
              <option key={severity} value={severity}>
                {severity}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter by assignee"
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            className="w-48"
          >
            <option value="ALL">All assignees</option>
            {(users?.items ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isError ? (
        <ErrorState
          message={
            error instanceof ApiError ? error.message : "Could not load violations"
          }
          retry={() => void refetch()}
        />
      ) : view === "board" ? (
        <ViolationsBoard
          rows={data ?? []}
          loading={isPending}
          userById={userById}
          onOpen={openViolation}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(row) => row.id}
          loading={isPending}
          defaultPageSize={10}
          emptyTitle="No violations match"
          emptyBody="Adjust the filters, or log a new violation from a validation failure."
          emptyAction={
            <Can perm="violation:create">
              <Button size="sm" variant="secondary" onClick={() => setCreateOpen(true)}>
                New violation
              </Button>
            </Can>
          }
          onRowClick={(row) => openViolation(row.id)}
          rowClassName={(row) => (isViolationTerminal(row.status) ? "opacity-60" : undefined)}
        />
      )}

      <CreateViolationDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <ViolationDetailDrawer
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        violationId={selectedId}
      />
    </div>
  );
}

interface ViolationsBoardProps {
  rows: ViolationResponse[];
  loading: boolean;
  userById: Map<string, string>;
  onOpen: (id: string) => void;
}

/** Kanban-lite columns by status (terminal collapsed) — plan §9.8. */
function ViolationsBoard({ rows, loading, userById, onOpen }: ViolationsBoardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-md border border-border bg-surface" />
        ))}
      </div>
    );
  }

  const terminal = rows.filter((row) => isViolationTerminal(row.status));
  const byColumn = (status: ViolationStatus) =>
    rows.filter((row) => row.status === status);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-7">
      {BOARD_COLUMNS.map((status) => (
        <BoardColumn
          key={status}
          title={status}
          count={byColumn(status).length}
          rows={byColumn(status)}
          userById={userById}
          onOpen={onOpen}
        />
      ))}
      <div className="rounded-md border border-dashed border-border bg-surface-2/40 p-2">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-3">
            Closed / Archived
          </span>
          <Badge variant="outline">{terminal.length}</Badge>
        </div>
        <div className="space-y-1.5">
          {terminal.map((row) => (
            <BoardCard key={row.id} row={row} userById={userById} onOpen={onOpen} muted />
          ))}
          {terminal.length === 0 ? (
            <p className="px-1 py-3 text-xs text-ink-3">Nothing here</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BoardColumn({
  title,
  count,
  rows,
  userById,
  onOpen,
}: {
  title: string;
  count: number;
  rows: ViolationResponse[];
  userById: Map<string, string>;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-surface-2/40 p-2">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-2">
          {humanizeStatus(title)}
        </span>
        <Badge variant="outline">{count}</Badge>
      </div>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <BoardCard key={row.id} row={row} userById={userById} onOpen={onOpen} />
        ))}
        {rows.length === 0 ? (
          <p className="px-1 py-3 text-xs text-ink-3">Nothing here</p>
        ) : null}
      </div>
    </div>
  );
}

function BoardCard({
  row,
  userById,
  onOpen,
  muted = false,
}: {
  row: ViolationResponse;
  userById: Map<string, string>;
  onOpen: (id: string) => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(row.id)}
      className={`focus-ring block w-full rounded-sm border border-border bg-surface p-2 text-left transition-shadow hover:shadow-sm ${
        muted ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <StatusChip status={row.severity} />
        <Badge variant="outline">v{row.version}</Badge>
      </div>
      <p className="mt-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-ink">
        {row.title}
      </p>
      <p className="mt-1 text-xs text-ink-3">
        {userById.get(row.assignedTo ?? "") ?? "Unassigned"}
        {row.dueAt ? ` · due ${formatDate(row.dueAt)}` : ""}
      </p>
    </button>
  );
}
