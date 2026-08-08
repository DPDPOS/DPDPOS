"use client";

import { ArrowUpRight, CalendarPlus, Check, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/errors";
import { useFrameworkRoadmap, usePublishFramework } from "@/features/framework/hooks";
import type { FrameworkResponse } from "@/features/framework/types";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { FrameworkWizard } from "./framework-wizard";
import { RoadmapPhases } from "./roadmap-phases";

/**
 * Programme home (plan §9.3). No framework → actionable empty state opening
 * the wizard; otherwise the identity bar, summary and a compact roadmap with
 * regenerate / publish (audited confirm) actions.
 */
export function FrameworkView() {
  const roadmapQuery = useFrameworkRoadmap();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const error = roadmapQuery.error;
  const hasNone = error instanceof ApiError && error.code === "NOT_FOUND";

  if (roadmapQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error && !hasNone) {
    return (
      <ErrorState
        title="Couldn't load the programme"
        message={error.message}
        retry={() => void roadmapQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {hasNone || !roadmapQuery.data ? (
        <>
          <header>
            <p className="micro-label">Programme</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Framework
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-2">
              Your compliance programme is generated from a profile — the
              backend picks the controls, obligations and phased due dates for
              your organisation.
            </p>
          </header>
          <Card>
            <EmptyState
              icon={Sparkles}
              title="No compliance programme yet"
              body="Answer a few profile questions and the system generates a DPDP Act-based control set with a phased roadmap. Nothing to configure by hand."
              action={
                <Button onClick={() => setWizardOpen(true)}>
                  Build your framework
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Button>
              }
            />
          </Card>
        </>
      ) : (
        <ProgrammeBoard
          framework={roadmapQuery.data}
          onRegenerate={() => setWizardOpen(true)}
          onPublish={() => setConfirmPublish(true)}
        />
      )}

      <FrameworkWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        mode={roadmapQuery.data?.status === "DRAFT" ? "regenerate" : "create"}
      />

      <PublishConfirmDialog
        framework={roadmapQuery.data ?? null}
        open={confirmPublish}
        onClose={() => setConfirmPublish(false)}
      />
    </div>
  );
}

function ProgrammeBoard({
  framework,
  onRegenerate,
  onPublish,
}: {
  framework: FrameworkResponse;
  onRegenerate: () => void;
  onPublish: () => void;
}) {
  const roadmap = framework.roadmapJson;
  const isDraft = framework.status === "DRAFT";

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">Programme</p>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {framework.name}
            </h1>
            <Badge variant={isDraft ? "default" : "accent"}>
              {framework.status}
            </Badge>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
            {framework.industryProfile} · {humanize(framework.maturityLevel)} maturity
            {framework.isSdf ? " · Significant Data Fiduciary" : ""}
            {framework.publishedAt ? (
              <>
                {" "}
                · published {formatDate(framework.publishedAt)}
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/framework/roadmap">
              <CalendarPlus className="size-3.5" aria-hidden />
              Roadmap
            </Link>
          </Button>
          <Can perm="framework:generate">
            <Button variant="secondary" size="sm" onClick={onRegenerate}>
              Regenerate
            </Button>
          </Can>
          <Can perm="framework:publish">
            <Button
              size="sm"
              onClick={onPublish}
              disabled={!isDraft}
              title={!isDraft ? "Framework is already published" : undefined}
            >
              <Check className="size-3.5" aria-hidden />
              Publish
            </Button>
          </Can>
        </div>
      </header>

      {roadmap ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryStat
            icon={Layers}
            label="Controls"
            value={roadmap.summary.controlCount}
          />
          <SummaryStat
            icon={Sparkles}
            label="Obligations"
            value={roadmap.summary.requirementCount}
          />
          <SummaryStat
            icon={CalendarPlus}
            label="Roadmap phases"
            value={roadmap.summary.phaseCount}
          />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Roadmap preview</CardTitle>
          <span className="micro-label text-ink-3">
            {roadmap ? `generated ${formatDate(roadmap.generatedAt)}` : ""}
          </span>
        </CardHeader>
        <CardBody>
          {roadmap ? (
            <RoadmapPhases roadmap={roadmap} />
          ) : (
            <p className="text-[13px] text-ink-3">
              Roadmap not available — regenerate the framework.
            </p>
          )}
        </CardBody>
      </Card>
    </>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border bg-surface-2 text-ink-3">
          <Icon className="size-4" aria-hidden />
        </div>
        <div>
          <p className="tabular text-lg font-semibold leading-tight text-ink">
            {value}
          </p>
          <p className="micro-label text-ink-3">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}

/** Audited privileged action (plan §6.5) — publish gets a double-confirm. */
function PublishConfirmDialog({
  framework,
  open,
  onClose,
}: {
  framework: FrameworkResponse | null;
  open: boolean;
  onClose: () => void;
}) {
  const publish = usePublishFramework();
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!framework) return;
    setError(null);
    try {
      await publish.mutateAsync(framework.id);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Publish failed.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Publish programme"
      description="This action is audited and archives any other published version."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void confirm()}
            disabled={publish.isPending}
          >
            {publish.isPending ? "Publishing…" : "Confirm publish"}
          </Button>
        </>
      }
    >
      <p className={cn("text-[13px] leading-relaxed text-ink-2")}>
        <span className="font-medium text-ink">{framework?.name}</span> will
        become the published programme. Controls and obligations registers
        immediately reflect it, and the dashboard score reacts from the next
        validation run.
      </p>
      {error ? (
        <p role="alert" className="mt-3 rounded-sm border border-fail/20 bg-fail-bg/50 px-3 py-2 text-xs text-fail">
          {error}
        </p>
      ) : null}
    </Dialog>
  );
}

function humanize(value: string | null): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
