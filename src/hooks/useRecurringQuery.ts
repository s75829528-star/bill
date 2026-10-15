/**
 * useRecurringQuery — React Query hooks for the Billing Recurring Invoices module.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recurringService } from "../services/recurring";
import type { RecurringFrequency, RecurringInvoiceItem, RecurringStatus } from "../lib/billing-data";
import type { DbProduct } from "../services/products";

// ── Query keys ─────────────────────────────────────────────────────

export const recurringKeys = {
  all: ["recurring_invoices"] as const,
  byBusiness: (businessId: string) => ["recurring_invoices", businessId] as const,
};

// ── Fetch ──────────────────────────────────────────────────────────

export function useRecurringInvoices(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? recurringKeys.byBusiness(businessId) : recurringKeys.all,
    queryFn: () => recurringService.getAll(businessId!),
    enabled: !!businessId,
    staleTime: 1000 * 30, // 30 s
  });
}

// ── Create ─────────────────────────────────────────────────────────

export function useCreateRecurring(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      dbProducts,
    }: {
      input: {
        templateName: string;
        customerId: string;
        frequency: RecurringFrequency;
        customIntervalDays?: number;
        startDate: string;
        endDate?: string;
        currency: string;
        notes: string;
        terms: string;
        items: RecurringInvoiceItem[];
      };
      dbProducts?: DbProduct[];
    }) => recurringService.create(input, businessId!, dbProducts ?? []),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: recurringKeys.byBusiness(businessId) });
    },
  });
}

// ── Update ─────────────────────────────────────────────────────────

export function useUpdateRecurring(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      dbProducts,
    }: {
      id: string;
      input: {
        templateName: string;
        customerId: string;
        frequency: RecurringFrequency;
        customIntervalDays?: number;
        startDate: string;
        endDate?: string;
        nextBillingDate: string;
        currency: string;
        notes: string;
        terms: string;
        items: RecurringInvoiceItem[];
      };
      dbProducts?: DbProduct[];
    }) => recurringService.update(id, input, dbProducts ?? []),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: recurringKeys.byBusiness(businessId) });
    },
  });
}

// ── Delete ─────────────────────────────────────────────────────────

export function useDeleteRecurring(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringService.delete(id),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: recurringKeys.byBusiness(businessId) });
    },
  });
}

// ── Update status ──────────────────────────────────────────────────

export function useUpdateRecurringStatus(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RecurringStatus }) =>
      recurringService.updateStatus(id, status),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: recurringKeys.byBusiness(businessId) });
    },
  });
}

// ── Duplicate ──────────────────────────────────────────────────────

export function useDuplicateRecurring(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dbProducts }: { id: string; dbProducts?: DbProduct[] }) =>
      recurringService.duplicate(id, businessId!, dbProducts ?? []),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: recurringKeys.byBusiness(businessId) });
    },
  });
}

// ── Generate invoice ───────────────────────────────────────────────

export function useGenerateInvoice(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      recurringId,
      dbProducts,
      invoiceNumber,
    }: {
      recurringId: string;
      dbProducts?: DbProduct[];
      invoiceNumber: string;
    }) =>
      recurringService.generateInvoice(recurringId, businessId!, dbProducts ?? [], invoiceNumber),
    onSuccess: () => {
      if (businessId) {
        qc.invalidateQueries({ queryKey: recurringKeys.byBusiness(businessId) });
        qc.invalidateQueries({ queryKey: ["invoices", businessId] });
        qc.invalidateQueries({ queryKey: ["products", businessId] });
        qc.invalidateQueries({ queryKey: ["inventory_movements", businessId] });
      }
    },
  });
}
