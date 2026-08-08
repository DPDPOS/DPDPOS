"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { StatusChip } from "@/components/ui/status-chip";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/format";
import type { AssessmentResponse } from "@/features/assessments/types";
import { useAssessments } from "@/features/assessments/hooks";
import { CreateAssessmentDrawer } from "./create-assessment-drawer";

export function AssessmentsView() {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isPending, isError, error, refetch } = useAssessments();

  const columns: TableColumn<AssessmentResponse>[] = [
    {
      key: "name",
      header: "Assessment",
      accessor: (row) => (
        <span className="text-[13px] font-medium text-ink">{row.name}</span>
      ),
      sortValue: (row) => row.name,
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => <StatusChip status={row.status} />,
    },
    {
      key: "version",
      header: "Version",
      accessor: (row) => <Badge variant="outline">v{row.currentVersion}</Badge>,
    },
    {
      key: "updated",
      header: "Updated",
      accessor: (row) => (
        <span className="text-[12px] text-ink-3">{formatDate(row.updatedAt)}</span>
      ),
      sortValue: (row) => row.updatedAt,
      sortable: true,
    },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Assessments</h1>
          <p className="mt-0.5 max-w-2xl text-[13px] text-ink-2">
            Full-page onboarding: upload policies → questionnaire → CLI scan →
            evaluate → version. Open a row to continue from the first incomplete
            step.
          </p>
        </div>
        <Can perm="assessment:create">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New assessment
          </Button>
        </Can>
      </header>

      {isError ? (
        <ErrorState
          title="Could not load assessments"
          message={
            error instanceof ApiError
              ? error.message
              : "Check that the backend assessment spine is running."
          }
          retry={() => void refetch()}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data ?? []}
          rowKey={(row) => row.id}
          loading={isPending}
          emptyTitle="No assessments yet"
          emptyBody="Create an assessment to start the guided onboarding flow."
          onRowClick={(row) => router.push(`/assessments/${row.id}`)}
        />
      )}

      <CreateAssessmentDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => router.push(`/assessments/${id}`)}
      />
    </div>
  );
}
