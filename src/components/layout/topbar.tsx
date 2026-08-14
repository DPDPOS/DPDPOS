"use client";

import {
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useLogout } from "@/features/auth/hooks";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsPage,
  useUnreadCount,
} from "@/features/notifications/hooks";
import { formatDateTime } from "@/lib/utils/format";
import {
  accessibleRoutes,
  CURRENT_PHASE,
  isRouteLive,
  routeForPathname,
} from "@/lib/navigation/routes";
import { useSessionStore } from "@/state/session";
import { useUiStore } from "@/state/ui";
import { cn } from "@/lib/utils/cn";

type Panel = "none" | "search" | "bell" | "user";

/**
 * Topbar (plan §5.3): breadcrumbs, global search (`/` or ⌘K focuses it),
 * notification bell polling `/notifications/unread-count` every 60 s, and the
 * user menu. The search surface is wired to the route map already — results
 * link when the screen exists and show a phase chip when it is upcoming.
 */
export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const logout = useLogout();

  const [panel, setPanel] = useState<Panel>("none");
  const [query, setQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setPanel("none");
    setQuery("");
  };

  const route = routeForPathname(pathname);
  const canReadNotifications =
    user?.permissions.includes("notification:read") ?? false;

  // Global search focus: `/` (when not typing) and ⌘K/Ctrl+K. Escape closes
  // whichever panel is open. Deliberately not memoized — it re-binds each
  // render so it always sees the current `panel`.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "Escape") {
        if (panel !== "none") {
          close();
          searchRef.current?.blur();
        }
        return;
      }
      if (typing) return;
      if (event.key === "/") {
        event.preventDefault();
        setPanel("search");
        searchRef.current?.focus();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPanel("search");
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Same permission surface as the sidebar (§6.4) — search never suggests
    // areas the user cannot read.
    const all = accessibleRoutes(user?.permissions).filter(
      (r) =>
        !q ||
        r.label.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q),
    );
    return all.slice(0, 7);
  }, [query, user?.permissions]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex h-12 items-center gap-2 px-4 sm:px-6">
        {/* Mobile nav toggle -------------------------------------------------- */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="focus-ring flex size-7 items-center justify-center rounded-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-4" aria-hidden />
        </button>

        {/* Sidebar collapse (desktop) ------------------------------------------ */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="focus-ring hidden size-7 items-center justify-center rounded-sm text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden />
          )}
        </button>

        {/* Breadcrumbs --------------------------------------------------------- */}
        <div className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex">
          <span className="micro-label text-ink-3">
            {route ? route.group : "Console"}
          </span>
          <ChevronRight className="size-3 text-ink-3" aria-hidden />
          <span className="truncate font-medium text-ink">
            {route ? route.label : "Workspace"}
          </span>
        </div>

        {/* Search -------------------------------------------------------------- */}
        <div className="relative ml-auto w-full max-w-xs">
          <button
            type="button"
            onClick={() => setPanel(panel === "search" ? "none" : "search")}
            className={cn(
              "focus-ring flex h-8 w-full items-center gap-2 rounded-sm border px-2.5 text-[13px] text-ink-3 transition-colors",
              panel === "search"
                ? "border-accent/40 bg-surface text-ink"
                : "border-border bg-surface hover:border-border-strong",
            )}
            aria-label="Search"
          >
            <Search className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {query || "Search the console…"}
            </span>
            <kbd className="ml-auto hidden shrink-0 items-center gap-0.5 rounded-sm border border-border bg-surface-2 px-1 font-mono text-[10px] text-ink-3 sm:flex">
              /
            </kbd>
          </button>

          {panel === "search" ? (
            <div className="absolute right-0 top-10 z-30 w-80 overflow-hidden rounded-sm border border-border bg-surface shadow-lg shadow-ink/5">
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter pages…"
                aria-label="Search pages"
                className="h-9 w-full border-b border-border bg-surface px-3 text-[13px] text-ink outline-none placeholder:text-ink-3"
                autoFocus
              />
              <ul className="max-h-72 overflow-y-auto p-1.5">
                {searchResults.map((result) => {
                  const Icon = result.icon;
                  return (
                    <li key={result.href}>
              {!isRouteLive(result) ? (
                <div
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13px] text-ink-3"
                  title={`${result.label} — arriving in Phase ${result.phase}`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">
                    {result.label}
                  </span>
                  <span className="shrink-0 rounded-sm border border-border px-1 font-mono text-[10px] uppercase text-ink-3">
                    {result.phase > CURRENT_PHASE ? `P${result.phase}` : "Soon"}
                  </span>
                </div>
              ) : (
                        <Link
                          href={result.href}
                          onClick={close}
                          className="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
                        >
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span className="min-w-0 flex-1 truncate">
                            {result.label}
                          </span>
                          <span className="micro-label shrink-0 text-ink-3">
                            {result.group}
                          </span>
                        </Link>
                      )}
                    </li>
                  );
                })}
                {searchResults.length === 0 ? (
                  <li className="px-2.5 py-3 text-[13px] text-ink-3">
                    No pages match “{query}”.
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Bell --------------------------------------------------------------- */}
        <div className="relative">
          <BellButton
            enabled={canReadNotifications}
            onClick={() => setPanel(panel === "bell" ? "none" : "bell")}
          />
          {panel === "bell" ? (
            <NotificationPanel enabled={canReadNotifications} onNavigate={close} />
          ) : null}
        </div>

        {/* User menu ---------------------------------------------------------- */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPanel(panel === "user" ? "none" : "user")}
            className={cn(
              "focus-ring flex h-8 items-center gap-2 rounded-sm border px-1.5 transition-colors",
              panel === "user"
                ? "border-border-strong bg-surface-2"
                : "border-transparent hover:border-border hover:bg-surface-2",
            )}
            aria-label="Account menu"
            aria-expanded={panel === "user"}
          >
            <span className="flex size-5 items-center justify-center rounded-sm bg-accent-soft font-mono text-[10px] font-semibold uppercase text-accent">
              {initials(user?.name)}
            </span>
            <span className="hidden max-w-28 truncate text-[13px] font-medium text-ink md:block">
              {user?.name ?? "Account"}
            </span>
            <ChevronDown
              className={cn(
                "size-3 text-ink-3 transition-transform duration-150",
                panel === "user" && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          {panel === "user" ? (
            <div className="absolute right-0 top-10 z-30 w-64 overflow-hidden rounded-sm border border-border bg-surface shadow-lg shadow-ink/5">
              <div className="border-b border-border px-3 py-3">
                <p className="truncate text-[13px] font-medium text-ink">
                  {user?.name}
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-ink-3">
                  {user?.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(user?.roles ?? []).map((role) => (
                    <Badge key={role} variant="outline">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-1 p-1.5">
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <span className="text-[13px] text-ink-2">MFA</span>
                  <span
                    className={cn(
                      "text-[13px] font-medium",
                      user?.mfaEnabled ? "text-pass" : "text-ink-3",
                    )}
                  >
                    {user?.mfaEnabled ? "Enabled" : "Not enrolled"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <span className="text-[13px] text-ink-2">Permissions</span>
                  <span className="tabular text-[13px] font-medium text-ink">
                    {user?.permissions.length ?? 0}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    router.push("/gallery");
                  }}
                  className="focus-ring w-full rounded-sm px-2.5 py-1.5 text-left text-[13px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  Component gallery
                </button>
              </div>
              <div className="border-t border-border p-1.5">
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => {
                    setLoggingOut(true);
                    void logout().finally(() => setLoggingOut(false));
                  }}
                  className="focus-ring flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-[13px] font-medium text-fail transition-colors hover:bg-fail-bg/60 disabled:opacity-60"
                >
                  {loggingOut ? (
                    <Spinner size="sm" label="Signing out" />
                  ) : (
                    <LogOut className="size-3.5" aria-hidden />
                  )}
                  {loggingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Click-outside close --------------------------------------------------- */}
      {panel !== "none" ? (
        <button
          type="button"
          aria-label="Close"
          className="fixed inset-0 z-10 cursor-default"
          onClick={close}
          tabIndex={-1}
        />
      ) : null}
    </header>
  );
}

/* Bell ---------------------------------------------------------------------- */

function BellButton({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  const { data } = useUnreadCount(enabled);
  const count = enabled ? data?.count ?? 0 : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring relative flex size-8 items-center justify-center rounded-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
    >
      <Bell className="size-4" aria-hidden />
      {count > 0 ? (
        <span
          aria-hidden
          className="absolute right-1 top-1 flex size-2 items-center justify-center rounded-full bg-fail"
        >
          <span className="absolute inset-0 rounded-full bg-fail/40" />
        </span>
      ) : null}
    </button>
  );
}

function NotificationPanel({
  enabled,
  onNavigate,
}: {
  enabled: boolean;
  onNavigate: () => void;
}) {
  const { data } = useUnreadCount(enabled);
  const { data: inbox, isFetching } = useNotificationsPage(1, 5, {}, enabled);
  const markRead = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const count = enabled ? data?.count ?? 0 : 0;

  const markAllRead = async () => {
    if (!enabled || count === 0) return;
    try {
      await markAllReadMutation.mutateAsync();
    } catch {
      // Non-fatal — the dot simply stays.
    }
  };

  return (
    <div className="absolute right-0 top-10 z-30 w-80 overflow-hidden rounded-sm border border-border bg-surface shadow-lg shadow-ink/5">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <p className="text-[13px] font-medium text-ink">Notifications</p>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={!enabled || count === 0 || isFetching || markAllReadMutation.isPending}
          className="focus-ring flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck className="size-3" aria-hidden />
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {!enabled ? (
          <p className="p-3 text-[13px] leading-relaxed text-ink-3">
            You don&apos;t have permission to view notifications.
          </p>
        ) : isFetching ? (
          <div className="space-y-2 p-3">
            <Spinner size="sm" label="Loading notifications" />
          </div>
        ) : (inbox?.items ?? []).length === 0 ? (
          <p className="p-3 text-[13px] leading-relaxed text-ink-3">
            You&apos;re all caught up.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {(inbox?.items ?? []).slice(0, 5).map((row) => (
              <li key={row.id} className="flex items-start gap-2 px-3 py-2.5 transition-colors hover:bg-surface-2/50">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-[13px]",
                      row.status === "READ" ? "text-ink-2" : "font-medium text-ink",
                    )}
                  >
                    {row.subject}
                  </p>
                  <p className="mt-0.5 tabular font-mono text-[10px] text-ink-3">
                    {formatDateTime(row.createdAt)}
                  </p>
                </div>
                {row.status !== "READ" ? (
                  <button
                    type="button"
                    onClick={() => markRead.mutate(row.id)}
                    className="focus-ring mt-0.5 shrink-0 rounded-sm px-1 py-0.5 text-[11px] text-accent transition-colors hover:underline"
                  >
                    Read
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-border p-1.5">
        <Link
          href="/notifications"
          onClick={onNavigate}
          className="focus-ring block rounded-sm px-2 py-1.5 text-center text-xs font-medium text-accent transition-colors hover:bg-accent-soft"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}

/* Helpers ------------------------------------------------------------------- */

function initials(name?: string): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
