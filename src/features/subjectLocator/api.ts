import { apiClient } from "@/lib/api/client";

export type ScoredHit = {
  id: string;
  score?: number;
  match?: string;
};

export type SubjectLocatorResult = {
  query: string;
  limit?: number;
  hits: {
    consentRecords: Array<
      ScoredHit & {
        subjectReference: string;
        purpose: string;
        state: string;
        createdAt: string;
      }
    >;
    dataSubjectRequests: Array<
      ScoredHit & {
        requestType: string;
        status: string;
        openedAt: string;
      }
    >;
    processingActivities: Array<
      ScoredHit & {
        purpose: string;
        processorName: string | null;
        vendorId: string | null;
        vendorName: string | null;
      }
    >;
    vendors: Array<
      ScoredHit & {
        name: string;
        status: string;
        criticality: string;
      }
    >;
    dataAssets?: Array<
      ScoredHit & {
        assetName: string;
        description: string | null;
        storageLocation: string | null;
      }
    >;
    evidenceFiles?: Array<
      ScoredHit & {
        fileName: string;
        description: string | null;
        tags: string[];
      }
    >;
    auditLogs?: Array<
      ScoredHit & {
        action: string;
        entityType: string;
        entityId: string;
        createdAt: string;
      }
    >;
    vendorAgreements?: Array<
      ScoredHit & {
        title: string;
        vendorName: string | null;
        notes: string | null;
      }
    >;
  };
};

export const subjectLocatorApi = {
  search: (q: string, limit = 50) =>
    apiClient.get<SubjectLocatorResult>("/subject-locator", { q, limit }),
};
