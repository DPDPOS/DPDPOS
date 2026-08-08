"use client";

import { Lock, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { ApiError } from "@/lib/api/errors";
import { ALL_PERMISSIONS } from "@/lib/constants/permissions";
import type { RoleResponse } from "@/features/roles/types";
import { useRoles } from "@/features/roles/hooks";
import { useUsers } from "@/features/users/hooks";
import { RoleFormModal } from "./role-form-modal";
import { RolePermissionsDrawer } from "./role-permissions-drawer";

export function RolesView() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<RoleResponse | null>(null);

  const { data, isPending, isError, error, refetch } = useRoles(1, 100);
  const { data: users } = useUsers();

  const memberCountByRole = useMemo(() => {
    const counts = new Map<string, number>();
    for (const user of users?.items ?? []) {
      for (const roleId of user.roleIds) {
        counts.set(roleId, (counts.get(roleId) ?? 0) + 1);
      }
    }
    return counts;
  }, [users]);

  const columns: TableColumn<RoleResponse>[] = [
    {
      key: "name",
      header: "Role",
      accessor: (row) => (
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
          {row.name}
          {row.isSystemRole ? (
            <Badge variant="outline" title="Seeded system role — locked">
              <Lock className="size-2.5" aria-hidden />
              System
            </Badge>
          ) : null}
        </span>
      ),
      sortValue: (row) => row.name,
      sortable: true,
    },
    {
      key: "description",
      header: "Description",
      accessor: (row) => (
        <span className="text-[13px] text-ink-2">{row.description ?? "—"}</span>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      align: "right",
      accessor: (row) => (
        <span className="tabular text-[13px] text-ink-2">{row.permissions.length}</span>
      ),
      sortValue: (row) => row.permissions.length,
      sortable: true,
    },
    {
      key: "members",
      header: "Members",
      align: "right",
      accessor: (row) => (
        <span className="tabular text-[13px] text-ink-2">
          {memberCountByRole.get(row.id) ?? 0}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Roles</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            The permission catalog is frozen at {ALL_PERMISSIONS.length} strings
            — custom roles pick a subset. System roles are locked.
          </p>
        </div>
        <Can perm="role:create">
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" aria-hidden />
            New role
          </Button>
        </Can>
      </header>

      {isError ? (
        <ErrorState
          message={error instanceof ApiError ? error.message : "Could not load roles"}
          retry={() => void refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(row) => row.id}
          loading={isPending}
          defaultPageSize={10}
          emptyTitle="No roles yet"
          emptyBody="Roles are seeded with the organization — custom roles come from here."
          rowActions={(row) =>
            row.isSystemRole ? null : (
              <Can perm="role:update_permissions">
                <Button size="sm" variant="ghost" onClick={() => setEditing(row)}>
                  Permissions
                </Button>
              </Can>
            )
          }
        />
      )}

      <RoleFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <RolePermissionsDrawer
        key={editing?.id ?? "none"}
        role={editing}
        onClose={() => setEditing(null)}
        open={editing !== null}
      />
    </div>
  );
}
