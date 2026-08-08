import type { Metadata } from "next";
import { RoadmapView } from "@/components/framework/roadmap-view";
import { RequirePermission } from "@/features/auth/components/require-permission";

export const metadata: Metadata = {
  title: "Framework · Roadmap",
};

export default function RoadmapPage() {
  return (
    <RequirePermission perm="framework:read">
      <RoadmapView />
    </RequirePermission>
  );
}
