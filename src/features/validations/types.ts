/**
 * Validations — mirrors dpdpos_backend/src/modules/validations
 * (validation-run.dto.ts, validation-rule.dto.ts, response mappers).
 */

export const RUN_STATUSES = [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "PARTIAL",
  "FAILED",
] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const RESULT_STATUSES = ["PASS", "FAIL", "SKIPPED", "ERROR"] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number];

export const RULE_CATEGORIES = ["NOTICE", "CONSENT", "RETENTION", "RIGHTS"] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];

export const RULE_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type RuleSeverity = (typeof RULE_SEVERITIES)[number];

export const RUN_TERMINAL_STATUSES: readonly RunStatus[] = [
  "COMPLETED",
  "PARTIAL",
  "FAILED",
];

/** Mirrors ValidationRunResponse. */
export interface ValidationRunResponse {
  id: string;
  triggerType: string;
  triggeredBy: string | null;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors ValidationResultResponse. */
export interface ValidationResultResponse {
  id: string;
  runId: string;
  ruleId: string;
  ruleCode: string;
  resultStatus: string;
  explanation: string | null;
  score: number | null;
  evidenceRequiredFlag: boolean;
  controlId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /validation-runs/:id — run + its results. */
export interface ValidationRunDetail extends ValidationRunResponse {
  results: ValidationResultResponse[];
}

/** Mirrors ValidationRuleResponse. */
export interface ValidationRuleResponse {
  id: string;
  ruleCode: string;
  title: string;
  description: string | null;
  legalBasisRef: string | null;
  severity: string;
  category: string;
  activeFlag: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type ListValidationRunsQuery = {
  status?: RunStatus;
};

export type ListValidationRulesQuery = {
  category?: RuleCategory;
  activeOnly?: boolean;
};

export interface CreateValidationRulePayload {
  ruleCode: string;
  title: string;
  description?: string;
  legalBasisRef?: string;
  severity?: RuleSeverity;
  category?: RuleCategory;
}

export interface UpdateValidationRulePayload {
  /** Optimistic-lock token — mismatch returns 409. */
  version: number;
  title?: string;
  description?: string | null;
  legalBasisRef?: string | null;
  severity?: RuleSeverity;
  activeFlag?: boolean;
}

export function isRunTerminal(status: string): boolean {
  return (RUN_TERMINAL_STATUSES as readonly string[]).includes(status);
}
