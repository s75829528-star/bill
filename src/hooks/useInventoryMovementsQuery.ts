/**
 * useInventoryMovementsQuery — React Query hooks for inventory movements.
 *
 * Stock In / Stock Out / Adjustments all share this file.
 * Every mutation invalidates both movements and products cache
 * (because the DB trigger updates products.current_stock).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  inventoryMovementsService,
  type DbInventoryMovementInsert,
  type DbInventoryMovement,
} from "../services/inventoryMovements";
import { productKeys } from "./useProductsQuery";

// ── Query keys ─────────────────────────────────────────────────────

export const movementKeys = {
  all: ["inv_movements"] as const,
  byBusiness: (id: string) => ["inv_movements", id] as const,
  byProduct: (bid: string, pid: string) =>
    ["inv_movements", bid, pid] as const,
};

// ── Queries ────────────────────────────────────────────────────────

export function useInventoryMovements(businessId: string | null) {
  return useQuery({
    queryKey: businessId
      ? movementKeys.byBusiness(businessId)
      : movementKeys.all,
    queryFn: () => inventoryMovementsService.getAll(businessId!),
    enabled: !!businessId,
    staleTime: 1000 * 30, // 30 s
  });
}

export function useProductMovements(
  businessId: string | null,
  productId: string | null
) {
  return useQuery({
    queryKey:
      businessId && productId
        ? movementKeys.byProduct(businessId, productId)
        : movementKeys.all,
    queryFn: () =>
      inventoryMovementsService.getByProduct(businessId!, productId!),
    enabled: !!businessId && !!productId,
    staleTime: 1000 * 30,
  });
}

// ── Shared mutation factory ─────────────────────────────────────────

function useCreateMovement(businessId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DbInventoryMovementInsert) =>
      inventoryMovementsService.create(payload),
    onSuccess: (_data, vars) => {
      if (!businessId) return;
      // Movements list
      qc.invalidateQueries({
        queryKey: movementKeys.byBusiness(businessId),
      });
      // Per-product movements
      qc.invalidateQueries({
        queryKey: movementKeys.byProduct(businessId, vars.product_id),
      });
      // Products list (stock changed via DB trigger)
      qc.invalidateQueries({
        queryKey: productKeys.byBusiness(businessId),
      });
    },
  });
}

// ── Public hooks ────────────────────────────────────────────────────

export function useCreateStockIn(businessId: string | null) {
  return useCreateMovement(businessId);
}

export function useCreateStockOut(businessId: string | null) {
  return useCreateMovement(businessId);
}

export function useCreateStockAdjustment(businessId: string | null) {
  return useCreateMovement(businessId);
}

// ── Helpers ────────────────────────────────────────────────────────

/** Format an ISO timestamp to date label */
export function fmtMovementDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format an ISO timestamp to time label */
export function fmtMovementTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** All movements for a business, filtered by type */
export function filterMovements(
  movements: DbInventoryMovement[],
  type: "in" | "out" | "adjustment"
) {
  return movements.filter((m) => m.movement_type === type);
}
