"use client";

import { useQuery } from "@tanstack/react-query";
import { subjectLocatorApi } from "./api";

export function useSubjectLocator(q: string) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: ["subject-locator", trimmed],
    queryFn: () => subjectLocatorApi.search(trimmed),
    enabled: trimmed.length >= 2,
  });
}
