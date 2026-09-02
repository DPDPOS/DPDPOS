import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { evidenceApi } from "./api";
import type { EvidenceListQuery } from "./types";

export function useEvidenceList(query: EvidenceListQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.evidence(query),
    queryFn: () => evidenceApi.list(query),
    enabled,
  });
}

export function useEvidenceItem(id: string | null) {
  return useQuery({
    queryKey: queryKeys.evidence({ detail: id ?? "" }),
    queryFn: () => evidenceApi.get(id as string),
    enabled: Boolean(id),
  });
}

/** After any mutation, refetch every evidence list (status filter included). */
function useInvalidateEvidence() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.evidence() });
}

export function useInitiateUpload() {
  const invalidate = useInvalidateEvidence();
  return useMutation({
    mutationFn: (body: Parameters<typeof evidenceApi.initiateUpload>[0]) =>
      evidenceApi.initiateUpload(body),
    onSuccess: invalidate,
  });
}

export function useConfirmUpload() {
  const invalidate = useInvalidateEvidence();
  return useMutation({
    mutationFn: (args: { id: string } & Parameters<typeof evidenceApi.confirmUpload>[1]) =>
      evidenceApi.confirmUpload(args.id, {
        fileHash: args.fileHash,
        fileSizeBytes: args.fileSizeBytes,
      }),
    onSuccess: invalidate,
  });
}

export function useTagEvidence() {
  const invalidate = useInvalidateEvidence();
  return useMutation({
    mutationFn: (args: { id: string } & Parameters<typeof evidenceApi.tag>[1]) =>
      evidenceApi.tag(args.id, { tags: args.tags, description: args.description }),
    onSuccess: invalidate,
  });
}

export function useMapEvidence() {
  const invalidate = useInvalidateEvidence();
  return useMutation({
    mutationFn: (args: { id: string; controlId: string }) =>
      evidenceApi.mapToControl(args.id, args.controlId),
    onSuccess: invalidate,
  });
}

export function useSubmitForReview() {
  const invalidate = useInvalidateEvidence();
  return useMutation({
    mutationFn: (id: string) => evidenceApi.submitForReview(id),
    onSuccess: invalidate,
  });
}

export function useApproveEvidence() {
  const invalidate = useInvalidateEvidence();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => evidenceApi.approve(id),
    onSuccess: () => {
      invalidate();
      // Approve may bump the linked control NOT_STARTED → IN_PROGRESS.
      void queryClient.invalidateQueries({ queryKey: queryKeys.controls() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.framework() });
    },
  });
}

export function useLockEvidence() {
  const invalidate = useInvalidateEvidence();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => evidenceApi.lock(id),
    onSuccess: () => {
      invalidate();
      // Lock may bump the linked control → IMPLEMENTED.
      void queryClient.invalidateQueries({ queryKey: queryKeys.controls() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.framework() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useExportEvidence() {
  return useMutation({
    mutationFn: (body: Parameters<typeof evidenceApi.exportPack>[0]) =>
      evidenceApi.exportPack(body),
  });
}
