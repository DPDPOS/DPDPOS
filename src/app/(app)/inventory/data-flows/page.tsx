"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { ErrorState } from "@/components/ui/error-state";
import { ApiError } from "@/lib/api/errors";

type FlowGraph = {
  nodes: Array<{
    id: string;
    kind: "asset" | "activity" | "vendor";
    label: string;
  }>;
  edges: Array<{ id: string; from: string; to: string; kind: string }>;
};

export default function DataFlowsPage() {
  const [data, setData] = useState<FlowGraph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const graph = await apiClient.get<FlowGraph>("/inventory/data-flows");
        setData(graph);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const layout = useMemo(() => {
    if (!data) return [];
    const byKind = {
      asset: data.nodes.filter((n) => n.kind === "asset"),
      activity: data.nodes.filter((n) => n.kind === "activity"),
      vendor: data.nodes.filter((n) => n.kind === "vendor"),
    };
    const positions = new Map<string, { x: number; y: number }>();
    const place = (
      nodes: typeof data.nodes,
      x: number,
    ) => {
      nodes.forEach((n, i) => {
        positions.set(n.id, { x, y: 40 + i * 56 });
      });
    };
    place(byKind.asset, 80);
    place(byKind.activity, 320);
    place(byKind.vendor, 560);
    return positions;
  }, [data]);

  const height = Math.max(
    240,
    ...(data?.nodes.map((_, i) => 80 + i * 20) ?? [240]),
  );

  return (
    <div className="space-y-4 p-6">
      <div>
        <p className="micro-label">Inventory</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Data flows</h1>
        <p className="mt-1 text-sm text-ink-2">
          Read-only graph of assets, processing activities, vendors, and links.
        </p>
      </div>

      {loading ? <p className="text-sm text-ink-3">Loading…</p> : null}
      {error ? (
        <ErrorState title="Couldn't load data flows" message={error} />
      ) : null}

      {data ? (
        <svg
          viewBox={`0 0 680 ${height}`}
          className="w-full max-w-4xl rounded-sm border border-border bg-surface"
          role="img"
          aria-label="Data flow graph"
        >
          {data.edges.map((e) => {
            const a = layout.get(e.from);
            const b = layout.get(e.to);
            if (!a || !b) return null;
            return (
              <line
                key={e.id}
                x1={a.x + 40}
                y1={a.y}
                x2={b.x - 40}
                y2={b.y}
                stroke="currentColor"
                className="text-border-strong"
                strokeWidth={1}
              />
            );
          })}
          {data.nodes.map((n) => {
            const p = layout.get(n.id);
            if (!p) return null;
            return (
              <g key={n.id} transform={`translate(${p.x - 40}, ${p.y - 14})`}>
                <rect
                  width={80}
                  height={28}
                  rx={2}
                  className="fill-surface-2 stroke-border"
                  strokeWidth={1}
                />
                <title>{`${n.kind}: ${n.label}`}</title>
                <text
                  x={40}
                  y={18}
                  textAnchor="middle"
                  className="fill-ink text-[9px]"
                >
                  {n.label.slice(0, 12)}
                </text>
              </g>
            );
          })}
        </svg>
      ) : null}
    </div>
  );
}
