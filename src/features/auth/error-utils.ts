import type { FieldValues, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/errors";

type SetErrorName<TFieldValues extends FieldValues> = Parameters<
  UseFormSetError<TFieldValues>
>[0];

/**
 * Maps VALIDATION_ERROR `details.fieldErrors` (zod flatten) onto react-hook-form
 * field errors. Generic over the form's field paths so callers can pass their
 * typed `setError` directly.
 */
export function applyFieldErrors<TFieldValues extends FieldValues>(
  err: ApiError,
  setError: UseFormSetError<TFieldValues>,
): void {
  const details = err.details as
    | { fieldErrors?: Record<string, string[]> }
    | undefined;
  if (!details?.fieldErrors) return;
  for (const [field, messages] of Object.entries(details.fieldErrors)) {
    const first = messages?.[0];
    if (first) {
      setError(field as SetErrorName<TFieldValues>, {
        type: "server",
        message: first,
      });
    }
  }
}

/** Human-facing message per error code (plan §7.4 policy). */
export function authErrorMessage(err: ApiError): string {
  switch (err.code) {
    case "NETWORK_ERROR":
      return "Cannot reach the server. Is the backend running?";
    case "RATE_LIMITED":
      return "Too many attempts. Please wait a moment and try again.";
    case "SERVICE_UNAVAILABLE":
      return "The service is temporarily unavailable. Please try again.";
    default:
      return err.message;
  }
}
