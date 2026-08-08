import type { Metadata } from "next";
import { RequirementsView } from "@/components/requirements/requirements-view";
import { RequirePermission } from "@/features/auth/components/require-permission";

export const metadata: Metadata = {
  title: "Obligations",
};

export default function RequirementsPage() {
  return (
    <RequirePermission perm="requirement:read">
      <RequirementsView />
    </RequirePermission>
  );
}
