import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-sm border border-border bg-surface text-ink-3">
        <SearchX className="size-5" aria-hidden />
      </div>
      <p className="micro-label text-ink-3">404 · Not found</p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">
        The route you followed is either mistyped, archived, or not part of the
        build yet. The sidebar shows what&apos;s live and what&apos;s coming.
      </p>
      <Card className="mt-6 w-full p-4 text-left">
        <p className="text-[13px] leading-relaxed text-ink-2">
          Many planned sections render disabled with a phase chip until their
          screen ships — use the search bar to see the full map.
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
