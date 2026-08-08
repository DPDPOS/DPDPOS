import type { Metadata } from "next";
import { FrameworkView } from "@/components/framework/framework-view";
import { RequirePermission } from "@/features/auth/components/require-permission";

export const metadata: Metadata = {
  title: "Framework",
};

export default function FrameworkPage() {
  return (
    <RequirePermission perm="framework:read">
      <FrameworkView />
    </RequirePermission>
  );
}
