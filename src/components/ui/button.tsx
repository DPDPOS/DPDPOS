import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover",
  secondary:
    "bg-surface text-ink border border-border hover:bg-surface-2 hover:border-border-strong",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "bg-fail text-white hover:bg-fail/90 focus-ring-danger",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-sm px-2.5 text-[13px]",
  md: "h-9 gap-1.5 rounded-sm px-3 text-sm",
  lg: "h-10 gap-2 rounded-md px-4 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "focus-ring inline-flex select-none items-center justify-center font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
