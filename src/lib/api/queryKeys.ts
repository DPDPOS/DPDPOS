/**
 * TanStack Query key builders — implementation plan §7.5.
 * List keys include the full filter object for cache precision.
 */

export const queryKeys = {
  health: ["health"] as const,
  /** Full dashboard overview — the single key other pages invalidate. */
  dashboard: ["dashboard"] as const,
  analytics: ["analytics"] as const,
  complianceScore: ["analytics", "compliance-score"] as const,
  violationBreakdown: ["analytics", "violations"] as const,
  evidenceCoverage: ["analytics", "evidence"] as const,
  rightsMetrics: ["analytics", "rights-requests"] as const,
  consentMetrics: ["analytics", "consent"] as const,
  validationSummary: ["analytics", "validations"] as const,
  // Parameterised keys return the bare prefix when called without a filter:
  // invalidateQueries matches by array prefix, so ["framework"] invalidates
  // every ["framework", …] query, whereas a trailing undefined element would
  // not match (React Query v5 hashes undefined to null and prefix-matches
  // strictly).
  framework: (id?: string) =>
    id ? (["framework", id] as const) : (["framework"] as const),
  controls: (filter?: Record<string, unknown>) =>
    filter ? (["controls", filter] as const) : (["controls"] as const),
  requirements: (filter?: Record<string, unknown>) =>
    filter ? (["requirements", filter] as const) : (["requirements"] as const),
  dataAssets: (filter?: Record<string, unknown>) =>
    filter ? (["data-assets", filter] as const) : (["data-assets"] as const),
  processingActivities: (assetId?: string) =>
    assetId
      ? (["processing-activities", assetId] as const)
      : (["processing-activities"] as const),
  notices: ["notices"] as const,
  consentRecords: (filter?: Record<string, unknown>) =>
    filter
      ? (["consent-records", filter] as const)
      : (["consent-records"] as const),
  rightsRequests: (filter?: Record<string, unknown>) =>
    filter ? (["rights-requests", filter] as const) : (["rights-requests"] as const),
  validationRules: (filter?: Record<string, unknown>) =>
    filter ? (["validation-rules", filter] as const) : (["validation-rules"] as const),
  validationRuns: (filter?: Record<string, unknown>) =>
    filter ? (["validation-runs", filter] as const) : (["validation-runs"] as const),
  violations: (filter?: Record<string, unknown>) =>
    filter ? (["violations", filter] as const) : (["violations"] as const),
  violation: (id: string) => ["violations", "detail", id] as const,
  remediation: (filter?: Record<string, unknown>) =>
    filter ? (["remediation", filter] as const) : (["remediation"] as const),
  evidence: (filter?: Record<string, unknown>) =>
    filter ? (["evidence", filter] as const) : (["evidence"] as const),
  reports: (filter?: Record<string, unknown>) =>
    filter ? (["reports", filter] as const) : (["reports"] as const),
  audit: (filter?: Record<string, unknown>) =>
    filter ? (["audit", filter] as const) : (["audit"] as const),
  notifications: (filter?: Record<string, unknown>) =>
    filter ? (["notifications", filter] as const) : (["notifications"] as const),
  unreadCount: ["notifications", "unread-count"] as const,
  users: (filter?: Record<string, unknown>) =>
    filter ? (["users", filter] as const) : (["users"] as const),
  roles: ["roles"] as const,
  departments: ["departments"] as const,
  organization: (id: string) => ["organizations", id] as const,
} as const;
