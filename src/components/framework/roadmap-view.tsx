"use client";

import { ArrowUpRight, CalendarPlus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/errors";
import { useFrameworkRoadmap } from "@/features/framework/hooks";
import { formatDate } from "@/lib/utils/format";
import { RoadmapPhases } from "./roadmap-phases";

/**
 * Roadmap page (plan §9.3) — the phased stepper with real due dates built
 * from the framework profile.
 */
export function RoadmapView() {
  const { data, isLoading, isError, error, refetch } = useFrameworkRoadmap();
  const hasNone = error instanceof ApiError && error.code === "NOT_FOUND";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isError && !hasNone) {
    return (
      <ErrorState
        title="Couldn't load the roadmap"
        message={error.message}
        retry={() => void refetch()}
      />
    );
  }

  if (hasNone || !data || !data.roadmapJson) {
    return (
      <div className="space-y-6">
        <header>
          <p className="micro-label">Programme</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Roadmap
          </h1>
        </header>
        <Card>
          <EmptyState
            icon={CalendarPlus}
            title="No roadmap yet"
            body="The roadmap is generated with your framework — build one first."
            action={
              <Button variant="secondary" size="sm" asChild>
                <Link href="/framework">
                  Build your framework
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const { roadmapJson, status, name, publishedAt } = data;

  return (
    <div className="space-y-6">
      <header>
        <p className="micro-label">Programme</p>
        <div className="mt-1 flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Roadmap
          </h1>
          <Badge variant={status === "PUBLISHED" ? "accent" : "default"}>
            {status}
          </Badge>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
          {name} · {roadmapJson.summary.controlCount} controls across{" "}
          {roadmapJson.summary.phaseCount} phases
          {publishedAt ? ` · published ${formatDate(publishedAt)}` : ""}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Phased plan</CardTitle>
          <span className="micro-label text-ink-3">
            generated {formatDate(roadmapJson.generatedAt)}
          </span>
        </CardHeader>
        <CardBody>
          <RoadmapPhases roadmap={roadmapJson} />
        </CardBody>
      </Card>
    </div>
  );
}
