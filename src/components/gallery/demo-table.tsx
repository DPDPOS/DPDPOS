"use client";

import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { StatusChip } from "@/components/ui/status-chip";

interface DemoRow {
  code: string;
  title: string;
  status: string;
  owner: string;
  due: string;
  version: number;
}

const ROWS: DemoRow[] = [
  { code: "CTRL-NOTICE", title: "Privacy notice program", status: "VERIFIED", owner: "Asha Rao", due: "2026-03-12", version: 2 },
  { code: "CTRL-CONSENT", title: "Consent management", status: "IMPLEMENTED", owner: "Rohan Menon", due: "2026-03-27", version: 2 },
  { code: "CTRL-PURPOSE", title: "Purpose limitation controls", status: "IN_PROGRESS", owner: "Priya Nair", due: "2026-03-12", version: 1 },
  { code: "CTRL-INVENTORY", title: "Personal data inventory", status: "IN_PROGRESS", owner: "Dev Sharma", due: "2026-04-11", version: 1 },
  { code: "CTRL-SECURITY", title: "Security safeguards", status: "NOT_STARTED", owner: "Asha Rao", due: "2026-04-11", version: 1 },
  { code: "CTRL-RETENTION", title: "Retention and erasure", status: "NOT_STARTED", owner: "—", due: "2026-04-26", version: 1 },
  { code: "CTRL-RIGHTS", title: "Data principal rights desk", status: "IMPLEMENTED", owner: "Priya Nair", due: "2026-03-27", version: 2 },
  { code: "CTRL-TRAINING", title: "Privacy awareness training", status: "NOT_STARTED", owner: "Dev Sharma", due: "2026-05-01", version: 1 },
  { code: "CTRL-PROCESSOR", title: "Processor oversight", status: "IN_PROGRESS", owner: "Rohan Menon", due: "2026-04-11", version: 1 },
  { code: "CTRL-TRANSFER", title: "Cross-border transfer governance", status: "NOT_STARTED", owner: "—", due: "2026-05-01", version: 1 },
];

const columns: TableColumn<DemoRow>[] = [
  {
    key: "code",
    header: "Code",
    sortable: true,
    sortValue: (row) => row.code,
    accessor: (row) => <span className="font-mono text-[13px]">{row.code}</span>,
  },
  {
    key: "title",
    header: "Control",
    sortable: true,
    sortValue: (row) => row.title,
    accessor: (row) => <span className="font-medium text-ink">{row.title}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    sortValue: (row) => row.status,
    accessor: (row) => <StatusChip status={row.status} />,
  },
  {
    key: "owner",
    header: "Owner",
    sortable: true,
    sortValue: (row) => row.owner,
    accessor: (row) => row.owner,
  },
  {
    key: "due",
    header: "Due",
    align: "right",
    sortable: true,
    sortValue: (row) => row.due,
    accessor: (row) => <span className="tabular text-ink-2">{row.due}</span>,
  },
  {
    key: "version",
    header: "Ver",
    align: "right",
    sortable: true,
    sortValue: (row) => row.version,
    accessor: (row) => <span className="font-mono text-[13px] text-ink-2">v{row.version}</span>,
  },
];

export function DemoTable() {
  const [isEmpty, setIsEmpty] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-2">
          Sample register of generated controls — sortable, paginated (5/page),
          with row actions and an empty-state toggle.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsEmpty((value) => !value)}
        >
          {isEmpty ? "Show rows" : "Toggle empty state"}
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={isEmpty ? [] : ROWS}
        rowKey={(row) => row.code}
        defaultPageSize={5}
        emptyTitle="No controls yet"
        emptyBody="Controls are generated when you build your framework from a compliance profile — then you assign owners and due dates."
        emptyAction={
          <Button size="sm">
            <Plus className="size-3.5" aria-hidden />
            Build framework
          </Button>
        }
        rowActions={() => (
          <button
            type="button"
            className="focus-ring rounded-sm p-1 text-ink-3 opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink-2 group-hover:opacity-100 focus-visible:opacity-100"
            aria-label="Row actions"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </button>
        )}
      />
    </div>
  );
}
