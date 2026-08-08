export const ASSESSMENT_STATUSES = [
  "DRAFT",
  "IN_PROGRESS",
  "READY_FOR_EVALUATION",
  "EVALUATED",
  "ARCHIVED",
] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const ASSESSMENT_DOCUMENT_TYPES = [
  "PRIVACY_NOTICE",
  "CONSENT_POLICY",
  "RETENTION_POLICY",
  "BREACH_POLICY",
  "RIGHTS_SOP",
  "VENDOR_DPA",
  "SECURITY_POLICY",
  "OTHER",
] as const;
export type AssessmentDocumentType = (typeof ASSESSMENT_DOCUMENT_TYPES)[number];

export interface AssessmentResponse {
  id: string;
  organizationId: string;
  name: string;
  status: AssessmentStatus | string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssessmentPayload {
  name: string;
}

export interface AssessmentDocument {
  id: string;
  fileName: string;
  fileType: string;
  documentType: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  uploadStatus: string;
  checksum: string;
  versionNumber: number;
  createdAt: string;
  storageKey?: string | null;
}

export interface UploadDocumentPayload {
  fileName: string;
  fileType: string;
  documentType?: AssessmentDocumentType;
  contentBase64?: string;
  extractedText?: string;
}

export interface InitiateDocumentPayload {
  fileName: string;
  mimeType: string;
  documentType: AssessmentDocumentType;
}

export interface ConfirmDocumentPayload {
  fileHash: string;
  fileSizeBytes: number;
  extractedText?: string;
}

export interface QuestionnaireQuestion {
  code: string;
  stageId: string;
  stageLabel: string;
  stageOrder: number;
  label: string;
  helpText: string;
  valueType: "boolean" | "string";
  options?: string[];
  required?: boolean;
  showIf?: { code: string; equals: string | boolean };
}

export interface QuestionnaireStage {
  stageId: string;
  stageLabel: string;
  stageOrder: number;
  questionCodes: string[];
}

export interface DocumentTypeOption {
  value: AssessmentDocumentType;
  label: string;
}

export interface QuestionnaireCatalog {
  questions: QuestionnaireQuestion[];
  stages: QuestionnaireStage[];
  documentTypes: DocumentTypeOption[];
}

export interface QuestionnaireAnswer {
  id: string;
  questionCode: string;
  valueJson: string | boolean | number | null;
  versionNumber: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface SaveAnswersPayload {
  answers: Array<{ questionCode: string; value: string | boolean | number | null }>;
}

export interface CliTokenResponse {
  id: string;
  token: string;
  label: string;
  expiresAt: string | null;
  instructions: {
    login: string;
    configure: string;
    scan: string;
    submit: string;
  };
}

export interface ScanJob {
  id: string;
  assessmentId: string;
  versionNumber: number;
  targetType: string;
  targetPath: string;
  cliVersion: string;
  status: string;
  findingsCount: number;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
}

export interface ControlEvalResult {
  controlCode: string;
  status: string;
  severity: string;
  reasoning: string;
  evidenceRefs: Array<{ kind: string; ref: string }>;
}

export interface AssessmentReportSummary {
  pass: number;
  partial: number;
  fail: number;
  unknown: number;
  notApplicable: number;
  scoreKind?: "READINESS";
  disclaimer?: string;
  evidenceCeilingApplied?: boolean;
  ceilingReason?: string | null;
  profile?: {
    processesChildren: boolean | null;
    crossBorder: boolean | null;
    isSdf: boolean | null;
    hasVendors: boolean | null;
  };
}

export interface AssessmentReport {
  id: string;
  version: number;
  score: number;
  scoreKind?: "READINESS";
  disclaimer?: string;
  summary: AssessmentReportSummary;
  results: ControlEvalResult[];
  createdAt: string;
}

export interface EvaluateResponse {
  score: number;
  scoreKind?: "READINESS";
  summary: AssessmentReportSummary;
  results: ControlEvalResult[];
  versionNumber: number;
  openedViolations?: number;
  nextSteps?: {
    remediation: string;
    violations: string;
    hint: string;
  };
}

export interface AssessmentVersion {
  id: string;
  versionNumber: number;
  label: string | null;
  readinessScore?: number | null;
  snapshotJson?: unknown;
  createdAt: string;
  frozenPriorScore?: number | null;
  frozenFromVersion?: number;
}

export interface AssessmentAuditEvent {
  id: string;
  action: string;
  actorType: string;
  actorUserId: string | null;
  objectType: string;
  objectId: string | null;
  eventHash: string;
  prevEventHash: string | null;
  createdAt: string;
}
