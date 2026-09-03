"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubjectLocator } from "@/features/subjectLocator/hooks";
import { ApiError } from "@/lib/api/errors";

export function SubjectLocatorView() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [limit, setLimit] = useState(50);
  const result = useSubjectLocator(submitted, limit);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subject locator</h1>
        <p className="text-sm text-muted-foreground">
          Trace-parity: find where a principal&apos;s data may live across consent,
          rights, processing, assets, evidence, and vendors.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Input
          className="max-w-md"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Email, phone, or subject id…"
          onKeyDown={(e) => {
            if (e.key === "Enter") setSubmitted(q.trim());
          }}
        />
        <label className="text-xs text-muted-foreground">
          Limit
          <Input
            className="mt-1 w-20"
            type="number"
            min={1}
            max={200}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 50)}
          />
        </label>
        <Button onClick={() => setSubmitted(q.trim())} disabled={q.trim().length < 2}>
          Search
        </Button>
      </div>

      {result.isError ? (
        <p className="text-sm text-destructive">
          {result.error instanceof ApiError
            ? result.error.message
            : "Search failed"}
        </p>
      ) : null}

      {result.data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <HitCard
            title="Consent records"
            empty="No consent hits"
            items={result.data.hits.consentRecords.map((c) => (
              <li key={c.id}>
                <ScoreBadge score={c.score} match={c.match} />{" "}
                {c.subjectReference} · {c.purpose} · {c.state}
              </li>
            ))}
          />
          <HitCard
            title="Rights requests"
            empty="No DSAR hits"
            items={result.data.hits.dataSubjectRequests.map((r) => (
              <li key={r.id}>
                <ScoreBadge score={r.score} match={r.match} />{" "}
                <Link className="text-primary underline" href="/rights">
                  {r.requestType}
                </Link>{" "}
                · {r.status}
              </li>
            ))}
          />
          <HitCard
            title="Data assets"
            empty="No asset hits"
            items={(result.data.hits.dataAssets ?? []).map((a) => (
              <li key={a.id}>
                <ScoreBadge score={a.score} match={a.match} /> {a.assetName}
                {a.storageLocation ? ` · ${a.storageLocation}` : ""}
              </li>
            ))}
          />
          <HitCard
            title="Evidence files"
            empty="No evidence hits"
            items={(result.data.hits.evidenceFiles ?? []).map((e) => (
              <li key={e.id}>
                <ScoreBadge score={e.score} match={e.match} /> {e.fileName}
              </li>
            ))}
          />
          <HitCard
            title="Processing activities"
            empty="No activity hits"
            items={result.data.hits.processingActivities.map((a) => (
              <li key={a.id}>
                <ScoreBadge score={a.score} match={a.match} /> {a.purpose}
                {a.vendorName ? ` · vendor ${a.vendorName}` : ""}
              </li>
            ))}
          />
          <HitCard
            title="Vendors"
            empty="No vendor hits"
            items={result.data.hits.vendors.map((v) => (
              <li key={v.id}>
                <ScoreBadge score={v.score} match={v.match} /> {v.name} ·{" "}
                {v.criticality}
              </li>
            ))}
          />
          <HitCard
            title="Audit log"
            empty="No audit hits"
            items={(result.data.hits.auditLogs ?? []).map((a) => (
              <li key={a.id}>
                <ScoreBadge score={a.score} match={a.match} /> {a.action} ·{" "}
                {a.entityType}
              </li>
            ))}
          />
          <HitCard
            title="Vendor agreements"
            empty="No agreement hits"
            items={(result.data.hits.vendorAgreements ?? []).map((a) => (
              <li key={a.id}>
                <ScoreBadge score={a.score} match={a.match} /> {a.title}
                {a.vendorName ? ` · ${a.vendorName}` : ""}
              </li>
            ))}
          />
        </div>
      ) : null}
    </div>
  );
}

function ScoreBadge({
  score,
  match,
}: {
  score?: number;
  match?: string;
}) {
  if (score == null) return null;
  return (
    <span className="mr-1 inline-flex rounded-sm border border-border px-1 font-mono text-[10px] text-muted-foreground">
      {score}
      {match ? `·${match}` : ""}
    </span>
  );
}

function HitCard({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: React.ReactNode[];
}) {
  return (
    <section className="rounded-sm border border-border p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">{items}</ul>
      )}
    </section>
  );
}
