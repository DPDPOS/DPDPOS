import { apiClient } from "@/lib/api/client";
import type { GenerateFrameworkPayload } from "./schemas";
import type { FrameworkResponse } from "./types";

/** GET/POST /api/v1/framework/* — gated by framework:read / :generate / :publish. */
export const frameworkApi = {
  /** Latest framework (published first, else latest draft) + its roadmap. */
  roadmap: (frameworkId?: string) =>
    apiClient.get<FrameworkResponse>("/framework/roadmap", {
      ...(frameworkId ? { frameworkId } : {}),
    }),
  generate: (body: GenerateFrameworkPayload) =>
    apiClient.post<FrameworkResponse>("/framework/generate", body),
  publish: (frameworkId?: string) =>
    apiClient.post<FrameworkResponse>("/framework/publish", {
      ...(frameworkId ? { frameworkId } : {}),
    }),
};
