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
  const result = useSubjectLocator(submitted);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subject locator</h1>
        <p className="text-sm text-muted-foreground">
          Trace-parity: find where a principal&apos;s data may live across consent,
          rights, processing, and vendors.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-md"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Email, phone, or subject id…"
          onKeyDown={(e) => {
            if (e.key === "Enter") setSubmitted(q.trim());
          }}
        />
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
                {c.subjectReference} · {c.purpose} · {c.state}
              </li>
            ))}
          />
          <HitCard
            title="Rights requests"
            empty="No DSAR hits"
            items={result.data.hits.dataSubjectRequests.map((r) => (
              <li key={r.id}>
                <Link className="text-primary underline" href="/rights">
                  {r.requestType}
                </Link>{" "}
                · {r.status}
              </li>
            ))}
          />
          <HitCard
            title="Processing activities"
            empty="No activity hits"
            items={result.data.hits.processingActivities.map((a) => (
              <li key={a.id}>
                {a.purpose}
                {a.vendorName ? ` · vendor ${a.vendorName}` : ""}
                {a.processorName ? ` · ${a.processorName}` : ""}
              </li>
            ))}
          />
          <HitCard
            title="Vendors"
            empty="No vendor hits"
            items={result.data.hits.vendors.map((v) => (
              <li key={v.id}>
                <Link className="text-primary underline" href={`/vendors/${v.id}`}>
                  {v.name}
                </Link>{" "}
                · {v.status} · {v.criticality}
              </li>
            ))}
          />
        </div>
      ) : null}
    </div>
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
    <section className="rounded-md border p-4">
      <h2 className="mb-2 text-sm font-medium">{title}</h2>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1 text-sm">{items}</ul>
      )}
    </section>
  );
}
