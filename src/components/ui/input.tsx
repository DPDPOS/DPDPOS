import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Set true (or aria-invalid) to render the error border. */
  invalid?: boolean;
}

export function Input({
  className,
  invalid,
  "aria-invalid": ariaInvalid,
  ...props
}: InputProps) {
  return (
    <input
      className={cn(
        "focus-ring h-9 w-full rounded-sm border bg-surface px-2.5 text-sm text-ink",
        "border-border placeholder:text-ink-3",
        "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60",
        "aria-[invalid=true]:border-fail aria-[invalid=true]:focus-visible:outline-fail",
        className,
      )}
      {...props}
      aria-invalid={invalid ? true : ariaInvalid}
    />
  );
}
