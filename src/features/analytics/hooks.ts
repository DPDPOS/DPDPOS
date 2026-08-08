"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { useSessionStore } from "@/state/session";
import { analyticsApi } from "./api";

/**
 * Analytics hooks. The dashboard overview is one query (plan §9.1) with a
 * stable ["dashboard"] key so any page action can invalidate just its slice;
 * individual metric endpoints are exposed for future sections.
 */
export function useDashboardOverview(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: analyticsApi.dashboard,
    enabled,
  });
}

export function useComplianceScore(enabled = true) {
  return useQuery({
    queryKey: queryKeys.complianceScore,
    queryFn: analyticsApi.complianceScore,
    enabled,
  });
}

export function useViolationBreakdown(enabled = true) {
  return useQuery({
    queryKey: queryKeys.violationBreakdown,
    queryFn: analyticsApi.violations,
    enabled,
  });
}

export function useEvidenceCoverage(enabled = true) {
  return useQuery({
    queryKey: queryKeys.evidenceCoverage,
    queryFn: analyticsApi.evidence,
    enabled,
  });
}

export function useRightsRequestMetrics(enabled = true) {
  return useQuery({
    queryKey: queryKeys.rightsMetrics,
    queryFn: analyticsApi.rightsRequests,
    enabled,
  });
}

export function useConsentMetrics(enabled = true) {
  return useQuery({
    queryKey: queryKeys.consentMetrics,
    queryFn: analyticsApi.consent,
    enabled,
  });
}

export function useValidationSummary(enabled = true) {
  return useQuery({
    queryKey: queryKeys.validationSummary,
    queryFn: analyticsApi.validations,
    enabled,
  });
}

/** The session may hold stale permissions until /auth/me hydrates it. */
export function useCanReadAnalytics(): boolean {
  return useSessionStore((state) =>
    state.user?.permissions.includes("analytics:read") ?? false,
  );
}
