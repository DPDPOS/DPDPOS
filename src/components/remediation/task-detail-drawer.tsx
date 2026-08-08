"use client";

import { Check, Circle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/errors";
import { humanizeStatus } from "@/lib/constants/status-maps";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  REMEDIATION_STEP_CHAIN,
  isRemediationTerminal,
  remediationActionsFor,
  type RemediationTaskStatus,
} from "@/features/remediation/types";
import {
  useCloseRemediationTask,
  useRemediationTask,
  useUpdateRemediationTask,
} from "@/features/remediation/hooks";
import { useUsers } from "@/features/users/hooks";

interface RemediationTaskDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  taskId: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  start: "Start",
  submit: "Submit for verification",
  rework: "Send back for rework",
  verify: "Verify",
  close: "Close",
  cancel: "Cancel task",
};

/** One-step transitions map action → target status (verify/close/cancel are dialogs). */
const ACTION_TARGETS: Record<string, RemediationTaskStatus> = {
  start: "IN_PROGRESS",
  submit: "PENDING_VERIFICATION",
  rework: "IN_PROGRESS",
};

export function RemediationTaskDetailDrawer({
  open,
  onClose,
  taskId,
}: RemediationTaskDetailDrawerProps) {
  const { data: task, isPending, isError, error, refetch } =
    useRemediationTask(taskId);
  const { data: users } = useUsers();

  const updateMutation = useUpdateRemediationTask();
  const closeMutation = useCloseRemediationTask();

  const [verifyDialog, setVerifyDialog] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [closeDialog, setCloseDialog] = useState(false);
  const [summary, setSummary] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  if (!open) {
    return (
      <Drawer open={false} onClose={onClose} title="Task detail">
        {null}
      </Drawer>
    );
  }

  if (isPending) {
    return (
      <Drawer open onClose={onClose} title="Task detail">
        <div className="space-y-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Drawer>
    );
  }

  if (isError || !task) {
    return (
      <Drawer open onClose={onClose} title="Task detail">
        <ErrorState
          message={
            error instanceof ApiError ? error.message : "Could not load the task"
          }
          retry={() => void refetch()}
        />
      </Drawer>
    );
  }

  const status = task.status as RemediationTaskStatus;
  const userById = new Map((users?.items ?? []).map((u) => [u.id, u.name]));
  const actions = remediationActionsFor(status);
  const canEditAssignee = !isRemediationTerminal(status);
  // CANCELLED is not in the chain → -1, handled by the `cancelled` branch below.
  const currentIndex = REMEDIATION_STEP_CHAIN.indexOf(
    status as (typeof REMEDIATION_STEP_CHAIN)[number],
  );
  const cancelled = status === "CANCELLED";

  const handleMutationError = (err: unknown) => {
    if (err instanceof ApiError && err.code === "CONFLICT") {
      setConflictOpen(true);
      return;
    }
    setInlineError(err instanceof ApiError ? err.message : "Something went wrong");
  };

  const transition = (to: RemediationTaskStatus) => {
    setInlineError(null);
    updateMutation.mutate(
      { id: task.id, body: { version: task.version, status: to } },
      { onError: handleMutationError },
    );
  };

  const onAssigneeChange = (assignedTo: string) => {
    setInlineError(null);
    updateMutation.mutate(
      { id: task.id, body: { version: task.version, assignedTo: assignedTo || null } },
      { onError: handleMutationError },
    );
  };

  const confirmVerify = () => {
    setInlineError(null);
    updateMutation.mutate(
      {
        id: task.id,
        body: {
          version: task.version,
          status: "VERIFIED",
          verificationNotes: verifyNotes.trim() || null,
        },
      },
      {
        onError: handleMutationError,
        onSuccess: () => setVerifyDialog(false),
      },
    );
  };

  const confirmClose = () => {
    setInlineError(null);
    closeMutation.mutate(
      { id: task.id, body: { version: task.version, resolutionSummary: summary.trim() } },
      {
        onError: handleMutationError,
        onSuccess: () => setCloseDialog(false),
      },
    );
  };

  const confirmCancel = () => {
    setInlineError(null);
    updateMutation.mutate(
      { id: task.id, body: { version: task.version, status: "CANCELLED" } },
      {
        onError: handleMutationError,
        onSuccess: () => setCancelConfirm(false),
      },
    );
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title="Task detail"
      description="Remediation task"
    >
      <div className="space-y-6">
        {/* Identity bar */}
        <div className="space-y-1">
          <p className="text-sm font-semibold leading-snug text-ink">{task.taskTitle}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              title={
                task.source === "AUTO"
                  ? "Auto-created from a validation failure"
                  : "Created manually"
              }
            >
              <StatusChip status={task.source} />
            </span>
            <StatusChip status={task.status} />
            <Badge variant="outline">v{task.version}</Badge>
          </div>
          <div className="flex flex-wrap gap-3 pt-1 text-xs text-ink-3">
            <span>Created {formatDate(task.createdAt)}</span>
            <span>Updated {formatDateTime(task.updatedAt)}</span>
          </div>
        </div>

        {/* Violation link */}
        <Link
          href="/violations"
          className="focus-ring inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-2 py-1 text-xs text-ink-2 transition-colors hover:border-border-strong hover:text-ink"
        >
          Fixes a violation
        </Link>

        {task.taskDescription ? (
          <p className="whitespace-pre-wrap rounded-md border border-border bg-surface-2/60 p-3 text-[13px] leading-relaxed text-ink">
            {task.taskDescription}
          </p>
        ) : null}

        {/* Stepper */}
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-2">
            Lifecycle
          </h3>
          <ol className="space-y-0">
            {REMEDIATION_STEP_CHAIN.map((step, index) => {
              const done = !cancelled && currentIndex >= index;
              const current = !cancelled && currentIndex === index;
              const isLast = index === REMEDIATION_STEP_CHAIN.length - 1;
              return (
                <li key={step} className="relative flex gap-2.5 pb-3">
                  {!isLast ? (
                    <span
                      className="absolute left-[5px] top-4 h-full w-px bg-border"
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 flex size-2.5 items-center justify-center rounded-full border",
                      done
                        ? "border-pass bg-pass"
                        : current
                          ? "border-accent bg-accent"
                          : "border-border bg-surface",
                    )}
                    aria-hidden
                  >
                    {done ? <Check className="size-2 text-white" /> : null}
                  </span>
                  <div>
                    <p
                      className={cn(
                        "text-[13px]",
                        done || current ? "font-medium text-ink" : "text-ink-2",
                      )}
                    >
                      {humanizeStatus(step)}
                    </p>
                    {current ? <p className="text-xs text-ink-3">Current</p> : null}
                  </div>
                </li>
              );
            })}
            {cancelled ? (
              <li className="relative flex gap-2.5">
                <span className="relative z-10 mt-0.5 flex size-2.5 items-center justify-center rounded-full border border-fail bg-fail">
                  <X className="size-2 text-white" aria-hidden />
                </span>
                <p className="text-[13px] font-medium text-fail">Cancelled</p>
              </li>
            ) : null}
          </ol>
        </div>

        {/* Actions — gated on the exact current status (§10.4) */}
        <Can perm="remediation:update">
          {!isRemediationTerminal(status) ? (
            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-ink-2">
                Actions
              </h3>
              {canEditAssignee ? (
                <Field label="Assignee" htmlFor="task-assignee">
                  <Select
                    id="task-assignee"
                    value={task.assignedTo ?? ""}
                    onChange={(event) => onAssigneeChange(event.target.value)}
                    disabled={updateMutation.isPending}
                  >
                    <option value="">Unassigned</option>
                    {(users?.items ?? []).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {actions.map(({ action }) =>
                  action === "verify" ? (
                    <Button
                      key={action}
                      size="sm"
                      onClick={() => {
                        setVerifyNotes("");
                        setVerifyDialog(true);
                      }}
                      disabled={updateMutation.isPending}
                    >
                      Verify
                    </Button>
                  ) :                  action === "close" ? (
                    <Button
                      key={action}
                      size="sm"
                      onClick={() => {
                        setSummary("");
                        setCloseDialog(true);
                      }}
                      disabled={updateMutation.isPending || closeMutation.isPending}
                    >
                      Close task
                    </Button>
                  ) : action === "cancel" ? (
                    <Button
                      key={action}
                      variant="ghost"
                      size="sm"
                      onClick={() => setCancelConfirm(true)}
                      disabled={updateMutation.isPending}
                    >
                      Cancel task
                    </Button>
                  ) : (
                    <Button
                      key={action}
                      size="sm"
                      onClick={() => transition(ACTION_TARGETS[action])}
                      disabled={updateMutation.isPending}
                    >
                      {ACTION_LABELS[action] ?? humanizeStatus(action)}
                    </Button>
                  ),
                )}
              </div>
              <p className="text-xs text-ink-3">
                Every change carries the optimistic-lock version and is audited.
              </p>
            </div>
          ) : (
            <p className="text-xs text-ink-3">
              Terminal state — the task is immutable.
            </p>
          )}
        </Can>

        {inlineError ? (
          <p role="alert" className="text-xs text-fail">
            {inlineError}
          </p>
        ) : null}

        {/* Verification notes */}
        {task.verificationNotes ? (
          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-2">
              Verification notes
            </h3>
            <p className="whitespace-pre-wrap rounded-md border border-border bg-surface-2/60 p-3 text-[13px] leading-relaxed text-ink">
              {task.verificationNotes}
            </p>
          </div>
        ) : null}

        {/* Resolution summary */}
        {task.resolutionSummary ? (
          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-2">
              Resolution
            </h3>
            <p className="whitespace-pre-wrap rounded-md border border-border bg-surface-2/60 p-3 text-[13px] leading-relaxed text-ink">
              {task.resolutionSummary}
            </p>
          </div>
        ) : null}

        {/* Trace footer */}
        <dl className="grid grid-cols-2 gap-2 text-xs text-ink-2">
          <div>
            <dt className="uppercase tracking-wider text-ink-3">Assignee</dt>
            <dd>{userById.get(task.assignedTo ?? "") ?? "—"}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider text-ink-3">Due</dt>
            <dd>{task.dueAt ? formatDate(task.dueAt) : "—"}</dd>
          </div>
          {task.verifiedAt ? (
            <div>
              <dt className="uppercase tracking-wider text-ink-3">Verified</dt>
              <dd>
                {formatDateTime(task.verifiedAt)} by{" "}
                {userById.get(task.verifiedBy ?? "") ?? "—"}
              </dd>
            </div>
          ) : null}
          {task.closedAt ? (
            <div>
              <dt className="uppercase tracking-wider text-ink-3">Closed</dt>
              <dd>{formatDateTime(task.closedAt)}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {/* Verify dialog */}
      <Dialog
        open={verifyDialog}
        onClose={() => setVerifyDialog(false)}
        title="Verify task"
        description="Mark the remediation as verified. Notes are recorded for the audit trail."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setVerifyDialog(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={confirmVerify}
              disabled={updateMutation.isPending}
            >
              Verify task
            </Button>
          </>
        }
      >
        <Field label="Verification notes" htmlFor="task-verify-notes">
          <Textarea
            id="task-verify-notes"
            value={verifyNotes}
            onChange={(event) => setVerifyNotes(event.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="How was the fix verified? (optional)"
          />
        </Field>
      </Dialog>

      {/* Close dialog — resolutionSummary required */}
      <Dialog
        open={closeDialog}
        onClose={() => setCloseDialog(false)}
        title="Close task"
        description="Only a verified task can close. The resolution summary becomes part of the audit trail."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCloseDialog(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={confirmClose}
              disabled={summary.trim().length === 0 || closeMutation.isPending}
            >
              Close task
            </Button>
          </>
        }
      >
        <Field
          label="Resolution summary"
          htmlFor="task-close-summary"
          error={
            summary.trim().length === 0 && closeDialog
              ? "Required to close"
              : undefined
          }
        >
          <Textarea
            id="task-close-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="What was done and what was the outcome?"
          />
        </Field>
      </Dialog>

      {/* Cancel confirm */}
      <Dialog
        open={cancelConfirm}
        onClose={() => setCancelConfirm(false)}
        title="Cancel task"
        description="Cancelling is terminal and audited — the task cannot be reopened."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCancelConfirm(false)}>
              Keep task
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmCancel}
              disabled={updateMutation.isPending}
            >
              Cancel task
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">
          Are you sure this remediation task should be cancelled?
        </p>
      </Dialog>

      {/* 409 conflict (§7.6) */}
      <Dialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        title="Changed by someone else"
        description="This task was updated in another session. Reload to see the latest state before retrying."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConflictOpen(false)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setConflictOpen(false);
                void refetch();
              }}
            >
              Reload
            </Button>
          </>
        }
      >
        <Circle className="size-4 text-warn" aria-hidden />
      </Dialog>
    </Drawer>
  );
}
