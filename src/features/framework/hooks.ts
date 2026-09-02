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
  return useMutation({
    mutationFn: (body: GenerateFrameworkPayload) =>
      frameworkApi.generate(body),
    // Do not invalidate here: invalidating mid-wizard remounts FrameworkView
    // from empty → board and interrupts the preview step. Refresh on close/publish.
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
