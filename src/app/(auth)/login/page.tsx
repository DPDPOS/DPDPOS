import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { RequireGuest } from "@/features/auth/components/require-guest";
import { DEMO_AVAILABLE } from "@/features/auth/demo-credentials";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <RequireGuest>
      <AuthShell
        title="Sign in"
        description="Access your organization's compliance workspace."
        footer={
          DEMO_AVAILABLE ? (
            <p className="text-xs leading-relaxed text-ink-3">
              Demo tenant —{" "}
              <span className="font-mono">admin@demo.dpdpos.local</span> /{" "}
              <span className="font-mono">ChangeMe123!</span>
            </p>
          ) : null
        }
      >
        <LoginForm />
      </AuthShell>
    </RequireGuest>
  );
}
