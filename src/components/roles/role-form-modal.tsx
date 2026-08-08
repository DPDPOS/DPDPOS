"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { useCreateRole } from "@/features/roles/hooks";
import { PermissionEditor } from "./permission-editor";

interface RoleFormModalProps {
  open: boolean;
  onClose: () => void;
}

export function RoleFormModal({ open, onClose }: RoleFormModalProps) {
  const createMutation = useCreateRole();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setName("");
    setDescription("");
    setPermissions([]);
    setError(null);
    onClose();
  };

  // The submit button is disabled until a name is typed, so the only errors
  // surfaced here are backend conflicts (e.g. duplicate role name).
  const submit = async () => {
    setError(null);
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        permissions,
      });
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the role");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="New role"
      description="Name the role, then pick its permissions from the catalog."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={close} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => void submit()}
            disabled={createMutation.isPending || name.trim().length === 0}
          >
            {createMutation.isPending ? "Creating…" : "Create role"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Name" htmlFor="role-name" error={name.trim().length === 0 ? error ?? undefined : undefined}>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              placeholder="e.g. Privacy Analyst"
            />
          </Field>
          <Field label="Description" htmlFor="role-description">
            <Input
              id="role-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              placeholder="What is this role for?"
            />
          </Field>
        </div>

        {error ? (
          <p role="alert" className="text-xs text-fail">
            {error}
          </p>
        ) : null}

        <PermissionEditor selected={permissions} onChange={setPermissions} />
      </div>
    </Dialog>
  );
}
