"use client";

import { Check, Circle, ShieldAlert } from "lucide-react";
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
  RIGHTS_REQUEST_TYPE_LABELS,
  RIGHTS_STEP_CHAIN,
  isRightsTerminal,
  rightsActionsFor,
  type RightsRequestStatus,
} from "@/features/rights/types";
import { slaDueFor, slaProgress } from "@/features/rights/sla";
import {
  useRightsRequest,
  useUpdateRightsRequest,
} from "@/features/rights/hooks";
import { useUsers } from "@/features/users/hooks";
import { SlaTimer } from "./sla-timer";
import { ErasureEvidencePanel } from "./erasure-evidence-panel";

interface RequestDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  requestId: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  assign: "Assign",
  start: "Start",
  respond: "Respond",
  reject: "Reject",
  close: "Close",
};

export function RequestDetailDrawer({
  open,
  onClose,
  requestId,
}: RequestDetailDrawerProps) {
  const { data: request, isPending, isError, error, refetch } =
    useRightsRequest(requestId);
  const { data: users } = useUsers();

  const updateMutation = useUpdateRightsRequest();
  const [summaryDialog, setSummaryDialog] = useState<
    { to: RightsRequestStatus } | null
  >(null);
  const [summary, setSummary] = useState("");
  const [conflictOpen, setConflictOpen] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Kept mounted so the slide transition runs both ways (plan §4.2).
  if (!open) {
    return (
      <Drawer open={false} onClose={onClose} title="Request detail">
        {null}
      </Drawer>
    );
  }

  if (isPending) {
    return (
      <Drawer open onClose={onClose} title="Request detail">
        <div className="space-y-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Drawer>
    );
  }

  if (isError || !request) {
    return (
      <Drawer open onClose={onClose} title="Request detail">
        <ErrorState
          message={error instanceof ApiError ? error.message : "Could not load the request"}
          retry={() => void refetch()}
        />
      </Drawer>
    );
  }

  const status = request.status as RightsRequestStatus;
  const userById = new Map((users?.items ?? []).map((u) => [u.id, u.name]));
  const due = slaDueFor(request);
  const { pct } = slaProgress(request);

  const handleMutationError = (err: unknown) => {
    if (err instanceof ApiError && err.code === "CONFLICT") {
      setConflictOpen(true);
      return;
    }
    setInlineError(
      err instanceof ApiError ? err.message : "Something went wrong",
    );
  };

  const transition = (to: RightsRequestStatus, resolutionSummary?: string) => {
    setInlineError(null);
    updateMutation.mutate(
      {
        id: request.id,
        body: {
          version: request.version,
          status: to,
          ...(resolutionSummary !== undefined ? { resolutionSummary } : {}),
        },
      },
      { onError: handleMutationError },
    );
  };

  const assign = (assignedTo: string) => {
    setInlineError(null);
    updateMutation.mutate(
      {
        id: request.id,
        body: { version: request.version, assignedTo: assignedTo || null },
      },
      { onError: handleMutationError },
    );
  };

  const openSummaryDialog = (to: RightsRequestStatus) => {
    setSummary("");
    setSummaryDialog({ to });
  };

  const confirmSummary = () => {
    if (!summaryDialog) return;
    transition(summaryDialog.to, summary.trim());
    setSummaryDialog(null);
  };

  const currentIndex = RIGHTS_STEP_CHAIN.indexOf(status);
  const rejected = status === "REJECTED";

  return (
    <Drawer
      open
      onClose={onClose}
      title="Request detail"
      description="Data principal request"
    >
      <div className="space-y-6">
        {/* Identity bar */}
        <div className="space-y-1">
          <p className="font-mono text-sm text-ink">{request.requesterReference}</p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={request.requestType} />
            <StatusChip status={request.status} />
            <Badge variant="outline">v{request.version}</Badge>
          </div>
          <p className="text-xs text-ink-2">
            {RIGHTS_REQUEST_TYPE_LABELS[
              request.requestType as keyof typeof RIGHTS_REQUEST_TYPE_LABELS
            ] ?? humanizeStatus(request.requestType)}
          </p>
        </div>

        {/* SLA block */}
        <div className="rounded-md border border-border bg-surface-2/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-2">
              SLA window
            </span>
            <SlaTimer request={request} />
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-sm bg-surface">
            <div
              className={cn(
                "h-full transition-all",
                pct >= 1
                  ? "bg-fail"
                  : pct >= 0.75
                    ? "bg-warn"
                    : "bg-pass",
              )}
              style={{ width: `${Math.round(pct * 100)}%` }}
              aria-hidden
            />
          </div>
          <p className="mt-2 text-xs text-ink-2">
            Opened {formatDate(request.openedAt)} · Due {formatDate(due.toISOString())}
          </p>
        </div>

        {/* Stepper */}
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-2">
            Lifecycle
          </h3>
          <ol className="space-y-0">
            {RIGHTS_STEP_CHAIN.map((step, index) => {
              const done = !rejected && currentIndex >= index;
              const current = !rejected && currentIndex === index;
              const isLast = index === RIGHTS_STEP_CHAIN.length - 1;
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
                    {current ? (
                      <p className="text-xs text-ink-3">Current</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
            {rejected ? (
              <li className="relative flex gap-2.5">
                <span className="relative z-10 mt-0.5 flex size-2.5 items-center justify-center rounded-full border border-fail bg-fail">
                  <ShieldAlert className="size-2 text-white" aria-hidden />
                </span>
                <p className="text-[13px] font-medium text-fail">Rejected</p>
              </li>
            ) : null}
          </ol>
        </div>

        {/* Actions — gated on the exact current status (§10.4) */}
        <Can perm="rights_request:update">
          {!isRightsTerminal(status) ? (
            <div className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-ink-2">
                Actions
              </h3>
              {rightsActionsFor(status).some((a) => a.action === "assign") ? (
                <Field label="Assignee" htmlFor="rights-detail-assignee">
                  <Select
                    id="rights-detail-assignee"
                    value={request.assignedTo ?? ""}
                    onChange={(event) => assign(event.target.value)}
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
                {rightsActionsFor(status).map(({ action, to }) =>
                  action === "reject" ? (
                    <Button
                      key={action}
                      variant="danger"
                      size="sm"
                      onClick={() => openSummaryDialog(to)}
                      disabled={updateMutation.isPending}
                    >
                      Reject
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
            </div>
          ) : (
            <p className="text-xs text-ink-3">
              Terminal state — no further actions.
            </p>
          )}
        </Can>

        {inlineError ? (
          <p role="alert" className="text-xs text-fail">
            {inlineError}
          </p>
        ) : null}

        {/* Resolution summary */}
        {request.resolutionSummary ? (
          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-2">
              Resolution
            </h3>
            <p className="whitespace-pre-wrap rounded-md border border-border bg-surface-2/60 p-3 text-[13px] leading-relaxed text-ink">
              {request.resolutionSummary}
            </p>
          </div>
        ) : null}

        <ErasureEvidencePanel
          requestId={request.id}
          requestType={request.requestType}
        />

        {/* Assignee / timestamps */}
        <dl className="grid grid-cols-2 gap-2 text-xs text-ink-2">
          <div>
            <dt className="uppercase tracking-wider text-ink-3">Assignee</dt>
            <dd>{userById.get(request.assignedTo ?? "") ?? "—"}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wider text-ink-3">Updated</dt>
            <dd>{formatDateTime(request.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Reject/close summary dialog */}
      <Dialog
        open={summaryDialog !== null}
        onClose={() => setSummaryDialog(null)}
        title={
          summaryDialog?.to === "REJECTED" ? "Reject request" : "Close request"
        }
        description={
          summaryDialog?.to === "REJECTED"
            ? "Record why the request is rejected — the principal is entitled to a clear reason."
            : "Closing requires a logged resolution — this becomes part of the audit trail."
        }
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSummaryDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant={summaryDialog?.to === "REJECTED" ? "danger" : "primary"}
              size="sm"
              onClick={confirmSummary}
              disabled={summary.trim().length === 0 || updateMutation.isPending}
            >
              {summaryDialog?.to === "REJECTED" ? "Reject request" : "Close request"}
            </Button>
          </>
        }
      >
        <Field
          label="Resolution summary"
          htmlFor="rights-resolution-summary"
          error={
            summary.trim().length === 0 && summaryDialog
              ? "Required to reject or close"
              : undefined
          }
        >
          <Textarea
            id="rights-resolution-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="What was the outcome and why?"
          />
        </Field>
      </Dialog>

      {/* 409 conflict (§7.6) */}
      <Dialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        title="Changed by someone else"
        description="This request was updated in another session. Reload to see the latest state before retrying."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConflictOpen(false)}
            >
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
