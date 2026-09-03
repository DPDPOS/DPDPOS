/**
 * Mirrors dpdpos_backend/src/modules/analytics/dto/analytics-response.dto.ts.
 * Field names and Record<string, number> shapes are copied verbatim so the
 * dashboard renders exactly what the API returns.
 */

export interface ComplianceScoreResult {
  score: number;
  totalRules: number;
  passed: number;
  failed: number;
  trend?: { date: string; score: number }[];
}

export interface ViolationBreakdown {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface EvidenceCoverage {
  totalControls: number;
  controlsWithEvidence: number;
  coveragePercent: number;
}

export interface RightsRequestMetrics {
  total: number;
  open: number;
  closed: number;
  avgResolutionDays: number | null;
  byType: Record<string, number>;
}

export interface ConsentMetrics {
  totalRecords: number;
  granted: number;
  withdrawn: number;
  grantedThisMonth: number;
  withdrawnThisMonth: number;
  expired: number;
  expiringSoon: number;
}

export interface ValidationSummary {
  totalRules: number;
  passed: number;
  failed: number;
}

export interface VendorRiskSummary {
  totalVendors: number;
  activeVendors: number;
  missingDpa: number;
  highRisk: number;
  reviewsOverdue: number;
  dpaExpiring: number;
}

export interface DashboardOverview {
  complianceScore: ComplianceScoreResult;
  violations: ViolationBreakdown;
  evidence: EvidenceCoverage;
  rightsRequests: RightsRequestMetrics;
  consent: ConsentMetrics;
}
