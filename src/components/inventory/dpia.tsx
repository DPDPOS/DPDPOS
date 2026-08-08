import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { DPIA_CONTROL_CODE } from "@/features/processingActivities/types";
import { cn } from "@/lib/utils/cn";

/**
 * Advisory chip shown on processing rows whose asset is HIGH/CRITICAL —
 * the backend derives the DPIA duty from the framework control
 * CTRL-SDF-DPIA, so this links there instead of pretending the backend
 * tracks DPIA status per activity.
 */
export function DpiaChip({ className }: { className?: string }) {
  return (
    <Link
      href="/controls"
      title={`High-risk processing — DPIA likely required (DPDP Act s.17). Track delivery under ${DPIA_CONTROL_CODE}.`}
      className={cn(
        "focus-ring inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border border-warn/20 bg-warn-bg px-1.5 py-0.5 text-xs font-medium text-warn transition-colors hover:border-warn/40",
        className,
      )}
    >
      <ShieldAlert className="size-3" aria-hidden />
      DPIA likely
    </Link>
  );
}

/**
 * Banner shown inside the activity drawer when the selected asset is
 * HIGH/CRITICAL sensitivity. Plain-language explainer + link to the control.
 */
export function DpiaBanner({ assetName }: { assetName?: string }) {
  return (
    <div
      role="note"
      className="rounded-sm border border-warn/25 bg-warn-bg/50 px-3 py-2.5"
    >
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-warn">
        <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
        High-risk processing detected
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-2">
        {assetName ? (
          <>
            <span className="font-medium text-ink">{assetName}</span> is
            high-risk personal data — a DPIA is likely required before this
            processing starts (DPDP Act 2023 s.17). Record the assessment
            against the{" "}
            <Link
              href="/controls"
              className="focus-ring rounded-sm font-medium text-accent underline-offset-2 hover:underline"
            >
              {DPIA_CONTROL_CODE}
            </Link>{" "}
            control.
          </>
        ) : (
          <>
            A DPIA is likely required before this processing starts (DPDP Act
            2023 s.17). Record the assessment against the{" "}
            <Link
              href="/controls"
              className="focus-ring rounded-sm font-medium text-accent underline-offset-2 hover:underline"
            >
              {DPIA_CONTROL_CODE}
            </Link>{" "}
            control.
          </>
        )}
      </p>
    </div>
  );
}
