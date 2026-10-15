import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  purchaseFlowService,
  type GoodsReceiptInput,
  type PurchaseBillInput,
  type PurchaseOrderInput,
} from "../services/purchaseFlow";
import type { POStatus } from "../lib/inventory-data";
import { productKeys, supplierKeys } from "./useProductsQuery";
import { movementKeys } from "./useInventoryMovementsQuery";

export const purchaseOrderKeys = {
  all: ["purchase_orders"] as const,
  byBusiness: (id: string) => ["purchase_orders", id] as const,
};

export const purchaseBillKeys = {
  all: ["purchase_bills"] as const,
  byBusiness: (id: string) => ["purchase_bills", id] as const,
};

export function usePurchaseOrders(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? purchaseOrderKeys.byBusiness(businessId) : purchaseOrderKeys.all,
    queryFn: () => purchaseFlowService.getOrders(businessId!),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

export function useCreatePurchaseOrder(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PurchaseOrderInput) => purchaseFlowService.createOrder(input, businessId!),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: purchaseOrderKeys.byBusiness(businessId) });
    },
  });
}

export function useUpdatePurchaseOrder(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof purchaseFlowService.updateOrder>[2] }) =>
      purchaseFlowService.updateOrder(id, businessId!, patch),
    onSuccess: () => {
      if (businessId) qc.invalidateQueries({ queryKey: purchaseOrderKeys.byBusiness(businessId) });
    },
  });
}

export function useReceivePurchaseGoods(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GoodsReceiptInput) => purchaseFlowService.receiveGoods(input, businessId!),
    onSuccess: () => {
      if (!businessId) return;
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.byBusiness(businessId) });
      qc.invalidateQueries({ queryKey: productKeys.byBusiness(businessId) });
      qc.invalidateQueries({ queryKey: movementKeys.byBusiness(businessId) });
      qc.invalidateQueries({ queryKey: purchaseBillKeys.byBusiness(businessId) });
    },
  });
}

export function usePurchaseBills(businessId: string | null) {
  return useQuery({
    queryKey: businessId ? purchaseBillKeys.byBusiness(businessId) : purchaseBillKeys.all,
    queryFn: () => purchaseFlowService.getBills(businessId!),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

export function useCreatePurchaseBill(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PurchaseBillInput) => purchaseFlowService.createBill(input, businessId!),
    onSuccess: () => {
      if (!businessId) return;
      qc.invalidateQueries({ queryKey: purchaseBillKeys.byBusiness(businessId) });
      qc.invalidateQueries({ queryKey: supplierKeys.byBusiness(businessId) });
    },
  });
}

export function useRecordPurchaseBillPayment(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, amount }: { billId: string; amount: number }) =>
      purchaseFlowService.recordPayment(billId, amount, businessId!, undefined),
    onSuccess: () => {
      if (!businessId) return;
      qc.invalidateQueries({ queryKey: purchaseBillKeys.byBusiness(businessId) });
      qc.invalidateQueries({ queryKey: supplierKeys.byBusiness(businessId) });
    },
  });
}

export type { POStatus };