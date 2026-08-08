import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Styled native <select> — 36px control height per §4.2. Native semantics
 * keep it accessible (keyboard, screen readers) with no menu implementation.
 */
export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          "h-9 w-full cursor-pointer appearance-none rounded-sm border bg-surface pl-2.5 pr-8 text-[13px] text-ink outline-none transition-colors focus-ring",
          invalid
            ? "border-fail"
            : "border-border hover:border-border-strong",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3"
        aria-hidden
      />
    </div>
  );
}
