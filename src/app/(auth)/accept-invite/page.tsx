import type { Metadata } from "next";
import { Suspense } from "react";
import { AcceptInviteForm } from "@/features/auth/components/accept-invite-form";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { RequireGuest } from "@/features/auth/components/require-guest";

export const metadata: Metadata = { title: "Accept invite" };

export default function AcceptInvitePage() {
  return (
    <RequireGuest>
      <AuthShell
        title="Accept your invite"
        description="Set your password to activate your DPDPOS account."
      >
        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <div className="size-6 animate-spin rounded-full border-2 border-border border-t-accent" />
            </div>
          }
        >
          <AcceptInviteForm />
        </Suspense>
      </AuthShell>
    </RequireGuest>
  );
}
