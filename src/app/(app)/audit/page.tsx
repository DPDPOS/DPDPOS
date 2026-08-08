import { AuditView } from "@/components/audit/audit-view";

export const metadata = {
  title: "Audit",
  description: "Immutable activity trail",
};

export default function AuditPage() {
  return <AuditView />;
}
