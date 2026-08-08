import { http, HttpResponse } from "msw";
import { DEMO_CREDENTIALS } from "@/features/auth/demo-credentials";
import {
  MFA_USER_EMAIL,
  MFA_USER_PASSWORD,
  analyticsOverview,
  testTokens,
  testUser,
} from "./fixtures";

/**
 * MSW handlers — responses are shaped exactly like the backend envelopes
 * (response-envelope.middleware.ts / error-map.ts) so components and the API
 * client are tested against backend-shaped contracts.
 */
export const handlers = [
  http.get("/api/healthz", () =>
    HttpResponse.json({ success: true, data: { status: "ok" } }),
  ),

  // ---- Auth ----------------------------------------------------------------
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as {
      organizationId: string;
      email: string;
      password: string;
    };
    const isDemo =
      body.organizationId === DEMO_CREDENTIALS.organizationId &&
      body.email === DEMO_CREDENTIALS.email &&
      body.password === DEMO_CREDENTIALS.password;
    const isMfaUser =
      body.organizationId === DEMO_CREDENTIALS.organizationId &&
      body.email === MFA_USER_EMAIL &&
      body.password === MFA_USER_PASSWORD;

    if (isMfaUser) {
      return HttpResponse.json({
        success: true,
        data: { mfaRequired: true, mfaToken: "mfa-tok-1", expiresIn: 300 },
      });
    }
    if (isDemo) {
      return HttpResponse.json({
        success: true,
        data: {
          mfaRequired: false,
          mfaEnrollmentRequired: false,
          user: testUser,
          tokens: testTokens,
        },
      });
    }
    return HttpResponse.json(
      {
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
      },
      { status: 401 },
    );
  }),

  http.post("/api/auth/mfa/verify", () =>
    HttpResponse.json({
      success: true,
      data: {
        mfaRequired: false,
        mfaEnrollmentRequired: false,
        user: testUser,
        tokens: { ...testTokens, accessToken: "at-mfa" },
      },
    }),
  ),

  http.post("/api/auth/mfa/setup", () =>
    HttpResponse.json({
      success: true,
      data: {
        secret: "JBSWY3DPEHPK3PXP",
        otpauthUrl:
          "otpauth://totp/DPDPOS:admin%40demo.dpdpos.local?secret=JBSWY3DPEHPK3PXP&issuer=DPDPOS",
      },
    }),
  ),

  http.post("/api/auth/mfa/confirm", () =>
    HttpResponse.json({ success: true, data: { mfaEnabled: true } }),
  ),

  http.post("/api/auth/accept-invite", () =>
    HttpResponse.json({
      success: true,
      data: { userId: "usr_invited", status: "ACTIVE" },
    }),
  ),

  http.post("/api/auth/refresh", async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };
    if (!body.refreshToken || body.refreshToken.startsWith("dead-")) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "INVALID_REFRESH_TOKEN", message: "Refresh token is invalid or expired" },
        },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: "refreshed-access",
        refreshToken: "refreshed-rt",
        tokenType: "Bearer",
        expiresIn: 900,
      },
    });
  }),

  http.post("/api/auth/logout", () =>
    HttpResponse.json({ success: true, data: { success: true } }),
  ),

  http.get("/api/auth/me", ({ request }) => {
    const auth = request.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
    // Only tokens issued by these handlers are accepted, so the client's
    // "no refresh on /auth/*" rule can be exercised with a stale token.
    if (["at-demo", "at-mfa", "refreshed-access"].includes(token)) {
      return HttpResponse.json({ success: true, data: testUser });
    }
    return HttpResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      },
      { status: 401 },
    );
  }),

  // ---- 401-replay probe for the client's silent-refresh interceptor --------
  http.get("/api/session-protected", ({ request }) => {
    const auth = request.headers.get("authorization") ?? "";
    if (auth === "Bearer refreshed-access") {
      return HttpResponse.json({ success: true, data: { ok: true } });
    }
    return HttpResponse.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Session expired" },
      },
      { status: 401 },
    );
  }),

  // ---- Analytics -----------------------------------------------------------
  http.get("/api/analytics/dashboard", () =>
    HttpResponse.json({ success: true, data: analyticsOverview }),
  ),

  http.get("/api/analytics/compliance-score", () =>
    HttpResponse.json({
      success: true,
      data: analyticsOverview.complianceScore,
    }),
  ),

  http.get("/api/analytics/violations", () =>
    HttpResponse.json({
      success: true,
      data: analyticsOverview.violations,
    }),
  ),

  http.get("/api/analytics/evidence", () =>
    HttpResponse.json({ success: true, data: analyticsOverview.evidence }),
  ),

  http.get("/api/analytics/rights-requests", () =>
    HttpResponse.json({
      success: true,
      data: analyticsOverview.rightsRequests,
    }),
  ),

  http.get("/api/analytics/consent", () =>
    HttpResponse.json({ success: true, data: analyticsOverview.consent }),
  ),

  http.get("/api/analytics/validations", () =>
    HttpResponse.json({
      success: true,
      data: {
        totalRules: analyticsOverview.complianceScore.totalRules,
        passed: analyticsOverview.complianceScore.passed,
        failed: analyticsOverview.complianceScore.failed,
      },
    }),
  ),

  // ---- Notifications -------------------------------------------------------
  http.get("/api/notifications/unread-count", () =>
    HttpResponse.json({ success: true, data: { count: 3 } }),
  ),

  http.patch("/api/notifications/read-all", () =>
    HttpResponse.json({ success: true, data: { count: 0 } }),
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
