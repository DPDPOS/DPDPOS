"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  accessibleRoutes,
  NAV_GROUPS,
  type AppRoute,
} from "@/lib/navigation/routes";
import { useSessionStore } from "@/state/session";
import { useUiStore } from "@/state/ui";
import { cn } from "@/lib/utils/cn";

/**
 * Sidebar — 224px, collapsible to 64px icons on desktop, an off-canvas drawer
 * on mobile. Groups and items mirror the route map; an item is hidden without
 * its read permission.
 */
export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const mobileOpen = useUiStore((state) => state.mobileNavOpen);
  const setMobileNavOpen = useUiStore((state) => state.setMobileNavOpen);
  const user = useSessionStore((state) => state.user);
  const pathname = usePathname();

  const routes = accessibleRoutes(user?.permissions);

  const groups = NAV_GROUPS.map((group) => ({
    group,
    items: routes.filter((route) => route.group === group),
  })).filter((entry) => entry.items.length > 0);

  const active = (href: string) => pathname === href;

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-ink/25 lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-border bg-surface transition-[width,transform] duration-200 ease-out lg:sticky lg:top-0 lg:h-dvh",
          collapsed ? "lg:w-16" : "lg:w-56",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3">
          <Link
            href="/dashboard"
            className="focus-ring flex min-w-0 items-center gap-2.5 rounded-sm"
            onClick={() => setMobileNavOpen(false)}
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-accent">
              <ShieldCheck className="size-4" aria-hidden />
            </div>
            {!collapsed ? (
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[13px] font-semibold tracking-tight text-ink">
                  DPDPOS
                </p>
                <p className="micro-label">Compliance console</p>
              </div>
            ) : null}
          </Link>
        </div>

        <nav
          className="flex-1 space-y-5 overflow-y-auto px-2 py-4"
          aria-label="Primary"
        >
          {groups.map(({ group, items }) => (
            <div key={group}>
              {!collapsed ? (
                <p className="micro-label px-2 pb-1.5 text-ink-3">{group}</p>
              ) : (
                <div className="mx-2 mb-1.5 border-t border-border" />
              )}
              <ul className="space-y-0.5">
                {items.map((route) => (
                  <li key={route.href}>
                    <NavItem
                      route={route}
                      active={active(route.href)}
                      collapsed={collapsed}
                      onNavigate={() => setMobileNavOpen(false)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

interface NavItemProps {
  route: AppRoute;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}

function NavItem({ route, active, collapsed, onNavigate }: NavItemProps) {
  const Icon = route.icon;
  const classes = cn(
    "group relative flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-[13px] transition-colors duration-150",
    collapsed && "justify-center px-0",
    active
      ? "font-medium text-ink"
      : "text-ink-2 hover:bg-surface-2 hover:text-ink",
  );

  return (
    <Link
      href={route.href}
      onClick={onNavigate}
      title={collapsed ? route.label : undefined}
      aria-current={active ? "page" : undefined}
      className={classes}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent"
        />
      ) : null}
      <Icon className="size-4 shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{route.label}</span> : null}
    </Link>
  );
}
