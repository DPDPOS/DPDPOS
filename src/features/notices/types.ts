/** Mirrors NoticeContentFormat in the Prisma schema. */
export const NOTICE_CONTENT_FORMATS = ["PLAIN", "MARKDOWN"] as const;
export type NoticeContentFormat = (typeof NOTICE_CONTENT_FORMATS)[number];

/** Mirrors NoticeResponse in notice.types.ts. */
export interface NoticeResponse {
  id: string;
  title: string;
  version: number;
  content: string;
  contentFormat: NoticeContentFormat;
  effectiveFrom: string | null;
  publishedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors createNoticeDtoSchema. */
export interface CreateNoticePayload {
  title: string;
  content: string;
  contentFormat?: NoticeContentFormat;
  effectiveFrom?: string;
}

/** Mirrors NoticeDiffResponse from notice.service. */
export interface NoticeDiffResponse {
  noticeId: string;
  title: string;
  fromVersion: number;
  toVersion: number;
  fromContent: string;
  toContent: string;
  unifiedDiff: string;
}
