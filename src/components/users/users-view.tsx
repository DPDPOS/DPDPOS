"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { StatusChip } from "@/components/ui/status-chip";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { UserResponse } from "@/features/users/types";
import { useUsersPage } from "@/features/users/hooks";
import { InviteUserDrawer } from "./invite-user-drawer";
import { EditUserDrawer } from "./edit-user-drawer";

const PAGE_SIZE = 10;

export function UsersView() {
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<UserResponse | null>(null);

  const { data, isPending, isError, error, refetch } = useUsersPage(page, PAGE_SIZE);

  const columns: TableColumn<UserResponse>[] = [
    {
      key: "name",
      header: "Name",
      accessor: (row) => <span className="text-[13px] font-medium text-ink">{row.name}</span>,
      sortValue: (row) => row.name,
      sortable: true,
    },
    {
      key: "email",
      header: "Email",
      accessor: (row) => <span className="font-mono text-[13px] text-ink-2">{row.email}</span>,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => <StatusChip status={row.status} />,
    },
    {
      key: "roles",
      header: "Roles",
      accessor: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roleNames.map((role) => (
            <Badge key={role} variant="outline">
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "lastLogin",
      header: "Last login",
      accessor: (row) => (
        <span className="tabular text-[13px] text-ink-2">
          {row.lastLoginAt ? formatDateTime(row.lastLoginAt) : "—"}
        </span>
      ),
      sortValue: (row) => row.lastLoginAt ?? "",
      sortable: true,
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Users</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            People, invites and account status. Invited users join via the
            emailed link.
          </p>
        </div>
        <Can perm="user:create">
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus className="size-3.5" aria-hidden />
            Invite user
          </Button>
        </Can>
      </header>

      {isError ? (
        <ErrorState
          message={error instanceof ApiError ? error.message : "Could not load users"}
          retry={() => void refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(row) => row.id}
          loading={isPending}
          pagination={{
            page: data?.meta.page ?? page,
            pageSize: PAGE_SIZE,
            total: data?.meta.total ?? 0,
            totalPages: data?.meta.totalPages ?? 1,
            onPageChange: setPage,
          }}
          emptyTitle="No users yet"
          emptyBody="Invite your first teammate — they join via an emailed invitation."
          emptyAction={
            <Can perm="user:create">
              <Button size="sm" variant="secondary" onClick={() => setInviteOpen(true)}>
                Invite user
              </Button>
            </Can>
          }
          rowActions={(row) => (
            <Can perm="user:update">
              <Button size="sm" variant="ghost" onClick={() => setEditing(row)}>
                Edit
              </Button>
            </Can>
          )}
        />
      )}

      <InviteUserDrawer open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <EditUserDrawer
        key={editing?.id ?? "none"}
        user={editing}
        onClose={() => setEditing(null)}
        open={editing !== null}
      />
    </div>
  );
}
