/**
 * Backend contract types — mirror of dpdpos_backend response/error envelopes.
 * Source: src/shared/middleware/response-envelope.middleware.ts,
 *         src/shared/middleware/error-handler.middleware.ts, error-map.ts
 */

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "NETWORK_ERROR"; // client-side only

export interface ApiErrorBody {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiMeta {
  pagination?: PaginationMeta;
}

export type ApiEnvelope<T> =
  | { success: true; data: T; meta?: ApiMeta }
  | ApiErrorBody;

/**
 * Validation error details (zod flatten) — maps 1:1 to form fields.
 * Source: src/shared/middleware/validate.middleware.ts
 */
export interface ValidationErrorDetails {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
}

/** Server-paginated payload style used by evidence (`{ items, total, page, pageSize }`). */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
