import { ViolationsView } from "@/components/violations/violations-view";

export const metadata = {
  title: "Violations",
  description: "Non-compliance queue with severity",
};

export default function ViolationsPage() {
  return <ViolationsView />;
}
