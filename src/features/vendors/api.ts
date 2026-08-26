import { apiClient } from "@/lib/api/client";
import type {
  CreateAgreementPayload,
  CreateRelationshipPayload,
  CreateReviewPayload,
  CreateVendorPayload,
  VendorCliTokenResponse,
  VendorResponse,
  VendorRiskScorecard,
} from "./types";

export const vendorsApi = {
  list: (query?: { status?: string; criticality?: string }) =>
    apiClient.get<VendorResponse[]>("/vendors", query),
  getById: (id: string) => apiClient.get<VendorResponse>(`/vendors/${id}`),
  create: (body: CreateVendorPayload) =>
    apiClient.post<VendorResponse>("/vendors", body),
  update: (id: string, body: Partial<CreateVendorPayload> & { version: number }) =>
    apiClient.patch<VendorResponse>(`/vendors/${id}`, body),
  offboard: (id: string) =>
    apiClient.post<VendorResponse>(`/vendors/${id}/offboard`, {}),
  risk: (id: string) =>
    apiClient.get<VendorRiskScorecard>(`/vendors/${id}/risk`),
  listAgreements: (id: string) =>
    apiClient.get<unknown[]>(`/vendors/${id}/agreements`),
  createAgreement: (id: string, body: CreateAgreementPayload) =>
    apiClient.post(`/vendors/${id}/agreements`, body),
  listReviews: (id: string) =>
    apiClient.get<unknown[]>(`/vendors/${id}/reviews`),
  createReview: (id: string, body: CreateReviewPayload) =>
    apiClient.post(`/vendors/${id}/reviews`, body),
  listRelationships: (id: string) =>
    apiClient.get<unknown[]>(`/vendors/${id}/relationships`),
  addRelationship: (id: string, body: CreateRelationshipPayload) =>
    apiClient.post(`/vendors/${id}/relationships`, body),
  acknowledgeRelationship: (id: string, relationshipId: string) =>
    apiClient.post(`/vendors/${id}/relationships/acknowledge`, {
      relationshipId,
    }),
  createCliToken: (body?: { label?: string; expiresInDays?: number }) =>
    apiClient.post<VendorCliTokenResponse>("/vendors/cli/tokens", body ?? {}),
};
