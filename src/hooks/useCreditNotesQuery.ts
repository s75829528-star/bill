/**
 * useCreditNotesQuery — React Query hooks for the Credit Notes module.
 *
 * On create/update with status "issued": also invalidates products and
 * inventory_movements (stock was returned to inventory).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { creditNotesService } from "../services/creditNotes";
import type { CreditNote, CreditNoteItem, CreditNoteStatus } from "../lib/billing-data";

// ── Query keys ─────────────────────────────────────────────────────

export const creditNoteKeys = {
  all: ["credit_notes"] as const,
  byBusiness: (businessId: string) => ["credit_notes", businessId] as const,
};

// ── Fetch ──────────────────────────────────────────────────────────

export function useCreditNotes(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? creditNoteKeys.byBusiness(businessId) : creditNoteKeys.all,
    queryFn: () => creditNotesService.getAll(businessId!),
    enabled: !!businessId,
    staleTime: 1000 * 30, // 30 s
  });
}

// ── Helpers ────────────────────────────────────────────────────────

function invalidateAll(qc: ReturnType<typeof useQueryClient>, businessId: string | null) {
  if (!businessId) return;
  qc.invalidateQueries({ queryKey: creditNoteKeys.byBusiness(businessId) });
}

function invalidateStock(qc: ReturnType<typeof useQueryClient>, businessId: string | null) {
  if (!businessId) return;
  qc.invalidateQueries({ queryKey: ["products", businessId] });
  qc.invalidateQueries({ queryKey: ["inventory_movements", businessId] });
}

// ── Mutations ──────────────────────────────────────────────────────

export function useCreateCreditNote(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      creditNoteDate: string;
      invoiceId: string;
      customerId: string;
      reason: string;
      notes: string;
      items: CreditNoteItem[];
      status: CreditNoteStatus;
    }) =>
      creditNotesService.create({ ...payload, businessId: businessId! }),
    onSuccess: (result) => {
      invalidateAll(qc, businessId);
      if (result.status === "issued") invalidateStock(qc, businessId);
    },
  });
}

export function useUpdateCreditNote(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      previousStatus,
      payload,
    }: {
      id: string;
      previousStatus: CreditNoteStatus;
      payload: {
        creditNoteDate: string;
        invoiceId: string;
        customerId: string;
        reason: string;
        notes: string;
        items: CreditNoteItem[];
        status: CreditNoteStatus;
      };
    }) => creditNotesService.update(id, previousStatus, payload),
    onSuccess: (result) => {
      invalidateAll(qc, businessId);
      if (result.status === "issued") invalidateStock(qc, businessId);
    },
  });
}

export function useDeleteCreditNote(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creditNotesService.delete(id),
    onSuccess: () => invalidateAll(qc, businessId),
  });
}

export function useVoidCreditNote(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => creditNotesService.void(id),
    onSuccess: () => invalidateAll(qc, businessId),
  });
}

export function useDuplicateCreditNote(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (source: CreditNote) =>
      creditNotesService.duplicate(source, businessId!),
    onSuccess: () => invalidateAll(qc, businessId),
  });
}
