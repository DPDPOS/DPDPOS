"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { ErrorState } from "@/components/ui/error-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/format";
import type { NoticeResponse } from "@/features/notices/types";
import { useCreateNotice, useDeleteNotice, useNotices } from "@/features/notices/hooks";
import {
  noticeFormSchema,
  NOTICE_CONTENT_MAX,
  type NoticeFormValues,
} from "@/features/notices/schemas";
import { useConsentRecords } from "@/features/consent/hooks";
import { cn } from "@/lib/utils/cn";

const PAGE_SIZE = 10;

export function NoticesView() {
  const notices = useNotices();
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<NoticeResponse | null>(null);
  const [deleting, setDeleting] = useState<NoticeResponse | null>(null);

  const columns: TableColumn<NoticeResponse>[] = [
    {
      key: "title",
      header: "Title",
      accessor: (row) => (
        <span className="block max-w-md truncate text-[13px] font-medium text-ink">
          {row.title}
        </span>
      ),
      sortValue: (row) => row.title,
      sortable: true,
    },
    {
      key: "version",
      header: "Version",
      accessor: (row) => (
        <span className="inline-flex items-center rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-ink-2">
          v{row.version}
        </span>
      ),
      sortValue: (row) => row.version,
      sortable: true,
    },
    {
      key: "effectiveFrom",
      header: "Effective from",
      accessor: (row) => (
        <span className="tabular text-[13px] text-ink-2">
          {row.effectiveFrom ? formatDate(row.effectiveFrom) : "—"}
        </span>
      ),
      sortValue: (row) => row.effectiveFrom ?? "",
      sortable: true,
      className: "hidden md:table-cell",
    },
    {
      key: "updatedAt",
      header: "Updated",
      accessor: (row) => (
        <span className="tabular text-xs text-ink-3">{formatDate(row.updatedAt)}</span>
      ),
      sortValue: (row) => row.updatedAt,
      sortable: true,
      className: "hidden lg:table-cell",
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">Operations · Transparency</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Notices
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            {notices.isLoading
              ? "Loading…"
              : `${notices.data?.length ?? 0} privacy notices`}
          </p>
        </div>
        <Can perm="notice:create">
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-3.5" aria-hidden />
            New notice
          </Button>
        </Can>
      </header>

      {notices.isError ? (
        <ErrorState
          title="Couldn't load notices"
          message={notices.error instanceof ApiError ? notices.error.message : undefined}
          retry={() => void notices.refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={notices.data ?? []}
          rowKey={(row) => row.id}
          loading={notices.isLoading}
          defaultPageSize={PAGE_SIZE}
          onRowClick={setDetail}
          emptyTitle="No privacy notices yet"
          emptyBody="Publish the first notice covering purpose, rights and contact details (DPDP Act s.5)."
          emptyAction={
            <Can perm="notice:create">
              <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
                <Plus className="size-3.5" aria-hidden />
                New notice
              </Button>
            </Can>
          }
          rowActions={(row) => (
            <div className="flex items-center justify-end gap-0.5">
              <button
                type="button"
                onClick={() => setDetail(row)}
                className="focus-ring rounded-sm p-1 text-ink-3 opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
                aria-label={`View ${row.title}`}
              >
                <Eye className="size-3.5" aria-hidden />
              </button>
              <Can perm="notice:delete">
                <button
                  type="button"
                  onClick={() => setDeleting(row)}
                  className="focus-ring rounded-sm p-1 text-ink-3 opacity-0 transition-opacity hover:bg-surface-2 hover:text-fail group-hover:opacity-100"
                  aria-label={`Delete ${row.title}`}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </Can>
            </div>
          )}
        />
      )}

      <CreateNoticeDrawer open={creating} onClose={() => setCreating(false)} />
      <NoticeDetailDrawer notice={detail} onClose={() => setDetail(null)} />
      <DeleteNoticeDialog notice={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

/* Create drawer --------------------------------------------------------------- */

function CreateNoticeDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const create = useCreateNotice();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeFormSchema),
    defaultValues: { title: "", content: "", effectiveFrom: "" },
  });
  const contentLength = ((useWatch({ control, name: "content" }) as string | undefined) ?? "").length;

  const submit = handleSubmit(async (values) => {
    await create.mutateAsync({
      title: values.title,
      content: values.content,
      effectiveFrom: values.effectiveFrom
        ? new Date(`${values.effectiveFrom}T00:00:00`).toISOString()
        : undefined,
    });
    onClose();
  });

  const nearLimit = contentLength > NOTICE_CONTENT_MAX * 0.9;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="New privacy notice"
      description="A versioned notice — publishing a new one starts at v1."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={create.isPending}>
            {create.isPending ? "Publishing…" : "Publish notice"}
          </Button>
        </>
      }
    >
      <form id="create-notice-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Title" htmlFor="n-title" error={errors.title?.message} hint="e.g. Privacy notice for customer data">
          <Input id="n-title" placeholder="Privacy notice for customer data" {...register("title")} />
        </Field>

        <Field label="Content" htmlFor="n-content" error={errors.content?.message}>
          <div className="relative">
            <textarea
              id="n-content"
              rows={12}
              className={cn(
                "w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-[13px] leading-relaxed text-ink outline-none transition-colors focus-ring placeholder:text-ink-3 hover:border-border-strong",
                "aria-[invalid=true]:border-fail",
              )}
              placeholder="What personal data we collect, why, and your rights…"
              aria-invalid={Boolean(errors.content)}
              {...register("content")}
            />
            <span
              className={cn(
                "absolute bottom-2 right-2.5 rounded-sm bg-surface/90 px-1.5 py-0.5 font-mono text-[11px] tabular",
                nearLimit ? "text-warn" : "text-ink-3",
              )}
            >
              {contentLength.toLocaleString()} / {NOTICE_CONTENT_MAX.toLocaleString()}
            </span>
          </div>
        </Field>

        <Field label="Effective from" htmlFor="n-effective" hint="Optional — when the notice takes effect.">
          <Input id="n-effective" type="date" {...register("effectiveFrom")} />
        </Field>

        {create.isError ? (
          <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
            {create.error instanceof ApiError ? create.error.message : "Publish failed."}
          </p>
        ) : null}
      </form>
    </Drawer>
  );
}

/* Detail drawer ---------------------------------------------------------------- */

function NoticeDetailDrawer({
  notice,
  onClose,
}: {
  notice: NoticeResponse | null;
  onClose: () => void;
}) {
  const linked = useConsentRecords({ noticeId: notice?.id }, !!notice);

  return (
    <Drawer
      open={!!notice}
      onClose={onClose}
      title={notice?.title ?? "Notice"}
      description={notice ? `v${notice.version} · ${formatDate(notice.updatedAt)}` : undefined}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      {notice ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-ink-2">
              v{notice.version}
            </span>
            <span className="text-xs text-ink-3">
              {notice.effectiveFrom
                ? `Effective ${formatDate(notice.effectiveFrom)}`
                : "No effective date set"}
            </span>
            {linked.data && linked.data.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-pass/20 bg-pass-bg px-1.5 py-0.5 text-xs font-medium text-pass">
                <span aria-hidden className="size-1.5 rounded-full bg-pass" />
                {linked.data.length} consent record{linked.data.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          <div className="max-h-[45vh] overflow-y-auto rounded-sm border border-border bg-surface-2 px-4 py-3">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
              {notice.content}
            </p>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}

/* Delete confirm ---------------------------------------------------------------- */

function DeleteNoticeDialog({
  notice,
  onClose,
}: {
  notice: NoticeResponse | null;
  onClose: () => void;
}) {
  const remove = useDeleteNotice();

  const submit = async () => {
    if (!notice) return;
    await remove.mutateAsync(notice.id);
    onClose();
  };

  return (
    <Dialog
      open={!!notice}
      onClose={onClose}
      title="Delete privacy notice?"
      description="This action can't be undone from this screen."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={remove.isPending} variant="danger">
            {remove.isPending ? "Deleting…" : "Delete notice"}
          </Button>
        </>
      }
    >
      {notice ? (
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-ink-2">
            <span className="font-medium text-ink">{notice.title}</span> (v
            {notice.version}) will be removed from the notice list.
          </p>
          <p className="flex items-start gap-2 rounded-sm border border-info/20 bg-info-bg/40 px-3 py-2 text-xs leading-relaxed text-ink-2">
            <Trash2 className="mt-0.5 size-3.5 shrink-0 text-info" aria-hidden />
            The notice is <span className="font-medium text-ink">soft-deleted</span> —
            consent records that reference it keep their version history.
          </p>
          {remove.isError ? (
            <p role="alert" className="rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
              {remove.error instanceof ApiError ? remove.error.message : "Delete failed."}
            </p>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
