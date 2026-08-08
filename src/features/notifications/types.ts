/** Mirrors NotificationRecord in dpdpos_backend notification-response.dto.ts. */
export interface NotificationRecord {
  id: string;
  organizationId: string;
  recipientUserId: string;
  notificationType: string;
  channel: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
  readAt: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export const NOTIFICATION_STATUSES = ["PENDING", "SENT", "FAILED", "READ"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/** Mirrors listNotificationsQuerySchema. */
export interface ListNotificationsQuery {
  status?: NotificationStatus;
  notificationType?: string;
  page?: number;
  pageSize?: number;
}

/** Mirrors updatePreferencesDtoSchema + the stored shape. */
export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  slack: boolean;
}

/** Known notificationType values from the backend template map (§9.13). */
export const NOTIFICATION_TYPES = [
  "VIOLATION_CREATED",
  "EVIDENCE_APPROVED",
  "RIGHTS_REQUEST_SUBMITTED",
  "REPORT_GENERATED",
  "VALIDATION_FAILED",
  "SLA_WARNING",
] as const;
