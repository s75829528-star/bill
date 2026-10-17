/**
 * customers.ts — Supabase CRUD service for the Customers module.
 *
 * All database operations go through here. Components never import
 * supabase directly for customer data.
 */

import { supabase } from "../lib/supabase";

// ── DB types ──────────────────────────────────────────────────────

export interface Customer {
  id: string;
  business_id: string;
  customer_code: string;
  name: string;
  company_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string;
  gst_number: string | null;
  pan_number: string | null;
  address: string | null;
  shipping_address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  credit_limit: number;
  credit_days: number;
  opening_balance: number;
  customer_group: string;
  status: string;
  rating: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerGroup {
  id: string;
  business_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DbCustomerNote {
  id: string;
  customer_id: string;
  text: string;
  author: string;
  created_at: string;
}

export interface DbBusinessCustomerNote extends DbCustomerNote {
  customer_name: string;
}

export type CustomerInsert = Omit<Customer, "id" | "created_at" | "updated_at">;
export type CustomerUpdate = Partial<
  Omit<Customer, "id" | "business_id" | "created_at" | "updated_at">
>;

const QUERY_PAGE_SIZE = 500;

// ── Helpers ───────────────────────────────────────────────────────

export function generateCustomerCode(): string {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `CUS-${yyyymm}-${rand}`;
}

// ── Service ───────────────────────────────────────────────────────

export const customersService = {
  // ── Customers ─────────────────────────────────────────────────

  async getAll(businessId: string): Promise<Customer[]> {
    const customers: Customer[] = [];
    for (let from = 0; ; from += QUERY_PAGE_SIZE) {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + QUERY_PAGE_SIZE - 1);
      if (error) throw error;
      const page = (data ?? []) as Customer[];
      customers.push(...page);
      if (page.length < QUERY_PAGE_SIZE) break;
    }
    return customers;
  },

  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as Customer | null;
  },

  async create(payload: CustomerInsert): Promise<Customer> {
    // Duplicate email guard (within same business)
    if (payload.email) {
      const { data: existing, error: duplicateCheckError } = await supabase
        .from("customers")
        .select("id")
        .eq("business_id", payload.business_id)
        .eq("email", payload.email)
        .maybeSingle();
      if (duplicateCheckError) throw duplicateCheckError;
      if (existing) throw new Error("A customer with this email already exists.");
    }

    const { data, error } = await supabase
      .from("customers")
      .insert({
        ...payload,
        customer_code: payload.customer_code || generateCustomerCode(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as Customer;
  },

  async update(id: string, payload: CustomerUpdate): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Customer;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw error;
  },

  async deleteMany(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const { error } = await supabase.from("customers").delete().in("id", ids);
    if (error) throw error;
  },

  async bulkUpdate(ids: string[], payload: CustomerUpdate): Promise<void> {
    if (!ids.length) return;
    const { error } = await supabase
      .from("customers")
      .update(payload)
      .in("id", ids);
    if (error) throw error;
  },

  async getGroups(businessId: string): Promise<CustomerGroup[]> {
    const { data, error } = await supabase
      .from("customer_groups")
      .select("*")
      .eq("business_id", businessId)
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as CustomerGroup[];
  },

  async createGroup(businessId: string, name: string): Promise<CustomerGroup> {
    const { data, error } = await supabase
      .from("customer_groups")
      .insert({ business_id: businessId, name: name.trim() })
      .select()
      .single();
    if (error) throw error;
    return data as CustomerGroup;
  },

  // ── Notes ──────────────────────────────────────────────────────

  async getNotes(customerId: string): Promise<DbCustomerNote[]> {
    const { data, error } = await supabase
      .from("customer_notes")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DbCustomerNote[];
  },

  async getAllNotesForBusiness(businessId: string): Promise<DbBusinessCustomerNote[]> {
    const notes: DbBusinessCustomerNote[] = [];
    for (let from = 0; ; from += QUERY_PAGE_SIZE) {
      const { data, error } = await supabase
        .from("customer_notes")
        .select("id, customer_id, text, author, created_at, customer:customers!inner(name, business_id)")
        .eq("customer.business_id", businessId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + QUERY_PAGE_SIZE - 1);
      if (error) throw error;

      const page = (data ?? []) as unknown as {
        id: string;
        customer_id: string;
        text: string;
        author: string;
        created_at: string;
        customer: { name: string };
      }[];
      notes.push(...page.map(({ customer, ...note }) => ({ ...note, customer_name: customer.name })));
      if (page.length < QUERY_PAGE_SIZE) break;
    }
    return notes;
  },

  async addNote(
    customerId: string,
    text: string,
    author = "You"
  ): Promise<DbCustomerNote> {
    const { data, error } = await supabase
      .from("customer_notes")
      .insert({ customer_id: customerId, text, author })
      .select()
      .single();
    if (error) throw error;
    return data as DbCustomerNote;
  },

  async deleteNote(noteId: string): Promise<void> {
    const { error } = await supabase
      .from("customer_notes")
      .delete()
      .eq("id", noteId);
    if (error) throw error;
  },
};
