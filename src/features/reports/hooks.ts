import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { reportsApi } from "./api";
import type { ReportListQuery } from "./types";

/**
 * Report list — polls every 3 s while any row is still PENDING/GENERATING
 * (§7.7 async resources), then settles. The poll stops the moment the set
 * resolves so we never tick against an idle table.
 */
export function useReports(query: ReportListQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.reports(query),
    queryFn: () => reportsApi.list(query),
    enabled,
    refetchInterval: (queryState) =>
      (queryState.state.data?.items ?? []).some((row) =>
        ["PENDING", "GENERATING"].includes(row.status),
      )
        ? 3000
        : false,
  });
}

function useInvalidateReports() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.reports() });
}

export function useGenerateReport() {
  const invalidate = useInvalidateReports();
  return useMutation({
    mutationFn: (body: Parameters<typeof reportsApi.generate>[0]) =>
      reportsApi.generate(body),
    onSuccess: invalidate,
  });
}

export function useCancelReport() {
  const invalidate = useInvalidateReports();
  return useMutation({
    mutationFn: (id: string) => reportsApi.cancel(id),
    onSuccess: invalidate,
  });
}
