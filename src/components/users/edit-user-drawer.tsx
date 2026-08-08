"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { useSessionStore } from "@/state/session";
import {
  USER_STATUSES,
  type UpdateUserPayload,
  type UserResponse,
} from "@/features/users/types";
import { useUpdateUser } from "@/features/users/hooks";

interface EditUserDrawerProps {
  open: boolean;
  user: UserResponse | null;
  onClose: () => void;
}

export function EditUserDrawer({ open, user, onClose }: EditUserDrawerProps) {
  const updateMutation = useUpdateUser();
  const currentUserId = useSessionStore((state) => state.user?.id);
  const isSelf = user?.id === currentUserId;

  // Lazy-init from the row; the parent remounts with `key={user.id}` so a
  // different row always starts from its own values.
  const [name, setName] = useState(user?.name ?? "");
  const [status, setStatus] = useState<string>(user?.status ?? "ACTIVE");
  const [disableConfirm, setDisableConfirm] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  if (!open) {
    return (
      <Drawer open={false} onClose={onClose} title="Edit user">
        {null}
      </Drawer>
    );
  }

  if (!user) {
    return (
      <Drawer open onClose={onClose} title="Edit user">
        <ErrorState message="Could not load the user" retry={onClose} />
      </Drawer>
    );
  }

  const handleError = (err: unknown) => {
    setInlineError(err instanceof ApiError ? err.message : "Something went wrong");
  };

  const save = (nextStatus: string, nextName: string) => {
    setInlineError(null);
    const body: UpdateUserPayload = {};
    if (nextName !== user.name) body.name = nextName.trim();
    if (nextStatus !== user.status) body.status = nextStatus as UpdateUserPayload["status"];
    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }
    updateMutation.mutate(
      { id: user.id, body },
      { onError: handleError, onSuccess: () => onClose() },
    );
  };

  const onSave = () => {
    if (status === "DISABLED" && user.status !== "DISABLED") {
      setDisableConfirm(true);
      return;
    }
    save(status, name);
  };

  return (
    <Drawer open onClose={onClose} title="Edit user" description={user.email}>
      <div className="space-y-4">
        {isSelf ? (
          <p className="flex items-start gap-2 rounded-md border border-warn/40 bg-warn-bg p-3 text-xs leading-relaxed text-warn">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            This is your own account — changing its status can lock you out of
            the workspace.
          </p>
        ) : null}

        <Field label="Name" htmlFor="edit-user-name">
          <Input
            id="edit-user-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={200}
          />
        </Field>

        <Field
          label="Status"
          htmlFor="edit-user-status"
          hint="INVITED users are still pending; DISABLED users cannot sign in."
        >
          <Select
            id="edit-user-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={updateMutation.isPending}
          >
            {USER_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        {inlineError ? (
          <p role="alert" className="text-xs text-fail">
            {inlineError}
          </p>
        ) : null}

        <footer className="flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </footer>
      </div>

      {/* Disable confirm — audited, explains the consequence (§9.14) */}
      <Dialog
        open={disableConfirm}
        onClose={() => setDisableConfirm(false)}
        title="Disable user"
        description="This is audited and takes effect immediately."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDisableConfirm(false)}>
              Keep active
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setDisableConfirm(false);
                save("DISABLED", name);
              }}
              disabled={updateMutation.isPending}
            >
              Disable account
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-2">
          <strong className="text-ink">{user.name}</strong> will not be able to
          sign in until re-enabled. Any active sessions are not forcibly revoked
          by this action.
        </p>
      </Dialog>
    </Drawer>
  );
}
