/**
 * creditNotes.ts — Supabase CRUD service for the Credit Notes module.
 *
 * On issue (status → "issued"): inserts inventory "in" movements for every
 * item that has a valid product_id. The DB trigger updates stock automatically.
 */

import { supabase } from "../lib/supabase";
import { inventoryMovementsService } from "./inventoryMovements";
import type { CreditNote, CreditNoteItem, CreditNoteStatus } from "../lib/billing-data";

// ── UUID helper ────────────────────────────────────────────────────

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// ── DB row types ───────────────────────────────────────────────────

export interface DbCreditNote {
  id: string;
  business_id: string;
  credit_note_number: string;
  credit_note_date: string;
  invoice_id: string | null;
  customer_id: string | null;
  reason: string;
  notes: string | null;
  status: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCreditNoteItem {
  id: string;
  credit_note_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  gst_percent: number;
  created_at: string;
}

export interface DbCreditNoteWithItems extends DbCreditNote {
  credit_note_items: DbCreditNoteItem[];
}

export type DbCreditNoteInsert = Omit<DbCreditNote, "id" | "created_at" | "updated_at">;
export type DbCreditNoteUpdate = Partial<
  Omit<DbCreditNote, "id" | "business_id" | "created_at" | "updated_at">
>;
export type DbCreditNoteItemInsert = Omit<DbCreditNoteItem, "id" | "created_at">;

// ── Adapters ───────────────────────────────────────────────────────

export function dbToCreditNote(row: DbCreditNoteWithItems): CreditNote {
  const items: CreditNoteItem[] = (row.credit_note_items ?? []).map((i) => ({
    productId: i.product_id ?? "",
    productName: i.product_name,
    quantity: i.quantity,
    unitPrice: i.unit_price,
    discountPercent: i.discount_percent,
    gstPercent: i.gst_percent,
  }));

  return {
    id: row.id,
    creditNoteNumber: row.credit_note_number,
    creditNoteDate: row.credit_note_date,
    invoiceId: row.invoice_id ?? "",
    customerId: row.customer_id ?? "",
    reason: row.reason,
    notes: row.notes ?? "",
    items,
    subtotal: row.subtotal,
    discountTotal: row.discount_total,
    taxTotal: row.tax_total,
    grandTotal: row.grand_total,
    amount: row.grand_total,
    status: row.status as CreditNoteStatus,
    createdDate: row.credit_note_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Totals helper ──────────────────────────────────────────────────

export function computeCNTotals(items: CreditNoteItem[]) {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  for (const item of items) {
    const gross = item.quantity * item.unitPrice;
    const disc = gross * (item.discountPercent / 100);
    const taxable = gross - disc;
    const tax = taxable * (item.gstPercent / 100);
    subtotal += taxable;
    discountTotal += disc;
    taxTotal += tax;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grandTotal: Math.round((subtotal + taxTotal) * 100) / 100,
  };
}

// ── Service ────────────────────────────────────────────────────────

export const creditNotesService = {
  /** Generate the next credit note number for a business. */
  async generateNumber(businessId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from("credit_notes")
      .select("credit_note_number")
      .eq("business_id", businessId)
      .like("credit_note_number", `CN-${year}-%`)
      .order("credit_note_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const last = data?.credit_note_number ?? `CN-${year}-0000`;
    const num = parseInt(last.split("-").pop() ?? "0", 10) + 1;
    return `CN-${year}-${String(num).padStart(4, "0")}`;
  },

  /** Fetch all credit notes for a business (newest first). */
  async getAll(businessId: string): Promise<CreditNote[]> {
    const { data, error } = await supabase
      .from("credit_notes")
      .select("*, credit_note_items(*)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as DbCreditNoteWithItems[]).map(dbToCreditNote);
  },

  /**
   * Create a credit note with line items.
   * If triggerMovements is true (status=issued), inserts inventory "in" movements.
   */
  async create(
    payload: {
      businessId: string;
      creditNoteDate: string;
      invoiceId: string;
      customerId: string;
      reason: string;
      notes: string;
      items: CreditNoteItem[];
      status: CreditNoteStatus;
    }
  ): Promise<CreditNote> {
    const cnNumber = await creditNotesService.generateNumber(payload.businessId);
    const totals = computeCNTotals(payload.items);

    // 1. Insert credit note header
    const { data: cn, error: cnErr } = await supabase
      .from("credit_notes")
      .insert({
        business_id: payload.businessId,
        credit_note_number: cnNumber,
        credit_note_date: payload.creditNoteDate,
        invoice_id: payload.invoiceId && isUUID(payload.invoiceId) ? payload.invoiceId : null,
        customer_id: payload.customerId && isUUID(payload.customerId) ? payload.customerId : null,
        reason: payload.reason,
        notes: payload.notes || null,
        status: payload.status,
        subtotal: totals.subtotal,
        discount_total: totals.discountTotal,
        tax_total: totals.taxTotal,
        grand_total: totals.grandTotal,
        created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      } satisfies DbCreditNoteInsert)
      .select()
      .single();
    if (cnErr) throw cnErr;

    const savedCN = cn as DbCreditNote;

    // 2. Insert line items
    if (payload.items.length > 0) {
      const itemsPayload: DbCreditNoteItemInsert[] = payload.items.map((item) => ({
        credit_note_id: savedCN.id,
        product_id: item.productId && isUUID(item.productId) ? item.productId : null,
        product_name: item.productName,
        product_sku: null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: item.discountPercent,
        gst_percent: item.gstPercent,
      }));

      const { error: itemsErr } = await supabase
        .from("credit_note_items")
        .insert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }

    // 3. Inventory stock-in movements when issuing
    if (payload.status === "issued") {
      await creditNotesService._createMovements(
        payload.items,
        savedCN.id,
        cnNumber,
        payload.businessId
      );
    }

    return dbToCreditNote({
      ...savedCN,
      credit_note_items: payload.items.map((item) => ({
        id: "",
        credit_note_id: savedCN.id,
        product_id: item.productId && isUUID(item.productId) ? item.productId : null,
        product_name: item.productName,
        product_sku: null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: item.discountPercent,
        gst_percent: item.gstPercent,
        created_at: savedCN.created_at,
      })),
    });
  },

  /**
   * Update credit note metadata and replace line items.
   * Triggers inventory movements if transitioning to "issued".
   */
  async update(
    id: string,
    previousStatus: CreditNoteStatus,
    payload: {
      creditNoteDate: string;
      invoiceId: string;
      customerId: string;
      reason: string;
      notes: string;
      items: CreditNoteItem[];
      status: CreditNoteStatus;
    }
  ): Promise<CreditNote> {
    const totals = computeCNTotals(payload.items);
    const triggerMovements =
      previousStatus !== "issued" && payload.status === "issued";

    // 1. Update header
    const { data, error } = await supabase
      .from("credit_notes")
      .update({
        credit_note_date: payload.creditNoteDate,
        invoice_id: payload.invoiceId && isUUID(payload.invoiceId) ? payload.invoiceId : null,
        customer_id:
          payload.customerId && isUUID(payload.customerId) ? payload.customerId : null,
        reason: payload.reason,
        notes: payload.notes || null,
        status: payload.status,
        ...totals,
      } satisfies DbCreditNoteUpdate)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    const updatedCN = data as DbCreditNote;

    // 2. Replace line items
    await supabase.from("credit_note_items").delete().eq("credit_note_id", id);

    if (payload.items.length > 0) {
      const itemsPayload: DbCreditNoteItemInsert[] = payload.items.map((item) => ({
        credit_note_id: id,
        product_id: item.productId && isUUID(item.productId) ? item.productId : null,
        product_name: item.productName,
        product_sku: null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: item.discountPercent,
        gst_percent: item.gstPercent,
      }));
      const { error: itemsErr } = await supabase
        .from("credit_note_items")
        .insert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }

    // 3. Inventory movements if transitioning to issued
    if (triggerMovements) {
      await creditNotesService._createMovements(
        payload.items,
        id,
        updatedCN.credit_note_number,
        updatedCN.business_id
      );
    }

    return dbToCreditNote({
      ...updatedCN,
      credit_note_items: payload.items.map((item) => ({
        id: "",
        credit_note_id: id,
        product_id: item.productId && isUUID(item.productId) ? item.productId : null,
        product_name: item.productName,
        product_sku: null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: item.discountPercent,
        gst_percent: item.gstPercent,
        created_at: updatedCN.created_at,
      })),
    });
  },

  /** Delete a credit note (must be draft). */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("credit_notes").delete().eq("id", id);
    if (error) throw error;
  },

  /** Void a credit note. */
  async void(id: string): Promise<void> {
    const { error } = await supabase
      .from("credit_notes")
      .update({ status: "voided" })
      .eq("id", id);
    if (error) throw error;
  },

  /** Duplicate: create a draft copy with a new number. */
  async duplicate(source: CreditNote, businessId: string): Promise<CreditNote> {
    return creditNotesService.create({
      businessId,
      creditNoteDate: new Date().toISOString().slice(0, 10),
      invoiceId: source.invoiceId,
      customerId: source.customerId,
      reason: source.reason,
      notes: source.notes,
      items: source.items,
      status: "draft",
    });
  },

  /** Internal: create stock-in inventory movements for returned items. */
  async _createMovements(
    items: CreditNoteItem[],
    cnId: string,
    cnNumber: string,
    businessId: string
  ): Promise<void> {
    for (const item of items) {
      if (!item.productId || !isUUID(item.productId)) continue;
      await inventoryMovementsService.create({
        business_id: businessId,
        product_id: item.productId,
        movement_type: "in",
        adjustment_type: null,
        adjustment_reason: null,
        quantity: item.quantity,
        reference: cnNumber,
        supplier_id: null,
        reason: "Credit note return",
        notes: `Credit Note ${cnNumber} — stock returned`,
        created_by: null,
      });
    }
  },
};
