import { supabase } from "../lib/supabase";
import type { Brand } from "../lib/inventory-data";

export type BrandStatus = "active" | "inactive";
export type BrandSort = "name" | "created_at" | "updated_at" | "product_count";

export interface DbBrand {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  logo_initial: string | null;
  logo_color: string | null;
  website: string | null;
  status: BrandStatus;
  created_at: string;
  updated_at: string;
  product_count?: number;
  total_count?: number;
}

export interface DbBrandInsert {
  business_id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  logo_initial?: string | null;
  logo_color?: string | null;
  website?: string | null;
  status?: BrandStatus;
}

export type DbBrandUpdate = Partial<Omit<DbBrandInsert, "business_id">>;

export interface BrandListFilters {
  search?: string;
  status?: "all" | BrandStatus;
  hasProducts?: "all" | "yes" | "no";
  createdRange?: "all" | "30d" | "90d" | "year";
  sortBy?: BrandSort;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface BrandPage {
  data: DbBrand[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 8;

function asDateRange(range: BrandListFilters["createdRange"]): string | null {
  if (!range || range === "all") return null;
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 365;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function validateWebsite(value: string | null | undefined) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error("Website must be a valid URL beginning with http:// or https://.");
  }
}

function normalisePayload(payload: DbBrandInsert | DbBrandUpdate) {
  const name = "name" in payload && payload.name != null ? payload.name.trim() : undefined;
  if ("name" in payload && !name) throw new Error("Brand name is required.");
  const website = "website" in payload ? payload.website?.trim() || null : undefined;
  validateWebsite(website);
  return {
    ...payload,
    ...(name !== undefined ? { name } : {}),
    ...(website !== undefined ? { website } : {}),
    ...(payload.description !== undefined ? { description: payload.description?.trim() || null } : {}),
  };
}

function friendlyError(error: { code?: string; message?: string } | null, fallback: string): Error {
  if (!error) return new Error(fallback);
  if (error.code === "23505") return new Error("A brand with this name already exists.");
  if (error.code === "23503") return new Error("This brand is currently associated with products and cannot be deleted.");
  if (error.code === "42501") return new Error("You do not have permission to modify this brand.");
  return new Error(error.message || fallback);
}

export function dbToBrand(db: DbBrand): Brand {
  return {
    id: db.id,
    name: db.name,
    description: db.description ?? "",
    productCount: Number(db.product_count ?? 0),
    logoInitial: db.logo_initial || db.name.charAt(0).toUpperCase(),
    color: db.logo_color || "bg-blue-500",
    status: db.status,
    website: db.website ?? undefined,
    logoUrl: db.logo_url ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export const brandsService = {
  async getPage(businessId: string, filters: BrandListFilters = {}): Promise<BrandPage> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
    const { data, error } = await supabase.rpc("get_brands_page", {
      p_business_id: businessId,
      p_search: filters.search?.trim() || null,
      p_status: filters.status && filters.status !== "all" ? filters.status : null,
      p_has_products:
        filters.hasProducts === "yes" ? true : filters.hasProducts === "no" ? false : null,
      p_created_from: asDateRange(filters.createdRange),
      p_sort_by: filters.sortBy ?? "name",
      p_sort_direction: filters.sortDirection ?? "asc",
      p_page: page,
      p_page_size: pageSize,
    });
    if (error) throw friendlyError(error, "Failed to load brands.");
    const rows = (data ?? []) as DbBrand[];
    return {
      data: rows,
      total: Number(rows[0]?.total_count ?? 0),
      page,
      pageSize,
    };
  },

  async getAll(businessId: string, status?: BrandStatus): Promise<DbBrand[]> {
    let query = supabase
      .from("brands")
      .select("*")
      .eq("business_id", businessId)
      .order("name");
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw friendlyError(error, "Failed to load brands.");
    return (data ?? []) as DbBrand[];
  },

  async create(payload: DbBrandInsert): Promise<DbBrand> {
    const { data, error } = await supabase
      .from("brands")
      .insert(normalisePayload(payload))
      .select("*")
      .single();
    if (error) throw friendlyError(error, "Failed to create brand.");
    return data as DbBrand;
  },

  async update(id: string, payload: DbBrandUpdate): Promise<DbBrand> {
    const { data, error } = await supabase
      .from("brands")
      .update(normalisePayload(payload))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw friendlyError(error, "Failed to update brand.");
    return data as DbBrand;
  },

  async getProductCount(id: string, businessId: string): Promise<number> {
    const { count, error } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", id)
      .eq("business_id", businessId);
    if (error) throw friendlyError(error, "Failed to check brand usage.");
    return count ?? 0;
  },

  async remove(id: string, businessId: string): Promise<void> {
    const productCount = await brandsService.getProductCount(id, businessId);
    if (productCount > 0) {
      throw new Error(
        `This brand cannot be deleted because ${productCount} product${productCount === 1 ? " is" : "s are"} currently associated with it. Deactivate it instead.`
      );
    }
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) throw friendlyError(error, "Failed to delete brand.");
  },

  async duplicate(brand: DbBrand, businessId: string): Promise<DbBrand> {
    return brandsService.create({
      business_id: businessId,
      name: `${brand.name} (Copy)`,
      description: brand.description,
      logo_url: brand.logo_url,
      logo_initial: brand.logo_initial,
      logo_color: brand.logo_color,
      website: brand.website,
      status: "active",
    });
  },

  async setStatus(id: string, status: BrandStatus): Promise<DbBrand> {
    return brandsService.update(id, { status });
  },
};