"use client";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import {
  useCompleteErasure,
  useConfirmErasureItem,
  useErasurePack,
  useStartErasure,
} from "@/features/rights/hooks";

export function ErasureEvidencePanel({
  requestId,
  requestType,
}: {
  requestId: string;
  requestType: string;
}) {
  const enabled = requestType === "ERASURE";
  const pack = useErasurePack(requestId, enabled);
  const start = useStartErasure();
  const confirm = useConfirmErasureItem();
  const complete = useCompleteErasure();

  if (!enabled) return null;

  const data = pack.data;
  const pending =
    data?.checklist.filter(
      (i) => i.status === "PENDING" || i.status === "IN_PROGRESS",
    ).length ?? 0;

  return (
    <section className="mt-6 space-y-3 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Erasure evidence (Trace)</h3>
        {!data?.softDeletedAt ? (
          <Button
            size="sm"
            disabled={start.isPending}
            onClick={() =>
              void start.mutateAsync({
                id: requestId,
                body: { immediate: true },
              })
            }
          >
            Start erasure
          </Button>
        ) : null}
      </div>

      {pack.isError ? (
        <p className="text-xs text-fail">
          {pack.error instanceof ApiError
            ? pack.error.message
            : "Could not load erasure pack"}
        </p>
      ) : null}

      {data ? (
        <>
          <p className="text-xs text-ink-3">
            Soft-delete: {data.softDeletedAt ?? "—"}
            {data.coolingOffUntil
              ? ` · cooling-off until ${data.coolingOffUntil}`
              : ""}
            {data.immediateErase ? " · immediate" : ""}
            {data.hardDeletedAt ? ` · hard-delete ${data.hardDeletedAt}` : ""}
          </p>
          <ul className="space-y-2 text-sm">
            {data.checklist.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2"
              >
                <span>
                  {item.systemLabel}{" "}
                  <span className="text-xs text-ink-3">({item.status})</span>
                </span>
                {item.status === "PENDING" || item.status === "IN_PROGRESS" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={confirm.isPending}
                    onClick={() =>
                      void confirm.mutateAsync({
                        id: requestId,
                        body: { systemKey: item.systemKey, status: "DONE" },
                      })
                    }
                  >
                    Confirm done
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          {data.softDeletedAt && !data.hardDeletedAt ? (
            <Button
              size="sm"
              disabled={complete.isPending || pending > 0}
              onClick={() => void complete.mutateAsync(requestId)}
            >
              Complete hard erase
              {pending > 0 ? ` (${pending} pending)` : ""}
            </Button>
          ) : null}
        </>
      ) : (
        <p className="text-xs text-ink-3">
          No erasure pack yet. Start to seed the multi-system + vendor checklist.
        </p>
      )}
    </section>
  );
}
