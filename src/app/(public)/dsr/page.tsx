"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const REQUEST_TYPES = [
  "ACCESS",
  "CORRECTION",
  "COMPLETION",
  "UPDATING",
  "ERASURE",
  "GRIEVANCE_REDRESSAL",
  "NOMINATION",
] as const;

/**
 * Public (unauthenticated) DSR intake form.
 * Posts to backend `/api/v1/public/dsr`.
 */
export default function PublicDsrPage() {
  const [organizationId, setOrganizationId] = useState("");
  const [requestType, setRequestType] =
    useState<(typeof REQUEST_TYPES)[number]>("ACCESS");
  const [requesterReference, setRequesterReference] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const base =
        process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
        "http://localhost:3000/api/v1";
      const res = await fetch(`${base}/public/dsr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: organizationId.trim() || undefined,
          organizationSlug: !organizationId.trim()
            ? undefined
            : undefined,
          requestType,
          requesterReference: requesterReference.trim(),
          description: description.trim() || undefined,
        }),
      });
      const json = (await res.json()) as {
        data?: { id: string; deduped?: boolean; status: string };
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(json.error?.message || `Request failed (${res.status})`);
      }
      setResult(
        json.data?.deduped
          ? `Existing request ${json.data.id} (${json.data.status})`
          : `Submitted ${json.data?.id} (${json.data?.status})`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-12">
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Public rights request
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Submit a data subject request
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          No login required. We will email you if you provide an email address.
        </p>
      </div>

      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <Field label="Organisation ID" htmlFor="org">
          <Input
            id="org"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            placeholder="UUID of the organisation"
            required
          />
        </Field>
        <Field label="Request type" htmlFor="type">
          <select
            id="type"
            className="w-full rounded-sm border px-2.5 py-2 text-sm"
            value={requestType}
            onChange={(e) =>
              setRequestType(e.target.value as (typeof REQUEST_TYPES)[number])
            }
          >
            {REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Your email or reference" htmlFor="ref">
          <Input
            id="ref"
            value={requesterReference}
            onChange={(e) => setRequesterReference(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </Field>
        <Field label="Description (optional)" htmlFor="desc">
          <textarea
            id="desc"
            rows={4}
            className="w-full rounded-sm border px-2.5 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={busy}>
          {busy ? "Submitting…" : "Submit request"}
        </Button>
      </form>

      {result ? <p className="text-sm text-green-700">{result}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
