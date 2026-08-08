import type { Tone } from "@/lib/constants/status-maps";
import { cn } from "@/lib/utils/cn";

/**
 * Hand-rolled SVG charts (plan §2 — "hand-rolled SVG sparklines, bars, donuts;
 * recharts only if a complex chart is needed"). Dense, tabular, and tinted by
 * the same tone tokens as the status chips.
 */

/* ProgressRing ------------------------------------------------------------ */

export interface ProgressRingProps {
  /** 0–100. */
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        role="img"
        aria-label={`${Math.round(clamped)}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface-2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-current transition-[stroke-dashoffset] duration-200 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/* BarList ------------------------------------------------------------------ */

export interface BarDatum {
  label: string;
  value: number;
  tone?: Tone;
}

const barTone: Record<Tone, string> = {
  pass: "bg-pass",
  warn: "bg-warn",
  fail: "bg-fail",
  info: "bg-info",
  neutral: "bg-neutral/50",
};

export interface BarListProps {
  items: BarDatum[];
  className?: string;
  emptyLabel?: string;
}

/** Horizontal value bars — longest bar sets the scale so rows stay readable. */
export function BarList({ items, className, emptyLabel = "No data yet" }: BarListProps) {
  const max = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return <p className="text-[13px] text-ink-3">{emptyLabel}</p>;
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {items.map(({ label, value, tone = "neutral" }) => (
        <div key={label}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-ink-2">{label}</span>
            <span className="tabular text-[13px] font-medium text-ink">
              {value}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-sm bg-surface-2">
            <div
              className={cn("h-full rounded-sm", barTone[tone])}
              style={{ width: `${Math.max((value / max) * 100, value > 0 ? 3 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* MiniDonut ---------------------------------------------------------------- */

export interface DonutSegment {
  label: string;
  value: number;
  /** Tailwind stroke class, e.g. "stroke-pass". */
  className: string;
}

export interface MiniDonutProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  className?: string;
  children?: React.ReactNode;
}

export function MiniDonut({
  segments,
  size = 128,
  thickness = 16,
  className,
  children,
}: MiniDonutProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const visible = segments.filter((segment) => segment.value > 0);
  // Pure cumulative offset (n is tiny — at most 3 segments), kept mutation-free
  // to satisfy the hooks purity rule.
  const arcs = visible.map((segment, index) => {
    const length = (segment.value / (total || 1)) * circumference;
    const offset = visible
      .slice(0, index)
      .reduce(
        (sum, earlier) => sum + (earlier.value / (total || 1)) * circumference,
        0,
      );
    return {
      ...segment,
      dash: `${Math.max(length - 1, 0)} ${circumference - length + 1}`,
      offset: -offset,
    };
  });

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        role="img"
        aria-label={`${total} total`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-surface-2"
        />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={thickness}
            className={arc.className}
            strokeDasharray={arc.dash}
            strokeDashoffset={arc.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
