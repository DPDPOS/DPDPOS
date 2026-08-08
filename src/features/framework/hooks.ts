"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { frameworkApi } from "./api";
import type { GenerateFrameworkPayload } from "./schemas";

/** Latest framework + roadmap; 404 (NOT_FOUND) means the org has none yet. */
export function useFrameworkRoadmap(enabled = true) {
  return useQuery({
    queryKey: queryKeys.framework(),
    queryFn: () => frameworkApi.roadmap(),
    enabled,
    retry: 0,
  });
}

export function useGenerateFramework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateFrameworkPayload) =>
      frameworkApi.generate(body),
    onSuccess: () => {
      // A new draft supersedes the previous latest framework + roadmap.
      void queryClient.invalidateQueries({ queryKey: queryKeys.framework() });
    },
  });
}

export function usePublishFramework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (frameworkId?: string) => frameworkApi.publish(frameworkId),
    onSuccess: () => {
      // Publishing lights up the programme: roadmap, registers, dashboard.
      void queryClient.invalidateQueries({ queryKey: queryKeys.framework() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.controls() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.requirements() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
