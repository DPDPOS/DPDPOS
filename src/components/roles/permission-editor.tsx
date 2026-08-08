"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  permissionLabel,
} from "@/lib/constants/permissions";

interface PermissionEditorProps {
  /** Currently selected permission strings. */
  selected: string[];
  /** Omit for read-only rendering (system roles, §9.14). */
  onChange?: (next: string[]) => void;
  className?: string;
}

/**
 * Grouped permission tree over the frozen 60-string catalog. Each group has a
 * select-all; a search box filters the tree; a live count is always visible.
 */
export function PermissionEditor({
  selected,
  onChange,
  className,
}: PermissionEditorProps) {
  const [query, setQuery] = useState("");
  const readOnly = onChange === undefined;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PERMISSION_GROUPS;
    return PERMISSION_GROUPS.map((group) => ({
      ...group,
      permissions: group.permissions.filter((perm) =>
        permissionLabel(perm).toLowerCase().includes(q),
      ),
    })).filter((group) => group.permissions.length > 0);
  }, [query]);

  const toggle = (perm: string) => {
    if (readOnly) return;
    const next = selected.includes(perm)
      ? selected.filter((p) => p !== perm)
      : [...selected, perm];
    onChange(next);
  };

  const toggleGroup = (groupPermissions: string[]) => {
    if (readOnly) return;
    const allSelected = groupPermissions.every((perm) => selected.includes(perm));
    const next = allSelected
      ? selected.filter((perm) => !groupPermissions.includes(perm))
      : Array.from(new Set([...selected, ...groupPermissions]));
    onChange(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-2">
          <span className="tabular font-medium text-ink">{selected.length}</span>{" "}
          of {ALL_PERMISSIONS.length} permissions
        </p>
        <div className="relative w-56">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-ink-3"
            aria-hidden
          />
          <Input
            aria-label="Search permissions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-8 pl-7 text-xs"
            placeholder="Search permissions"
          />
        </div>
      </div>

      <div className="max-h-80 space-y-4 overflow-y-auto rounded-sm border border-border bg-surface p-3">
        {groups.map((group) => {
          const groupSelected = group.permissions.filter((perm) =>
            selected.includes(perm),
          ).length;
          const allSelected =
            group.permissions.length > 0 &&
            groupSelected === group.permissions.length;
          const partial = groupSelected > 0 && !allSelected;
          return (
            <section key={group.id} aria-label={group.label}>
              <div className="flex items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = partial;
                    }}
                    onChange={() => toggleGroup(group.permissions)}
                    disabled={readOnly || group.permissions.length === 0}
                    aria-label={`Select all ${group.label}`}
                    className="size-3.5 accent-accent"
                  />
                  {group.label}
                  <span className="tabular text-xs font-normal text-ink-3">
                    {groupSelected}/{group.permissions.length}
                  </span>
                </label>
              </div>
              <ul className="mt-1.5 space-y-0.5 border-l border-border pl-4">
                {group.permissions.map((perm) => {
                  const checked = selected.includes(perm);
                  return (
                    <li key={perm}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 text-[13px] text-ink-2 transition-colors hover:bg-surface-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(perm)}
                          disabled={readOnly}
                          aria-label={permissionLabel(perm)}
                          className="size-3.5 accent-accent"
                        />
                        <span className="flex-1">{permissionLabel(perm)}</span>
                        <code className="font-mono text-[11px] text-ink-3">{perm}</code>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        {groups.length === 0 ? (
          <p className="py-4 text-center text-xs text-ink-3">
            No permissions match “{query}”.
          </p>
        ) : null}
      </div>
    </div>
  );
}
