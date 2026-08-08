"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/format";
import {
  REMEDIATION_TASK_STATUSES,
  isRemediationTerminal,
  type RemediationTaskResponse,
  type RemediationTaskStatus,
} from "@/features/remediation/types";
import { useRemediationTasks } from "@/features/remediation/hooks";
import { useAllViolations } from "@/features/violations/hooks";
import { useUsers } from "@/features/users/hooks";
import { CreateRemediationTaskDrawer } from "./create-task-drawer";
import { RemediationTaskDetailDrawer } from "./task-detail-drawer";

type StatusFilter = "ALL" | RemediationTaskStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  ...REMEDIATION_TASK_STATUSES.map((status) => ({
    value: status as StatusFilter,
    label: status,
  })),
];

export function RemediationView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [violationFilter, setViolationFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isPending, isError, error, refetch } = useRemediationTasks({
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    ...(violationFilter !== "ALL" ? { violationId: violationFilter } : {}),
    ...(assigneeFilter !== "ALL" ? { assignedTo: assigneeFilter } : {}),
  });

  const { data: violations } = useAllViolations();
  const { data: users } = useUsers();
  const userById = useMemo(
    () => new Map((users?.items ?? []).map((user) => [user.id, user.name])),
    [users],
  );
  const violationById = useMemo(
    () => new Map((violations ?? []).map((violation) => [violation.id, violation.title])),
    [violations],
  );

  const columns: TableColumn<RemediationTaskResponse>[] = [
    {
      key: "task",
      header: "Task",
      accessor: (row) => (
        <span className="text-[13px] font-medium text-ink">{row.taskTitle}</span>
      ),
      sortValue: (row) => row.taskTitle,
      sortable: true,
    },
    {
      key: "violation",
      header: "Violation",
      accessor: (row) => (
        <span className="text-[13px] text-ink-2">
          {violationById.get(row.violationId) ?? "—"}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      accessor: (row) => (
        <span
          title={
            row.source === "AUTO"
              ? "Auto-created from a validation failure"
              : "Created manually"
          }
        >
          <StatusChip status={row.source} />
        </span>
      ),
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
            row.dueAt && !isRemediationTerminal(row.status)
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

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Remediation</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            The fix-it queue with verification — nothing closes without proof.
          </p>
        </div>
        <Can perm="remediation:update">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" aria-hidden />
            New task
          </Button>
        </Can>
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
            aria-label="Filter by violation"
            value={violationFilter}
            onChange={(event) => setViolationFilter(event.target.value)}
            className="w-60"
          >
            <option value="ALL">All violations</option>
            {(violations ?? []).map((violation) => (
              <option key={violation.id} value={violation.id}>
                {violation.title}
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
            error instanceof ApiError ? error.message : "Could not load remediation tasks"
          }
          retry={() => void refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(row) => row.id}
          loading={isPending}
          defaultPageSize={10}
          emptyTitle="No tasks match"
          emptyBody="Tasks are created automatically when a violation opens, or manually from the violation detail."
          emptyAction={
            <Can perm="remediation:update">
              <Button size="sm" variant="secondary" onClick={() => setCreateOpen(true)}>
                New task
              </Button>
            </Can>
          }
          onRowClick={(row) => setSelectedId(row.id)}
          rowClassName={(row) =>
            isRemediationTerminal(row.status) ? "opacity-60" : undefined
          }
        />
      )}

      <CreateRemediationTaskDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <RemediationTaskDetailDrawer
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        taskId={selectedId}
      />
    </div>
  );
}
