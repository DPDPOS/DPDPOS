"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ApiError } from "@/lib/api/errors";
import type { RoleResponse } from "@/features/roles/types";
import { useUpdateRolePermissions } from "@/features/roles/hooks";
import { PermissionEditor } from "./permission-editor";

interface RolePermissionsDrawerProps {
  open: boolean;
  role: RoleResponse | null;
  onClose: () => void;
}

export function RolePermissionsDrawer({ open, role, onClose }: RolePermissionsDrawerProps) {
  const updateMutation = useUpdateRolePermissions();
  // Lazy-init from the row; the parent remounts with `key={role.id}` so a
  // different role always starts from its own permission set.
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? []);
  const [inlineError, setInlineError] = useState<string | null>(null);

  if (!open) {
    return (
      <Drawer open={false} onClose={onClose} title="Role permissions">
        {null}
      </Drawer>
    );
  }

  if (!role) return null;

  const system = role.isSystemRole;

  const save = () => {
    setInlineError(null);
    updateMutation.mutate(
      { id: role.id, body: { permissions } },
      {
        onError: (err) =>
          setInlineError(err instanceof ApiError ? err.message : "Something went wrong"),
        onSuccess: () => onClose(),
      },
    );
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title="Role permissions"
      description={role.name}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-ink">{role.name}</span>
          <Badge variant="outline">{permissions.length} permissions</Badge>
          {system ? (
            <Badge variant="outline">
              <Lock className="size-2.5" aria-hidden />
              Seeded system role — locked
            </Badge>
          ) : null}
        </div>

        {system ? (
          <p className="text-xs leading-relaxed text-ink-3">
            System roles are seeded from the catalog presets and cannot be
            edited. Create a custom role to grant a different subset.
          </p>
        ) : null}

        <PermissionEditor
          selected={permissions}
          onChange={system ? undefined : setPermissions}
        />

        {inlineError ? (
          <p role="alert" className="text-xs text-fail">
            {inlineError}
          </p>
        ) : null}

        {!system ? (
          <footer className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save permissions"}
            </Button>
          </footer>
        ) : null}
      </div>
    </Drawer>
  );
}
