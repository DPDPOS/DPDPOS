import type { Metadata } from "next";
import { ControlsView } from "@/components/controls/controls-view";
import { RequirePermission } from "@/features/auth/components/require-permission";

export const metadata: Metadata = {
  title: "Controls",
};

export default function ControlsPage() {
  return (
    <RequirePermission perm="control:read">
      <ControlsView />
    </RequirePermission>
  );
}
