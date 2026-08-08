/**
 * Client-side SHA-256 of a File for the presigned upload pipeline (§10.2):
 * `POST /evidence` (initiate) → PUT to the presigned URL → compute the hash
 * of the exact bytes that were sent → `PATCH /evidence/:id/confirm`.
 */
export async function sha256Hex(file: File): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      "Web Crypto is not available in this environment — cannot hash the file.",
    );
  }
  const bytes = await file.arrayBuffer();
  // Copy into a fresh view: some runtimes (jsdom under vitest) hand webcrypto
  // an ArrayBuffer from another realm, which Node's SubtleCrypto rejects.
  const source = new Uint8Array(bytes);
  const data = new Uint8Array(source.byteLength);
  data.set(source);
  const digest = await subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Best-effort file size formatter ("2.4 MB"). */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let i = 1; i < units.length && value >= 1024; i += 1) {
    value /= 1024;
    unit = units[i];
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`;
}
