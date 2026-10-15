/**
 * recurring.ts — Supabase CRUD service for the Billing Recurring Invoices module.
 *
 * Supports: create, update, delete, duplicate, status transitions,
 * and backend logic for automatic invoice generation.
 */

import { supabase } from "../lib/supabase";
import { invoicesService } from "./invoices";
import type {
  RecurringInvoice,
  RecurringInvoiceItem,
  RecurringFrequency,
  RecurringStatus,
  InvoiceItem,
} from "../lib/billing-data";
import type { DbProduct } from "./products";

// ── UUID validation ────────────────────────────────────────────────

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// ── DB row types ───────────────────────────────────────────────────

export interface DbRecurringInvoice {
  id: string;
  business_id: string;
  series_number: string;
  template_name: string;
  customer_id: string | null;
  frequency: string;
  custom_interval_days: number | null;
  start_date: string;
  end_date: string | null;
  next_billing_date: string;
  last_generated_date: string | null;
  status: string;
  currency: string;
  notes: string | null;
  terms: string | null;
  invoices_generated: number;
  created_at: string;
  updated_at: string;
}

export interface DbRecurringInvoiceItem {
  id: string;
  recurring_invoice_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  hsn_code: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  gst_percent: number;
  created_at: string;
}

export interface DbRecurringInvoiceWithItems extends DbRecurringInvoice {
  recurring_invoice_items: DbRecurringInvoiceItem[];
}

export type DbRecurringInsert = Omit<DbRecurringInvoice, "id" | "created_at" | "updated_at">;
export type DbRecurringUpdate = Partial<
  Omit<DbRecurringInvoice, "id" | "business_id" | "created_at" | "updated_at">
>;
export type DbRecurringItemInsert = Omit<DbRecurringInvoiceItem, "id" | "created_at">;

// ── Helpers ───────────────────────────────────────────────────────

/** Compute grand total from line items. */
export function computeRecurringTotal(items: RecurringInvoiceItem[]): number {
  return items.reduce((sum, item) => {
    const line = item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
    return sum + line * (1 + item.gstPercent / 100);
  }, 0);
}

/** Generate a human-readable items summary string. */
function buildItemsSummary(items: RecurringInvoiceItem[], productMap: Map<string, string>): string {
  if (items.length === 0) return "";
  return items
    .map((i) => productMap.get(i.productId) ?? i.productId)
    .slice(0, 3)
    .join(", ") + (items.length > 3 ? ` +${items.length - 3} more` : "");
}

/** Calculate next billing date given a current date and frequency. */
export function calculateNextBillingDate(
  from: string,
  frequency: RecurringFrequency,
  customIntervalDays?: number
): string {
  const d = new Date(from + "T00:00:00");
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "half-yearly":
      d.setMonth(d.getMonth() + 6);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    case "custom":
      d.setDate(d.getDate() + (customIntervalDays ?? 30));
      break;
  }
  return d.toISOString().slice(0, 10);
}

/** Advance the next billing date past today (used on first creation). */
export function computeFirstBillingDate(
  startDate: string,
  frequency: RecurringFrequency,
  customIntervalDays?: number
): string {
  let d = startDate;
  const today = new Date().toISOString().slice(0, 10);
  let safety = 0;
  while (d <= today && safety++ < 3650) {
    d = calculateNextBillingDate(d, frequency, customIntervalDays);
  }
  return d;
}

// ── Series number ─────────────────────────────────────────────────

async function generateSeriesNumber(businessId: string): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from("recurring_invoices")
    .select("series_number")
    .eq("business_id", businessId)
    .like("series_number", `REC-${year}-%`)
    .order("series_number", { ascending: false })
    .limit(1);
  const last = (data?.[0] as { series_number?: string })?.series_number ?? `REC-${year}-0000`;
  const num = parseInt(last.split("-").pop() ?? "0", 10) + 1;
  return `REC-${year}-${String(num).padStart(4, "0")}`;
}

// ── Adapters ──────────────────────────────────────────────────────

export function dbToRecurring(
  row: DbRecurringInvoiceWithItems,
  productNameMap: Map<string, string> = new Map()
): RecurringInvoice {
  const items: RecurringInvoiceItem[] = (row.recurring_invoice_items ?? []).map((i) => ({
    productId: i.product_id ?? "",
    quantity: i.quantity,
    unitPrice: i.unit_price,
    discountPercent: i.discount_percent,
    gstPercent: i.gst_percent,
  }));

  // Build product name map from items for summary
  const localMap = new Map(productNameMap);
  (row.recurring_invoice_items ?? []).forEach((i) => {
    if (i.product_id) localMap.set(i.product_id, i.product_name);
  });

  return {
    id: row.id,
    seriesNumber: row.series_number,
    templateName: row.template_name,
    customerId: row.customer_id ?? "",
    frequency: row.frequency as RecurringFrequency,
    customIntervalDays: row.custom_interval_days ?? undefined,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    nextBillingDate: row.next_billing_date,
    lastGeneratedDate: row.last_generated_date ?? undefined,
    status: row.status as RecurringStatus,
    currency: row.currency,
    notes: row.notes ?? "",
    terms: row.terms ?? "",
    items,
    amount: computeRecurringTotal(items),
    itemsSummary: buildItemsSummary(items, localMap),
    invoicesGenerated: row.invoices_generated,
  };
}

// ── Service ───────────────────────────────────────────────────────

export const recurringService = {
  /** Fetch all recurring invoices for a business (most recent first). */
  async getAll(businessId: string): Promise<RecurringInvoice[]> {
    const { data, error } = await supabase
      .from("recurring_invoices")
      .select("*, recurring_invoice_items(*)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as DbRecurringInvoiceWithItems[]).map((row) => dbToRecurring(row));
  },

  /** Create a recurring invoice with its line items. */
  async create(
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
    },
    businessId: string,
    dbProducts: DbProduct[] = []
  ): Promise<RecurringInvoice> {
    const seriesNumber = await generateSeriesNumber(businessId);
    const nextBillingDate = computeFirstBillingDate(
      input.startDate,
      input.frequency,
      input.customIntervalDays
    );

    const insert: DbRecurringInsert = {
      business_id: businessId,
      series_number: seriesNumber,
      template_name: input.templateName,
      customer_id: input.customerId && isUUID(input.customerId) ? input.customerId : null,
      frequency: input.frequency,
      custom_interval_days: input.customIntervalDays ?? null,
      start_date: input.startDate,
      end_date: input.endDate || null,
      next_billing_date: nextBillingDate,
      last_generated_date: null,
      status: "active",
      currency: input.currency || "INR",
      notes: input.notes || null,
      terms: input.terms || null,
      invoices_generated: 0,
    };

    const { data: rec, error: recErr } = await supabase
      .from("recurring_invoices")
      .insert(insert)
      .select()
      .single();
    if (recErr) throw recErr;
    const savedRec = rec as DbRecurringInvoice;

    const productNameMap = new Map(dbProducts.map((p) => [p.id, p.name]));
    const productSkuMap = new Map(dbProducts.map((p) => [p.id, p.sku]));

    const itemsPayload: DbRecurringItemInsert[] = input.items.map((item) => ({
      recurring_invoice_id: savedRec.id,
      product_id: isUUID(item.productId) ? item.productId : null,
      product_name: productNameMap.get(item.productId) ?? "Unknown",
      product_sku: productSkuMap.get(item.productId) ?? null,
      hsn_code: null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_percent: item.discountPercent,
      gst_percent: item.gstPercent,
    }));

    if (itemsPayload.length > 0) {
      const { error: itemsErr } = await supabase
        .from("recurring_invoice_items")
        .insert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }

    return dbToRecurring(
      {
        ...savedRec,
        recurring_invoice_items: itemsPayload.map((ip) => ({
          id: "",
          recurring_invoice_id: savedRec.id,
          product_id: ip.product_id ?? null,
          product_name: ip.product_name,
          product_sku: ip.product_sku ?? null,
          hsn_code: ip.hsn_code ?? null,
          quantity: ip.quantity,
          unit_price: ip.unit_price,
          discount_percent: ip.discount_percent,
          gst_percent: ip.gst_percent,
          created_at: savedRec.created_at,
        })),
      },
      productNameMap
    );
  },

  /** Update a recurring invoice metadata and replace its items. */
  async update(
    id: string,
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
    },
    dbProducts: DbProduct[] = []
  ): Promise<RecurringInvoice> {
    const payload: DbRecurringUpdate = {
      template_name: input.templateName,
      customer_id: input.customerId && isUUID(input.customerId) ? input.customerId : null,
      frequency: input.frequency,
      custom_interval_days: input.customIntervalDays ?? null,
      start_date: input.startDate,
      end_date: input.endDate || null,
      next_billing_date: input.nextBillingDate,
      currency: input.currency || "INR",
      notes: input.notes || null,
      terms: input.terms || null,
    };

    const { data: rec, error: recErr } = await supabase
      .from("recurring_invoices")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (recErr) throw recErr;

    // Replace items: delete old, insert new
    await supabase.from("recurring_invoice_items").delete().eq("recurring_invoice_id", id);

    const productNameMap = new Map(dbProducts.map((p) => [p.id, p.name]));
    const productSkuMap = new Map(dbProducts.map((p) => [p.id, p.sku]));

    const itemsPayload: DbRecurringItemInsert[] = input.items.map((item) => ({
      recurring_invoice_id: id,
      product_id: isUUID(item.productId) ? item.productId : null,
      product_name: productNameMap.get(item.productId) ?? "Unknown",
      product_sku: productSkuMap.get(item.productId) ?? null,
      hsn_code: null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_percent: item.discountPercent,
      gst_percent: item.gstPercent,
    }));

    if (itemsPayload.length > 0) {
      const { error: itemsErr } = await supabase
        .from("recurring_invoice_items")
        .insert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }

    return dbToRecurring(
      {
        ...(rec as DbRecurringInvoice),
        recurring_invoice_items: itemsPayload.map((ip) => ({
          id: "",
          recurring_invoice_id: id,
          product_id: ip.product_id ?? null,
          product_name: ip.product_name,
          product_sku: ip.product_sku ?? null,
          hsn_code: ip.hsn_code ?? null,
          quantity: ip.quantity,
          unit_price: ip.unit_price,
          discount_percent: ip.discount_percent,
          gst_percent: ip.gst_percent,
          created_at: rec.created_at,
        })),
      },
      productNameMap
    );
  },

  /** Delete a recurring invoice (cascade deletes items). */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("recurring_invoices").delete().eq("id", id);
    if (error) throw error;
  },

  /** Update only the status field. */
  async updateStatus(id: string, status: RecurringStatus): Promise<void> {
    const { error } = await supabase
      .from("recurring_invoices")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  },

  /** Duplicate a recurring invoice with a new series number. */
  async duplicate(id: string, businessId: string, dbProducts: DbProduct[] = []): Promise<RecurringInvoice> {
    const { data, error } = await supabase
      .from("recurring_invoices")
      .select("*, recurring_invoice_items(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    const source = data as DbRecurringInvoiceWithItems;

    const items: RecurringInvoiceItem[] = (source.recurring_invoice_items ?? []).map((i) => ({
      productId: i.product_id ?? "",
      quantity: i.quantity,
      unitPrice: i.unit_price,
      discountPercent: i.discount_percent,
      gstPercent: i.gst_percent,
    }));

    return recurringService.create(
      {
        templateName: `${source.template_name} (Copy)`,
        customerId: source.customer_id ?? "",
        frequency: source.frequency as RecurringFrequency,
        customIntervalDays: source.custom_interval_days ?? undefined,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: source.end_date ?? undefined,
        currency: source.currency,
        notes: source.notes ?? "",
        terms: source.terms ?? "",
        items,
      },
      businessId,
      dbProducts
    );
  },

  /**
   * Generate a real invoice from a recurring schedule.
   *
   * This is the backend function that a future scheduled job will call.
   * It creates a new invoice, updates last_generated_date, advances
   * next_billing_date, and marks the schedule "completed" if expired.
   *
   * @param recurringId  The recurring invoice schedule ID
   * @param businessId   Tenant scope
   * @param dbProducts   Current product list for stock movements
   * @param invoiceNumber Pre-generated invoice number from the caller
   */
  async generateInvoice(
    recurringId: string,
    businessId: string,
    dbProducts: DbProduct[] = [],
    invoiceNumber: string
  ): Promise<string> {
    // Fetch the recurring schedule + items
    const { data, error } = await supabase
      .from("recurring_invoices")
      .select("*, recurring_invoice_items(*)")
      .eq("id", recurringId)
      .single();
    if (error) throw error;
    const rec = data as DbRecurringInvoiceWithItems;

    if (rec.status !== "active") {
      throw new Error(`Cannot generate invoice for a schedule with status "${rec.status}"`);
    }

    // Build UI invoice items from recurring items
    const items: InvoiceItem[] = (rec.recurring_invoice_items ?? []).map((i) => ({
      productId: i.product_id ?? "",
      quantity: i.quantity,
      unitPrice: i.unit_price,
      discountPercent: i.discount_percent,
      gstPercent: i.gst_percent,
    }));

    const today = new Date().toISOString().slice(0, 10);

    // Create the invoice (skipMovements = false → deducts stock)
    const created = await invoicesService.create(
      {
        id: "",
        invoiceNumber,
        customerId: rec.customer_id ?? "",
        status: "sent",
        paymentStatus: "pending",
        paymentMode: "cash",
        items,
        createdDate: today,
        dueDate: today,
        amountPaid: 0,
        notes: rec.notes ?? "",
        internalNotes: `Auto-generated from recurring schedule ${rec.series_number}`,
        terms: rec.terms ?? "",
        placeOfSupply: "Karnataka",
        isInterState: false,
        currency: rec.currency,
        exchangeRate: 1,
      },
      businessId,
      dbProducts,
      false // do deduct stock
    );

    // Advance billing date
    const nextBillingDate = calculateNextBillingDate(
      today,
      rec.frequency as RecurringFrequency,
      rec.custom_interval_days ?? undefined
    );

    // Check if schedule has expired
    let newStatus: RecurringStatus = "active";
    if (rec.end_date && nextBillingDate > rec.end_date) {
      newStatus = "completed";
    }

    // Update the recurring schedule
    const { error: updErr } = await supabase
      .from("recurring_invoices")
      .update({
        last_generated_date: today,
        next_billing_date: nextBillingDate,
        invoices_generated: (rec.invoices_generated ?? 0) + 1,
        status: newStatus,
      })
      .eq("id", recurringId);
    if (updErr) throw updErr;

    return created.id;
  },
};
