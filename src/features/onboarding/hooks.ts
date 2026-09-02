"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { downloadOnboardingTemplate, onboardingApi } from "./api";
import type {
  ImportOnboardingExcelPayload,
  OnboardingProfilePayload,
  SaveOnboardingAnswersPayload,
} from "./types";

function useInvalidateOnboarding() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.onboardingStatus });
    void queryClient.invalidateQueries({
      queryKey: queryKeys.onboardingQuestionnaire,
    });
  };
}

export function useOnboardingStatus(enabled = true) {
  return useQuery({
    queryKey: queryKeys.onboardingStatus,
    queryFn: () => onboardingApi.status(),
    enabled,
    retry: 0,
  });
}

export function useOnboardingQuestionnaire(enabled = true) {
  return useQuery({
    queryKey: queryKeys.onboardingQuestionnaire,
    queryFn: () => onboardingApi.questionnaire(),
    enabled,
    retry: 0,
  });
}

export function useUpdateOnboardingProfile() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateOnboarding();
  return useMutation({
    mutationFn: (body: OnboardingProfilePayload) => onboardingApi.updateProfile(body),
    onSuccess: (data) => {
      invalidate();
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organization(data.organization.id),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.assessmentQuestionnaireCatalog,
      });
    },
  });
}

export function useSaveOnboardingAnswers() {
  const invalidate = useInvalidateOnboarding();
  return useMutation({
    mutationFn: (body: SaveOnboardingAnswersPayload) => onboardingApi.saveAnswers(body),
    onSuccess: invalidate,
  });
}

export function useImportOnboardingExcel() {
  const invalidate = useInvalidateOnboarding();
  return useMutation({
    mutationFn: (body: ImportOnboardingExcelPayload) => onboardingApi.importExcel(body),
    onSuccess: invalidate,
  });
}

export function useCompleteOnboarding() {
  const invalidate = useInvalidateOnboarding();
  return useMutation({
    mutationFn: () => onboardingApi.complete(),
    onSuccess: invalidate,
  });
}

export function useDownloadOnboardingTemplate() {
  return useMutation({
    mutationFn: () => downloadOnboardingTemplate(),
  });
}
