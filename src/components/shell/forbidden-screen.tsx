"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * 403 screen (plan §6.4) — the server still enforces permissions; this is the
 * UI that turns a denied route into an explanation instead of a raw error.
 */
export function ForbiddenScreen({ permission }: { permission?: string }) {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-sm border border-border bg-surface text-fail">
        <ShieldAlert className="size-5" aria-hidden />
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-ink">
        You don&apos;t have access to this area
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">
        This screen is gated by a permission your role doesn&apos;t hold.
        {permission ? (
          <>
            {" "}
            It requires{" "}
            <code className="rounded-sm bg-surface-2 px-1 font-mono text-xs text-ink">
              {permission}
            </code>
            .
          </>
        ) : null}{" "}
        Ask an organisation admin to update your role.
      </p>
      <Card className="mt-6 w-full p-4 text-left">
        <p className="text-[13px] leading-relaxed text-ink-2">
          The sidebar already hides areas you can&apos;t read — this screen is
          the fallback for direct links. Your session is intact.
        </p>
      </Card>
      <div className="mt-6">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
