import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { RequireGuest } from "@/features/auth/components/require-guest";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = { title: "Create organization" };

export default function SignupPage() {
  return (
    <RequireGuest>
      <AuthShell
        title="Create your organization"
        description="Provision a new DPDPOS workspace and admin account."
      >
        <SignupForm />
      </AuthShell>
    </RequireGuest>
  );
}
