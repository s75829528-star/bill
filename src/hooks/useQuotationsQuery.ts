/**
 * useQuotationsQuery — React Query hooks for the Billing Quotations module.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quotationsService } from "../services/quotations";
import type { Quotation, QuotationStatus, InvoiceItem } from "../lib/billing-data";
import type { DbProduct } from "../services/products";

// ── Query keys ─────────────────────────────────────────────────────

export const quotationKeys = {
  all: ["quotations"] as const,
  byBusiness: (businessId: string) => ["quotations", businessId] as const,
};

// ── Helpers ────────────────────────────────────────────────────────

function buildProductMaps(dbProducts: DbProduct[]) {
  return {
    productNameMap: new Map(dbProducts.map((p) => [p.id, p.name])),
    productSkuMap: new Map(dbProducts.map((p) => [p.id, p.sku])),
  };
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>, businessId: string | null) {
  if (!businessId) return;
  qc.invalidateQueries({ queryKey: quotationKeys.byBusiness(businessId) });
}

// ── Fetch ──────────────────────────────────────────────────────────

export function useQuotations(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? quotationKeys.byBusiness(businessId) : quotationKeys.all,
    queryFn: () => quotationsService.getAll(businessId!),
    enabled: !!businessId,
    staleTime: 1000 * 30, // 30 s
  });
}

// ── Mutations ──────────────────────────────────────────────────────

export function useCreateQuotation(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      expiryDate,
      billingAddress,
      notes,
      internalNotes,
      terms,
      items,
      status,
      dbProducts,
    }: {
      customerId: string;
      expiryDate: string;
      billingAddress: string;
      notes: string;
      internalNotes: string;
      terms: string;
      items: InvoiceItem[];
      status: QuotationStatus;
      dbProducts: DbProduct[];
    }) => {
      const { productNameMap, productSkuMap } = buildProductMaps(dbProducts);
      return quotationsService.create({
        businessId: businessId!,
        customerId,
        expiryDate,
        billingAddress,
        notes,
        internalNotes,
        terms,
        items,
        status,
        productNameMap,
        productSkuMap,
      });
    },
    onSuccess: () => invalidateAll(qc, businessId),
  });
}

export function useUpdateQuotation(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      customerId,
      expiryDate,
      billingAddress,
      notes,
      internalNotes,
      terms,
      items,
      status,
      dbProducts,
    }: {
      id: string;
      customerId: string;
      expiryDate: string;
      billingAddress: string;
      notes: string;
      internalNotes: string;
      terms: string;
      items: InvoiceItem[];
      status: QuotationStatus;
      dbProducts: DbProduct[];
    }) => {
      const { productNameMap, productSkuMap } = buildProductMaps(dbProducts);
      return quotationsService.update(id, {
        customerId,
        expiryDate,
        billingAddress,
        notes,
        internalNotes,
        terms,
        items,
        status,
        productNameMap,
        productSkuMap,
      });
    },
    onSuccess: () => invalidateAll(qc, businessId),
  });
}

export function useUpdateQuotationStatus(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuotationStatus }) =>
      quotationsService.updateStatus(id, status),
    onSuccess: () => invalidateAll(qc, businessId),
  });
}

export function useDeleteQuotation(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quotationsService.delete(id),
    onSuccess: () => invalidateAll(qc, businessId),
  });
}

export function useDuplicateQuotation(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ source, dbProducts }: { source: Quotation; dbProducts: DbProduct[] }) => {
      const { productNameMap, productSkuMap } = buildProductMaps(dbProducts);
      return quotationsService.duplicate(source, businessId!, productNameMap, productSkuMap);
    },
    onSuccess: () => invalidateAll(qc, businessId),
  });
}

export function useConvertToInvoice(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quotation, dbProducts }: { quotation: Quotation; dbProducts: DbProduct[] }) => {
      const { productNameMap, productSkuMap } = buildProductMaps(dbProducts);
      return quotationsService.convertToInvoice(quotation, businessId!, productNameMap, productSkuMap);
    },
    onSuccess: () => {
      if (!businessId) return;
      invalidateAll(qc, businessId);
      // Invoice was created — refresh invoices too
      qc.invalidateQueries({ queryKey: ["invoices", businessId] });
    },
  });
}
