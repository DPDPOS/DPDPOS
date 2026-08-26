"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useAddRelationship,
  useAcknowledgeRelationship,
  useCreateAgreement,
  useCreateReview,
  useCreateVendor,
  useOffboardVendor,
  useUpdateVendor,
  useVendor,
  useVendorAgreements,
  useVendorRelationships,
  useVendorReviews,
  useVendorRisk,
  useVendors,
} from "@/features/vendors/hooks";
import { ApiError } from "@/lib/api/errors";
import { useRouter } from "next/navigation";

export function VendorDetailView({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const vendor = useVendor(vendorId);
  const risk = useVendorRisk(vendorId);
  const agreements = useVendorAgreements(vendorId);
  const reviews = useVendorReviews(vendorId);
  const relationships = useVendorRelationships(vendorId);
  const allVendors = useVendors();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor(vendorId);
  const createAgreement = useCreateAgreement(vendorId);
  const createReview = useCreateReview(vendorId);
  const addRelationship = useAddRelationship(vendorId);
  const acknowledge = useAcknowledgeRelationship(vendorId);
  const offboard = useOffboardVendor();

  const [agreementTitle, setAgreementTitle] = useState("Master DPA");
  const [childId, setChildId] = useState("");
  const [newChildName, setNewChildName] = useState("");
  const [reviewOutcome, setReviewOutcome] = useState("APPROVED");
  const [reviewResidual, setReviewResidual] = useState("MEDIUM");
  const [reviewNotes, setReviewNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const childOptions = useMemo(
    () => (allVendors.data ?? []).filter((v) => v.id !== vendorId),
    [allVendors.data, vendorId],
  );

  if (vendor.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!vendor.data) {
    return <div className="p-6 text-sm">Vendor not found.</div>;
  }

  const v = vendor.data;

  return (
    <div className="space-y-8 p-6">
      <div>
        <Link href="/vendors" className="text-sm text-primary underline">
          ← Vendors
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{v.name}</h1>
        <p className="text-sm text-muted-foreground">
          {v.vendorType} · {v.status} · {v.criticality}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {v.status === "DRAFT" ? (
            <Can perm="vendor:update">
              <Button
                disabled={updateVendor.isPending}
                onClick={() => {
                  setError(null);
                  void updateVendor
                    .mutateAsync({ version: v.version, status: "ACTIVE" })
                    .catch((err) =>
                      setError(
                        err instanceof ApiError
                          ? err.message
                          : "Activate failed",
                      ),
                    );
                }}
              >
                Activate (DRAFT → ACTIVE)
              </Button>
            </Can>
          ) : null}
          {v.status !== "OFFBOARDED" ? (
            <Can perm="vendor:offboard">
              <Button
                variant="secondary"
                disabled={offboard.isPending}
                onClick={() => {
                  setError(null);
                  void offboard
                    .mutateAsync(vendorId)
                    .then(() => router.push("/vendors"))
                    .catch((err) =>
                      setError(
                        err instanceof ApiError
                          ? err.message
                          : "Offboard failed",
                      ),
                    );
                }}
              >
                Offboard vendor
              </Button>
            </Can>
          ) : null}
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Risk scorecard</h2>
        <div className="rounded-md border p-4 text-sm">
          <p>
            Inherent {risk.data?.inherentRiskScore ?? "—"} · Residual{" "}
            {risk.data?.residualRiskScore ?? "—"}
          </p>
          <p className="mt-1 text-muted-foreground">
            Active DPA: {risk.data?.hasActiveDpa ? "yes" : "no"}
            {risk.data?.dpaExpiresAt
              ? ` · expires ${risk.data.dpaExpiresAt.slice(0, 10)}`
              : ""}
          </p>
          {(risk.data?.openRiskFlags.length ?? 0) > 0 ? (
            <p className="mt-1">Flags: {risk.data?.openRiskFlags.join(", ")}</p>
          ) : null}
          <ul className="mt-2 list-disc pl-5 text-muted-foreground">
            {(risk.data?.factors ?? []).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Agreements (DPA)</h2>
        <Can perm="vendor:update">
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              value={agreementTitle}
              onChange={(e) => setAgreementTitle(e.target.value)}
            />
            <Button
              onClick={() => {
                setError(null);
                void createAgreement
                  .mutateAsync({
                    title: agreementTitle,
                    versionLabel: "v1",
                    status: "ACTIVE",
                    expiresAt: new Date(
                      Date.now() + 365 * 24 * 60 * 60 * 1000,
                    ).toISOString(),
                  })
                  .catch((err) =>
                    setError(
                      err instanceof ApiError
                        ? err.message
                        : "Agreement failed",
                    ),
                  );
              }}
            >
              Add ACTIVE DPA
            </Button>
          </div>
        </Can>
        <ul className="space-y-1 text-sm">
          {(
            (agreements.data as
              | Array<{
                  id: string;
                  title: string;
                  status: string;
                  expiresAt?: string;
                }>
              | undefined) ?? []
          ).map((a) => (
            <li key={a.id}>
              {a.title} · {a.status}
              {a.expiresAt ? ` · exp ${a.expiresAt.slice(0, 10)}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Diligence reviews</h2>
        <Can perm="vendor:review">
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium">Outcome</label>
              <Select
                className="w-44"
                value={reviewOutcome}
                onChange={(e) => setReviewOutcome(e.target.value)}
              >
                <option value="APPROVED">APPROVED</option>
                <option value="CONDITIONAL">CONDITIONAL</option>
                <option value="REJECTED">REJECTED</option>
                <option value="PENDING">PENDING</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Residual risk
              </label>
              <Select
                className="w-36"
                value={reviewResidual}
                onChange={(e) => setReviewResidual(e.target.value)}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </Select>
            </div>
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs font-medium">Notes</label>
              <Input
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            <Button
              disabled={createReview.isPending}
              onClick={() => {
                setError(null);
                void createReview
                  .mutateAsync({
                    outcome: reviewOutcome,
                    residualRisk: reviewResidual,
                    complete: reviewOutcome !== "PENDING",
                    notes: reviewNotes.trim() || undefined,
                  })
                  .then(() => setReviewNotes(""))
                  .catch((err) =>
                    setError(
                      err instanceof ApiError
                        ? err.message
                        : "Review failed",
                    ),
                  );
              }}
            >
              Record review
            </Button>
          </div>
        </Can>
        <ul className="space-y-1 text-sm">
          {(
            (reviews.data as
              | Array<{
                  id: string;
                  outcome: string;
                  residualRisk?: string;
                  notes?: string | null;
                }>
              | undefined) ?? []
          ).map((r) => (
            <li key={r.id}>
              {r.outcome}
              {r.residualRisk ? ` · residual ${r.residualRisk}` : ""}
              {r.notes ? ` · ${r.notes}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Supply chain (SCRM)</h2>
        <p className="text-sm text-muted-foreground">
          Sub-processors are other Vendor records. Pick an existing one, or
          create a child vendor and link it.
        </p>
        <Can perm="vendor:update">
          <div className="flex flex-wrap gap-2">
            <Select
              className="max-w-xs"
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
            >
              <option value="">Select sub-processor…</option>
              {childOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.vendorType})
                </option>
              ))}
            </Select>
            <Button
              disabled={!childId || addRelationship.isPending}
              onClick={() => {
                setError(null);
                void addRelationship
                  .mutateAsync({
                    childVendorId: childId,
                    relationshipType: "SUB_PROCESSOR",
                  })
                  .then(() => setChildId(""))
                  .catch((err) =>
                    setError(
                      err instanceof ApiError
                        ? err.message
                        : "Relationship failed",
                    ),
                  );
              }}
            >
              Link sub-processor
            </Button>
          </div>
          {childOptions.length === 0 ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              No other vendors yet — create one below (or on the Vendors list),
              then link it here.
            </p>
          ) : null}
          <div className="flex flex-wrap items-end gap-2 border-t pt-3">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-medium">
                New sub-processor name
              </label>
              <Input
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                placeholder="e.g. Acme KYC Cloud"
              />
            </div>
            <Button
              variant="secondary"
              disabled={
                !newChildName.trim() ||
                createVendor.isPending ||
                addRelationship.isPending
              }
              onClick={() => {
                setError(null);
                void (async () => {
                  try {
                    const created = await createVendor.mutateAsync({
                      name: newChildName.trim(),
                      vendorType: "SUB_PROCESSOR",
                      status: "ACTIVE",
                      criticality: "HIGH",
                    });
                    await addRelationship.mutateAsync({
                      childVendorId: created.id,
                      relationshipType: "SUB_PROCESSOR",
                    });
                    setNewChildName("");
                    void allVendors.refetch();
                  } catch (err) {
                    setError(
                      err instanceof ApiError
                        ? err.message
                        : "Could not create/link sub-processor",
                    );
                  }
                })();
              }}
            >
              Create &amp; link
            </Button>
          </div>
        </Can>
        <ul className="space-y-1 text-sm">
          {(
            (relationships.data as
              | Array<{
                  id: string;
                  relationshipType: string;
                  childVendor?: { name: string; criticality: string };
                  acknowledgedAt?: string | null;
                }>
              | undefined) ?? []
          ).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2">
              <span>
                {r.childVendor?.name ?? "Child"} · {r.relationshipType} ·{" "}
                {r.childVendor?.criticality}
                {r.acknowledgedAt ? " · acked" : " · pending ack"}
              </span>
              {!r.acknowledgedAt ? (
                <Can perm="vendor:update">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={acknowledge.isPending}
                    onClick={() => {
                      setError(null);
                      void acknowledge
                        .mutateAsync(r.id)
                        .catch((err) =>
                          setError(
                            err instanceof ApiError
                              ? err.message
                              : "Acknowledge failed",
                          ),
                        );
                    }}
                  >
                    Acknowledge
                  </Button>
                </Can>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
