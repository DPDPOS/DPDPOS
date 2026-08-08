"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/format";
import type { DepartmentResponse } from "@/features/departments/types";
import { useDepartments } from "@/features/departments/hooks";
import { useUsers } from "@/features/users/hooks";
import { CreateDepartmentModal } from "./create-department-modal";

export function DepartmentsView() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isPending, isError, error, refetch } = useDepartments();
  const { data: users } = useUsers();

  const userById = useMemo(
    () => new Map((users?.items ?? []).map((user) => [user.id, user.name])),
    [users],
  );

  const columns: TableColumn<DepartmentResponse>[] = [
    {
      key: "name",
      header: "Department",
      accessor: (row) => <span className="text-[13px] font-medium text-ink">{row.name}</span>,
      sortValue: (row) => row.name,
      sortable: true,
    },
    {
      key: "head",
      header: "Head",
      accessor: (row) => (
        <span className="text-[13px] text-ink-2">
          {row.headUserId ? userById.get(row.headUserId) ?? "—" : "—"}
        </span>
      ),
    },
    {
      key: "members",
      header: "Members",
      align: "right",
      accessor: () => <span className="tabular text-[13px] text-ink-3">—</span>,
    },
    {
      key: "created",
      header: "Created",
      accessor: (row) => (
        <span className="tabular text-[13px] text-ink-2">{formatDate(row.createdAt)}</span>
      ),
      sortValue: (row) => row.createdAt,
      sortable: true,
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Departments</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            Organizational units with a head — used by the data inventory and
            controls.
          </p>
        </div>
        <Can perm="department:create">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" aria-hidden />
            New department
          </Button>
        </Can>
      </header>

      {isError ? (
        <ErrorState
          message={
            error instanceof ApiError ? error.message : "Could not load departments"
          }
          retry={() => void refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(row) => row.id}
          loading={isPending}
          defaultPageSize={10}
          emptyTitle="No departments yet"
          emptyBody="Create the units that own data, controls and people."
          emptyAction={
            <Can perm="department:create">
              <Button size="sm" variant="secondary" onClick={() => setCreateOpen(true)}>
                New department
              </Button>
            </Can>
          }
        />
      )}

      <CreateDepartmentModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
