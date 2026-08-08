"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { assessmentsApi } from "./api";
import type {
  ConfirmDocumentPayload,
  CreateAssessmentPayload,
  InitiateDocumentPayload,
  SaveAnswersPayload,
  UploadDocumentPayload,
} from "./types";

function useInvalidateAssessment(id?: string | null) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.assessments() });
    if (id) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assessment(id) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentDocuments(id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentAnswers(id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentScans(id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentReport(id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentAudit(id),
      });
    }
  };
}

export function useAssessments(enabled = true) {
  return useQuery({
    queryKey: queryKeys.assessments(),
    queryFn: () => assessmentsApi.list(),
    enabled,
    retry: 0,
  });
}

export function useAssessment(id: string | null) {
  return useQuery({
    queryKey: queryKeys.assessment(id ?? ""),
    queryFn: () => assessmentsApi.getById(id as string),
    enabled: Boolean(id),
    retry: 0,
  });
}

export function useQuestionnaireCatalog(enabled = true) {
  return useQuery({
    queryKey: queryKeys.assessmentQuestionnaireCatalog,
    queryFn: () => assessmentsApi.questionnaireCatalog(),
    enabled,
    retry: 0,
    staleTime: 60_000,
  });
}

export function useAssessmentDocuments(id: string | null) {
  return useQuery({
    queryKey: queryKeys.assessmentDocuments(id ?? ""),
    queryFn: () => assessmentsApi.listDocuments(id as string),
    enabled: Boolean(id),
    retry: 0,
  });
}

export function useAssessmentAnswers(id: string | null) {
  return useQuery({
    queryKey: queryKeys.assessmentAnswers(id ?? ""),
    queryFn: () => assessmentsApi.listAnswers(id as string),
    enabled: Boolean(id),
    retry: 0,
  });
}

export function useAssessmentScans(id: string | null) {
  return useQuery({
    queryKey: queryKeys.assessmentScans(id ?? ""),
    queryFn: () => assessmentsApi.listScans(id as string),
    enabled: Boolean(id),
    retry: 0,
    refetchInterval: 10_000,
  });
}

export function useAssessmentReport(id: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.assessmentReport(id ?? ""),
    queryFn: () => assessmentsApi.getReport(id as string),
    enabled: Boolean(id) && enabled,
    retry: 0,
  });
}

export function useAssessmentAudit(id: string | null) {
  return useQuery({
    queryKey: queryKeys.assessmentAudit(id ?? ""),
    queryFn: () => assessmentsApi.listAudit(id as string),
    enabled: Boolean(id),
    retry: 0,
  });
}

export function useCreateAssessment() {
  const invalidate = useInvalidateAssessment();
  return useMutation({
    mutationFn: (body: CreateAssessmentPayload) => assessmentsApi.create(body),
    onSuccess: invalidate,
  });
}

export function useUploadAssessmentDocument(id: string) {
  const invalidate = useInvalidateAssessment(id);
  return useMutation({
    mutationFn: (body: UploadDocumentPayload) =>
      assessmentsApi.uploadDocument(id, body),
    onSuccess: invalidate,
  });
}

export function useInitiateAssessmentDocument(id: string) {
  return useMutation({
    mutationFn: (body: InitiateDocumentPayload) =>
      assessmentsApi.initiateDocument(id, body),
  });
}

export function useConfirmAssessmentDocument(id: string) {
  const invalidate = useInvalidateAssessment(id);
  return useMutation({
    mutationFn: ({
      documentId,
      body,
    }: {
      documentId: string;
      body: ConfirmDocumentPayload;
    }) => assessmentsApi.confirmDocument(id, documentId, body),
    onSuccess: invalidate,
  });
}

export function useSaveAssessmentAnswers(id: string) {
  const invalidate = useInvalidateAssessment(id);
  return useMutation({
    mutationFn: (body: SaveAnswersPayload) =>
      assessmentsApi.saveAnswers(id, body),
    onSuccess: invalidate,
  });
}

export function useCreateCliToken(id: string) {
  const invalidate = useInvalidateAssessment(id);
  return useMutation({
    mutationFn: (body: { label: string; expiresInDays?: number }) =>
      assessmentsApi.createCliToken(id, body),
    onSuccess: invalidate,
  });
}

export function useEvaluateAssessment(id: string) {
  const invalidate = useInvalidateAssessment(id);
  return useMutation({
    mutationFn: () => assessmentsApi.evaluate(id),
    onSuccess: invalidate,
  });
}

export function useCreateAssessmentVersion(id: string) {
  const invalidate = useInvalidateAssessment(id);
  return useMutation({
    mutationFn: (body?: { label?: string }) =>
      assessmentsApi.createVersion(id, body),
    onSuccess: invalidate,
  });
}
