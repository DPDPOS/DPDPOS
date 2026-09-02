import { ArrowUpRight, Bell, Database, FileText, Gauge, Lock, Scale, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusChip } from "@/components/ui/status-chip";
import { Textarea } from "@/components/ui/textarea";
import { BackendStatus } from "@/components/gallery/backend-status";
import { DemoTable } from "@/components/gallery/demo-table";
import { ErrorStateDemo } from "@/components/gallery/error-state-demo";
import {
  CONSENT_STATES,
  CONTROL_STATUSES,
  EVIDENCE_STATUSES,
  REMEDIATION_TASK_STATUSES,
  RIGHTS_REQUEST_STATUSES,
  RULE_SEVERITIES,
  VALIDATION_RESULT_STATUSES,
  VALIDATION_RUN_STATUSES,
  VIOLATION_STATUSES,
} from "@/types/enums";

const swatches: { name: string; value: string }[] = [
  { name: "bg", value: "#FAFAF9" },
  { name: "surface", value: "#FFFFFF" },
  { name: "surface-2", value: "#F4F4F5" },
  { name: "border", value: "#E4E4E7" },
  { name: "border-strong", value: "#D4D4D8" },
  { name: "ink", value: "#18181B" },
  { name: "ink-2", value: "#52525B" },
  { name: "ink-3", value: "#A1A1AA" },
  { name: "accent", value: "#1D4ED8" },
  { name: "accent-hover", value: "#1E40AF" },
  { name: "accent-soft", value: "#EFF6FF" },
  { name: "pass", value: "#15803D" },
  { name: "pass-bg", value: "#F0FDF4" },
  { name: "warn", value: "#B45309" },
  { name: "warn-bg", value: "#FFFBEB" },
  { name: "fail", value: "#B91C1C" },
  { name: "fail-bg", value: "#FEF2F2" },
  { name: "neutral", value: "#52525B" },
  { name: "neutral-bg", value: "#F4F4F5" },
];

const typeSamples = [
  { label: "micro-label", className: "micro-label", sample: "Section label — 11px caps" },
  { label: "12 metadata", className: "text-xs text-ink-2", sample: "Created by Asha Rao · 12 Jun, 09:41" },
  { label: "13 body", className: "text-[13px] text-ink", sample: "The body size used in tables and forms." },
  { label: "14 emphasis", className: "text-sm font-medium text-ink", sample: "Row titles and primary content." },
  { label: "16 card title", className: "text-base font-semibold text-ink", sample: "Card title" },
  { label: "18 page title", className: "text-lg font-semibold text-ink", sample: "Page title" },
  { label: "24 metric", className: "text-2xl font-semibold text-ink tabular", sample: "87.4" },
  { label: "30 hero", className: "text-[30px] font-semibold tracking-tight text-ink", sample: "Executive dashboard" },
];

function Section({
  index,
  title,
  description,
  children,
}: {
  index: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <p className="micro-label">{index}</p>
      <h2 className="mt-1 text-lg font-semibold text-ink">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-2">
          {description}
        </p>
      ) : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function GalleryPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-20 pt-12">
      {/* Header ------------------------------------------------------------- */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">DPDPOS · Design system</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            Component gallery
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
            Tokens, primitives, and patterns from the implementation plan (§4–§8).
            This page is the contract for the visual language — borders over
            shadows, one accent, tinted status chips, tabular numbers, no
            gradients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BackendStatus />
          <Kbd>⌘K</Kbd>
        </div>
      </header>

      {/* Color -------------------------------------------------------------- */}
      <div className="mt-12">
        <Section
          index="01"
          title="Color tokens"
          description="Warm neutral zinc base, one restrained regulatory-blue accent, and a desaturated status system. Defined in src/app/globals.css via Tailwind v4 @theme."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {swatches.map((color) => (
              <div key={color.name} className="flex flex-col gap-1.5">
                <div
                  className="h-10 rounded-sm border border-border"
                  style={{ backgroundColor: color.value }}
                />
                <span className="font-mono text-[11px] text-ink">{color.name}</span>
                <span className="font-mono text-[11px] text-ink-3">{color.value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Type --------------------------------------------------------------- */}
      <div className="mt-10">
        <Section
          index="02"
          title="Typography"
          description="IBM Plex Sans for interface, IBM Plex Mono for codes and data. Tabular numerals keep columns and SLA timers from jittering."
        >
          <div className="space-y-3 rounded-md border border-border bg-surface p-5">
            {typeSamples.map((sample) => (
              <div key={sample.label} className="flex items-baseline justify-between gap-6">
                <span className={`${sample.className} truncate`}>{sample.sample}</span>
                <span className="shrink-0 font-mono text-[11px] text-ink-3">
                  {sample.label}
                </span>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-6 border-t border-border pt-3">
              <span className="truncate font-mono text-[13px] text-accent">
                CTRL-NOTICE · REQ-CONSENT-01 · 7f3d9c2e1b
              </span>
              <span className="shrink-0 font-mono text-[11px] text-ink-3">mono</span>
            </div>
          </div>
        </Section>
      </div>

      {/* Buttons ------------------------------------------------------------ */}
      <div className="mt-10">
        <Section
          index="03"
          title="Buttons"
          description="36px default control height; 4px radius; single accent. Disabled states are explicit, never a mystery."
        >
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface p-5">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button variant="secondary" size="sm">
              <Search className="size-3.5" aria-hidden />
              Search
            </Button>
          </div>
        </Section>
      </div>

      {/* Forms -------------------------------------------------------------- */}
      <div className="mt-10">
        <Section
          index="04"
          title="Form controls"
          description="Error states map 1:1 to the backend's zod fieldErrors (VALIDATION_ERROR details). Labels and helpers are part of the input, not afterthoughts."
        >
          <div className="grid gap-5 rounded-md border border-border bg-surface p-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Email</span>
              <Input type="email" placeholder="you@company.in" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">
                Invite token
              </span>
              <Input
                defaultValue="3f2a…"
                invalid
                aria-describedby="token-error"
              />
              <span id="token-error" className="mt-1.5 block text-xs text-fail">
                This invite token is invalid or has expired.
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">
                Disabled field
              </span>
              <Input defaultValue="Read-only value" disabled />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">
                Notice content
              </span>
              <Textarea
                rows={3}
                defaultValue="We collect your personal data for the following purposes…"
              />
              <span className="mt-1.5 block text-right text-xs text-ink-3 tabular">
                63 / 20 000
              </span>
            </label>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Badge>Manual</Badge>
              <Badge variant="accent">SDF</Badge>
              <Badge variant="outline">PDF</Badge>
              <Badge variant="outline">CSV</Badge>
            </div>
          </div>
        </Section>
      </div>

      {/* Status chips ------------------------------------------------------- */}
      <div className="mt-10">
        <Section
          index="05"
          title="Status language"
          description="One StatusChip, one tone map (src/lib/constants/status-maps.ts), mirroring every backend enum. Chips and filter dropdowns never disagree."
        >
          <div className="grid gap-5 rounded-md border border-border bg-surface p-5 sm:grid-cols-2">
            <StatusGroup label="Controls" statuses={CONTROL_STATUSES} />
            <StatusGroup label="Violations" statuses={VIOLATION_STATUSES} />
            <StatusGroup label="Remediation" statuses={REMEDIATION_TASK_STATUSES} />
            <StatusGroup label="Evidence" statuses={EVIDENCE_STATUSES} />
            <StatusGroup label="Rights requests" statuses={RIGHTS_REQUEST_STATUSES} />
            <StatusGroup
              label="Validation runs & results"
              statuses={[...VALIDATION_RUN_STATUSES, ...VALIDATION_RESULT_STATUSES]}
            />
            <StatusGroup label="Severity / sensitivity" statuses={RULE_SEVERITIES} />
            <StatusGroup label="Consent" statuses={CONSENT_STATES} />
          </div>
        </Section>
      </div>

      {/* Table -------------------------------------------------------------- */}
      <div className="mt-10">
        <Section
          index="06"
          title="Data table"
          description="The workhorse: sticky headers, sortable columns, server-or-client pagination, hover-revealed row actions, and actionable empty states."
        >
          <DemoTable />
        </Section>
      </div>

      {/* Feedback ----------------------------------------------------------- */}
      <div className="mt-10">
        <Section
          index="07"
          title="Loading, empty, and error states"
          description="Every page ships all three. Loading mirrors final geometry; empty states explain and act; errors are recoverable and never raw."
        >
          <div className="grid gap-5 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Loading</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center gap-3 pt-1">
                  <Skeleton className="size-8 rounded-sm" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Empty</CardTitle>
              </CardHeader>
              <EmptyState
                icon={FileText}
                title="No evidence yet"
                body="Upload files and tag them to controls — the proof vault starts with a single artifact."
                action={
                  <Button size="sm">
                    <ArrowUpRight className="size-3.5" aria-hidden />
                    Upload evidence
                  </Button>
                }
              />
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Error</CardTitle>
              </CardHeader>
              <CardBody>
                <ErrorStateDemo />
              </CardBody>
            </Card>
          </div>
        </Section>
      </div>

      {/* Signals ------------------------------------------------------------ */}
      <div className="mt-10">
        <Section
          index="08"
          title="Signals"
          description="Small, hand-crafted touches that make a console feel operated, not generated."
        >
          <div className="grid gap-5 rounded-md border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Gauge, title: "Metric cards", body: "Label, tabular value, sparkline. No icon-in-a-circle." },
              { icon: Scale, title: "Record identity", body: "Code, status, version — the first thing a detail page shows." },
              { icon: Lock, title: "Audited actions", body: "Confirm modals for actions the audit trail records." },
              { icon: Bell, title: "Trace footers", body: "Who changed what, when — on every detail view." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-2">
                <div className="flex size-8 items-center justify-center rounded-sm border border-border bg-surface-2 text-ink-2">
                  <Icon className="size-4" aria-hidden />
                </div>
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="text-[13px] leading-relaxed text-ink-2">{body}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-ink-3">
        <span>
          Tokens: <span className="font-mono">src/app/globals.css</span> ·
          Primitives: <span className="font-mono">src/components/ui</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Database className="size-3.5" aria-hidden />
          Contract: <span className="font-mono">implementation.md</span>
        </span>
      </footer>
    </main>
  );
}

function StatusGroup({
  label,
  statuses,
}: {
  label: string;
  statuses: readonly string[];
}) {
  return (
    <div>
      <p className="micro-label mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {statuses.map((status) => (
          <StatusChip key={status} status={status} />
        ))}
      </div>
    </div>
  );
}
