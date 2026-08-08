import { useRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name: string;
  className?: string;
}

/** Radio-style segmented control for small enum sets (maturity, sensitivity). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  name,
  className,
}: SegmentedProps<T>) {
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Roving tabindex + arrow keys, as expected of a radiogroup.
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + direction + options.length) % options.length;
    onChange(options[next].value);
    optionRefs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        "inline-flex w-full rounded-sm border border-border bg-surface p-0.5",
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              optionRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "focus-ring flex-1 rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
              selected
                ? "bg-surface-2 text-ink shadow-sm"
                : "text-ink-2 hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
