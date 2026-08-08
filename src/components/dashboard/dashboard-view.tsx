"use client";

import { ArrowUpRight, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { ApiError } from "@/lib/api/errors";
import {
  humanizeStatus,
  toneFor,
  type Tone,
} from "@/lib/constants/status-maps";
import { cn } from "@/lib/utils/cn";
import { useSessionStore } from "@/state/session";
import { useCanReadAnalytics, useDashboardOverview } from "@/features/analytics/hooks";
import type { DashboardOverview } from "@/features/analytics/types";
import { BarList, MiniDonut, ProgressRing } from "./charts";

/**
 * Dashboard (plan §9.1) — one `GET /analytics/dashboard` query. Executive row
 * first (score, violations, evidence, rights), then breakdowns. Users without
 * `analytics:read` get a reduced workspace view instead of a dead end.
 */
export function DashboardView() {
  const user = useSessionStore((state) => state.user);
  const canRead = useCanReadAnalytics();
  const { data, isLoading, isError, error, isFetching, refetch } =
    useDashboardOverview(canRead);

  if (!canRead) {
    return <ReducedDashboard user={user} />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        isFetching={isFetching}
        onRefresh={() => void refetch()}
        trailing={
          <div className="hidden items-center gap-2 sm:flex">
            {(user?.roles ?? []).map((role) => (
              <Badge key={role} variant="outline">
                {role}
              </Badge>
            ))}
            <Badge variant="accent">Live metrics</Badge>
          </div>
        }
      />

      {isLoading ? <DashboardSkeleton /> : null}

      {isError ? (
        <ErrorState
          title="Couldn't load the dashboard"
          message={error instanceof ApiError ? error.message : "Something went wrong."}
          retry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !isError && data ? (
        <DashboardBody data={data} />
      ) : null}
    </div>
  );
}

/* Full board ---------------------------------------------------------------- */

function DashboardBody({ data }: { data: DashboardOverview }) {
  const { complianceScore, violations, evidence, rightsRequests, consent } = data;
  const empty =
    complianceScore.totalRules === 0 &&
    violations.total === 0 &&
    evidence.totalControls === 0 &&
    rightsRequests.total === 0 &&
    consent.totalRecords === 0;

  if (empty) {
    return (
      <Card>
        <EmptyState
          icon={Sparkles}
          title="Your compliance programme hasn't been built yet"
          body="Generate a framework from your profile to light up the score, violations, evidence and consent metrics on this board."
          action={
            <Button variant="secondary" size="sm" disabled title="Arrives in Phase 3">
              Build your framework
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Button>
          }
        />
      </Card>
    );
  }

  const scoreTone =
    complianceScore.score >= 80
      ? "text-pass"
      : complianceScore.score >= 50
        ? "text-warn"
        : "text-fail";

  const activeViolations = Object.entries(violations.byStatus)
    .filter(([status]) => status !== "CLOSED" && status !== "ARCHIVED")
    .reduce((sum, [, count]) => sum + count, 0);

  const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const severityBars = severityOrder
    .map((severity) => ({
      label: humanizeStatus(severity),
      value: violations.bySeverity[severity] ?? 0,
      tone: toneFor(severity),
    }))
    .filter((bar) => bar.value > 0);

  const topStatuses = Object.entries(violations.byStatus)
    .filter(([status]) => status !== "CLOSED" && status !== "ARCHIVED")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const rightsBars = Object.entries(rightsRequests.byType)
    .map(([type, count]) => ({
      label: humanizeStatus(type),
      value: count,
      tone: toneFor(type),
    }))
    .sort((a, b) => b.value - a.value);

  const consentSegments = [
    { label: "Granted", value: consent.granted, className: "stroke-pass" },
    { label: "Withdrawn", value: consent.withdrawn, className: "stroke-neutral/60" },
  ];
  const otherConsent = consent.totalRecords - consent.granted - consent.withdrawn;
  if (otherConsent > 0) {
    consentSegments.push({
      label: "Other",
      value: otherConsent,
      className: "stroke-ink-3/40",
    });
  }

  return (
    <>
      {/* Row 1 — metric cards ------------------------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardBody className="space-y-3">
            <p className="micro-label">Compliance score</p>
            <div className="flex items-center gap-4">
              <ProgressRing
                value={complianceScore.score}
                size={84}
                stroke={8}
                className={scoreTone}
              >
                <span className="tabular text-lg font-semibold text-ink">
                  {complianceScore.score}
                  <span className="text-xs font-normal text-ink-3">%</span>
                </span>
              </ProgressRing>
              <div className="min-w-0 space-y-1">
                <p className="text-[13px] font-medium text-ink">
                  {complianceScore.passed} of {complianceScore.totalRules} rules
                </p>
                <p className="text-xs text-ink-3">
                  passing latest validation
                </p>
                <p className="text-xs text-ink-2">
                  <span className="text-pass">{complianceScore.passed} passed</span>
                  {" · "}
                  <span className="text-fail">{complianceScore.failed} failed</span>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <p className="micro-label">Open violations</p>
            <p className="tabular text-2xl font-semibold tracking-tight text-ink">
              {activeViolations}
            </p>
            <p className="text-xs text-ink-3">
              of {violations.total} total · by severity
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {severityBars.map((bar) => (
                <span
                  key={bar.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 text-xs",
                    severityChipText[bar.tone],
                  )}
                >
                  <span className="tabular font-medium">{bar.value}</span>
                  <span className="text-[11px] uppercase tracking-wide text-ink-3">
                    {bar.label}
                  </span>
                </span>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <p className="micro-label">Evidence coverage</p>
            <p className="tabular text-2xl font-semibold tracking-tight text-ink">
              {evidence.coveragePercent}
              <span className="text-sm font-normal text-ink-3">%</span>
            </p>
            <p className="text-xs text-ink-3">
              of {evidence.totalControls} controls with approved evidence
            </p>
            <div className="h-1.5 overflow-hidden rounded-sm bg-surface-2">
              <div
                className="h-full rounded-sm bg-pass transition-[width] duration-200 ease-out"
                style={{ width: `${evidence.coveragePercent}%` }}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <p className="micro-label">Rights requests</p>
            <p className="tabular text-2xl font-semibold tracking-tight text-ink">
              {rightsRequests.open}
            </p>
            <p className="text-xs text-ink-3">
              of {rightsRequests.total} total · {rightsRequests.closed} responded
            </p>
            <p className="text-xs text-ink-2">
              avg resolution{" "}
              <span className="tabular font-medium text-ink">
                {rightsRequests.avgResolutionDays !== null
                  ? `${rightsRequests.avgResolutionDays.toFixed(1)}d`
                  : "—"}
              </span>
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Row 2 — violations + rights breakdowns ------------------------------ */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Violation breakdown</CardTitle>
            <span className="micro-label text-ink-3">
              {violations.total} total
            </span>
          </CardHeader>
          <CardBody className="space-y-5">
            <div>
              <p className="micro-label mb-2 text-ink-3">By severity</p>
              <BarList items={severityBars} emptyLabel="No violations recorded" />
            </div>
            <div>
              <p className="micro-label mb-2 text-ink-3">By status</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {topStatuses.map(([status, count]) => (
                  <span
                    key={status}
                    className="flex items-center gap-1.5 text-xs text-ink-2"
                  >
                    <StatusChip status={status} />
                    <span className="tabular font-medium text-ink">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rights requests by type</CardTitle>
            <span className="micro-label text-ink-3">
              {rightsRequests.total} total
            </span>
          </CardHeader>
          <CardBody>
            <BarList
              items={rightsBars}
              emptyLabel="No data subject requests yet"
            />
          </CardBody>
        </Card>
      </div>

      {/* Row 3 — consent pulse + validation summary -------------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Consent pulse</CardTitle>
            <span className="micro-label text-ink-3">
              {consent.totalRecords} records
            </span>
          </CardHeader>
          <CardBody className="flex items-center gap-6">
            <MiniDonut segments={consentSegments} size={124} thickness={14}>
              <div className="text-center">
                <p className="tabular text-lg font-semibold text-ink">
                  {consent.totalRecords}
                </p>
                <p className="micro-label text-ink-3">records</p>
              </div>
            </MiniDonut>
            <div className="min-w-0 flex-1 space-y-2.5">
              {consentSegments.map((segment) => (
                <div key={segment.label} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 rounded-full",
                      segment.className.replace("stroke-", "bg-"),
                    )}
                  />
                  <span className="flex-1 text-[13px] text-ink-2">
                    {segment.label}
                  </span>
                  <span className="tabular text-[13px] font-medium text-ink">
                    {segment.value}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Latest validation run</CardTitle>
            <span className="micro-label text-ink-3">
              {complianceScore.totalRules} rules
            </span>
          </CardHeader>
          <CardBody className="space-y-4">
            {complianceScore.totalRules === 0 ? (
              <p className="text-[13px] text-ink-3">
                No completed validation runs yet. Trigger a run from the
                Validations section in Phase 3.
              </p>
            ) : (
              <>
                <div className="space-y-2.5">
                  <div>
                    <div className="mb-1 flex items-baseline justify-between text-[13px]">
                      <span className="text-ink-2">Passing</span>
                      <span className="tabular font-medium text-pass">
                        {complianceScore.passed}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-sm bg-surface-2">
                      <div
                        className="h-full rounded-sm bg-pass transition-[width] duration-200 ease-out"
                        style={{
                          width: `${(complianceScore.passed / complianceScore.totalRules) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-baseline justify-between text-[13px]">
                      <span className="text-ink-2">Failing</span>
                      <span className="tabular font-medium text-fail">
                        {complianceScore.failed}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-sm bg-surface-2">
                      <div
                        className="h-full rounded-sm bg-fail transition-[width] duration-200 ease-out"
                        style={{
                          width: `${(complianceScore.failed / complianceScore.totalRules) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <p className="border-t border-border pt-3 text-xs text-ink-3">
                  Score is computed from the most recent completed run.
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

/* Header -------------------------------------------------------------------- */

function DashboardHeader({
  isFetching,
  onRefresh,
  trailing,
}: {
  isFetching: boolean;
  onRefresh: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="micro-label">Compliance overview</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-2">
          The score, queue and coverage picture for your organisation — from
          the analytics endpoints.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {trailing}
        <Button variant="secondary" size="sm" onClick={onRefresh} disabled={isFetching}>
          <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} aria-hidden />
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
    </header>
  );
}

/* Reduced dashboard (no analytics:read) -------------------------------------- */

function ReducedDashboard({
  user,
}: {
  user: ReturnType<typeof useSessionStore.getState>["user"];
}) {
  return (
    <div className="space-y-6">
      <header>
        <p className="micro-label">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-2">
          Welcome back. Your role can&apos;t see the compliance metrics on this
          board — here&apos;s your session and the areas you can reach.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
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
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dashboard access</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              The compliance score, violations and consent metrics require the{" "}
              <code className="rounded-sm bg-surface-2 px-1 font-mono text-xs">
                analytics:read
              </code>{" "}
              permission. Ask an admin to grant it.
            </p>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-[13px] text-ink-2">Permissions held</span>
              <span className="tabular text-[13px] font-medium text-ink">
                {(user?.permissions ?? []).length}
              </span>
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

/** Chip text colour per tone — mirrors StatusChip's toneChip map. */
const severityChipText: Record<Tone, string> = {
  pass: "text-pass",
  warn: "text-warn",
  fail: "text-fail",
  info: "text-info",
  neutral: "text-ink-2",
};

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

/* Skeleton ------------------------------------------------------------------- */

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardBody className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-full" />
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardBody className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
