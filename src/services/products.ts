/**
 * products.ts — Supabase CRUD service for the Inventory Products module.
 *
 * All database operations go through here. Components never import
 * supabase directly for product/category/supplier data.
 */

import { supabase } from "../lib/supabase";
import type { Product } from "../lib/inventory-data";

// ── DB row types ──────────────────────────────────────────────────

export interface DbCategory {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DbSupplier {
  id: string;
  business_id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  gst_number: string | null;
  pan: string | null;
  city: string | null;
  address: string | null;
  state: string | null;
  pincode: string | null;
  payment_terms: string | null;
  lead_time_days: number;
  outstanding_amount: number;
  rating: number;
  total_purchases: number;
  products_supplied: number;
  bank_name: string | null;
  account_number: string | null;
  ifsc: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  business_id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  supplier_id: string | null;
  purchase_price: number;
  selling_price: number;
  tax_rate: number;
  unit: string | null;
  opening_stock: number;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  status: "active" | "inactive" | "archived";
  image_url: string | null;
  // Extended UI fields
  mrp: number;
  cost_price: number;
  hsn_code: string | null;
  brand_id: string | null;
  unit_id: string | null;
  reorder_qty: number;
  lead_time_days: number;
  weight: number | null;
  dimensions: { l: number; w: number; h: number } | null;
  color: string | null;
  size: string | null;
  material: string | null;
  subcategory: string | null;
  manufacturer: string | null;
  internal_notes: string | null;
  tags: string[] | null;
  emoji: string;
  created_at: string;
  updated_at: string;
}

export type DbProductInsert = Omit<DbProduct, "id" | "created_at" | "updated_at">;
export type DbProductUpdate = Partial<Omit<DbProduct, "id" | "business_id" | "created_at" | "updated_at">>;

export type DbCategoryInsert = Omit<DbCategory, "id" | "created_at" | "updated_at">;
export type DbSupplierInsert = Omit<DbSupplier, "id" | "created_at" | "updated_at">;

// ── Adapters: DB <-> UI ────────────────────────────────────────────

/** Convert a Supabase DbProduct row to the UI Product type. */
export function dbToProduct(db: DbProduct): Product {
  return {
    id: db.id,
    name: db.name,
    sku: db.sku,
    barcode: db.barcode ?? "",
    categoryId: db.category_id ?? "",
    subcategory: db.subcategory ?? undefined,
    brandId: db.brand_id ?? "",
    unitId: db.unit_id ?? "",
    supplierId: db.supplier_id ?? "",
    manufacturer: db.manufacturer ?? undefined,
    purchasePrice: db.purchase_price,
    sellingPrice: db.selling_price,
    mrp: db.mrp,
    costPrice: db.cost_price,
    taxPercent: db.tax_rate,
    hsnCode: db.hsn_code ?? "",
    currentStock: db.current_stock,
    minStock: db.minimum_stock,
    maxStock: db.maximum_stock,
    reorderQty: db.reorder_qty,
    leadTimeDays: db.lead_time_days,
    weight: db.weight ?? undefined,
    dimensions: db.dimensions ?? undefined,
    color: db.color ?? undefined,
    size: db.size ?? undefined,
    material: db.material ?? undefined,
    status: db.status,
    description: db.description ?? "",
    internalNotes: db.internal_notes ?? undefined,
    tags: db.tags ?? [],
    emoji: db.emoji,
    images: [],
  };
}

/** Convert a UI ProductFormData (Omit<Product, 'id'>) to a DbProductInsert. */
export function productFormToDb(
  form: Omit<Product, "id" | "images">,
  businessId: string
): DbProductInsert {
  return {
    business_id: businessId,
    sku: form.sku.trim(),
    barcode: form.barcode?.trim() || null,
    name: form.name.trim(),
    description: form.description?.trim() || null,
    category_id: form.categoryId || null,
    supplier_id: form.supplierId || null,
    purchase_price: form.purchasePrice,
    selling_price: form.sellingPrice,
    tax_rate: form.taxPercent,
    unit: form.unitId || null,
    opening_stock: form.currentStock,
    current_stock: form.currentStock,
    minimum_stock: form.minStock,
    maximum_stock: form.maxStock,
    status: form.status,
    image_url: null,
    mrp: form.mrp,
    cost_price: form.costPrice,
    hsn_code: form.hsnCode?.trim() || null,
    brand_id: form.brandId || null,
    unit_id: form.unitId || null,
    reorder_qty: form.reorderQty,
    lead_time_days: form.leadTimeDays,
    weight: form.weight ?? null,
    dimensions: form.dimensions ?? null,
    color: form.color?.trim() || null,
    size: form.size?.trim() || null,
    material: form.material?.trim() || null,
    subcategory: form.subcategory?.trim() || null,
    manufacturer: form.manufacturer?.trim() || null,
    internal_notes: form.internalNotes?.trim() || null,
    tags: form.tags?.length ? form.tags : null,
    emoji: form.emoji || "📦",
  };
}

// ── Products service ───────────────────────────────────────────────

export const productsService = {
  async getAll(businessId: string): Promise<DbProduct[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DbProduct[];
  },

  async create(payload: DbProductInsert): Promise<DbProduct> {
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        if (error.message.includes("sku")) throw new Error("A product with this SKU already exists.");
        if (error.message.includes("barcode")) throw new Error("A product with this barcode already exists.");
      }
      throw error;
    }
    return data as DbProduct;
  },

  async update(id: string, payload: DbProductUpdate): Promise<DbProduct> {
    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      if (error.code === "23505") {
        if (error.message.includes("sku")) throw new Error("A product with this SKU already exists.");
        if (error.message.includes("barcode")) throw new Error("A product with this barcode already exists.");
      }
      throw error;
    }
    return data as DbProduct;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },

  async deleteMany(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) throw error;
  },

  async bulkUpdate(ids: string[], payload: DbProductUpdate): Promise<void> {
    if (!ids.length) return;
    const { error } = await supabase
      .from("products")
      .update(payload)
      .in("id", ids);
    if (error) throw error;
  },
};

// ── Categories service ─────────────────────────────────────────────

export const categoriesService = {
  async getAll(businessId: string): Promise<DbCategory[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("business_id", businessId)
      .order("name");
    if (error) throw error;
    return (data ?? []) as DbCategory[];
  },

  async create(payload: DbCategoryInsert): Promise<DbCategory> {
    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as DbCategory;
  },

  async update(id: string, payload: Partial<DbCategoryInsert>): Promise<DbCategory> {
    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as DbCategory;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },
};

// ── Suppliers service ──────────────────────────────────────────────

export const suppliersService = {
  async getAll(businessId: string): Promise<DbSupplier[]> {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("business_id", businessId)
      .order("name");
    if (error) throw error;
    return (data ?? []) as DbSupplier[];
  },

  async create(payload: DbSupplierInsert): Promise<DbSupplier> {
    const { data, error } = await supabase
      .from("suppliers")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as DbSupplier;
  },

  async update(id: string, payload: Partial<DbSupplierInsert>): Promise<DbSupplier> {
    const { data, error } = await supabase
      .from("suppliers")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as DbSupplier;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) throw error;
  },
};
