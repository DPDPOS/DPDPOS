import { cn } from "@/lib/utils/cn";

export function Kbd({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-border bg-surface-2 px-1.5 font-mono text-[11px] font-medium text-ink-2",
        className,
      )}
      {...props}
    />
  );
}
