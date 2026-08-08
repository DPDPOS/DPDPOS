import type { ApiErrorCode, ApiErrorBody } from "@/types/api";

interface ApiErrorInit {
  code: ApiErrorCode;
  message: string;
  status: number;
  details?: unknown;
  correlationId?: string;
}

/**
 * Normalized API error. UI policy lives in the implementation plan §7.4:
 * VALIDATION_ERROR → map fieldErrors to inputs; UNAUTHORIZED → refresh/logout;
 * FORBIDDEN → inline permission state; CONFLICT → optimistic-lock recovery;
 * NETWORK_ERROR → "backend unreachable" banner.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;
  readonly correlationId?: string;
  readonly isOperational: boolean;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = "ApiError";
    this.code = init.code;
    this.status = init.status;
    this.details = init.details;
    this.correlationId = init.correlationId;
    this.isOperational = init.status >= 400 && init.status < 500;
  }

  static fromBody(
    body: ApiErrorBody["error"],
    status: number,
    correlationId?: string,
  ): ApiError {
    return new ApiError({
      code: body.code,
      message: body.message,
      status,
      details: body.details,
      correlationId,
    });
  }
}
