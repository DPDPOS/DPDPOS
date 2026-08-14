/**
 * Frozen permission catalog — mirrored 1:1 from
 * dpdpos_backend/src/shared/constants/permissions.ts (§9.14 roles screen).
 * A unit test asserts the mirror contains exactly the backend strings so
 * the two catalogs cannot drift.
 */

export const PERMISSIONS = {
  // organizations
  ORGANIZATION_CREATE: "organization:create",
  ORGANIZATION_READ: "organization:read",
  ORGANIZATION_UPDATE: "organization:update",

  // users
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_INVITE: "user:invite",

  // roles
  ROLE_CREATE: "role:create",
  ROLE_READ: "role:read",
  ROLE_UPDATE_PERMISSIONS: "role:update_permissions",
  ROLE_ASSIGN: "role:assign",

  // departments
  DEPARTMENT_CREATE: "department:create",
  DEPARTMENT_READ: "department:read",
  DEPARTMENT_UPDATE: "department:update",

  // framework / controls / requirements
  FRAMEWORK_GENERATE: "framework:generate",
  FRAMEWORK_READ: "framework:read",
  FRAMEWORK_PUBLISH: "framework:publish",
  CONTROL_CREATE: "control:create",
  CONTROL_READ: "control:read",
  CONTROL_UPDATE: "control:update",
  REQUIREMENT_CREATE: "requirement:create",
  REQUIREMENT_READ: "requirement:read",

  // inventory
  DATA_ASSET_CREATE: "data_asset:create",
  DATA_ASSET_READ: "data_asset:read",
  DATA_ASSET_UPDATE: "data_asset:update",
  DATA_ASSET_DELETE: "data_asset:delete",
  PROCESSING_ACTIVITY_CREATE: "processing_activity:create",
  PROCESSING_ACTIVITY_READ: "processing_activity:read",
  PROCESSING_ACTIVITY_UPDATE: "processing_activity:update",
  PROCESSING_ACTIVITY_DELETE: "processing_activity:delete",

  // notices & consent
  NOTICE_CREATE: "notice:create",
  NOTICE_READ: "notice:read",
  NOTICE_DELETE: "notice:delete",
  CONSENT_CREATE: "consent:create",
  CONSENT_READ: "consent:read",
  CONSENT_WITHDRAW: "consent:withdraw",

  // rights
  RIGHTS_REQUEST_CREATE: "rights_request:create",
  RIGHTS_REQUEST_READ: "rights_request:read",
  RIGHTS_REQUEST_UPDATE: "rights_request:update",

  // validations / violations / remediation
  VALIDATION_RUN: "validation:run",
  VALIDATION_READ: "validation:read",
  VIOLATION_CREATE: "violation:create",
  VIOLATION_READ: "violation:read",
  VIOLATION_ASSIGN: "violation:assign",
  VIOLATION_CLOSE: "violation:close",
  REMEDIATION_READ: "remediation:read",
  REMEDIATION_UPDATE: "remediation:update",

  // evidence / reports / analytics
  EVIDENCE_CREATE: "evidence:create",
  EVIDENCE_READ: "evidence:read",
  EVIDENCE_APPROVE: "evidence:approve",
  EVIDENCE_EXPORT: "evidence:export",
  REPORT_GENERATE: "report:generate",
  REPORT_READ: "report:read",
  ANALYTICS_READ: "analytics:read",

  // notifications / ai / audit
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_PREFERENCES_UPDATE: "notification:update_preferences",
  AI_EXPLAIN: "ai:explain",
  AI_DRAFT: "ai:draft",
  AUDIT_READ: "audit:read",
  AUDIT_EXPORT: "audit:export",

  // assessment / CLI spine
  ASSESSMENT_CREATE: "assessment:create",
  ASSESSMENT_READ: "assessment:read",
  ASSESSMENT_UPDATE: "assessment:update",
  ASSESSMENT_EVALUATE: "assessment:evaluate",
  ASSESSMENT_CLI_TOKEN: "assessment:cli_token",

  // identity / directory federation
  IDENTITY_READ: "identity:read",
  IDENTITY_UPDATE: "identity:update",
  IDENTITY_SYNC: "identity:sync",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: string[] = Object.values(PERMISSIONS);

export interface PermissionGroup {
  id: string;
  label: string;
  permissions: string[];
}

/**
 * Grouping for the role permission editor — mirrors the comment blocks of the
 * backend catalog so the tree reads like the source of truth.
 */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "organizations",
    label: "Organizations",
    permissions: [
      PERMISSIONS.ORGANIZATION_CREATE,
      PERMISSIONS.ORGANIZATION_READ,
      PERMISSIONS.ORGANIZATION_UPDATE,
    ],
  },
  {
    id: "users",
    label: "Users",
    permissions: [
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_INVITE,
    ],
  },
  {
    id: "roles",
    label: "Roles",
    permissions: [
      PERMISSIONS.ROLE_CREATE,
      PERMISSIONS.ROLE_READ,
      PERMISSIONS.ROLE_UPDATE_PERMISSIONS,
      PERMISSIONS.ROLE_ASSIGN,
    ],
  },
  {
    id: "departments",
    label: "Departments",
    permissions: [
      PERMISSIONS.DEPARTMENT_CREATE,
      PERMISSIONS.DEPARTMENT_READ,
      PERMISSIONS.DEPARTMENT_UPDATE,
    ],
  },
  {
    id: "assessments",
    label: "Assessments & CLI",
    permissions: [
      PERMISSIONS.ASSESSMENT_CREATE,
      PERMISSIONS.ASSESSMENT_READ,
      PERMISSIONS.ASSESSMENT_UPDATE,
      PERMISSIONS.ASSESSMENT_EVALUATE,
      PERMISSIONS.ASSESSMENT_CLI_TOKEN,
    ],
  },
  {
    id: "identity",
    label: "Directory identity",
    permissions: [
      PERMISSIONS.IDENTITY_READ,
      PERMISSIONS.IDENTITY_UPDATE,
      PERMISSIONS.IDENTITY_SYNC,
    ],
  },
  {
    id: "framework",
    label: "Framework, controls & requirements",
    permissions: [
      PERMISSIONS.FRAMEWORK_GENERATE,
      PERMISSIONS.FRAMEWORK_READ,
      PERMISSIONS.FRAMEWORK_PUBLISH,
      PERMISSIONS.CONTROL_CREATE,
      PERMISSIONS.CONTROL_READ,
      PERMISSIONS.CONTROL_UPDATE,
      PERMISSIONS.REQUIREMENT_CREATE,
      PERMISSIONS.REQUIREMENT_READ,
    ],
  },
  {
    id: "inventory",
    label: "Data inventory",
    permissions: [
      PERMISSIONS.DATA_ASSET_CREATE,
      PERMISSIONS.DATA_ASSET_READ,
      PERMISSIONS.DATA_ASSET_UPDATE,
      PERMISSIONS.DATA_ASSET_DELETE,
      PERMISSIONS.PROCESSING_ACTIVITY_CREATE,
      PERMISSIONS.PROCESSING_ACTIVITY_READ,
      PERMISSIONS.PROCESSING_ACTIVITY_UPDATE,
      PERMISSIONS.PROCESSING_ACTIVITY_DELETE,
    ],
  },
  {
    id: "notices",
    label: "Notices & consent",
    permissions: [
      PERMISSIONS.NOTICE_CREATE,
      PERMISSIONS.NOTICE_READ,
      PERMISSIONS.NOTICE_DELETE,
      PERMISSIONS.CONSENT_CREATE,
      PERMISSIONS.CONSENT_READ,
      PERMISSIONS.CONSENT_WITHDRAW,
    ],
  },
  {
    id: "rights",
    label: "Data principal rights",
    permissions: [
      PERMISSIONS.RIGHTS_REQUEST_CREATE,
      PERMISSIONS.RIGHTS_REQUEST_READ,
      PERMISSIONS.RIGHTS_REQUEST_UPDATE,
    ],
  },
  {
    id: "enforcement",
    label: "Validations, violations & remediation",
    permissions: [
      PERMISSIONS.VALIDATION_RUN,
      PERMISSIONS.VALIDATION_READ,
      PERMISSIONS.VIOLATION_CREATE,
      PERMISSIONS.VIOLATION_READ,
      PERMISSIONS.VIOLATION_ASSIGN,
      PERMISSIONS.VIOLATION_CLOSE,
      PERMISSIONS.REMEDIATION_READ,
      PERMISSIONS.REMEDIATION_UPDATE,
    ],
  },
  {
    id: "evidence",
    label: "Evidence, reports & analytics",
    permissions: [
      PERMISSIONS.EVIDENCE_CREATE,
      PERMISSIONS.EVIDENCE_READ,
      PERMISSIONS.EVIDENCE_APPROVE,
      PERMISSIONS.EVIDENCE_EXPORT,
      PERMISSIONS.REPORT_GENERATE,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.ANALYTICS_READ,
    ],
  },
  {
    id: "system",
    label: "Notifications, AI & audit",
    permissions: [
      PERMISSIONS.NOTIFICATION_READ,
      PERMISSIONS.NOTIFICATION_PREFERENCES_UPDATE,
      PERMISSIONS.AI_EXPLAIN,
      PERMISSIONS.AI_DRAFT,
      PERMISSIONS.AUDIT_READ,
      PERMISSIONS.AUDIT_EXPORT,
    ],
  },
];

/** "data_asset:read" → "Read data asset" — label for the permission tree. */
export function permissionLabel(permission: string): string {
  const [resource, action] = permission.split(":");
  const actionWords = action
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
  const resourceWords = resource.replace(/_/g, " ");
  return `${actionWords} ${resourceWords}`;
}
