import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface AuthShellProps {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export function AuthShell({ title, description, footer, children }: AuthShellProps) {
  return (
    <main className="flex min-h-dvh items-start justify-center bg-bg px-4 pb-16 pt-16 sm:pt-24">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-border bg-surface text-accent">
            <ShieldCheck className="size-4" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-ink">DPDPOS</p>
            <p className="micro-label">Compliance console</p>
          </div>
        </div>

        <Card className="p-6">
          <h1 className="text-lg font-semibold text-ink">{title}</h1>
          {description ? (
            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
              {description}
            </p>
          ) : null}
          <div className="mt-5">{children}</div>
        </Card>

        {footer ? <div className="mt-4 text-center">{footer}</div> : null}
      </div>
    </main>
  );
}
