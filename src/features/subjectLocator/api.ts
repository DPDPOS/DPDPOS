import { apiClient } from "@/lib/api/client";

export type SubjectLocatorResult = {
  query: string;
  hits: {
    consentRecords: Array<{
      id: string;
      subjectReference: string;
      purpose: string;
      state: string;
      createdAt: string;
    }>;
    dataSubjectRequests: Array<{
      id: string;
      requestType: string;
      status: string;
      openedAt: string;
    }>;
    processingActivities: Array<{
      id: string;
      purpose: string;
      processorName: string | null;
      vendorId: string | null;
      vendorName: string | null;
    }>;
    vendors: Array<{
      id: string;
      name: string;
      status: string;
      criticality: string;
    }>;
  };
};

export const subjectLocatorApi = {
  search: (q: string) =>
    apiClient.get<SubjectLocatorResult>("/subject-locator", { q }),
};
