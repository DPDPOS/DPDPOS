import { CircleAlert } from "lucide-react";

export function FormAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-sm border border-fail/20 bg-fail-bg/60 px-3 py-2 text-[13px] text-fail"
    >
      <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
