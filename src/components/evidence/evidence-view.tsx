"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Download,
  FileUp,
  Lock,
  LockKeyhole,
  PackageOpen,
  Paperclip,
  Send,
  Tag,
  Unlock,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { evidenceApi } from "@/features/evidence/api";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useControls } from "@/features/controls/hooks";
import { useUsers } from "@/features/users/hooks";
import { formatFileSize, sha256Hex } from "@/features/evidence/hash";
import {
  EVIDENCE_STATUS_LABELS,
  EVIDENCE_STATES,
  type EvidenceFileRecord,
  type EvidenceStatus,
} from "@/features/evidence/types";
import {
  evidenceUploadSchema,
  evidenceTagSchema,
  parseTags,
  type EvidenceTagFormValues,
  type EvidenceUploadFormValues,
} from "@/features/evidence/schemas";
import {
  useApproveEvidence,
  useConfirmUpload,
  useEvidenceItem,
  useEvidenceList,
  useExportEvidence,
  useInitiateUpload,
  useLockEvidence,
  useMapEvidence,
  useSubmitForReview,
  useTagEvidence,
} from "@/features/evidence/hooks";

type StatusFilter = "ALL" | EvidenceStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  ...EVIDENCE_STATES.map((state) => ({
    value: state as StatusFilter,
    label: EVIDENCE_STATUS_LABELS[state],
  })),
];

const PAGE_SIZE = 10;

/** Resolve a user id to a display name (fallback: short id). */
function userName(
  users: Map<string, { name: string }> | undefined,
  id: string | null,
): string {
  if (!id) return "—";
  return users?.get(id)?.name ?? id.slice(0, 8);
}

export function EvidenceView() {
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ jobId: string } | null>(null);

  const list = useEvidenceList(
    {
      ...(filter !== "ALL" ? { status: filter } : {}),
      page,
      pageSize: PAGE_SIZE,
    },
    true,
  );
  const users = useUsers();

  const userById = useMemo(
    () => new Map((users.data?.items ?? []).map((user) => [user.id, user])),
    [users.data],
  );
  const userNameFor = (id: string | null) => userName(userById, id);

  const columns: TableColumn<EvidenceFileRecord>[] = [
    {
      key: "fileName",
      header: "File",
      accessor: (row) => (
        <span className="flex max-w-[240px] flex-col">
          <span className="flex items-center gap-1.5 truncate font-mono text-xs font-medium text-accent">
            <Paperclip className="size-3 shrink-0 text-ink-3" aria-hidden />
            <span className="truncate">{row.fileName}</span>
          </span>
          <span className="text-[11px] text-ink-3">
            {row.mimeType} · {formatFileSize(row.fileSizeBytes)}
          </span>
        </span>
      ),
      sortValue: (row) => row.fileName,
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => <StatusChip status={row.status} />,
      sortValue: (row) => row.status,
      sortable: true,
    },
    {
      key: "tags",
      header: "Tags",
      accessor: (row) =>
        row.tags.length ? (
          <span className="flex max-w-[200px] flex-wrap gap-1">
            {row.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
            {row.tags.length > 3 ? (
              <Badge>+{row.tags.length - 3}</Badge>
            ) : null}
          </span>
        ) : (
          <span className="text-xs text-ink-3">—</span>
        ),
      sortValue: (row) => row.tags.join(","),
      sortable: true,
      className: "hidden lg:table-cell",
    },
    {
      key: "control",
      header: "Control",
      accessor: (row) => (
        <span className="font-mono text-xs text-ink-2">
          {row.controlId
            ? controlCode(row.controlId)?.code ?? row.controlId.slice(0, 8)
            : "—"}
        </span>
      ),
      sortValue: (row) => row.controlId ?? "",
      sortable: true,
      className: "hidden xl:table-cell",
    },
    {
      key: "uploadedAt",
      header: "Uploaded",
      accessor: (row) => (
        <span className="tabular text-xs text-ink-2">
          {formatDate(row.createdAt)}
        </span>
      ),
      sortValue: (row) => row.createdAt,
      sortable: true,
      className: "hidden md:table-cell",
    },
    {
      key: "uploadedBy",
      header: "By",
      accessor: (row) => (
        <span className="block max-w-[110px] truncate text-xs text-ink-2">
          {userNameFor(row.uploadedBy)}
        </span>
      ),
      sortValue: (row) => row.uploadedBy ?? "",
      sortable: true,
      className: "hidden md:table-cell",
    },
  ];

  /** Control code lookup — lazily loaded from the controls query. */
  function controlCode(controlId: string) {
    return controls.data?.items.find((control) => control.id === controlId);
  }

  const controls = useControls({ page: 1, pageSize: 100 });
  const exportMutation = useExportEvidence();

  const exportPack = async () => {
    try {
      const result = await exportMutation.mutateAsync({
        ...(filter !== "ALL" ? { status: filter } : {}),
      });
      setExportResult(result);
    } catch {
      // error surface handled by the dialog
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">Proof · Vault</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Evidence
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            {list.isLoading
              ? "Loading…"
              : filter === "ALL"
                ? `${list.data?.meta.total ?? 0} files in the vault`
                : `${list.data?.meta.total ?? 0} files · ${EVIDENCE_STATUS_LABELS[filter as EvidenceStatus]}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Can perm="evidence:export">
            <Button
              variant="secondary"
              onClick={() => setExporting(true)}
              disabled={exportMutation.isPending}
            >
              <PackageOpen className="size-3.5" aria-hidden />
              Export pack
            </Button>
          </Can>
          <Can perm="evidence:create">
            <Button onClick={() => setUploading(true)}>
              <FileUp className="size-3.5" aria-hidden />
              Upload evidence
            </Button>
          </Can>
        </div>
      </header>

      {/* Status filter chips ------------------------------------------------ */}
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Filter by evidence status"
      >
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={filter === item.value}
            onClick={() => {
              setFilter(item.value);
              setPage(1);
            }}
            className={cn(
              "focus-ring rounded-sm border px-2.5 py-1 text-[13px] font-medium transition-colors",
              filter === item.value
                ? "border-accent/40 bg-accent-soft text-accent"
                : "border-border bg-surface text-ink-2 hover:border-border-strong hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {list.isError ? (
        <ErrorState
          title="Couldn't load the evidence vault"
          message={list.error instanceof ApiError ? list.error.message : undefined}
          retry={() => void list.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={list.data?.items ?? []}
          rowKey={(row) => row.id}
          loading={list.isLoading}
          pagination={{
            page: list.data?.meta.page ?? page,
            pageSize: PAGE_SIZE,
            total: list.data?.meta.total ?? 0,
            totalPages: list.data?.meta.totalPages ?? 1,
            onPageChange: setPage,
          }}
          onRowClick={(row) => setDetailId(row.id)}
          emptyTitle="No evidence files yet"
          emptyBody="The vault starts empty — upload the first proof of a control in action."
          emptyAction={
            <Can perm="evidence:create">
              <Button size="sm" onClick={() => setUploading(true)}>
                <FileUp className="size-3.5" aria-hidden />
                Upload evidence
              </Button>
            </Can>
          }
        />
      )}

      <UploadEvidenceDrawer open={uploading} onClose={() => setUploading(false)} />
      <EvidenceDetailDrawer
        id={detailId}
        onClose={() => setDetailId(null)}
        userName={userNameFor}
      />
      <ExportEvidenceDialog
        open={exporting}
        onClose={() => {
          setExporting(false);
          setExportResult(null);
        }}
        onConfirm={exportPack}
        pending={exportMutation.isPending}
        error={exportMutation.error}
        result={exportResult}
        filter={filter}
      />
    </div>
  );
}

/* Upload drawer — the presigned pipeline (§10.2) ----------------------------- */

type UploadStep = "idle" | "initiating" | "putting" | "confirming";

function UploadEvidenceDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const initiate = useInitiateUpload();
  const confirm = useConfirmUpload();
  const controls = useControls({ page: 1, pageSize: 100 });

  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep>("idle");
  const [stepError, setStepError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EvidenceUploadFormValues>({
    resolver: zodResolver(evidenceUploadSchema),
    defaultValues: { description: "", controlId: "", tagsInput: "" },
  });

  const busy = step !== "idle";

  const submit = handleSubmit(async (values) => {
    if (!file) {
      setStepError("Pick a file first.");
      return;
    }
    setStepError(null);
    try {
      setStep("initiating");
      const { evidence, uploadUrl } = await initiate.mutateAsync({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        description: values.description?.trim() || undefined,
        controlId: values.controlId || undefined,
        tags: parseTags(values.tagsInput),
      });

      setStep("putting");
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error(`Upload to storage failed (HTTP ${put.status})`);

      setStep("confirming");
      const hash = await sha256Hex(file);
      await confirm.mutateAsync({
        id: evidence.id,
        fileHash: hash,
        fileSizeBytes: file.size,
      });

      // Close through the raw prop — the user-initiated close handler below
      // guards on step state, which would still read the in-flight step here.
      setStep("idle");
      reset();
      setFile(null);
      onClose();
    } catch (error) {
      setStep("idle");
      setStepError(
        error instanceof Error ? error.message : "Upload failed — try again.",
      );
    }
  });

  return (
    <Drawer
      open={open}
      // User-initiated closes (overlay, X, Escape) are blocked mid-upload so
      // a half-sent record never looks finished; the success path calls the
      // raw onClose above.
      onClose={() => {
        if (step === "idle") onClose();
      }}
      title="Upload evidence"
      description="Initiate a presigned upload, send the object, and confirm its hash."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy || !file}>
            {step === "initiating"
              ? "Initiating…"
              : step === "putting"
                ? "Uploading…"
                : step === "confirming"
                  ? "Verifying hash…"
                  : "Upload file"}
          </Button>
        </>
      }
    >
      <form id="evidence-upload-form" onSubmit={submit} noValidate className="space-y-4">
        <Field
          label="File"
          htmlFor="ev-file"
          hint="PDFs, spreadsheets, screenshots — anything you can point at as proof."
          error={stepError ?? undefined}
        >
          <label
            htmlFor="ev-file"
            className={cn(
              "flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed transition-colors",
              file
                ? "border-pass/40 bg-pass-bg/30"
                : "border-border-strong bg-surface hover:border-accent/50",
            )}
          >
            <FileUp className="size-5 text-ink-3" aria-hidden />
            {file ? (
              <span className="max-w-full truncate px-3 font-mono text-xs font-medium text-ink">
                {file.name}
              </span>
            ) : (
              <span className="text-xs text-ink-2">Click to choose a file</span>
            )}
          </label>
          <input
            id="ev-file"
            type="file"
            className="sr-only"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setStepError(null);
            }}
          />
        </Field>

        <Field label="Description" htmlFor="ev-desc" error={errors.description?.message}>
          <Input
            id="ev-desc"
            placeholder="What does this prove? (e.g. DPO appointment letter)"
            {...register("description")}
          />
        </Field>

        <Field label="Control" htmlFor="ev-control" hint="Optional — or map later.">
          <Controller
            control={control}
            name="controlId"
            render={({ field }) => (
              <Select
                id="ev-control"
                value={field.value ?? ""}
                onChange={(event) => field.onChange(event.target.value || undefined)}
                aria-label="Control"
              >
                <option value="">No control</option>
                {controls.data?.items.map((control) => (
                  <option key={control.id} value={control.id}>
                    {control.code} · {control.title}
                  </option>
                ))}
              </Select>
            )}
          />
        </Field>

        <Field
          label="Tags"
          htmlFor="ev-tags"
          hint="Comma-separated, e.g. audit, q3"
          error={errors.tagsInput?.message}
        >
          <Input id="ev-tags" placeholder="pen-test, dpo, board" {...register("tagsInput")} />
        </Field>
      </form>
    </Drawer>
  );
}

/* Detail drawer — identity, lifecycle stepper, actions, trace ----------------- */

function EvidenceDetailDrawer({
  id,
  onClose,
  userName,
}: {
  id: string | null;
  onClose: () => void;
  userName: (userId: string | null) => string;
}) {
  const detail = useEvidenceItem(id);
  const record = detail.data;
  const controls = useControls({ page: 1, pageSize: 100 });
  const reviewMutation = useSubmitForReview();
  const approveMutation = useApproveEvidence();
  const lockMutation = useLockEvidence();

  const [tagging, setTagging] = useState(false);
  const [mapping, setMapping] = useState(false);
  const [confirming, setConfirming] = useState<"approve" | "lock" | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!record) return null;

  const control = record.controlId
    ? controls.data?.items.find((item) => item.id === record.controlId)
    : undefined;

  const download = async () => {
    setDownloadError(null);
    try {
      const { downloadUrl } = await evidenceDownload(record.id);
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Download failed.");
    }
  };

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      title={record.fileName}
      description={`${record.mimeType} · ${formatFileSize(record.fileSizeBytes)} · ${EVIDENCE_STATUS_LABELS[record.status]}`}
      className="sm:max-w-xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Can perm="evidence:read">
              <Button variant="secondary" onClick={() => void download()}>
                <Download className="size-3.5" aria-hidden />
                Download
              </Button>
            </Can>
            {record.status === "UPLOADED" ? (
              <Can perm="evidence:create">
                <Button variant="secondary" onClick={() => setTagging(true)}>
                  <Tag className="size-3.5" aria-hidden />
                  Add tags
                </Button>
              </Can>
            ) : null}
            {/* Map is offered from UPLOADED or TAGGED — the two states that may
                reach MAPPED — and only while no control is attached. */}
            {(record.status === "UPLOADED" || record.status === "TAGGED") &&
            !record.controlId ? (
              <Can perm="evidence:create">
                <Button variant="secondary" onClick={() => setMapping(true)}>
                  Map to control
                </Button>
              </Can>
            ) : null}
            {/* Submit review from UPLOADED (skips tagging/mapping) or MAPPED. */}
            {record.status === "UPLOADED" || record.status === "MAPPED" ? (
              <Can perm="evidence:create">
                <Button
                  variant="secondary"
                  onClick={() => void reviewMutation.mutateAsync(record.id)}
                  disabled={reviewMutation.isPending}
                >
                  <Send className="size-3.5" aria-hidden />
                  Submit for review
                </Button>
              </Can>
            ) : null}
            {record.status === "UNDER_REVIEW" ? (
              <Can perm="evidence:approve">
                <Button variant="secondary" onClick={() => setConfirming("approve")}>
                  <Check className="size-3.5" aria-hidden />
                  Approve
                </Button>
              </Can>
            ) : null}
            {record.status === "APPROVED" ? (
              <Can perm="evidence:approve">
                <Button variant="secondary" onClick={() => setConfirming("lock")}>
                  <LockKeyhole className="size-3.5" aria-hidden />
                  Lock
                </Button>
              </Can>
            ) : null}
          </div>
        </>
      }
    >
      <div className="space-y-5">
        {downloadError ? (
          <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
            {downloadError}
          </p>
        ) : null}

        {/* Lifecycle stepper ---------------------------------------------- */}
        <section aria-label="Evidence lifecycle">
          <p className="micro-label mb-2">Lifecycle</p>
          <ol className="space-y-0">
            {EVIDENCE_STATES.map((state, index) => {
              const reached = EVIDENCE_STATES.indexOf(record.status) >= index;
              const current = record.status === state;
              const locked = state === "LOCKED";
              return (
                <li key={state} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full border font-mono text-[10px]",
                        current
                          ? "border-accent bg-accent-soft text-accent"
                          : reached
                            ? "border-pass/30 bg-pass-bg text-pass"
                            : "border-border bg-surface text-ink-3",
                      )}
                    >
                      {reached && !current ? (
                        <Check className="size-3" aria-hidden />
                      ) : locked && current ? (
                        <Lock className="size-3" aria-hidden />
                      ) : (
                        index + 1
                      )}
                    </span>
                    {index < EVIDENCE_STATES.length - 1 ? (
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1 h-4 w-px",
                          reached ? "bg-pass/30" : "bg-border",
                        )}
                      />
                    ) : null}
                  </div>
                  <div className={cn("pb-3.5 pt-0.5", current ? "text-ink" : "text-ink-3")}>
                    <p className="text-[13px] font-medium">
                      {EVIDENCE_STATUS_LABELS[state]}
                      {current ? (
                        <span className="ml-2 rounded-sm border border-accent/30 bg-accent-soft px-1 py-px font-mono text-[10px] uppercase text-accent">
                          Current
                        </span>
                      ) : null}
                    </p>
                    {state === "LOCKED" ? (
                      <p className="mt-0.5 text-xs text-ink-3">
                        Terminal — locked files are immutable evidence.
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Metadata --------------------------------------------------------- */}
        <section aria-label="Evidence metadata" className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
          <Meta label="Control" value={control ? `${control.code} · ${control.title}` : "—"} mono={!!control} />
          <Meta label="File hash" value={record.fileHash ? record.fileHash.slice(0, 16) : "Not confirmed"} mono />
          <Meta label="Uploaded by" value={userName(record.uploadedBy)} />
          <Meta label="Uploaded at" value={formatDate(record.createdAt)} />
          <Meta label="Reviewed by" value={userName(record.reviewedBy)} />
          <Meta label="Approved by" value={userName(record.approvedBy)} />
          <Meta label="Locked at" value={record.lockedAt ? formatDate(record.lockedAt) : "—"} />
          <Meta
            label="Tags"
            value={record.tags.length ? record.tags.join(", ") : "—"}
          />
        </section>

        {/* Trace footer ------------------------------------------------------ */}
        <p className="border-t border-border pt-3 font-mono text-[11px] leading-relaxed text-ink-3">
          {record.id.slice(0, 8)} · updated {formatDate(record.updatedAt)}
          {record.expiresAt ? ` · url expires ${formatDate(record.expiresAt)}` : ""}
        </p>
      </div>

      {/* Nested editors ----------------------------------------------------- */}
      <TagEvidenceDialog
        record={record}
        open={tagging}
        onClose={() => setTagging(false)}
      />
      <MapToControlDialog
        record={record}
        open={mapping}
        onClose={() => setMapping(false)}
      />
      <ConfirmActionDialog
        action={confirming}
        record={record}
        onClose={() => setConfirming(null)}
        approvePending={approveMutation.isPending}
        lockPending={lockMutation.isPending}
        onApprove={async () => {
          await approveMutation.mutateAsync(record.id);
        }}
        onLock={async () => {
          await lockMutation.mutateAsync(record.id);
        }}
        error={approveMutation.error ?? lockMutation.error}
      />
    </Drawer>
  );
}

async function evidenceDownload(id: string) {
  return evidenceApi.download(id);
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="micro-label text-ink-3">{label}</p>
      <p
        className={cn(
          "mt-0.5 truncate text-[13px] text-ink",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* Tag editor ----------------------------------------------------------------- */

function TagEvidenceDialog({
  record,
  open,
  onClose,
}: {
  record: EvidenceFileRecord;
  open: boolean;
  onClose: () => void;
}) {
  const tagMutation = useTagEvidence();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EvidenceTagFormValues>({
    resolver: zodResolver(evidenceTagSchema),
    defaultValues: {
      tagsInput: record.tags.join(", "),
      description: record.description ?? "",
    },
  });

  const submit = handleSubmit(async (values) => {
    await tagMutation.mutateAsync({
      id: record.id,
      tags: parseTags(values.tagsInput),
      description: values.description || undefined,
    });
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Tag evidence"
      description="Labels make the vault searchable — they replace the current set."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={tagMutation.isPending}>
            {tagMutation.isPending ? "Saving…" : "Save tags"}
          </Button>
        </>
      }
    >
      <form id="tag-evidence-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Tags" htmlFor="tag-input" error={errors.tagsInput?.message}>
          <Input id="tag-input" placeholder="audit, q3, dpo" {...register("tagsInput")} />
        </Field>
        <Field label="Description" htmlFor="tag-desc" error={errors.description?.message}>
          <Input id="tag-desc" placeholder="What does this prove?" {...register("description")} />
        </Field>
        {tagMutation.isError ? (
          <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
            {tagMutation.error instanceof ApiError
              ? tagMutation.error.message
              : "Could not save tags."}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}

/* Map to control -------------------------------------------------------------- */

function MapToControlDialog({
  record,
  open,
  onClose,
}: {
  record: EvidenceFileRecord;
  open: boolean;
  onClose: () => void;
}) {
  const mapMutation = useMapEvidence();
  const controls = useControls({ page: 1, pageSize: 100 });
  const [controlId, setControlId] = useState(record.controlId ?? "");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Map to control"
      description="Linking the file gives the control evidence coverage in the register."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              void mapMutation
                .mutateAsync({ id: record.id, controlId })
                .then(onClose)
            }
            disabled={mapMutation.isPending || !controlId}
          >
            {mapMutation.isPending ? "Mapping…" : "Map file"}
          </Button>
        </>
      }
    >
      <Field label="Control" htmlFor="map-control">
        <Select
          id="map-control"
          value={controlId}
          onChange={(event) => setControlId(event.target.value)}
        >
          <option value="">Select a control…</option>
          {controls.data?.items.map((control) => (
            <option key={control.id} value={control.id}>
              {control.code} · {control.title}
            </option>
          ))}
        </Select>
      </Field>
      {mapMutation.isError ? (
        <p role="alert" className="mt-3 rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
          {mapMutation.error instanceof ApiError
            ? mapMutation.error.message
            : "Could not map the file."}
        </p>
      ) : null}
    </Dialog>
  );
}

/* Audited confirm — approve / lock -------------------------------------------- */

function ConfirmActionDialog({
  action,
  record,
  onClose,
  approvePending,
  lockPending,
  onApprove,
  onLock,
  error,
}: {
  action: "approve" | "lock" | null;
  record: EvidenceFileRecord;
  onClose: () => void;
  approvePending: boolean;
  lockPending: boolean;
  onApprove: () => Promise<void>;
  onLock: () => Promise<void>;
  error: unknown;
}) {
  if (!action) return null;
  const isLock = action === "lock";
  return (
    <Dialog
      open={!!action}
      onClose={onClose}
      title={isLock ? "Lock this evidence?" : "Approve this evidence?"}
      description={
        isLock
          ? "Locked files are immutable — the state machine stops here."
          : "Approval marks the file as accepted evidence."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              try {
                if (isLock) await onLock();
                else await onApprove();
                onClose();
              } catch {
                // Failure keeps the dialog open — the error prop renders it.
              }
            }}
            disabled={approvePending || lockPending}
          >
            {(isLock ? lockPending : approvePending)
              ? "Confirming…"
              : isLock
                ? "Lock evidence"
                : "Approve evidence"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-ink-2">
          <span className="font-medium text-ink">{record.fileName}</span> will be{" "}
          <span className="font-medium text-ink">{isLock ? "locked" : "approved"}</span>.
          This action is audited and timestamped — it cannot be undone from this screen.
        </p>
        {error ? (
          <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
            {error instanceof ApiError ? error.message : "The action failed."}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

/* Export pack ---------------------------------------------------------------- */

function ExportEvidenceDialog({
  open,
  onClose,
  onConfirm,
  pending,
  error,
  result,
  filter,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
  error: unknown;
  result: { jobId: string } | null;
  filter: StatusFilter;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Export evidence pack"
      description="Queue a zip of every file matching the current filter."
      footer={
        result ? (
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => void onConfirm()} disabled={pending}>
              {pending ? "Queuing…" : "Start export"}
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-sm border border-pass/20 bg-pass-bg/40 px-3 py-2 text-[13px] leading-relaxed text-ink-2">
            <Unlock className="mt-0.5 size-3.5 shrink-0 text-pass" aria-hidden />
            Export job{" "}
            <span className="font-mono text-ink">{result.jobId}</span> is queued.
            The worker assembles the pack asynchronously — completed exports
            surface in the report center.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-ink-2">
          {filter !== "ALL" ? (
            <>
              Only files in{" "}
              <span className="font-medium text-ink">
                {EVIDENCE_STATUS_LABELS[filter as EvidenceStatus]}
              </span>{" "}
              status are included.
            </>
          ) : (
            <>Every file in the vault is included.</>
          )}
          </p>
          <p className="rounded-sm border border-warn/20 bg-warn-bg/40 px-3 py-2 text-xs leading-relaxed text-ink-2">
            This action is audited. The export API returns a job id — there is
            no status endpoint, so completion is tracked through the report center.
          </p>
          {error ? (
            <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
              {error instanceof ApiError ? error.message : "Export failed."}
            </p>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}
