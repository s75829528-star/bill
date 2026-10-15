/**
 * inventoryMovements.ts — Supabase CRUD service for stock movements.
 *
 * Handles Stock In, Stock Out, and Stock Adjustments.
 * The DB trigger (process_inventory_movement) automatically:
 *   • stamps previous_stock / new_stock on every row
 *   • updates products.current_stock
 *   • raises an exception if stock would go negative
 */

import { supabase } from "../lib/supabase";

// ── Types ──────────────────────────────────────────────────────────

export type MovementType = "in" | "out" | "adjustment";
export type AdjustmentType = "increase" | "decrease";
export type AdjustmentReason =
  | "damaged"
  | "returned"
  | "expired"
  | "lost"
  | "found"
  | "cycle-count"
  | "quality-rejection"
  | "manual";

export interface DbInventoryMovement {
  id: string;
  business_id: string;
  product_id: string;
  movement_type: MovementType;
  adjustment_type: AdjustmentType | null;
  adjustment_reason: AdjustmentReason | null;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference: string | null;
  supplier_id: string | null;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export type DbInventoryMovementInsert = Omit<
  DbInventoryMovement,
  "id" | "previous_stock" | "new_stock" | "created_at"
>;

// ── Service ────────────────────────────────────────────────────────

export const inventoryMovementsService = {
  /** Fetch all movements for a business, most recent first. */
  async getAll(businessId: string): Promise<DbInventoryMovement[]> {
    const { data, error } = await supabase
      .from("inventory_movements")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DbInventoryMovement[];
  },

  /** Fetch movements for a single product. */
  async getByProduct(
    businessId: string,
    productId: string
  ): Promise<DbInventoryMovement[]> {
    const { data, error } = await supabase
      .from("inventory_movements")
      .select("*")
      .eq("business_id", businessId)
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DbInventoryMovement[];
  },

  /**
   * Insert a movement record.
   * The DB trigger updates products.current_stock automatically.
   * Throws a friendly error if stock would go negative.
   */
  async create(
    payload: DbInventoryMovementInsert
  ): Promise<DbInventoryMovement> {
    const { data, error } = await supabase
      .from("inventory_movements")
      .insert(payload)
      .select()
      .single();
    if (error) {
      if (
        error.message?.includes("Insufficient stock") ||
        error.message?.includes("insufficient_stock")
      ) {
        throw new Error(error.message);
      }
      throw error;
    }
    return data as DbInventoryMovement;
  },
};
