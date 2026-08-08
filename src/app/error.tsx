"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TriangleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the failure to the console; the UI stays calm.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-sm border border-border bg-surface text-fail">
        <TriangleAlert className="size-5" aria-hidden />
      </div>
      <p className="micro-label text-ink-3">500 · Something broke</p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">
        The screen couldn&apos;t be rendered
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">
        An unexpected error occurred
        {error.digest ? (
          <>
            {" "}
            (reference{" "}
            <code className="rounded-sm bg-surface-2 px-1 font-mono text-xs">
              {error.digest}
            </code>
            )
          </>
        ) : null}
        . Your session is unaffected.
      </p>
      <Card className="mt-6 w-full p-4 text-left">
        <p className="font-mono text-[11px] leading-relaxed text-ink-3">
          {error.message || "Unknown error"}
        </p>
      </Card>
      <div className="mt-6 flex gap-2">
        <Button size="sm" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="secondary" size="sm" asChild>
          <a href="/dashboard">Back to dashboard</a>
        </Button>
      </div>
    </div>
  );
}
