"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";
import { dataAssetsApi } from "./api";
import type {
  CreateDataAssetPayload,
  UpdateDataAssetPayload,
} from "./types";

export function useDataAssets() {
  return useQuery({
    queryKey: queryKeys.dataAssets(),
    queryFn: () => dataAssetsApi.list(),
  });
}

export function useCreateDataAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDataAssetPayload) => dataAssetsApi.create(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dataAssets() });
    },
  });
}

export function useUpdateDataAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateDataAssetPayload }) =>
      dataAssetsApi.update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dataAssets() });
    },
  });
}

export function useArchiveDataAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataAssetsApi.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dataAssets() });
    },
  });
}
