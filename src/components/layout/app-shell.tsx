"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * App shell (plan §5.3) — sticky collapsible sidebar, topbar with breadcrumbs
 * / search / notifications / user menu, and a full-width data-dense content
 * area with a 16–24px gutter (no content max-width, per §4.2).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
