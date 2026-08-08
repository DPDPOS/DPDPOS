import { http, HttpResponse } from "msw";

/**
 * MSW handlers — responses are shaped exactly like the backend envelopes
 * (response-envelope.middleware.ts / error-map.ts) so components and the API
 * client are tested against backend-shaped contracts.
 */
export const handlers = [
  http.get("/api/healthz", () =>
    HttpResponse.json({ success: true, data: { status: "ok" } }),
  ),

  http.get("/api/not-found", () =>
    HttpResponse.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Resource not found" },
      },
      { status: 404 },
    ),
  ),

  http.get("/api/validation-error", () =>
    HttpResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: {
            formErrors: [],
            fieldErrors: { email: ["Invalid email address"] },
          },
        },
      },
      { status: 400 },
    ),
  ),

  http.get("/api/conflict", () =>
    HttpResponse.json(
      {
        success: false,
        error: {
          code: "CONFLICT",
          message: "Record was modified by another user",
        },
      },
      { status: 409 },
    ),
  ),
];
