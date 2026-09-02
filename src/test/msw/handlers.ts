import { http, HttpResponse } from "msw";
import { DEMO_CREDENTIALS } from "@/features/auth/demo-credentials";
import type { EvidenceFileRecord } from "@/features/evidence/types";
import type { ReportRecord } from "@/features/reports/types";
import type { RightsRequestResponse } from "@/features/rights/types";
import type {
  ValidationRuleResponse,
  ValidationRunResponse,
} from "@/features/validations/types";
import type { ViolationResponse } from "@/features/violations/types";
import { VIOLATION_TRANSITIONS } from "@/features/violations/types";
import type { RemediationTaskResponse } from "@/features/remediation/types";
import { REMEDIATION_TRANSITIONS } from "@/features/remediation/types";
import type { CreateUserPayload, UpdateUserPayload } from "@/features/users/types";
import type { CreateRolePayload, UpdateRolePermissionsPayload } from "@/features/roles/types";
import type { CreateDepartmentPayload } from "@/features/departments/types";
import type { UpdateOrganizationPayload } from "@/features/organizations/types";
import type { NotificationPreferences } from "@/features/notifications/types";
import {
  MFA_USER_EMAIL,
  MFA_USER_PASSWORD,
  activityRows,
  analyticsOverview,
  auditRows,
  consentRows,
  controlRows,
  dataAssetRows,
  departmentRows,
  evidenceRows,
  generatedFramework,
  noticeRows,
  notificationPreferences,
  notificationRows,
  organizationRow,
  reportRows,
  requirementRows,
  rightsRows,
  roleRows,
  testTokens,
  testUser,
  userRows,
  validationResultsByRun,
  validationRuleRows,
  validationRunRows,
  violationRows,
  remediationTaskRows,
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
  http.get("/api/auth/identity/options", () =>
    HttpResponse.json({
      success: true,
      data: {
        mode: "LOCAL",
        enforceSso: false,
        allowLocalBreakGlass: true,
        oidcEnabled: false,
        ldapEnabled: false,
        samlEnabled: false,
        providers: [],
      },
    }),
  ),

  http.post("/api/auth/lookup-organizations", async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    if (
      email === DEMO_CREDENTIALS.email.toLowerCase() ||
      email === MFA_USER_EMAIL.toLowerCase()
    ) {
      return HttpResponse.json({
        success: true,
        data: {
          organizations: [
            {
              id: DEMO_CREDENTIALS.organizationId,
              name: organizationRow.name,
              onboardingCompleted: true,
            },
          ],
        },
      });
    }
    return HttpResponse.json({
      success: true,
      data: { organizations: [] },
    });
  }),

  http.post("/api/auth/signup", async ({ request }) => {
    const body = (await request.json()) as {
      organizationName: string;
      adminName: string;
      email: string;
    };
    return HttpResponse.json({
      success: true,
      data: {
        mfaRequired: false,
        mfaEnrollmentRequired: false,
        user: {
          ...testUser,
          email: body.email,
          name: body.adminName,
          onboardingCompleted: false,
          requiresOnboarding: true,
        },
        tokens: testTokens,
        organization: {
          ...organizationRow,
          name: body.organizationName,
        },
      },
    });
  }),

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
      data: items,
      meta: {
        pagination: {
          page,
          pageSize,
          total: rows.length,
          totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
        },
      },
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

  http.post("/api/departments", async ({ request }) => {
    const body = (await request.json()) as CreateDepartmentPayload;
    const name = body.name.trim();
    if (departmentRows.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: "A department with this name already exists" },
        },
        { status: 409 },
      );
    }
    const row = {
      id: `dept_${Math.random().toString(36).slice(2, 10)}`,
      organizationId: organizationRow.id,
      name,
      headUserId: body.headUserId ?? null,
      createdAt: "2026-08-08T10:00:00.000Z",
      updatedAt: "2026-08-08T10:00:00.000Z",
    };
    departmentRows.push(row);
    return HttpResponse.json({ success: true, data: row });
  }),

  // ---- Users ---------------------------------------------------------------
  http.get("/api/users", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const filtered = search
      ? userRows.filter(
          (u) =>
            u.name.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search),
        )
      : userRows;
    const sliced = filtered.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({
      success: true,
      data: sliced,
      meta: {
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      },
    });
  }),

  http.post("/api/users", async ({ request }) => {
    const body = (await request.json()) as CreateUserPayload;
    const email = body.email.trim().toLowerCase();
    if (userRows.some((u) => u.email.toLowerCase() === email)) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: "A user with this email already exists" },
        },
        { status: 409 },
      );
    }
    const now = new Date().toISOString();
    const row = {
      id: `usr_${Math.random().toString(36).slice(2, 10)}`,
      organizationId: organizationRow.id,
      email,
      name: body.name.trim(),
      status: "INVITED",
      roleIds: body.roleIds ?? [],
      roleNames: (body.roleIds ?? []).map(
        (id) => roleRows.find((r) => r.id === id)?.name ?? id,
      ),
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };
    userRows.push(row);
    return HttpResponse.json({ success: true, data: row });
  }),

  http.patch("/api/users/:id", async ({ request, params }) => {
    const row = userRows.find((u) => u.id === params.id);
    if (!row) {
      return HttpResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 },
      );
    }
    const body = (await request.json()) as UpdateUserPayload;
    if (body.name !== undefined) row.name = body.name.trim();
    if (body.status !== undefined) row.status = body.status;
    row.updatedAt = new Date().toISOString();
    return HttpResponse.json({ success: true, data: row });
  }),

  // ---- Roles ---------------------------------------------------------------
  http.get("/api/roles", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const sliced = roleRows.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({
      success: true,
      data: sliced,
      meta: {
        page,
        pageSize,
        total: roleRows.length,
        totalPages: Math.max(1, Math.ceil(roleRows.length / pageSize)),
      },
    });
  }),

  http.post("/api/roles", async ({ request }) => {
    const body = (await request.json()) as CreateRolePayload;
    const name = body.name.trim();
    if (roleRows.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: "A role with this name already exists" },
        },
        { status: 409 },
      );
    }
    const now = new Date().toISOString();
    const row = {
      id: `role_${Math.random().toString(36).slice(2, 10)}`,
      organizationId: organizationRow.id,
      name,
      description: body.description?.trim() || null,
      permissions: body.permissions,
      isSystemRole: false,
      createdAt: now,
      updatedAt: now,
    };
    roleRows.push(row);
    return HttpResponse.json({ success: true, data: row });
  }),

  http.patch("/api/roles/:id/permissions", async ({ request, params }) => {
    const row = roleRows.find((r) => r.id === params.id);
    if (!row) {
      return HttpResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Role not found" } },
        { status: 404 },
      );
    }
    if (row.isSystemRole) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: "System roles cannot be modified" },
        },
        { status: 409 },
      );
    }
    const body = (await request.json()) as UpdateRolePermissionsPayload;
    row.permissions = body.permissions;
    row.updatedAt = new Date().toISOString();
    return HttpResponse.json({ success: true, data: row });
  }),

  // ---- Organization (settings) ---------------------------------------------
  http.get("/api/organizations/:id", ({ params }) => {
    if (params.id !== organizationRow.id) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Organization not found" },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: organizationRow });
  }),

  http.patch("/api/organizations/:id", async ({ request, params }) => {
    if (params.id !== organizationRow.id) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Organization not found" },
        },
        { status: 404 },
      );
    }
    const body = (await request.json()) as UpdateOrganizationPayload;
    if (body.name !== undefined) organizationRow.name = body.name.trim();
    if (body.industry !== undefined) organizationRow.industry = body.industry;
    if (body.companySize !== undefined) organizationRow.companySize = body.companySize;
    if (body.operatingRegion !== undefined) organizationRow.operatingRegion = body.operatingRegion;
    if (body.companyType !== undefined) organizationRow.companyType = body.companyType;
    if (body.maturityLevel !== undefined) organizationRow.maturityLevel = body.maturityLevel;
    if (body.isSignificantDataFiduciary !== undefined)
      organizationRow.isSignificantDataFiduciary = body.isSignificantDataFiduciary;
    organizationRow.updatedAt = new Date().toISOString();
    return HttpResponse.json({ success: true, data: organizationRow });
  }),

  // ---- Notifications -------------------------------------------------------
  // The backend list returns `{ items, pagination }` *inside* data — Variant C
  // of the apiClient list normalizer; the handler mirrors that oddity.
  http.get("/api/notifications", ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
    const status = url.searchParams.get("status");
    const notificationType = url.searchParams.get("notificationType");
    const filtered = notificationRows.filter(
      (row) =>
        (!status || row.status === status) &&
        (!notificationType || row.notificationType === notificationType),
    );
    const sliced = filtered.slice((page - 1) * pageSize, page * pageSize);
    return HttpResponse.json({
      success: true,
      data: {
        items: sliced,
        pagination: {
          page,
          pageSize,
          total: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
        },
      },
    });
  }),

  http.get("/api/notifications/unread-count", () => {
    const count = notificationRows.filter((row) => row.status !== "READ").length;
    return HttpResponse.json({ success: true, data: { count } });
  }),

  http.patch("/api/notifications/:id/read", ({ params }) => {
    const row = notificationRows.find((n) => n.id === params.id);
    if (!row) {
      return HttpResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Notification not found" } },
        { status: 404 },
      );
    }
    row.status = "READ";
    row.readAt = "2026-08-08T12:00:00.000Z";
    row.updatedAt = "2026-08-08T12:00:00.000Z";
    return HttpResponse.json({ success: true, data: { success: true } });
  }),

  http.patch("/api/notifications/read-all", () => {
    let updated = 0;
    for (const row of notificationRows) {
      if (row.status !== "READ") {
        row.status = "READ";
        row.readAt = "2026-08-08T12:00:00.000Z";
        row.updatedAt = "2026-08-08T12:00:00.000Z";
        updated += 1;
      }
    }
    return HttpResponse.json({ success: true, data: { updatedCount: updated } });
  }),

  http.get("/api/notifications/preferences", () =>
    HttpResponse.json({ success: true, data: { ...notificationPreferences } }),
  ),

  http.put("/api/notifications/preferences", async ({ request }) => {
    const body = (await request.json()) as Partial<NotificationPreferences>;
    Object.assign(notificationPreferences, body);
    return HttpResponse.json({ success: true, data: { ...notificationPreferences } });
  }),

  // ---- Audit ---------------------------------------------------------------
  // Cursor pagination, not page-based: `{ data: rows, nextCursor }` in data.
  http.get("/api/audit", ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);
    const cursor = url.searchParams.get("cursor");
    const entityType = url.searchParams.get("entityType");
    const actionType = url.searchParams.get("actionType");
    const actorUserId = url.searchParams.get("actorUserId");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    let filtered = auditRows.filter(
      (row) =>
        (!entityType || row.entityType === entityType) &&
        (!actionType || row.actionType === actionType) &&
        (!actorUserId || row.actorUserId === actorUserId) &&
        (!dateFrom || row.createdAt >= dateFrom) &&
        (!dateTo || row.createdAt <= dateTo),
    );
    if (cursor) {
      const idx = filtered.findIndex((row) => row.id === cursor);
      filtered = idx >= 0 ? filtered.slice(idx + 1) : filtered;
    }
    const rows = filtered.slice(0, limit);
    const nextCursor = filtered.length > limit ? rows[rows.length - 1]?.id ?? null : null;
    return HttpResponse.json({
      success: true,
      data: { data: rows, nextCursor },
    });
  }),

  http.get("/api/audit/entity/:entityType/:entityId", ({ params }) =>
    HttpResponse.json({
      success: true,
      data: auditRows.filter(
        (row) =>
          row.entityType === params.entityType && row.entityId === params.entityId,
      ),
    }),
  ),

  http.post("/api/audit/export", () => {
    const csv = [
      "date,action,entityType,entityId,actorUserId",
      ...auditRows.map((row) =>
        [row.createdAt, row.actionType, row.entityType, row.entityId, row.actorUserId].join(","),
      ),
    ].join("\n");
    return HttpResponse.text(csv, {
      headers: { "Content-Type": "text/csv" },
    });
  }),

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

  // ---- Rights requests ------------------------------------------------------
  http.get("/api/data-subject-requests", ({ request }) => {
    const url = new URL(request.url);
    let rows = rightsRows;
    const status = url.searchParams.get("status");
    if (status) rows = rows.filter((row) => row.status === status);
    const requestType = url.searchParams.get("requestType");
    if (requestType) rows = rows.filter((row) => row.requestType === requestType);
    const assignedTo = url.searchParams.get("assignedTo");
    if (assignedTo) rows = rows.filter((row) => row.assignedTo === assignedTo);
    return HttpResponse.json({ success: true, data: rows });
  }),

  http.get("/api/data-subject-requests/:id", ({ params }) => {
    const row = rightsRows.find((r) => r.id === params.id);
    if (!row) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Request not found" },
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: row });
  }),

  http.post("/api/data-subject-requests", async ({ request }) => {
    const body = (await request.json()) as {
      requestType: string;
      requesterReference: string;
      assignedTo?: string;
    };
    const now = Date.now();
    const slaDays = body.requestType === "GRIEVANCE_REDRESSAL" ? 45 : 30;
    const created: RightsRequestResponse = {
      id: `rqst-created-${now}`,
      requestType: body.requestType,
      requesterReference: body.requesterReference,
      status: "SUBMITTED",
      assignedTo: body.assignedTo ?? null,
      openedAt: new Date(now).toISOString(),
      dueAt: new Date(now + slaDays * 86_400_000).toISOString(),
      closedAt: null,
      resolutionSummary: null,
      version: 1,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };
    rightsRows.push(created);
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch("/api/data-subject-requests/:id", async ({ request, params }) => {
    const row = rightsRows.find((r) => r.id === params.id);
    if (!row) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Request not found" },
        },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      version: number;
      status?: string;
      assignedTo?: string | null;
      resolutionSummary?: string | null;
    };
    if (body.version !== row.version) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Version conflict — the record changed. Reload and retry.",
          },
        },
        { status: 409 },
      );
    }
    if (body.status !== undefined) row.status = body.status;
    if (body.assignedTo !== undefined) row.assignedTo = body.assignedTo;
    if (body.resolutionSummary !== undefined) {
      row.resolutionSummary = body.resolutionSummary;
    }
    row.version += 1;
    row.updatedAt = new Date().toISOString();
    if (row.status === "CLOSED" || row.status === "REJECTED") {
      row.closedAt = new Date().toISOString();
    }
    return HttpResponse.json({ success: true, data: row });
  }),

  // ---- Validations -----------------------------------------------------------
  http.get("/api/validation-runs", ({ request }) => {
    const url = new URL(request.url);
    let rows = validationRunRows;
    const status = url.searchParams.get("status");
    if (status) rows = rows.filter((row) => row.status === status);
    return HttpResponse.json({ success: true, data: rows });
  }),

  http.post("/api/validation-runs", () => {
    const now = new Date().toISOString();
    const created: ValidationRunResponse = {
      id: `run-created-${Date.now()}`,
      triggerType: "MANUAL",
      triggeredBy: "usr_demo_admin",
      status: "PENDING",
      startedAt: now,
      finishedAt: null,
      durationMs: null,
      createdAt: now,
      updatedAt: now,
    };
    validationRunRows.push(created);
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.get("/api/validation-runs/:id", ({ params }) => {
    const run = validationRunRows.find((row) => row.id === params.id);
    if (!run) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Validation run not found" },
        },
        { status: 404 },
      );
    }
    const results = validationResultsByRun[run.id] ?? [];
    return HttpResponse.json({ success: true, data: { ...run, results } });
  }),

  http.get("/api/validation-rules", ({ request }) => {
    const url = new URL(request.url);
    let rows = validationRuleRows;
    const category = url.searchParams.get("category");
    if (category) rows = rows.filter((row) => row.category === category);
    if (url.searchParams.get("activeOnly") === "true") {
      rows = rows.filter((row) => row.activeFlag);
    }
    return HttpResponse.json({ success: true, data: rows });
  }),

  http.post("/api/validation-rules", async ({ request }) => {
    const body = (await request.json()) as Partial<ValidationRuleResponse> & {
      ruleCode: string;
      title: string;
    };
    const now = new Date().toISOString();
    const created: ValidationRuleResponse = {
      id: `rule-created-${Date.now()}`,
      ruleCode: body.ruleCode,
      title: body.title,
      description: body.description ?? null,
      legalBasisRef: body.legalBasisRef ?? null,
      severity: body.severity ?? "MEDIUM",
      category: body.category ?? "NOTICE",
      activeFlag: true,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    validationRuleRows.push(created);
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch("/api/validation-rules/:id", async ({ request, params }) => {
    const row = validationRuleRows.find((rule) => rule.id === params.id);
    if (!row) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Validation rule not found" },
        },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      version: number;
      title?: string;
      description?: string | null;
      legalBasisRef?: string | null;
      severity?: string;
      activeFlag?: boolean;
    };
    if (body.version !== row.version) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Version conflict — the rule changed. Reload and retry.",
          },
        },
        { status: 409 },
      );
    }
    if (body.title !== undefined) row.title = body.title;
    if (body.description !== undefined) row.description = body.description;
    if (body.legalBasisRef !== undefined) row.legalBasisRef = body.legalBasisRef;
    if (body.severity !== undefined) row.severity = body.severity;
    if (body.activeFlag !== undefined) row.activeFlag = body.activeFlag;
    row.version += 1;
    row.updatedAt = new Date().toISOString();
    return HttpResponse.json({ success: true, data: row });
  }),

  // ---- Violations (full module — Phase 8) -----------------------------------
  http.get("/api/violations", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const severity = url.searchParams.get("severity");
    const assignedTo = url.searchParams.get("assignedTo");
    let rows = violationRows;
    if (status) rows = rows.filter((row) => row.status === status);
    if (severity) rows = rows.filter((row) => row.severity === severity);
    if (assignedTo) rows = rows.filter((row) => row.assignedTo === assignedTo);
    return HttpResponse.json({ success: true, data: rows });
  }),

  http.get("/api/violations/:id", ({ params }) => {
    const row = violationRows.find((v) => v.id === params.id);
    if (!row) {
      return HttpResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Violation not found" } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: row });
  }),

  http.post("/api/violations", async ({ request }) => {
    const body = (await request.json()) as {
      validationResultId?: string;
      severity: string;
      title: string;
      description?: string;
      assignedTo?: string;
      dueAt?: string;
    };
    const now = new Date().toISOString();
    const created: ViolationResponse = {
      id: `vio-created-${Date.now()}`,
      validationResultId: body.validationResultId ?? null,
      severity: body.severity,
      title: body.title,
      description: body.description ?? null,
      status: "OPEN",
      assignedTo: body.assignedTo ?? null,
      openedAt: now,
      dueAt: body.dueAt ?? null,
      closedAt: null,
      resolutionSummary: null,
      evidenceRequiredFlag: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    violationRows.push(created);
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch("/api/violations/:id", async ({ params, request }) => {
    const row = violationRows.find((v) => v.id === params.id);
    if (!row) {
      return HttpResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Violation not found" } },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      version?: number;
      severity?: string;
      status?: string;
      assignedTo?: string | null;
      dueAt?: string | null;
      resolutionSummary?: string | null;
    };
    if (body.version === undefined || body.version !== row.version) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Concurrent update detected; refresh and retry with the current version",
          },
        },
        { status: 409 },
      );
    }
    if (row.status === "CLOSED" || row.status === "ARCHIVED") {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: `Violation is already ${row.status} and cannot be updated` },
        },
        { status: 409 },
      );
    }
    const nextStatus = body.status ?? row.status;
    if (
      body.status !== undefined &&
      !VIOLATION_TRANSITIONS[row.status as keyof typeof VIOLATION_TRANSITIONS]?.some(
        (t) => t.to === nextStatus,
      )
    ) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: `Illegal transition ${row.status} → ${nextStatus} in violation lifecycle` },
        },
        { status: 409 },
      );
    }
    if (body.severity !== undefined) row.severity = body.severity;
    if (body.status !== undefined) row.status = nextStatus;
    if (body.assignedTo !== undefined) row.assignedTo = body.assignedTo;
    if (body.dueAt !== undefined) row.dueAt = body.dueAt;
    if (body.resolutionSummary !== undefined) row.resolutionSummary = body.resolutionSummary;
    row.version += 1;
    row.updatedAt = new Date().toISOString();
    return HttpResponse.json({ success: true, data: row });
  }),

  http.post("/api/violations/:id/close", async ({ params, request }) => {
    const row = violationRows.find((v) => v.id === params.id);
    if (!row) {
      return HttpResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Violation not found" } },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { version?: number; resolutionSummary?: string };
    if (row.status !== "VALIDATED") {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: `Violation must be VALIDATED before closing (current: ${row.status})` },
        },
        { status: 409 },
      );
    }
    if (body.version === undefined || body.version !== row.version) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Concurrent update detected; refresh and retry with the current version",
          },
        },
        { status: 409 },
      );
    }
    row.status = "CLOSED";
    row.resolutionSummary = body.resolutionSummary ?? null;
    row.closedAt = new Date().toISOString();
    row.version += 1;
    row.updatedAt = new Date().toISOString();
    return HttpResponse.json({ success: true, data: row });
  }),

  // ---- Remediation tasks (Phase 8) -------------------------------------------
  http.get("/api/remediation-tasks", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const violationId = url.searchParams.get("violationId");
    const assignedTo = url.searchParams.get("assignedTo");
    let rows = remediationTaskRows;
    if (status) rows = rows.filter((row) => row.status === status);
    if (violationId) rows = rows.filter((row) => row.violationId === violationId);
    if (assignedTo) rows = rows.filter((row) => row.assignedTo === assignedTo);
    return HttpResponse.json({ success: true, data: rows });
  }),

  http.get("/api/remediation-tasks/:id", ({ params }) => {
    const row = remediationTaskRows.find((t) => t.id === params.id);
    if (!row) {
      return HttpResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Remediation task not found" } },
        { status: 404 },
      );
    }
    return HttpResponse.json({ success: true, data: row });
  }),

  http.post("/api/remediation-tasks", async ({ request }) => {
    const body = (await request.json()) as {
      violationId: string;
      taskTitle: string;
      taskDescription?: string;
      assignedTo?: string;
      dueAt?: string;
    };
    const now = new Date().toISOString();
    const created: RemediationTaskResponse = {
      id: `rem-created-${Date.now()}`,
      violationId: body.violationId,
      source: "MANUAL",
      taskTitle: body.taskTitle,
      taskDescription: body.taskDescription ?? null,
      status: "PENDING",
      assignedTo: body.assignedTo ?? null,
      dueAt: body.dueAt ?? null,
      verifiedAt: null,
      verifiedBy: null,
      closedAt: null,
      verificationNotes: null,
      resolutionSummary: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    remediationTaskRows.push(created);
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch("/api/remediation-tasks/:id", async ({ params, request }) => {
    const row = remediationTaskRows.find((t) => t.id === params.id);
    if (!row) {
      return HttpResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Remediation task not found" } },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      version?: number;
      status?: string;
      assignedTo?: string | null;
      dueAt?: string | null;
      verificationNotes?: string | null;
      resolutionSummary?: string | null;
    };
    if (body.version === undefined || body.version !== row.version) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Concurrent update detected; refresh and retry with the current version",
          },
        },
        { status: 409 },
      );
    }
    if (row.status === "CLOSED" || row.status === "CANCELLED") {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: `Remediation task is already ${row.status} and cannot be updated` },
        },
        { status: 409 },
      );
    }
    const nextStatus = body.status ?? row.status;
    if (
      body.status !== undefined &&
      !REMEDIATION_TRANSITIONS[row.status as keyof typeof REMEDIATION_TRANSITIONS]?.some(
        (t) => t.to === nextStatus,
      )
    ) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: `Illegal transition ${row.status} → ${nextStatus} in remediation task lifecycle` },
        },
        { status: 409 },
      );
    }
    if (body.status !== undefined) row.status = nextStatus;
    if (body.assignedTo !== undefined) row.assignedTo = body.assignedTo;
    if (body.dueAt !== undefined) row.dueAt = body.dueAt;
    if (body.verificationNotes !== undefined) row.verificationNotes = body.verificationNotes;
    if (body.resolutionSummary !== undefined) row.resolutionSummary = body.resolutionSummary;
    if (nextStatus === "VERIFIED") {
      row.verifiedAt = new Date().toISOString();
      row.verifiedBy = "usr_demo_admin";
    }
    row.version += 1;
    row.updatedAt = new Date().toISOString();
    return HttpResponse.json({ success: true, data: row });
  }),

  http.post("/api/remediation-tasks/:id/close", async ({ params, request }) => {
    const row = remediationTaskRows.find((t) => t.id === params.id);
    if (!row) {
      return HttpResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Remediation task not found" } },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { version?: number; resolutionSummary?: string };
    if (row.status !== "VERIFIED") {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "CONFLICT", message: `Remediation task must be VERIFIED before closing (current: ${row.status})` },
        },
        { status: 409 },
      );
    }
    if (body.version === undefined || body.version !== row.version) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Concurrent update detected; refresh and retry with the current version",
          },
        },
        { status: 409 },
      );
    }
    row.status = "CLOSED";
    row.resolutionSummary = body.resolutionSummary ?? null;
    row.closedAt = new Date().toISOString();
    row.version += 1;
    row.updatedAt = new Date().toISOString();
    return HttpResponse.json({ success: true, data: row });
  }),
];
