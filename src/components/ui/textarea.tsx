import { cn } from "@/lib/utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({
  className,
  invalid,
  "aria-invalid": ariaInvalid,
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={cn(
        "focus-ring w-full rounded-sm border bg-surface px-2.5 py-2 text-sm text-ink",
        "border-border placeholder:text-ink-3",
        "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60",
        "aria-[invalid=true]:border-fail",
        className,
      )}
      {...props}
      aria-invalid={invalid ? true : ariaInvalid}
    />
  );
}
