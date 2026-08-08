"use client";

import { ErrorState } from "@/components/ui/error-state";

/** Gallery demo — keeps the interactive retry inside a client component. */
export function ErrorStateDemo() {
  return (
    <ErrorState
      message="The validation run failed. Check the run details and try again."
      retry={() => undefined}
      back={{ label: "Back to validations", href: "#" }}
    />
  );
}
