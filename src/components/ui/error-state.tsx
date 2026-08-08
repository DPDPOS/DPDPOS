"use client";

import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
  back?: { label: string; href: string };
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  retry,
  back,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-md border border-fail/20 bg-fail-bg/50 p-4",
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-fail" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium text-fail">{title}</p>
        {message ? (
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-2">
            {message}
          </p>
        ) : null}
        {retry || back ? (
          <div className="mt-3 flex items-center gap-2">
            {retry ? (
              <Button variant="secondary" size="sm" onClick={retry}>
                Try again
              </Button>
            ) : null}
            {back ? (
              <Link
                href={back.href}
                className="focus-ring inline-flex h-8 select-none items-center gap-1.5 rounded-sm px-2.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {back.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
