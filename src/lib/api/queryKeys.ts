/**
 * TanStack Query key builders — implementation plan §7.5.
 * List keys include the full filter object for cache precision.
 */

export const queryKeys = {
  health: ["health"] as const,
  dashboard: ["dashboard"] as const,
  framework: (id?: string) => ["framework", id ?? "latest"] as const,
  controls: (filter?: Record<string, unknown>) =>
    ["controls", filter] as const,
  requirements: (filter?: Record<string, unknown>) =>
    ["requirements", filter] as const,
  dataAssets: (filter?: Record<string, unknown>) =>
    ["data-assets", filter] as const,
  processingActivities: (assetId?: string) =>
    ["processing-activities", assetId] as const,
  notices: ["notices"] as const,
  consentRecords: (filter?: Record<string, unknown>) =>
    ["consent-records", filter] as const,
  rightsRequests: (filter?: Record<string, unknown>) =>
    ["rights-requests", filter] as const,
  validationRules: (filter?: Record<string, unknown>) =>
    ["validation-rules", filter] as const,
  validationRuns: (filter?: Record<string, unknown>) =>
    ["validation-runs", filter] as const,
  violations: (filter?: Record<string, unknown>) =>
    ["violations", filter] as const,
  violation: (id: string) => ["violations", "detail", id] as const,
  remediation: (filter?: Record<string, unknown>) =>
    ["remediation", filter] as const,
  evidence: (filter?: Record<string, unknown>) =>
    ["evidence", filter] as const,
  reports: (filter?: Record<string, unknown>) =>
    ["reports", filter] as const,
  audit: (filter?: Record<string, unknown>) => ["audit", filter] as const,
  notifications: (filter?: Record<string, unknown>) =>
    ["notifications", filter] as const,
  unreadCount: ["notifications", "unread-count"] as const,
  users: (filter?: Record<string, unknown>) => ["users", filter] as const,
  roles: ["roles"] as const,
  departments: ["departments"] as const,
  organization: (id: string) => ["organizations", id] as const,
} as const;
