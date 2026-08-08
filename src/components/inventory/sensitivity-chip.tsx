import { cn } from "@/lib/utils/cn";
import { humanizeSensitivity } from "@/features/dataAssets/types";

/**
 * Data sensitivity chip (plan §9.4): LOW → neutral, MEDIUM/HIGH → warn,
 * CRITICAL → fail. The fail tone on CRITICAL doubles as the DPIA trigger
 * signal for high-risk processing.
 */
export function SensitivityChip({
  sensitivity,
  className,
}: {
  sensitivity: string;
  className?: string;
}) {
  const tone =
    sensitivity === "CRITICAL"
      ? "border-fail/20 bg-fail-bg text-fail"
      : sensitivity === "HIGH" || sensitivity === "MEDIUM"
        ? "border-warn/20 bg-warn-bg text-warn"
        : "border-neutral/20 bg-neutral-bg text-neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          sensitivity === "CRITICAL"
            ? "bg-fail"
            : sensitivity === "HIGH" || sensitivity === "MEDIUM"
              ? "bg-warn"
              : "bg-neutral",
        )}
      />
      <span className="tabular">{humanizeSensitivity(sensitivity)}</span>
    </span>
  );
}
