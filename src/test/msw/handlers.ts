import { http, HttpResponse } from "msw";
import { DEMO_CREDENTIALS } from "@/features/auth/demo-credentials";
import type { EvidenceFileRecord } from "@/features/evidence/types";
import type { ReportRecord } from "@/features/reports/types";
import {
  MFA_USER_EMAIL,
  MFA_USER_PASSWORD,
  activityRows,
  analyticsOverview,
  consentRows,
  controlRows,
  dataAssetRows,
  departmentRows,
  evidenceRows,
  generatedFramework,
  noticeRows,
  reportRows,
  requirementRows,
  testTokens,
  testUser,
  userRows,
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

  // ---- Framework -----------------------------------------------------------
  http.post("/api/framework/generate", () =>
    HttpResponse.json({ success: true, data: generatedFramework }, { status: 201 }),
  ),

  http.get("/api/framework/roadmap", () =>
    HttpResponse.json({ success: true, data: generatedFramework }),
  ),

  http.post("/api/framework/publish", () =>
    HttpResponse.json({
      success: true,
      data: {
        ...generatedFramework,
        status: "PUBLISHED",
        publishedAt: "2026-08-08T10:00:00.000Z",
      },
    }),
  ),

  // ---- Controls ------------------------------------------------------------
  http.get("/api/controls", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const filtered = status
      ? controlRows.filter((row) => row.status === status)
      : controlRows;
    return HttpResponse.json({
      success: true,
      data: filtered.slice((page - 1) * pageSize, page * pageSize),
      meta: {
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    });
  }),

  http.post("/api/controls", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created = {
      id: `c-${Date.now()}`,
      organizationId: DEMO_CREDENTIALS.organizationId,
      status: "NOT_STARTED",
      ownerUserId: null,
      createdAt: "2026-08-08T10:00:00.000Z",
      updatedAt: "2026-08-08T10:00:00.000Z",
      ...body,
    };
    controlRows.push(created as never);
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch("/api/controls/:id", async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const index = controlRows.findIndex((row) => row.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Control not found" },
        },
        { status: 404 },
      );
    }
    controlRows[index] = { ...controlRows[index], ...body, updatedAt: "2026-08-08T10:00:00.000Z" };
    return HttpResponse.json({ success: true, data: controlRows[index] });
  }),

  // ---- Requirements --------------------------------------------------------
  http.get("/api/requirements", ({ request }) => {
    const url = new URL(request.url);
    const unmapped = url.searchParams.get("unmapped") === "true";
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const filtered = unmapped
      ? requirementRows.filter((row) => row.controlId === null)
      : requirementRows;
    return HttpResponse.json({
      success: true,
      data: filtered.slice((page - 1) * pageSize, page * pageSize),
      meta: {
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    });
  }),

  http.post("/api/requirements/:id/map", async ({ request, params }) => {
    const body = (await request.json()) as { controlId: string };
    const requirement = requirementRows.find((row) => row.id === params.id);
    if (!requirement) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Requirement not found" },
        },
        { status: 404 },
      );
    }
    requirement.controlId = body.controlId;
    requirement.updatedAt = "2026-08-08T10:00:00.000Z";
    return HttpResponse.json({ success: true, data: requirement });
  }),

  // ---- Inventory: data assets ------------------------------------------------
  // The backend returns these as bare arrays (unpaginated list endpoints).
  http.get("/api/data-assets", () =>
    HttpResponse.json({ success: true, data: dataAssetRows }),
  ),

  http.get("/api/data-assets/:id", ({ params }) => {
    const asset = dataAssetRows.find((row) => row.id === params.id);
    if (!asset) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Data asset not found" },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: asset });
  }),

  http.post("/api/data-assets", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created = {
      id: `a-${Date.now()}`,
      status: "ACTIVE",
      createdAt: "2026-08-08T10:00:00.000Z",
      updatedAt: "2026-08-08T10:00:00.000Z",
      ...body,
    };
    dataAssetRows.push(created as never);
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch("/api/data-assets/:id", async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const index = dataAssetRows.findIndex((row) => row.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Data asset not found" },
        },
        { status: 404 },
      );
    }
    dataAssetRows[index] = {
      ...dataAssetRows[index],
      ...body,
      updatedAt: "2026-08-08T10:00:00.000Z",
    };
    return HttpResponse.json({ success: true, data: dataAssetRows[index] });
  }),

  // Soft archive — status flips to ARCHIVED, row stays for traceability.
  http.delete("/api/data-assets/:id", ({ params }) => {
    const index = dataAssetRows.findIndex((row) => row.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Data asset not found" },
        },
        { status: 404 },
      );
    }
    dataAssetRows[index] = {
      ...dataAssetRows[index],
      status: "ARCHIVED",
      updatedAt: "2026-08-08T10:00:00.000Z",
    };
    return HttpResponse.json({ success: true, data: dataAssetRows[index] });
  }),

  // ---- Inventory: processing activities --------------------------------------
  http.get("/api/processing-activities", ({ request }) => {
    const url = new URL(request.url);
    const dataAssetId = url.searchParams.get("dataAssetId");
    const rows = dataAssetId
      ? activityRows.filter((row) => row.dataAssetId === dataAssetId)
      : activityRows;
    return HttpResponse.json({ success: true, data: rows });
  }),

  http.get("/api/processing-activities/:id", ({ params }) => {
    const activity = activityRows.find((row) => row.id === params.id);
    if (!activity) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Processing activity not found" },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: activity });
  }),

  http.post("/api/processing-activities", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created = {
      id: `pa-${Date.now()}`,
      createdAt: "2026-08-08T10:00:00.000Z",
      updatedAt: "2026-08-08T10:00:00.000Z",
      ...body,
    };
    activityRows.push(created as never);
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch("/api/processing-activities/:id", async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const index = activityRows.findIndex((row) => row.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Processing activity not found" },
        },
        { status: 404 },
      );
    }
    activityRows[index] = {
      ...activityRows[index],
      ...body,
      updatedAt: "2026-08-08T10:00:00.000Z",
    };
    return HttpResponse.json({ success: true, data: activityRows[index] });
  }),

  http.delete("/api/processing-activities/:id", ({ params }) => {
    const index = activityRows.findIndex((row) => row.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Processing activity not found" },
        },
        { status: 404 },
      );
    }
    const [removed] = activityRows.splice(index, 1);
    return HttpResponse.json({ success: true, data: removed });
  }),

  // ---- Notices ----------------------------------------------------------------
  http.get("/api/notices", () =>
    HttpResponse.json({ success: true, data: noticeRows }),
  ),

  http.get("/api/notices/:id", ({ params }) => {
    const notice = noticeRows.find((row) => row.id === params.id);
    if (!notice) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Notice not found" },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: notice });
  }),

  http.post("/api/notices", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created = {
      id: `n-${Date.now()}`,
      version: 1,
      publishedBy: "usr_demo_admin",
      createdAt: "2026-08-08T10:00:00.000Z",
      updatedAt: "2026-08-08T10:00:00.000Z",
      ...body,
    };
    noticeRows.push(created as never);
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.delete("/api/notices/:id", ({ params }) => {
    const index = noticeRows.findIndex((row) => row.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Notice not found" },
        },
        { status: 404 },
      );
    }
    const [removed] = noticeRows.splice(index, 1);
    return HttpResponse.json({ success: true, data: removed });
  }),

  // ---- Consent records --------------------------------------------------------
  http.get("/api/consent-records", ({ request }) => {
    const url = new URL(request.url);
    let rows = consentRows;
    const consentState = url.searchParams.get("consentState");
    if (consentState) {
      rows = rows.filter((row) => row.consentState === consentState);
    }
    const dataAssetId = url.searchParams.get("dataAssetId");
    if (dataAssetId) {
      rows = rows.filter((row) => row.dataAssetId === dataAssetId);
    }
    const noticeId = url.searchParams.get("noticeId");
    if (noticeId) {
      rows = rows.filter((row) => row.noticeId === noticeId);
    }
    const identifier = url.searchParams.get("dataSubjectIdentifier");
    if (identifier) {
      rows = rows.filter((row) =>
        row.dataSubjectIdentifier.toLowerCase().includes(identifier.toLowerCase()),
      );
    }
    return HttpResponse.json({ success: true, data: rows });
  }),

  http.get("/api/consent-records/:id", ({ params }) => {
    const record = consentRows.find((row) => row.id === params.id);
    if (!record) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Consent record not found" },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: record });
  }),

  http.post("/api/consent-records", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created = {
      id: `cn-${Date.now()}`,
      consentState: "GRANTED",
      withdrawnAt: null,
      createdAt: "2026-08-08T10:00:00.000Z",
      updatedAt: "2026-08-08T10:00:00.000Z",
      ...body,
    };
    consentRows.push(created as never);
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.post("/api/consent-records/:id/withdraw", ({ params }) => {
    const record = consentRows.find((row) => row.id === params.id);
    if (!record) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Consent record not found" },
        },
        { status: 404 },
      );
    }
    if (record.consentState === "WITHDRAWN") {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: "Consent is already withdrawn" },
        },
        { status: 409 },
      );
    }
    record.consentState = "WITHDRAWN";
    record.withdrawnAt = "2026-08-08T10:00:00.000Z";
    record.updatedAt = "2026-08-08T10:00:00.000Z";
    return HttpResponse.json({ success: true, data: record });
  }),

  // ---- Evidence ----------------------------------------------------------------
  // The backend returns the paged shape *inside* `data` with no `meta` — the
  // API client's apiList normalizes it; the handlers mirror the oddity exactly.
  http.get("/api/evidence", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const controlId = url.searchParams.get("controlId");
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    let rows = evidenceRows;
    if (status) rows = rows.filter((row) => row.status === status);
    if (controlId) rows = rows.filter((row) => row.controlId === controlId);
    const items = rows.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({
      success: true,
      data: { items, total: rows.length, page, pageSize },
    });
  }),

  http.get("/api/evidence/:id", ({ params }) => {
    const record = evidenceRows.find((row) => row.id === params.id);
    if (!record) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Evidence not found" },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: record });
  }),

  http.get("/api/evidence/:id/download", ({ params }) => {
    const record = evidenceRows.find((row) => row.id === params.id);
    if (!record) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Evidence not found" },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        downloadUrl: `https://evidence-bucket.mock/${record.storageKey}?X-Amz-Signature=demo`,
      },
    });
  }),

  http.post("/api/evidence", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const id = `ev-${Date.now()}`;
    const record: EvidenceFileRecord = {
      id,
      organizationId: DEMO_CREDENTIALS.organizationId,
      fileName: String(body.fileName),
      storageKey: `evidence/${DEMO_CREDENTIALS.organizationId}/${id}/${body.fileName}`,
      mimeType: String(body.mimeType),
      fileHash: null,
      fileSizeBytes: null,
      description: (body.description as string) ?? null,
      tags: (body.tags as string[]) ?? [],
      status: "UPLOADED",
      controlId: (body.controlId as string) ?? null,
      violationId: (body.violationId as string) ?? null,
      uploadedBy: "usr_demo_admin",
      reviewedBy: null,
      approvedBy: null,
      lockedAt: null,
      expiresAt: null,
      createdBy: "usr_demo_admin",
      updatedBy: "usr_demo_admin",
      createdAt: "2026-08-08T10:00:00.000Z",
      updatedAt: "2026-08-08T10:00:00.000Z",
      deletedAt: null,
    };
    evidenceRows.push(record);
    return HttpResponse.json(
      {
        success: true,
        data: {
          evidence: record,
          uploadUrl: `https://evidence-bucket.mock/${record.storageKey}?X-Amz-Signature=demo`,
        },
      },
      { status: 201 },
    );
  }),

  // The presigned PUT target — the component uploads the bytes here before
  // confirming with the hash (mirrors S3 in the demo).
  http.put("https://evidence-bucket.mock/*", () =>
    HttpResponse.json({ success: true }, { status: 200 }),
  ),

  http.patch("/api/evidence/:id/confirm", async ({ request, params }) => {
    const body = (await request.json()) as { fileHash: string; fileSizeBytes: number };
    const record = evidenceRows.find((row) => row.id === params.id);
    if (!record) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Evidence not found" },
        },
        { status: 404 },
      );
    }
    record.fileHash = body.fileHash;
    record.fileSizeBytes = body.fileSizeBytes;
    record.updatedAt = "2026-08-08T10:00:00.000Z";
    return HttpResponse.json({ success: true, data: record });
  }),

  http.patch("/api/evidence/:id/tag", async ({ request, params }) => {
    const body = (await request.json()) as { tags: string[]; description?: string };
    const record = evidenceRows.find((row) => row.id === params.id);
    if (!record) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Evidence not found" },
        },
        { status: 404 },
      );
    }
    if (record.status !== "UPLOADED") {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: `Invalid state transition from ${record.status} to TAGGED`,
          },
        },
        { status: 409 },
      );
    }
    record.tags = body.tags;
    if (body.description !== undefined) record.description = body.description;
    record.status = "TAGGED";
    record.updatedAt = "2026-08-08T10:00:00.000Z";
    return HttpResponse.json({ success: true, data: record });
  }),

  http.patch("/api/evidence/:id/map", async ({ request, params }) => {
    const body = (await request.json()) as { controlId: string };
    const record = evidenceRows.find((row) => row.id === params.id);
    if (!record) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Evidence not found" },
        },
        { status: 404 },
      );
    }
    if (!["UPLOADED", "TAGGED"].includes(record.status)) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: `Invalid state transition from ${record.status} to MAPPED`,
          },
        },
        { status: 409 },
      );
    }
    record.controlId = body.controlId;
    record.status = "MAPPED";
    record.updatedAt = "2026-08-08T10:00:00.000Z";
    return HttpResponse.json({ success: true, data: record });
  }),

  http.patch("/api/evidence/:id/submit-review", ({ params }) => {
    const record = evidenceRows.find((row) => row.id === params.id);
    if (!record) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Evidence not found" },
        },
        { status: 404 },
      );
    }
    if (!["UPLOADED", "MAPPED"].includes(record.status)) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: `Invalid state transition from ${record.status} to UNDER_REVIEW`,
          },
        },
        { status: 409 },
      );
    }
    record.status = "UNDER_REVIEW";
    record.reviewedBy = "usr_demo_admin";
    record.updatedAt = "2026-08-08T10:00:00.000Z";
    return HttpResponse.json({ success: true, data: record });
  }),

  http.patch("/api/evidence/:id/approve", ({ params }) => {
    const record = evidenceRows.find((row) => row.id === params.id);
    if (!record) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Evidence not found" },
        },
        { status: 404 },
      );
    }
    if (record.status !== "UNDER_REVIEW") {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: `Invalid state transition from ${record.status} to APPROVED`,
          },
        },
        { status: 409 },
      );
    }
    record.status = "APPROVED";
    record.approvedBy = "usr_demo_admin";
    record.updatedAt = "2026-08-08T10:00:00.000Z";
    return HttpResponse.json({ success: true, data: record });
  }),

  http.patch("/api/evidence/:id/lock", ({ params }) => {
    const record = evidenceRows.find((row) => row.id === params.id);
    if (!record) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Evidence not found" },
        },
        { status: 404 },
      );
    }
    if (record.status !== "APPROVED") {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: `Invalid state transition from ${record.status} to LOCKED`,
          },
        },
        { status: 409 },
      );
    }
    record.status = "LOCKED";
    record.lockedAt = "2026-08-08T10:00:00.000Z";
    record.updatedAt = "2026-08-08T10:00:00.000Z";
    return HttpResponse.json({ success: true, data: record });
  }),

  http.post("/api/evidence/export", async ({ request }) => {
    await request.json().catch(() => null);
    return HttpResponse.json(
      { success: true, data: { jobId: `exp-${Date.now()}`, status: "PENDING" } },
      { status: 202 },
    );
  }),

  // ---- Reports ----------------------------------------------------------------
  // Same paged-inside-data oddity as evidence — no `meta` in the envelope.
  http.get("/api/reports", ({ request }) => {
    const url = new URL(request.url);
    const reportType = url.searchParams.get("reportType");
    const status = url.searchParams.get("status");
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    let rows = reportRows;
    if (reportType) rows = rows.filter((row) => row.reportType === reportType);
    if (status) rows = rows.filter((row) => row.status === status);
    const items = rows.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({
      success: true,
      data: { data: items, total: rows.length, page, pageSize },
    });
  }),

  http.post("/api/reports", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const type = String(body.reportType ?? "BOARD_PACK");
    const title =
      (body.title as string) ||
      `Board pack — ${new Date().toISOString().slice(0, 10)}`;
    const record: ReportRecord = {
      id: `rpt-${Date.now()}`,
      organizationId: DEMO_CREDENTIALS.organizationId,
      reportType: type,
      title,
      status: "PENDING",
      format: String(body.format ?? "CSV"),
      generatedBy: "usr_demo_admin",
      storageKey: null,
      parameters: (body.parameters as ReportRecord["parameters"]) ?? null,
      startedAt: null,
      completedAt: null,
      errorMessage: null,
      createdBy: "usr_demo_admin",
      updatedBy: "usr_demo_admin",
      createdAt: "2026-08-08T10:00:00.000Z",
      updatedAt: "2026-08-08T10:00:00.000Z",
      deletedAt: null,
    };
    reportRows.unshift(record);
    return HttpResponse.json({ success: true, data: record }, { status: 201 });
  }),

  http.get("/api/reports/:id/download", ({ params }) => {
    const record = reportRows.find((row) => row.id === params.id);
    if (!record || record.status !== "COMPLETED") {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: "Report is not completed or has no file" },
        },
        { status: 409 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: { downloadUrl: `https://reports-bucket.mock/${record.storageKey}?X-Amz-Signature=demo` },
    });
  }),

  http.delete("/api/reports/:id", ({ params }) => {
    const index = reportRows.findIndex((row) => row.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Report not found" },
        },
        { status: 404 },
      );
    }
    if (!["PENDING", "GENERATING"].includes(reportRows[index].status)) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Only pending or generating reports can be cancelled",
          },
        },
        { status: 409 },
      );
    }
    const [removed] = reportRows.splice(index, 1);
    return HttpResponse.json({ success: true, data: { cancelled: true, id: removed.id } });
  }),

  // ---- Departments ------------------------------------------------------------
  http.get("/api/departments", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const sliced = departmentRows.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({
      success: true,
      data: sliced,
      meta: {
        page,
        pageSize,
        total: departmentRows.length,
        totalPages: Math.max(1, Math.ceil(departmentRows.length / pageSize)),
      },
    });
  }),

  // ---- Users ---------------------------------------------------------------
  http.get("/api/users", () =>
    HttpResponse.json({
      success: true,
      data: userRows,
      meta: { page: 1, pageSize: 100, total: userRows.length, totalPages: 1 },
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
