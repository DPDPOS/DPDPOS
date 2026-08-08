import type { Metadata } from "next";
import { Suspense } from "react";
import { MfaRouter } from "@/features/auth/components/mfa-router";

export const metadata: Metadata = { title: "Two-factor verification" };

export default function MfaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-bg">
          <div className="size-6 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      }
    >
      <MfaRouter />
    </Suspense>
  );
}
