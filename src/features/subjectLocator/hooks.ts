"use client";

import { useQuery } from "@tanstack/react-query";
import { subjectLocatorApi } from "./api";

export function useSubjectLocator(q: string, limit = 50) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: ["subject-locator", trimmed, limit],
    queryFn: () => subjectLocatorApi.search(trimmed, limit),
    enabled: trimmed.length >= 2,
  });
}
