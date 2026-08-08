/** Mirrors NoticeResponse in notice.types.ts. */
export interface NoticeResponse {
  id: string;
  title: string;
  version: number;
  content: string;
  effectiveFrom: string | null;
  publishedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors createNoticeDtoSchema. */
export interface CreateNoticePayload {
  title: string;
  content: string;
  effectiveFrom?: string;
}
