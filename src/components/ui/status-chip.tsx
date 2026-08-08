import { humanizeStatus, toneFor, type Tone } from "@/lib/constants/status-maps";
import { cn } from "@/lib/utils/cn";

const toneChip: Record<Tone, string> = {
  pass: "border-pass/20 bg-pass-bg text-pass",
  warn: "border-warn/20 bg-warn-bg text-warn",
  fail: "border-fail/20 bg-fail-bg text-fail",
  info: "border-info/20 bg-info-bg text-info",
  neutral: "border-neutral/20 bg-neutral-bg text-neutral",
};

const toneDot: Record<Tone, string> = {
  pass: "bg-pass",
  warn: "bg-warn",
  fail: "bg-fail",
  info: "bg-info",
  neutral: "bg-neutral",
};

export interface StatusChipProps {
  /** Backend enum member, e.g. "PENDING_VERIFICATION". */
  status: string;
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  const tone = toneFor(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-xs font-medium",
        toneChip[tone],
        className,
      )}
      title={status}
    >
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", toneDot[tone])}
      />
      <span className="tabular">{humanizeStatus(status)}</span>
    </span>
  );
}
