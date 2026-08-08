"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { useCreateDepartment } from "@/features/departments/hooks";
import { useUsers } from "@/features/users/hooks";

interface CreateDepartmentModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateDepartmentModal({ open, onClose }: CreateDepartmentModalProps) {
  const { data: users } = useUsers();
  const createMutation = useCreateDepartment();
  const [name, setName] = useState("");
  const [headUserId, setHeadUserId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setName("");
    setHeadUserId("");
    setError(null);
    onClose();
  };

  // The submit button is disabled until a name is typed, so the only errors
  // surfaced here are backend conflicts (e.g. duplicate department name).
  const submit = async () => {
    setError(null);
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        headUserId: headUserId || undefined,
      });
      close();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the department");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="New department"
      description="A unit that owns data, controls and people."
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
            {createMutation.isPending ? "Creating…" : "Create department"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? (
          <p role="alert" className="text-xs text-fail">
            {error}
          </p>
        ) : null}
        <Field label="Name" htmlFor="dept-name" error={name.trim().length === 0 ? error ?? undefined : undefined}>
          <Input
            id="dept-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={200}
            placeholder="e.g. Legal & Privacy"
          />
        </Field>
        <Field label="Head" htmlFor="dept-head" hint="Optional — the person responsible for the unit.">
          <Select
            id="dept-head"
            value={headUserId}
            onChange={(event) => setHeadUserId(event.target.value)}
          >
            <option value="">Unassigned</option>
            {(users?.items ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Dialog>
  );
}
