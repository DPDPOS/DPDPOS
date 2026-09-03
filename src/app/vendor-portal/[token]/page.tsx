"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const API =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000/api/v1";

export default function VendorPortalPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [vendor, setVendor] = useState<{
    name: string;
    services: string | null;
    countries: string[];
    notes: string | null;
  } | null>(null);
  const [services, setServices] = useState("");
  const [countries, setCountries] = useState("");
  const [notes, setNotes] = useState("");
  const [evidenceFileId, setEvidenceFileId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${API}/vendor-portal/${token}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message || "Load failed");
        setVendor(json.data.vendor);
        setServices(json.data.vendor.services ?? "");
        setCountries((json.data.vendor.countries ?? []).join(", "));
        setNotes(json.data.vendor.notes ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Load failed");
      }
    })();
  }, [token]);

  async function save() {
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`${API}/vendor-portal/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: services.trim() || undefined,
          notes: notes.trim() || undefined,
          countries: countries
            .split(/[,;\s]+/)
            .map((c) => c.trim().toUpperCase())
            .filter((c) => c.length === 2),
          evidenceFileId: evidenceFileId.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Save failed");
      setVendor(json.data);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  if (error && !vendor) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-12">
      <div>
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Vendor portal
        </p>
        <h1 className="mt-1 text-2xl font-semibold">
          {vendor?.name ?? "Loading…"}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Update profile fields and attach DPA evidence (file ID). No full console
          access.
        </p>
      </div>

      {vendor ? (
        <div className="space-y-4">
          <Field label="Services" htmlFor="services">
            <Input
              id="services"
              value={services}
              onChange={(e) => setServices(e.target.value)}
            />
          </Field>
          <Field label="Countries (ISO)" htmlFor="countries">
            <Input
              id="countries"
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              placeholder="IN, SG"
            />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <textarea
              id="notes"
              rows={4}
              className="w-full rounded-sm border px-2.5 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          <Field label="DPA evidence file ID" htmlFor="evidence">
            <Input
              id="evidence"
              value={evidenceFileId}
              onChange={(e) => setEvidenceFileId(e.target.value)}
              placeholder="Evidence UUID"
            />
          </Field>
          <Button onClick={() => void save()}>Save</Button>
          {saved ? <p className="text-sm text-green-700">Saved.</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      ) : null}
    </main>
  );
}
