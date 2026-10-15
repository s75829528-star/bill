/**
 * quotations.ts — Supabase CRUD service for the Billing Quotations module.
 *
 * Supports: create, update, delete, duplicate, status transitions
 * (send, approve, reject, expire), and convert-to-invoice.
 */

import { supabase } from "../lib/supabase";
import { invoicesService } from "./invoices";
import type { Quotation, QuotationStatus, InvoiceItem, Invoice } from "../lib/billing-data";

// ── UUID validation ────────────────────────────────────────────────

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// ── DB row types ───────────────────────────────────────────────────

export interface DbQuotation {
  id: string;
  business_id: string;
  quote_number: string;
  quote_date: string;
  expiry_date: string | null;
  customer_id: string | null;
  billing_address: string | null;
  status: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  notes: string | null;
  internal_notes: string | null;
  terms: string | null;
  converted_invoice_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbQuotationItem {
  id: string;
  quotation_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  gst_percent: number;
  created_at: string;
}

export interface DbQuotationWithItems extends DbQuotation {
  quotation_items: DbQuotationItem[];
}

export type DbQuotationInsert = Omit<DbQuotation, "id" | "created_at" | "updated_at">;
export type DbQuotationUpdate = Partial<Omit<DbQuotation, "id" | "business_id" | "created_at" | "updated_at">>;
export type DbQuotationItemInsert = Omit<DbQuotationItem, "id" | "created_at">;

// ── Adapters ───────────────────────────────────────────────────────

export function dbToQuotation(row: DbQuotationWithItems): Quotation {
  const items: InvoiceItem[] = (row.quotation_items ?? []).map((i) => ({
    productId: i.product_id ?? "",
    quantity: i.quantity,
    unitPrice: i.unit_price,
    discountPercent: i.discount_percent,
    gstPercent: i.gst_percent,
  }));

  return {
    id: row.id,
    quoteNumber: row.quote_number,
    customerId: row.customer_id ?? "",
    status: row.status as QuotationStatus,
    items,
    createdDate: row.quote_date,
    expiryDate: row.expiry_date ?? "",
    convertedInvoiceId: row.converted_invoice_id ?? undefined,
    billingAddress: row.billing_address ?? "",
    notes: row.notes ?? "",
    internalNotes: row.internal_notes ?? "",
    terms: row.terms ?? "",
    subtotal: row.subtotal,
    discountTotal: row.discount_total,
    taxTotal: row.tax_total,
    grandTotal: row.grand_total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Totals helper ──────────────────────────────────────────────────

export function computeQTTotals(items: InvoiceItem[]) {
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

export const quotationsService = {
  /** Generate the next quote number for a business (QT-YYYY-####). */
  async generateNumber(businessId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from("quotations")
      .select("quote_number")
      .eq("business_id", businessId)
      .like("quote_number", `QT-${year}-%`)
      .order("quote_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const last = data?.quote_number ?? `QT-${year}-0000`;
    const num = parseInt(last.split("-").pop() ?? "0", 10) + 1;
    return `QT-${year}-${String(num).padStart(4, "0")}`;
  },

  /** Generate the next invoice number for conversion (INV-YYYY-####). */
  async generateInvoiceNumber(businessId: string): Promise<string> {
    const year = new Date().getFullYear();
    const { data } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("business_id", businessId)
      .like("invoice_number", `INV-${year}-%`)
      .order("invoice_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const last = data?.invoice_number ?? `INV-${year}-0000`;
    const num = parseInt(last.split("-").pop() ?? "0", 10) + 1;
    return `INV-${year}-${String(num).padStart(4, "0")}`;
  },

  /** Fetch all quotations for a business (newest first). */
  async getAll(businessId: string): Promise<Quotation[]> {
    const { data, error } = await supabase
      .from("quotations")
      .select("*, quotation_items(*)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as DbQuotationWithItems[]).map(dbToQuotation);
  },

  /** Create a quotation with its line items. */
  async create(payload: {
    businessId: string;
    customerId: string;
    expiryDate: string;
    billingAddress: string;
    notes: string;
    internalNotes: string;
    terms: string;
    items: InvoiceItem[];
    status: QuotationStatus;
    productNameMap: Map<string, string>;
    productSkuMap: Map<string, string>;
  }): Promise<Quotation> {
    const qNumber = await quotationsService.generateNumber(payload.businessId);
    const totals = computeQTTotals(payload.items);

    const { data: qt, error: qtErr } = await supabase
      .from("quotations")
      .insert({
        business_id: payload.businessId,
        quote_number: qNumber,
        quote_date: new Date().toISOString().slice(0, 10),
        expiry_date: payload.expiryDate || null,
        customer_id: payload.customerId && isUUID(payload.customerId) ? payload.customerId : null,
        billing_address: payload.billingAddress || null,
        status: payload.status,
        subtotal: totals.subtotal,
        discount_total: totals.discountTotal,
        tax_total: totals.taxTotal,
        grand_total: totals.grandTotal,
        notes: payload.notes || null,
        internal_notes: payload.internalNotes || null,
        terms: payload.terms || null,
        converted_invoice_id: null,
        created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      } satisfies DbQuotationInsert)
      .select()
      .single();
    if (qtErr) throw qtErr;

    const savedQt = qt as DbQuotation;

    if (payload.items.length > 0) {
      const itemsPayload: DbQuotationItemInsert[] = payload.items.map((item) => ({
        quotation_id: savedQt.id,
        product_id: item.productId && isUUID(item.productId) ? item.productId : null,
        product_name: payload.productNameMap.get(item.productId) ?? item.productId ?? "Unknown",
        product_sku: payload.productSkuMap.get(item.productId) ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: item.discountPercent,
        gst_percent: item.gstPercent,
      }));
      const { error: itemsErr } = await supabase.from("quotation_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }

    return dbToQuotation({
      ...savedQt,
      quotation_items: payload.items.map((item) => ({
        id: "",
        quotation_id: savedQt.id,
        product_id: item.productId && isUUID(item.productId) ? item.productId : null,
        product_name: payload.productNameMap.get(item.productId) ?? "Unknown",
        product_sku: payload.productSkuMap.get(item.productId) ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: item.discountPercent,
        gst_percent: item.gstPercent,
        created_at: savedQt.created_at,
      })),
    });
  },

  /** Update a quotation's fields and replace its line items. */
  async update(
    id: string,
    payload: {
      customerId: string;
      expiryDate: string;
      billingAddress: string;
      notes: string;
      internalNotes: string;
      terms: string;
      items: InvoiceItem[];
      status: QuotationStatus;
      productNameMap: Map<string, string>;
      productSkuMap: Map<string, string>;
    }
  ): Promise<Quotation> {
    const totals = computeQTTotals(payload.items);

    const { data, error } = await supabase
      .from("quotations")
      .update({
        customer_id: payload.customerId && isUUID(payload.customerId) ? payload.customerId : null,
        expiry_date: payload.expiryDate || null,
        billing_address: payload.billingAddress || null,
        status: payload.status,
        subtotal: totals.subtotal,
        discount_total: totals.discountTotal,
        tax_total: totals.taxTotal,
        grand_total: totals.grandTotal,
        notes: payload.notes || null,
        internal_notes: payload.internalNotes || null,
        terms: payload.terms || null,
      } satisfies DbQuotationUpdate)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    const updatedQt = data as DbQuotation;

    // Replace line items
    await supabase.from("quotation_items").delete().eq("quotation_id", id);
    if (payload.items.length > 0) {
      const itemsPayload: DbQuotationItemInsert[] = payload.items.map((item) => ({
        quotation_id: id,
        product_id: item.productId && isUUID(item.productId) ? item.productId : null,
        product_name: payload.productNameMap.get(item.productId) ?? "Unknown",
        product_sku: payload.productSkuMap.get(item.productId) ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: item.discountPercent,
        gst_percent: item.gstPercent,
      }));
      const { error: itemsErr } = await supabase.from("quotation_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }

    return dbToQuotation({
      ...updatedQt,
      quotation_items: payload.items.map((item) => ({
        id: "",
        quotation_id: id,
        product_id: item.productId && isUUID(item.productId) ? item.productId : null,
        product_name: payload.productNameMap.get(item.productId) ?? "Unknown",
        product_sku: payload.productSkuMap.get(item.productId) ?? null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_percent: item.discountPercent,
        gst_percent: item.gstPercent,
        created_at: updatedQt.created_at,
      })),
    });
  },

  /** Update only the status of a quotation. */
  async updateStatus(id: string, status: QuotationStatus): Promise<void> {
    const { error } = await supabase
      .from("quotations")
      .update({ status } satisfies DbQuotationUpdate)
      .eq("id", id);
    if (error) throw error;
  },

  /** Delete a quotation (only safe on draft). */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("quotations").delete().eq("id", id);
    if (error) throw error;
  },

  /** Duplicate: create a draft copy with a new QT number. */
  async duplicate(
    source: Quotation,
    businessId: string,
    productNameMap: Map<string, string>,
    productSkuMap: Map<string, string>
  ): Promise<Quotation> {
    return quotationsService.create({
      businessId,
      customerId: source.customerId,
      expiryDate: "",
      billingAddress: source.billingAddress,
      notes: source.notes,
      internalNotes: source.internalNotes,
      terms: source.terms,
      items: source.items,
      status: "draft",
      productNameMap,
      productSkuMap,
    });
  },

  /**
   * Convert an approved/sent quotation to an invoice.
   * Creates a draft invoice and marks the quotation as "converted".
   */
  async convertToInvoice(
    quotation: Quotation,
    businessId: string,
    productNameMap: Map<string, string>,
    productSkuMap: Map<string, string>
  ): Promise<{ invoice: Invoice; quoteNumber: string }> {
    const invoiceNumber = await quotationsService.generateInvoiceNumber(businessId);
    const today = new Date().toISOString().slice(0, 10);

    // Build the Invoice object
    const newInvoice: Invoice = {
      id: "",
      invoiceNumber,
      customerId: quotation.customerId,
      status: "draft",
      paymentStatus: "pending",
      paymentMode: "cash",
      items: quotation.items,
      createdDate: today,
      dueDate: quotation.expiryDate || "",
      amountPaid: 0,
      notes: quotation.notes,
      internalNotes: quotation.internalNotes,
      terms: quotation.terms,
      placeOfSupply: "Karnataka",
      isInterState: false,
      billingAddress: quotation.billingAddress,
      currency: "INR",
      exchangeRate: 1,
    };

    const dbProducts = Array.from(productNameMap.entries()).map(([id, name]) => ({
      id,
      business_id: businessId,
      sku: productSkuMap.get(id) ?? "",
      barcode: null,
      name,
      description: null,
      category_id: null,
      supplier_id: null,
      purchase_price: 0,
      selling_price: 0,
      tax_rate: 0,
      unit: null,
      opening_stock: 0,
      current_stock: 0,
      minimum_stock: 0,
      maximum_stock: 0,
      status: "active" as const,
      image_url: null,
      mrp: 0,
      cost_price: 0,
      hsn_code: null,
      brand_id: null,
      unit_id: null,
      reorder_qty: 0,
      lead_time_days: 0,
      weight: null,
      dimensions: null,
      color: null,
      size: null,
      material: null,
      subcategory: null,
      manufacturer: null,
      internal_notes: null,
      tags: null,
      emoji: "📦",
      created_at: today,
      updated_at: today,
    }));

    const createdInvoice = await invoicesService.create(
      newInvoice,
      businessId,
      dbProducts,
      true // skipMovements — quotations don't deduct stock
    );

    // Mark quotation as converted and link the invoice
    const { error } = await supabase
      .from("quotations")
      .update({
        status: "converted",
        converted_invoice_id: createdInvoice.id,
      } satisfies DbQuotationUpdate)
      .eq("id", quotation.id);
    if (error) throw error;

    return { invoice: createdInvoice, quoteNumber: quotation.quoteNumber };
  },
};
