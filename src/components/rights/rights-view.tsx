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
  REQUEST_STATUSES,
  REQUEST_TYPES,
  RIGHTS_REQUEST_TYPE_LABELS,
  isRightsTerminal,
  type RightsRequestResponse,
  type RightsRequestStatus,
  type RightsRequestType,
} from "@/features/rights/types";
import { slaDueFor } from "@/features/rights/sla";
import { useRightsRequests } from "@/features/rights/hooks";
import { useUsers } from "@/features/users/hooks";
import { RequestDetailDrawer } from "./request-detail-drawer";
import { SubmitRequestDrawer } from "./submit-request-drawer";
import { SlaTimer } from "./sla-timer";

type StatusFilter = "ALL" | RightsRequestStatus;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  ...REQUEST_STATUSES.map((status) => ({ value: status as StatusFilter, label: status })),
];

export function RightsView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isPending, isError, error, refetch } = useRightsRequests({
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    ...(typeFilter !== "ALL" ? { requestType: typeFilter as RightsRequestType } : {}),
    ...(assigneeFilter !== "ALL" ? { assignedTo: assigneeFilter } : {}),
  });

  const { data: users } = useUsers();
  const userById = useMemo(
    () => new Map((users?.items ?? []).map((user) => [user.id, user.name])),
    [users],
  );

  const columns: TableColumn<RightsRequestResponse>[] = [
    {
      key: "requester",
      header: "Requester",
      accessor: (row) => (
        <span className="font-mono text-[13px]">{row.requesterReference}</span>
      ),
      sortValue: (row) => row.requesterReference,
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      accessor: (row) => <StatusChip status={row.requestType} />,
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
      key: "opened",
      header: "Opened",
      accessor: (row) => (
        <span className="tabular text-[13px] text-ink-2">
          {formatDate(row.openedAt)}
        </span>
      ),
      sortValue: (row) => row.openedAt,
      sortable: true,
    },
    {
      key: "sla",
      header: "SLA",
      accessor: (row) => <SlaTimer request={row} />,
      sortValue: (row) => slaDueFor(row).toISOString(),
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
          <h1 className="text-lg font-semibold text-ink">Rights requests</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            Data principal requests with SLA timers — 30 days, 45 for grievance
            redressal.
          </p>
        </div>
        <Can perm="rights_request:create">
          <Button size="sm" onClick={() => setSubmitOpen(true)}>
            <Plus className="size-3.5" aria-hidden />
            Submit request
          </Button>
        </Can>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
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
            aria-label="Filter by type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="w-56"
          >
            <option value="ALL">All types</option>
            {REQUEST_TYPES.map((type) => (
              <option key={type} value={type}>
                {RIGHTS_REQUEST_TYPE_LABELS[type]}
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
            error instanceof ApiError ? error.message : "Could not load requests"
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
          emptyTitle="No requests match"
          emptyBody="Adjust the filters, or submit a new Data Principal request."
          emptyAction={
            <Can perm="rights_request:create">
              <Button size="sm" variant="secondary" onClick={() => setSubmitOpen(true)}>
                Submit request
              </Button>
            </Can>
          }
          onRowClick={(row) => setSelectedId(row.id)}
          rowClassName={(row) => (isRightsTerminal(row.status) ? "opacity-60" : undefined)}
        />
      )}

      <SubmitRequestDrawer open={submitOpen} onClose={() => setSubmitOpen(false)} />
      <RequestDetailDrawer
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        requestId={selectedId}
      />
    </div>
  );
}
