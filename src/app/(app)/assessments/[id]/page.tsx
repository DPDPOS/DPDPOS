"use client";

import { use } from "react";
import { AssessmentWizard } from "@/components/assessments/assessment-wizard";
import { RequirePermission } from "@/features/auth/components/require-permission";

export default function AssessmentWizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <RequirePermission perm="assessment:read">
      <AssessmentWizard assessmentId={id} />
    </RequirePermission>
  );
}
