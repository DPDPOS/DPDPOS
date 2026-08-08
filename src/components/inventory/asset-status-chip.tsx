import { cn } from "@/lib/utils/cn";

/** ACTIVE → pass tone, ARCHIVED → neutral (shared by the table + detail bar). */
export function AssetStatusChip({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const active = status === "ACTIVE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-xs font-medium",
        active
          ? "border-pass/20 bg-pass-bg text-pass"
          : "border-neutral/20 bg-neutral-bg text-neutral",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          active ? "bg-pass" : "bg-neutral",
        )}
      />
      <span className="tabular">{active ? "Active" : "Archived"}</span>
    </span>
  );
}
