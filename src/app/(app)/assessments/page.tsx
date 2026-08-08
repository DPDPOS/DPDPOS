import type { Metadata } from "next";
import { AssessmentsView } from "@/components/assessments/assessments-view";
import { RequirePermission } from "@/features/auth/components/require-permission";

export const metadata: Metadata = {
  title: "Assessments",
  description: "Gap assessment, CLI evidence and compliance reports",
};

export default function AssessmentsPage() {
  return (
    <RequirePermission perm="assessment:read">
      <AssessmentsView />
    </RequirePermission>
  );
}
