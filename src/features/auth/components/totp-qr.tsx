"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function TotpQr({ otpauthUrl }: { otpauthUrl: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(otpauthUrl, { width: 168, margin: 1 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [otpauthUrl]);

  if (failed) {
    return (
      <div className="flex h-42 w-42 items-center justify-center rounded-sm border border-border bg-surface-2 p-4 text-center text-xs text-ink-3">
        Couldn&apos;t render the QR code — use the setup key below instead.
      </div>
    );
  }

  return (
    <div className="flex h-42 w-42 items-center justify-center rounded-sm border border-border bg-surface p-2">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt="Scan with your authenticator app"
          className="size-38"
          width={152}
          height={152}
        />
      ) : (
        <Skeleton className="size-38" />
      )}
    </div>
  );
}
