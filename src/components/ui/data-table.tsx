"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";

export interface TableColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  /** Required for sortable columns. */
  sortValue?: (row: T) => string | number;
  sortable?: boolean;
  align?: "left" | "right";
  className?: string;
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  /** External (server-side) pagination; omit for client-side pagination. */
  pagination?: TablePagination;
  /** Client-side pagination page size when no external pagination is given. */
  defaultPageSize?: number;
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  /** Per-row classes (e.g. muting withdrawn records). */
  rowClassName?: (row: T) => string | undefined;
  className?: string;
}

interface SortState {
  key: string;
  dir: "asc" | "desc";
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  pagination,
  defaultPageSize = 10,
  emptyTitle = "Nothing here yet",
  emptyBody,
  emptyAction,
  onRowClick,
  rowActions,
  rowClassName,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [internalPage, setInternalPage] = useState(1);

  const pageSize = pagination?.pageSize ?? defaultPageSize;

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const { dir } = sort;
    return [...rows].sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const total = pagination?.total ?? sorted.length;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(total / pageSize));
  // Clamp the internal page so shrinking datasets never show an empty page.
  const page = pagination?.page ?? Math.min(internalPage, totalPages);
  const start = (page - 1) * pageSize;
  const visible = pagination ? sorted : sorted.slice(start, start + pageSize);

  const goToPage = (next: number) => {
    if (pagination) {
      pagination.onPageChange(next);
      return;
    }
    setInternalPage(Math.min(Math.max(1, next), totalPages));
  };

  const toggleSort = (column: TableColumn<T>) => {
    if (!column.sortable) return;
    setSort((prev) => {
      if (prev?.key !== column.key) return { key: column.key, dir: "asc" };
      if (prev.dir === "asc") return { key: column.key, dir: "desc" };
      return null;
    });
  };

  const SortIcon = ({ column }: { column: TableColumn<T> }) => {
    if (!column.sortable) return null;
    if (sort?.key !== column.key) {
      return (
        <ChevronsUpDown className="size-3 text-ink-3" aria-hidden />
      );
    }
    return sort.dir === "asc" ? (
      <ChevronUp className="size-3 text-ink-2" aria-hidden />
    ) : (
      <ChevronDown className="size-3 text-ink-2" aria-hidden />
    );
  };

  const from = total === 0 ? 0 : start + 1;
  const to = Math.min(start + pageSize, total);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-surface",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2 text-left text-xs font-medium uppercase tracking-wider text-ink-2">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-3 py-2.5 font-medium"
                  scope="col"
                  aria-sort={
                    column.sortable
                      ? sort?.key === column.key
                        ? sort.dir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                      : undefined
                  }
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className={cn(
                        "focus-ring inline-flex items-center gap-1 rounded-sm uppercase tracking-wider hover:text-ink",
                        column.align === "right" && "flex-row-reverse",
                      )}
                    >
                      {column.header}
                      <SortIcon column={column} />
                    </button>
                  ) : (
                    <span
                      className={cn(
                        column.align === "right" && "block text-right",
                      )}
                    >
                      {column.header}
                    </span>
                  )}
                </th>
              ))}
              {rowActions ? <th className="w-10 px-3 py-2.5" scope="col" /> : null}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-t border-border">
                    {columns.map((column) => (
                      <td key={column.key} className="px-3 py-2.5">
                        <Skeleton className="h-3.5 w-full max-w-40" />
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="px-3 py-2.5">
                        <Skeleton className="size-4" />
                      </td>
                    ) : null}
                  </tr>
                ))
              : visible.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-t border-border transition-colors",
                      onRowClick && "cursor-pointer hover:bg-surface-2/70",
                      rowActions && "group",
                      rowClassName?.(row),
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "px-3 py-2.5 text-ink",
                          column.align === "right" && "text-right tabular",
                          column.className,
                        )}
                      >
                        {column.accessor(row)}
                      </td>
                    ))}
                    {rowActions ? (
                      <td
                        className="px-3 py-2.5 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {rowActions(row)}
                      </td>
                    ) : null}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && visible.length === 0 ? (
        <div className="border-t border-border">
          <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />
        </div>
      ) : null}

      {!loading && total > pageSize ? (
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-ink-2">
          <span className="tabular">
            Showing {from}–{to} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="focus-ring inline-flex h-6 items-center gap-1 rounded-sm px-1.5 hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5" aria-hidden />
              Prev
            </button>
            <span className="tabular px-1.5">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="focus-ring inline-flex h-6 items-center gap-1 rounded-sm px-1.5 hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-40"
              aria-label="Next page"
            >
              Next
              <ChevronRight className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
