"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { vendorsApi } from "./api";
import type {
  CreateAgreementPayload,
  CreateRelationshipPayload,
  CreateReviewPayload,
  CreateVendorPayload,
} from "./types";

export function useVendors(filter?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.vendors(filter),
    queryFn: () => vendorsApi.list(filter),
  });
}

export function useVendor(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vendor(id),
    queryFn: () => vendorsApi.getById(id!),
    enabled: Boolean(id),
  });
}

export function useVendorRisk(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.vendor(id), "risk"],
    queryFn: () => vendorsApi.risk(id!),
    enabled: Boolean(id),
  });
}

export function useVendorAgreements(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.vendor(id), "agreements"],
    queryFn: () => vendorsApi.listAgreements(id!),
    enabled: Boolean(id),
  });
}

export function useVendorReviews(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.vendor(id), "reviews"],
    queryFn: () => vendorsApi.listReviews(id!),
    enabled: Boolean(id),
  });
}

export function useVendorRelationships(id: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.vendor(id), "relationships"],
    queryFn: () => vendorsApi.listRelationships(id!),
    enabled: Boolean(id),
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateVendorPayload) => vendorsApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.vendors() });
    },
  });
}

export function useUpdateVendor(vendorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      body: Partial<CreateVendorPayload> & { version: number },
    ) => vendorsApi.update(vendorId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.vendors() });
      void qc.invalidateQueries({ queryKey: queryKeys.vendor(vendorId) });
    },
  });
}

function invalidateVendorSubtree(
  qc: ReturnType<typeof useQueryClient>,
  vendorId: string,
) {
  void qc.invalidateQueries({ queryKey: queryKeys.vendors() });
  void qc.invalidateQueries({ queryKey: queryKeys.vendor(vendorId) });
}

export function useCreateAgreement(vendorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAgreementPayload) =>
      vendorsApi.createAgreement(vendorId, body),
    onSuccess: () => invalidateVendorSubtree(qc, vendorId),
  });
}

export function useCreateReview(vendorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReviewPayload) =>
      vendorsApi.createReview(vendorId, body),
    onSuccess: () => invalidateVendorSubtree(qc, vendorId),
  });
}

export function useAddRelationship(vendorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRelationshipPayload) =>
      vendorsApi.addRelationship(vendorId, body),
    onSuccess: () => invalidateVendorSubtree(qc, vendorId),
  });
}

export function useOffboardVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorsApi.offboard(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.vendors() });
    },
  });
}

export function useAcknowledgeRelationship(vendorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (relationshipId: string) =>
      vendorsApi.acknowledgeRelationship(vendorId, relationshipId),
    onSuccess: () => invalidateVendorSubtree(qc, vendorId),
  });
}

export function useCreateVendorCliToken() {
  return useMutation({
    mutationFn: (body?: { label?: string; expiresInDays?: number }) =>
      vendorsApi.createCliToken(body),
  });
}
