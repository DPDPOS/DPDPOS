"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/ui/can";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useCreateVendor,
  useCreateVendorCliToken,
  useVendors,
} from "@/features/vendors/hooks";
import type { VendorCliTokenResponse } from "@/features/vendors/types";
import { ApiError } from "@/lib/api/errors";

export function VendorsView() {
  const vendors = useVendors();
  const create = useCreateVendor();
  const mintToken = useCreateVendorCliToken();
  const [name, setName] = useState("");
  const [criticality, setCriticality] = useState("MEDIUM");
  const [vendorType, setVendorType] = useState("PROCESSOR");
  const [status, setStatus] = useState("ACTIVE");
  const [cliLabel, setCliLabel] = useState("vendors-cli");
  const [minted, setMinted] = useState<VendorCliTokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const commandBlock = useMemo(() => {
    if (!minted) return "";
    return [
      "# Install once (requires Node.js 20+)",
      minted.instructions.install,
      "",
      "# Authenticate the CLI (same pattern as Assessments)",
      minted.instructions.login,
      "",
      "# Discover processors, then sync DRAFT vendors into this org",
      minted.instructions.scan,
      minted.instructions.sync,
    ].join("\n");
  }, [minted]);

  async function onCreate() {
    setError(null);
    try {
      await create.mutateAsync({
        name: name.trim(),
        criticality,
        status,
        vendorType,
      });
      setName("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to create vendor",
      );
    }
  }

  async function copyCommands() {
    if (!commandBlock) return;
    try {
      await navigator.clipboard.writeText(commandBlock);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>
        <p className="text-sm text-muted-foreground">
          Third-party processors (TPRM), DPAs, diligence, and supply-chain links
          (SCRM).
        </p>
      </div>

      <Can
        perm="vendor:create"
        fallback={
          <p className="text-sm text-muted-foreground">
            You can view vendors, but your role lacks{" "}
            <code className="text-xs">vendor:create</code>. Ask an org admin to
            update your role.
          </p>
        }
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Processor name"
            />
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium">Type</label>
            <Select
              value={vendorType}
              onChange={(e) => setVendorType(e.target.value)}
            >
              <option value="PROCESSOR">PROCESSOR</option>
              <option value="SUB_PROCESSOR">SUB_PROCESSOR</option>
              <option value="JOINT">JOINT</option>
              <option value="OTHER">OTHER</option>
            </Select>
          </div>
          <div className="w-36">
            <label className="mb-1 block text-xs font-medium">Status</label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
            </Select>
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium">Criticality</label>
            <Select
              value={criticality}
              onChange={(e) => setCriticality(e.target.value)}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </Select>
          </div>
          <Button
            onClick={() => void onCreate()}
            disabled={!name.trim() || create.isPending}
          >
            {create.isPending ? "Adding…" : "Add vendor"}
          </Button>
        </div>
      </Can>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <section className="space-y-3 rounded-md border p-4">
        <h2 className="text-base font-medium">Collect from CLI</h2>
        <p className="text-sm text-muted-foreground">
          Generate a CLI token, log in locally, scan a codebase for processor
          signals, then sync DRAFT vendors into this org — same flow as
          Assessments.
        </p>

        <Can perm="vendor:create">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs font-medium">
                Token label
              </label>
              <Input
                value={cliLabel}
                onChange={(e) => setCliLabel(e.target.value)}
                placeholder="vendors-cli"
              />
            </div>
            <Button
              type="button"
              disabled={mintToken.isPending}
              onClick={() => {
                setError(null);
                void mintToken
                  .mutateAsync({ label: cliLabel.trim() || "vendors-cli" })
                  .then((token) => setMinted(token))
                  .catch((err) =>
                    setError(
                      err instanceof ApiError
                        ? err.message
                        : "Could not mint CLI token",
                    ),
                  );
              }}
            >
              {mintToken.isPending ? "Generating…" : "Generate CLI token"}
            </Button>
          </div>
        </Can>

        {minted ? (
          <div className="space-y-3 rounded-md border border-dashed p-3">
            <p className="text-sm font-medium">
              Copy now — the raw token is shown only once.
            </p>
            <code className="block break-all rounded-md bg-muted/50 px-3 py-2 font-mono text-xs">
              {minted.token}
            </code>
            <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs whitespace-pre-wrap">
              {commandBlock}
            </pre>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void copyCommands()}
            >
              {copied ? "Copied" : "Copy commands"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Generate a token to see install, login, scan, and sync commands with
            the token filled in.
          </p>
        )}
      </section>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Criticality</th>
              <th className="px-3 py-2 font-medium">Residual risk</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {(vendors.data ?? []).map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-3 py-2">{v.name}</td>
                <td className="px-3 py-2">{v.vendorType}</td>
                <td className="px-3 py-2">{v.status}</td>
                <td className="px-3 py-2">{v.criticality}</td>
                <td className="px-3 py-2">{v.residualRiskScore ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <Link
                    className="text-primary underline"
                    href={`/vendors/${v.id}`}
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {!vendors.isLoading && (vendors.data?.length ?? 0) === 0 ? (
              <tr>
                <td className="px-3 py-6 text-muted-foreground" colSpan={6}>
                  No vendors yet. Add a processor above or sync from CLI.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
