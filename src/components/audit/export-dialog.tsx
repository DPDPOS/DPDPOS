"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { downloadAuditExport } from "@/features/audit/api";

interface AuditExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AuditExportDialog({ open, onClose }: AuditExportDialogProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const close = () => {
    setDateFrom("");
    setDateTo("");
    setFormat("csv");
    setError(null);
    onClose();
  };

  const submit = async () => {
    setError(null);
    setExporting(true);
    try {
      await downloadAuditExport({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        format,
      });
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Export audit log"
      description="Downloads an immutable snapshot of the trail matching the current filters."
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={close} disabled={exporting}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => void submit()} disabled={exporting}>
            {exporting ? (
              <Spinner size="sm" label="Exporting" />
            ) : (
              "Download export"
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="From" htmlFor="audit-export-from">
            <Input
              id="audit-export-from"
              type="datetime-local"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </Field>
          <Field label="To" htmlFor="audit-export-to">
            <Input
              id="audit-export-to"
              type="datetime-local"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Format" htmlFor="audit-export-format">
          <Select
            id="audit-export-format"
            value={format}
            onChange={(event) => setFormat(event.target.value as "csv" | "pdf")}
          >
            <option value="csv">CSV (spreadsheet)</option>
            <option value="pdf">PDF (board pack)</option>
          </Select>
        </Field>
        {error ? (
          <p role="alert" className="text-xs text-fail">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
