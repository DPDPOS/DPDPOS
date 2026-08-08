import type { ApiEnvelope } from "@/types/api";
import { ApiError } from "./errors";

/**
 * Typed API client — implementation plan §7.1/§7.4.
 * - Wraps every response in the backend `{ success, data, meta? }` envelope.
 * - Normalizes failures into a single ApiError type.
 * - Network failures become ApiError(NETWORK_ERROR) so UI code never sees raw TypeErrors.
 */

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/** Base URL — default to the Next.js /api rewrite (next.config.ts). */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

/** Builds a query string, skipping undefined/null/empty values. */
export function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  /** JSON-serialized body. */
  body?: unknown;
  query?: QueryParams;
}

export async function api<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, query, headers, ...init } = options;
  const url = `${BASE_URL}${path}${buildQuery(query)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError({
      code: "NETWORK_ERROR",
      message: "Network request failed — is the backend running?",
      status: 0,
    });
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON response — treat as malformed.
  }

  const correlationId = res.headers.get("x-correlation-id") ?? undefined;

  if (!res.ok) {
    const envelope = payload as ApiEnvelope<never> | undefined;
    if (envelope && envelope.success === false) {
      throw ApiError.fromBody(envelope.error, res.status, correlationId);
    }
    throw new ApiError({
      code: "INTERNAL_ERROR",
      message: `Request failed (HTTP ${res.status})`,
      status: res.status,
      correlationId,
    });
  }

  const envelope = payload as ApiEnvelope<T> | undefined;
  if (!envelope || envelope.success !== true) {
    throw new ApiError({
      code: "INTERNAL_ERROR",
      message: "Malformed API response",
      status: res.status,
    });
  }
  return envelope.data;
}

export const apiClient = {
  get: <T>(path: string, query?: QueryParams) => api<T>(path, { query }),
  post: <T>(path: string, body?: unknown, query?: QueryParams) =>
    api<T>(path, { method: "POST", body, query }),
  patch: <T>(path: string, body?: unknown, query?: QueryParams) =>
    api<T>(path, { method: "PATCH", body, query }),
  put: <T>(path: string, body?: unknown, query?: QueryParams) =>
    api<T>(path, { method: "PUT", body, query }),
  del: <T>(path: string, query?: QueryParams) =>
    api<T>(path, { method: "DELETE", query }),
};
