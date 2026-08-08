import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  /** What this area is for and why it is empty. */
  body?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  body,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-start gap-3 p-8", className)}>
      <div className="flex size-9 items-center justify-center rounded-sm border border-border bg-surface-2 text-ink-3">
        <Icon className="size-4" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {body ? (
          <p className="mt-1 max-w-md text-[13px] leading-relaxed text-ink-2">
            {body}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
