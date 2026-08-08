"use client";

import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { useSessionStore } from "@/state/session";

/**
 * Phase 1 placeholder — proves the protected route + permission gating.
 * Real metrics and navigation land in Phase 2.
 */
export function DashboardView() {
  const user = useSessionStore((state) => state.user);

  return (
    <div className="space-y-8">
      <header>
        <p className="micro-label">Phase 1 · auth foundation</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-2">
          Session, MFA, and route guards are live. Metrics, navigation, and the
          compliance programme land in Phase 2.
        </p>
      </header>

      {/* Metric placeholders ------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Compliance score", "Open violations", "Rights requests", "Evidence items"].map(
          (label) => (
            <Card key={label}>
              <CardBody className="space-y-3">
                <p className="micro-label">{label}</p>
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-full" />
              </CardBody>
            </Card>
          ),
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Session card ------------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Session</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <Row label="Name" value={user?.name ?? "—"} />
            <Row label="Email" value={user?.email ?? "—"} mono />
            <Row label="Organization" value={user?.organizationId ?? "—"} mono />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-ink-2">MFA</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[13px] font-medium",
                  user?.mfaEnabled ? "text-pass" : "text-ink-3",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full",
                    user?.mfaEnabled ? "bg-pass" : "bg-ink-3",
                  )}
                />
                {user?.mfaEnabled ? "Enabled" : "Not enrolled"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-ink-2">Roles</span>
              <span className="flex flex-wrap justify-end gap-1.5">
                {(user?.roles ?? []).length > 0 ? (
                  user!.roles.map((role) => (
                    <Badge key={role} variant="outline">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[13px] text-ink-3">—</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-[13px] text-ink-2">Permissions</span>
              <span className="tabular text-[13px] font-medium text-ink">
                {(user?.permissions ?? []).length}
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Permission surface -------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Permission surface</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-[13px] leading-relaxed text-ink-2">
              The <code className="rounded-sm bg-surface-2 px-1 font-mono text-xs text-ink">Can</code>{" "}
              component and{" "}
              <code className="rounded-sm bg-surface-2 px-1 font-mono text-xs text-ink">usePermission</code>{" "}
              hook gate UI by the backend&apos;s permission catalog — the same
              strings the API enforces.
            </p>
            <div className="space-y-2">
              <Can
                perm="users:create"
                fallback={
                  <p className="text-[13px] text-ink-3">
                    You cannot invite users (no <span className="font-mono text-xs">users:create</span>).
                  </p>
                }
              >
                <p className="flex items-center gap-2 text-[13px] text-ink">
                  <CheckCircle2 className="size-3.5 shrink-0 text-pass" aria-hidden />
                  You can invite users.
                </p>
              </Can>
              <Can
                perm="violations:create"
                fallback={
                  <p className="text-[13px] text-ink-3">
                    You cannot log violations (no{" "}
                    <span className="font-mono text-xs">violations:create</span>).
                  </p>
                }
              >
                <p className="flex items-center gap-2 text-[13px] text-ink">
                  <CheckCircle2 className="size-3.5 shrink-0 text-pass" aria-hidden />
                  You can log violations.
                </p>
              </Can>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/gallery">
                  <ArrowUpRight className="size-3.5" aria-hidden />
                  Component gallery
                </Link>
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-ink-2">{label}</span>
      <span
        className={cn(
          "truncate text-[13px] font-medium text-ink",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </span>
    </div>
  );
}
