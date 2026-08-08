"use client";

import {
  Archive,
  Check,
  Circle,
  ExternalLink,
  Paperclip,
  ShieldAlert,
} from "lucide-react";
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
  VIOLATION_SEVERITIES,
  VIOLATION_STEP_CHAIN,
  isViolationTerminal,
  violationActionsFor,
  type ViolationStatus,
} from "@/features/violations/types";
import {
  useCloseViolation,
  useUpdateViolation,
  useViolation,
} from "@/features/violations/hooks";
import { useRemediationTasks } from "@/features/remediation/hooks";
import { useUsers } from "@/features/users/hooks";
import { CreateRemediationTaskDrawer } from "../remediation/create-task-drawer";

interface ViolationDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  violationId: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  triage: "Triage",
  assign: "Assign",
  start: "Start work",
  request_evidence: "Request evidence",
  submit_evidence: "Submit evidence",
  validate: "Validate",
  close: "Close",
  archive: "Archive",
};

export function ViolationDetailDrawer({
  open,
  onClose,
  violationId,
}: ViolationDetailDrawerProps) {
  const { data: violation, isPending, isError, error, refetch } =
    useViolation(violationId);
  const { data: users } = useUsers();
  const { data: tasks } = useRemediationTasks(
    violationId ? { violationId } : {},
    Boolean(violationId),
  );

  const updateMutation = useUpdateViolation();
  const closeMutation = useCloseViolation();

  const [closeDialog, setCloseDialog] = useState(false);
  const [summary, setSummary] = useState("");
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  if (!open) {
    return (
      <Drawer open={false} onClose={onClose} title="Violation detail">
        {null}
      </Drawer>
    );
  }

  if (isPending) {
    return (
      <Drawer open onClose={onClose} title="Violation detail">
        <div className="space-y-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Drawer>
    );
  }

  if (isError || !violation) {
    return (
      <Drawer open onClose={onClose} title="Violation detail">
        <ErrorState
          message={
            error instanceof ApiError ? error.message : "Could not load the violation"
          }
          retry={() => void refetch()}
        />
      </Drawer>
    );
  }

  const status = violation.status as ViolationStatus;
  const userById = new Map((users?.items ?? []).map((u) => [u.id, u.name]));
  const actions = violationActionsFor(status);
  const hasAssign = actions.some((a) => a.action === "assign");
  const canEditAssignee = !isViolationTerminal(status) && (hasAssign || violation.assignedTo);
  // ARCHIVED is not in the chain → -1, handled by the `archived` branch below.
  const currentIndex = VIOLATION_STEP_CHAIN.indexOf(
    status as (typeof VIOLATION_STEP_CHAIN)[number],
  );
  const archived = status === "ARCHIVED";

  const handleMutationError = (err: unknown) => {
    if (err instanceof ApiError && err.code === "CONFLICT") {
      setConflictOpen(true);
      return;
    }
    setInlineError(err instanceof ApiError ? err.message : "Something went wrong");
  };

  const transition = (to: ViolationStatus) => {
    setInlineError(null);
    updateMutation.mutate(
      { id: violation.id, body: { version: violation.version, status: to } },
      { onError: handleMutationError },
    );
  };

  const onAssigneeChange = (assignedTo: string) => {
    setInlineError(null);
    const value = assignedTo || null;
    if (hasAssign) {
      updateMutation.mutate(
        {
          id: violation.id,
          body: { version: violation.version, status: "ASSIGNED", assignedTo: value },
        },
        { onError: handleMutationError },
      );
    } else {
      updateMutation.mutate(
        { id: violation.id, body: { version: violation.version, assignedTo: value } },
        { onError: handleMutationError },
      );
    }
  };

  const onSeverityChange = (severity: string) => {
    setInlineError(null);
    updateMutation.mutate(
      {
        id: violation.id,
        body: {
          version: violation.version,
          severity: severity as (typeof VIOLATION_SEVERITIES)[number],
        },
      },
      { onError: handleMutationError },
    );
  };

  const confirmClose = () => {
    setInlineError(null);
    closeMutation.mutate(
      { id: violation.id, body: { version: violation.version, resolutionSummary: summary.trim() } },
      {
        onError: handleMutationError,
        onSuccess: () => setCloseDialog(false),
      },
    );
  };

  const confirmArchive = () => {
    setInlineError(null);
    updateMutation.mutate(
      { id: violation.id, body: { version: violation.version, status: "ARCHIVED" } },
      {
        onError: handleMutationError,
        onSuccess: () => setArchiveConfirm(false),
      },
    );
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title="Violation detail"
      description="Enforcement record"
    >
      <div className="space-y-6">
        {/* Identity bar */}
        <div className="space-y-1">
          <p className="text-sm font-semibold leading-snug text-ink">{violation.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={violation.severity} />
            <StatusChip status={violation.status} />
            <Badge variant="outline">v{violation.version}</Badge>
          </div>
          <div className="flex flex-wrap gap-3 pt-1 text-xs text-ink-3">
            <span>Opened {formatDate(violation.openedAt)}</span>
            <span>Updated {formatDateTime(violation.updatedAt)}</span>
          </div>
        </div>

        {/* Source + evidence links */}
        {(violation.validationResultId || violation.evidenceRequiredFlag) && (
          <div className="flex flex-wrap gap-2">
            {violation.validationResultId ? (
              <Link
                href="/validations"
                className="focus-ring inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-2 py-1 text-xs text-ink-2 transition-colors hover:border-border-strong hover:text-ink"
              >
                <ExternalLink className="size-3" aria-hidden />
                From validation result
              </Link>
            ) : null}
            {violation.evidenceRequiredFlag ? (
              <Link
                href={`/evidence?violationId=${violation.id}`}
                className="focus-ring inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-2 py-1 text-xs text-ink-2 transition-colors hover:border-border-strong hover:text-ink"
              >
                <Paperclip className="size-3" aria-hidden />
                Evidence required
              </Link>
            ) : null}
          </div>
        )}

        {/* Stepper */}
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-2">
            Lifecycle
          </h3>
          <ol className="space-y-0">
            {VIOLATION_STEP_CHAIN.map((step, index) => {
              const done = !archived && currentIndex >= index;
              const current = !archived && currentIndex === index;
              const isLast = index === VIOLATION_STEP_CHAIN.length - 1;
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
            {archived ? (
              <li className="relative flex gap-2.5">
                <span className="relative z-10 mt-0.5 flex size-2.5 items-center justify-center rounded-full border border-neutral bg-neutral">
                  <Archive className="size-2 text-white" aria-hidden />
                </span>
                <p className="text-[13px] font-medium text-ink-2">Archived</p>
              </li>
            ) : null}
          </ol>
        </div>

        {/* Editable fields + actions — gated on the exact current status (§10.4) */}
        <Can perm="violation:assign">
          {!isViolationTerminal(status) ? (
            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-ink-2">
                Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Severity" htmlFor="violation-severity">
                  <Select
                    id="violation-severity"
                    value={violation.severity}
                    onChange={(event) => onSeverityChange(event.target.value)}
                    disabled={updateMutation.isPending}
                  >
                    {VIOLATION_SEVERITIES.map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </Select>
                </Field>
                {canEditAssignee ? (
                  <Field label="Assignee" htmlFor="violation-assignee">
                    <Select
                      id="violation-assignee"
                      value={violation.assignedTo ?? ""}
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
              </div>
              <div className="flex flex-wrap gap-2">
                {actions.map(({ action, to }) =>
                  action === "close" ? (
                    <Button
                      key={action}
                      size="sm"
                      onClick={() => {
                        setSummary("");
                        setCloseDialog(true);
                      }}
                      disabled={updateMutation.isPending || closeMutation.isPending}
                    >
                      Close violation
                    </Button>
                  ) : action === "archive" ? (
                    <Button
                      key={action}
                      variant="ghost"
                      size="sm"
                      onClick={() => setArchiveConfirm(true)}
                      disabled={updateMutation.isPending}
                    >
                      Archive
                    </Button>
                  ) : (
                    <Button
                      key={action}
                      size="sm"
                      onClick={() => transition(to)}
                      disabled={updateMutation.isPending}
                    >
                      {ACTION_LABELS[action] ?? humanizeStatus(action)}
                    </Button>
                  ),
                )}
              </div>
              <p className="text-xs text-ink-3">
                Status, assignment and due-date changes carry the optimistic-lock
                version and are audited.
              </p>
            </div>
          ) : (
            <p className="text-xs text-ink-3">
              Terminal state — the record is immutable.
            </p>
          )}
        </Can>

        {inlineError ? (
          <p role="alert" className="text-xs text-fail">
            {inlineError}
          </p>
        ) : null}

        {/* Resolution summary */}
        {violation.resolutionSummary ? (
          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-2">
              Resolution
            </h3>
            <p className="whitespace-pre-wrap rounded-md border border-border bg-surface-2/60 p-3 text-[13px] leading-relaxed text-ink">
              {violation.resolutionSummary}
            </p>
          </div>
        ) : null}

        {/* Linked remediation tasks */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-ink-2">
              Remediation tasks · {tasks?.length ?? 0}
            </h3>
            <Can perm="remediation:update">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCreateTaskOpen(true)}
                disabled={isViolationTerminal(status)}
              >
                Create task
              </Button>
            </Can>
          </div>
          {tasks && tasks.length > 0 ? (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-md border border-border bg-surface p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] font-medium text-ink">{task.taskTitle}</p>
                    <div className="flex items-center gap-1.5">
                      <StatusChip status={task.source} />
                      <StatusChip status={task.status} />
                    </div>
                  </div>
                  <MiniStepper status={task.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-md border border-dashed border-border p-3 text-xs text-ink-3">
              No remediation tasks yet — create one to start fixing this violation.
            </p>
          )}
        </div>

        {/* Trace footer */}
        <dl className="grid grid-cols-2 gap-2 text-xs text-ink-2">
          <div>
            <dt className="uppercase tracking-wider text-ink-3">Assignee</dt>
            <dd>{userById.get(violation.assignedTo ?? "") ?? "—"}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider text-ink-3">Due</dt>
            <dd>{violation.dueAt ? formatDate(violation.dueAt) : "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Close dialog — resolutionSummary required */}
      <Dialog
        open={closeDialog}
        onClose={() => setCloseDialog(false)}
        title="Close violation"
        description="Only a validated violation can close. The resolution summary becomes part of the audit trail."
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
              Close violation
            </Button>
          </>
        }
      >
        <Field
          label="Resolution summary"
          htmlFor="violation-close-summary"
          error={
            summary.trim().length === 0 && closeDialog
              ? "Required to close"
              : undefined
          }
        >
          <Textarea
            id="violation-close-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="How was the violation resolved and verified?"
          />
        </Field>
      </Dialog>

      {/* Archive confirm */}
      <Dialog
        open={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        title="Archive violation"
        description="Archiving is terminal and audited. The record stays searchable but no further action is possible."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setArchiveConfirm(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmArchive} disabled={updateMutation.isPending}>
              Archive violation
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">
          Are you sure this violation should be archived rather than worked to closure?
        </p>
      </Dialog>

      {/* 409 conflict (§7.6) */}
      <Dialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        title="Changed by someone else"
        description="This violation was updated in another session. Reload to see the latest state before retrying."
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

      {/* Create remediation task for this violation */}
      <CreateRemediationTaskDrawer
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        violationId={violation.id}
      />
    </Drawer>
  );
}

/** Compact 5-state stepper for tasks embedded in the violation drawer. */
function MiniStepper({ status }: { status: string }) {
  const chain = ["PENDING", "IN_PROGRESS", "PENDING_VERIFICATION", "VERIFIED", "CLOSED"];
  const cancelled = status === "CANCELLED";
  const index = chain.indexOf(status);
  return (
    <div className="mt-2 flex items-center gap-0" aria-label="Task lifecycle">
      {chain.map((step, i) => {
        const done = !cancelled && index >= i;
        const isLast = i === chain.length - 1;
        return (
          <div key={step} className="flex items-center">
            <span
              className={cn(
                "flex size-2 rounded-full",
                done ? "bg-pass" : "bg-border",
              )}
              aria-hidden
            />
            {!isLast ? <span className={cn("h-px w-4", done ? "bg-pass" : "bg-border")} aria-hidden /> : null}
          </div>
        );
      })}
      {cancelled ? (
        <span className="ml-2 inline-flex items-center gap-1 text-xs text-fail">
          <ShieldAlert className="size-3" aria-hidden />
          Cancelled
        </span>
      ) : null}
    </div>
  );
}
