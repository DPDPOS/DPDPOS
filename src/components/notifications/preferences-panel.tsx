"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useNotificationPreferences } from "@/features/notifications/hooks";
import { cn } from "@/lib/utils/cn";

interface PreferencesPanelProps {
  open: boolean;
  onClose: () => void;
}

const ROWS = [
  { key: "inApp" as const, label: "In-app", hint: "Bell badge and the center list." },
  { key: "email" as const, label: "Email", hint: "Digest of alerts sent to your inbox." },
  { key: "slack" as const, label: "Slack", hint: "Channel notifications when integrated." },
];

export function PreferencesPanel({ open, onClose }: PreferencesPanelProps) {
  const { data, isPending, mutation } = useNotificationPreferences(open);

  const toggle = (key: "email" | "inApp" | "slack") => {
    mutation.mutate({ [key]: !data?.[key] });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Notification preferences"
      description="Where the engine may reach you. Stored per user."
      footer={
        <Button size="sm" variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      {isPending ? (
        <div className="flex items-center gap-2 py-6 text-[13px] text-ink-2">
          <Spinner size="sm" label="Loading preferences" />
          Loading…
        </div>
      ) : (
        <div className="space-y-3">
          {ROWS.map((row) => {
            const checked = data?.[row.key] ?? false;
            return (
              <label
                key={row.key}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-sm border border-border px-3 py-2.5 transition-colors hover:bg-surface-2/50"
              >
                <span>
                  <span className="block text-[13px] font-medium text-ink">{row.label}</span>
                  <span className="mt-0.5 block text-xs text-ink-2">{row.hint}</span>
                </span>
                <span
                  role="switch"
                  aria-checked={checked}
                  aria-label={`${row.label} notifications`}
                  tabIndex={0}
                  onClick={() => toggle(row.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggle(row.key);
                    }
                  }}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full border transition-colors",
                    checked ? "border-accent bg-accent" : "border-border-strong bg-surface-2",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-3.5 rounded-full bg-surface shadow-sm transition-all",
                      checked ? "left-[18px]" : "left-0.5",
                    )}
                  />
                </span>
              </label>
            );
          })}
          <p className="text-xs leading-relaxed text-ink-3">
            All channels fall back to the in-app feed when disabled elsewhere.
            {mutation.isSuccess ? (
              <span className="ml-1 font-medium text-pass">Saved.</span>
            ) : null}
          </p>
          {mutation.isError ? (
            <p role="alert" className="text-xs text-fail">
              Could not save notification preferences. Please try again.
            </p>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}
