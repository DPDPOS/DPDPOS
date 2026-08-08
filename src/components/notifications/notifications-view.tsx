"use client";

import { CheckCheck, Mail, MailOpen, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { StatusChip } from "@/components/ui/status-chip";
import { humanizeStatus } from "@/lib/constants/status-maps";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { NOTIFICATION_STATUSES, type NotificationRecord } from "@/features/notifications/types";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsPage,
} from "@/features/notifications/hooks";
import { PreferencesPanel } from "./preferences-panel";

const PAGE_SIZE = 10;

/** Deep-link a related record when the entity maps to a frontend route. */
function relatedHref(type: string | null): string | null {
  if (!type) return null;
  const map: Record<string, string> = {
    VIOLATION: "/violations",
    REMEDIATION_TASK: "/remediation",
    EVIDENCE: "/evidence",
    CONSENT_RECORD: "/consent",
    NOTICE: "/notices",
    REPORT: "/reports",
    VALIDATION_RUN: "/validations",
  };
  return map[type] ?? null;
}

export function NotificationsView() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [prefsOpen, setPrefsOpen] = useState(false);

  const { data, isPending, isError, error, refetch } = useNotificationsPage(page, PAGE_SIZE, {
    status: (status || undefined) as "PENDING" | "SENT" | "FAILED" | "READ" | undefined,
  });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const columns: TableColumn<NotificationRecord>[] = [
    {
      key: "subject",
      header: "Notification",
      accessor: (row) => (
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-[13px]",
              row.status === "READ" ? "font-normal text-ink-2" : "font-medium text-ink",
            )}
          >
            {row.subject}
          </p>
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-3">{row.body}</p>
        </div>
      ),
      sortValue: (row) => row.subject,
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      accessor: (row) => (
        <Badge variant="outline" className="font-mono text-[10px]">
          {humanizeStatus(row.notificationType)}
        </Badge>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      accessor: (row) => (
        <span className="font-mono text-[11px] text-ink-2">{row.channel}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => <StatusChip status={row.status} />,
    },
    {
      key: "createdAt",
      header: "Received",
      align: "right",
      accessor: (row) => (
        <span className="tabular text-[13px] text-ink-2">{formatDateTime(row.createdAt)}</span>
      ),
      sortValue: (row) => row.createdAt,
      sortable: true,
    },
  ];

  const unreadCount = (data?.items ?? []).filter((row) => row.status !== "READ").length;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Notifications</h1>
          <p className="mt-0.5 text-[13px] text-ink-2">
            Alerts from the compliance engine — violations, evidence approvals,
            validation failures and SLA warnings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Can perm="notification:update_preferences">
            <Button size="sm" variant="secondary" onClick={() => setPrefsOpen(true)}>
              <SlidersHorizontal className="size-3.5" aria-hidden />
              Preferences
            </Button>
          </Can>
          <Button
            size="sm"
            variant="ghost"
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="size-3.5" aria-hidden />
            Mark all read
          </Button>
        </div>
      </header>

      {/* Status filter chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterChip label="All" active={status === ""} onClick={() => setStatus("")} />
        {NOTIFICATION_STATUSES.map((option) => (
          <FilterChip
            key={option}
            label={humanizeStatus(option)}
            active={status === option}
            onClick={() => setStatus(option)}
          />
        ))}
      </div>

      {isError ? (
        <ErrorState
          message={error instanceof ApiError ? error.message : "Could not load notifications"}
          retry={() => void refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(row) => row.id}
          loading={isPending}
          pagination={{
            page: data?.meta.page ?? page,
            pageSize: PAGE_SIZE,
            total: data?.meta.total ?? 0,
            totalPages: data?.meta.totalPages ?? 1,
            onPageChange: setPage,
          }}
          emptyTitle="No notifications"
          emptyBody="Events from the engine will land here — violations, approvals and SLA warnings."
          rowActions={(row) => {
            const href = relatedHref(row.relatedEntityType);
            return (
              <div className="flex items-center justify-end gap-1">
                {href && row.relatedEntityId ? (
                  <Link
                    href={href}
                    className="focus-ring rounded-sm px-1.5 py-1 text-xs text-accent transition-colors hover:underline"
                  >
                    View related
                  </Link>
                ) : null}
                {row.status === "READ" ? (
                  <span title="Read">
                    <MailOpen className="size-3.5 text-ink-3" aria-hidden />
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markRead.mutate(row.id)}
                    disabled={markRead.isPending}
                  >
                    <Mail className="size-3.5" aria-hidden />
                    Mark read
                  </Button>
                )}
              </div>
            );
          }}
        />
      )}

      <PreferencesPanel open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring rounded-full border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-accent/40 bg-accent-soft text-accent"
          : "border-border bg-surface text-ink-2 hover:border-border-strong hover:text-ink",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
