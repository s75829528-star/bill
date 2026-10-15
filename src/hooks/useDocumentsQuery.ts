/**
 * useDocumentsQuery — React Query hooks for the Billing Documents module.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsService } from "../services/documents";
import type { DocumentFilters, UploadParams } from "../services/documents";

// ── Query keys ─────────────────────────────────────────────────────

export const documentKeys = {
  all: ["documents"] as const,
  byBusiness: (businessId: string, filters?: DocumentFilters, page?: number) =>
    ["documents", businessId, filters ?? {}, page ?? 1] as const,
};

// ── Helpers ────────────────────────────────────────────────────────

function invalidateAll(qc: ReturnType<typeof useQueryClient>, businessId: string) {
  qc.invalidateQueries({ queryKey: ["documents", businessId] });
}

// ── Fetch ──────────────────────────────────────────────────────────

export function useDocuments(
  businessId: string | null,
  filters: DocumentFilters = {},
  page = 1,
  pageSize = 10
) {
  return useQuery({
    queryKey: businessId
      ? documentKeys.byBusiness(businessId, filters, page)
      : documentKeys.all,
    queryFn: () => documentsService.getAll(businessId!, filters, page, pageSize),
    enabled: !!businessId,
    staleTime: 1000 * 30, // 30 s
    placeholderData: (prev) => prev,
  });
}

// ── Mutations ──────────────────────────────────────────────────────

export function useUploadDocument(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: UploadParams) => documentsService.uploadDocument(params),
    onSuccess: () => { if (businessId) invalidateAll(qc, businessId); },
  });
}

export function useDeleteDocument(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, filePath }: { id: string; filePath: string }) =>
      documentsService.delete(id, filePath),
    onSuccess: () => { if (businessId) invalidateAll(qc, businessId); },
  });
}

export function useArchiveDocument(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsService.archive(id),
    onSuccess: () => { if (businessId) invalidateAll(qc, businessId); },
  });
}

export function useRestoreDocument(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsService.restore(id),
    onSuccess: () => { if (businessId) invalidateAll(qc, businessId); },
  });
}

export function useRenameDocument(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      documentsService.rename(id, name),
    onSuccess: () => { if (businessId) invalidateAll(qc, businessId); },
  });
}

export function useMoveDocument(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      linkedModule,
      linkedRecordId,
    }: {
      id: string;
      linkedModule: string | null;
      linkedRecordId: string | null;
    }) => documentsService.move(id, linkedModule, linkedRecordId),
    onSuccess: () => { if (businessId) invalidateAll(qc, businessId); },
  });
}

export function useReplaceDocument(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      documentsService.replaceFile(id, file),
    onSuccess: () => { if (businessId) invalidateAll(qc, businessId); },
  });
}
