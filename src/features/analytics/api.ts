import { apiClient } from "@/lib/api/client";
import type {
  ComplianceScoreResult,
  ConsentMetrics,
  DashboardOverview,
  EvidenceCoverage,
  RightsRequestMetrics,
  ValidationSummary,
  ViolationBreakdown,
} from "./types";

/** GET /api/v1/analytics/* — all gated by `analytics:read` server-side. */
export const analyticsApi = {
  dashboard: () => apiClient.get<DashboardOverview>("/analytics/dashboard"),
  complianceScore: () =>
    apiClient.get<ComplianceScoreResult>("/analytics/compliance-score"),
  violations: () =>
    apiClient.get<ViolationBreakdown>("/analytics/violations"),
  evidence: () => apiClient.get<EvidenceCoverage>("/analytics/evidence"),
  rightsRequests: () =>
    apiClient.get<RightsRequestMetrics>("/analytics/rights-requests"),
  consent: () => apiClient.get<ConsentMetrics>("/analytics/consent"),
  validations: () =>
    apiClient.get<ValidationSummary>("/analytics/validations"),
};
