import { cn } from "@/lib/utils/cn";

export interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Visually-hidden status label for screen readers. */
  label?: string;
}

const sizeClasses = {
  sm: "size-3.5 border-[1.5px]",
  md: "size-5 border-2",
  lg: "size-6 border-2",
} as const;

export function Spinner({
  className,
  size = "md",
  label = "Loading",
}: SpinnerProps) {
  return (
    <span role="status" className={cn("inline-flex", className)}>
      <span
        aria-hidden
        className={cn(
          "animate-spin rounded-full border-border border-t-accent",
          sizeClasses[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
