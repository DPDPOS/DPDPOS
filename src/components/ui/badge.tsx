import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "accent" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-2 text-ink-2 border border-border",
  accent: "bg-accent-soft text-accent border border-accent/20",
  outline: "bg-surface text-ink-2 border border-border-strong",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
