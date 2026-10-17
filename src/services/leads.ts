/**
 * leads.ts — tenant-scoped read/write service for CRM leads and follow-ups.
 * All lead/follow-up operations are enforced by the app's per-business RLS policy.
 */

import { supabase } from "@/lib/supabase";
import { businessService } from "./business";

export type LeadSource =
  | "website"
  | "social"
  | "referral"
  | "walk_in"
  | "campaign"
  | "other";

export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

export type FollowUpChannel = "call" | "whatsapp" | "email" | "visit" | "other";
export type FollowUpStatus = "scheduled" | "completed" | "missed" | "cancelled";

export interface Lead {
  id: string;
  business_id: string;
  customer_id: string | null;
  full_name: string;
  company_name: string | null;
  email: string | null;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  value: number;
  notes: string | null;
  next_followup_at: string | null;
  converted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: string;
  business_id: string;
  lead_id: string;
  scheduled_for: string;
  channel: FollowUpChannel;
  status: FollowUpStatus;
  notes: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadInsert = Omit<Lead, "id" | "created_at" | "updated_at" | "next_followup_at" | "converted_at"> & {
  next_followup_at?: string | null;
  converted_at?: string | null;
};

export type LeadUpdate = Partial<Omit<Lead, "id" | "business_id" | "created_at" | "updated_at">>;

export type FollowUpInsert = Omit<FollowUp, "id" | "created_at" | "updated_at" | "completed_at"> & {
  completed_at?: string | null;
};

export type FollowUpUpdate = Partial<Omit<FollowUp, "id" | "business_id" | "lead_id" | "created_at" | "updated_at">>;

async function getCurrentBusinessId(): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user?.id) throw new Error("User is not authenticated.");

  const business = await businessService.getByOwner(user.id);
  if (!business) {
    throw new Error("Business record not found. Complete onboarding before managing leads.");
  }

  return business.id;
}

export const leadsService = {
  async getAll(businessId?: string): Promise<Lead[]> {
    const targetBusinessId = businessId ?? (await getCurrentBusinessId());

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("business_id", targetBusinessId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Lead[];
  },

  async getById(id: string): Promise<Lead | null> {
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as Lead | null) ?? null;
  },

  async create(payload: LeadInsert): Promise<Lead> {
    const { data, error } = await supabase.from("leads").insert(payload).select().single();
    if (error) throw error;
    return data as Lead;
  },

  async update(id: string, payload: LeadUpdate): Promise<Lead> {
    const { data, error } = await supabase.from("leads").update(payload).eq("id", id).select().single();
    if (error) throw error;
    return data as Lead;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) throw error;
  },
};

export const followUpsService = {
  async getAll(businessId?: string): Promise<FollowUp[]> {
    const targetBusinessId = businessId ?? (await getCurrentBusinessId());

    const { data, error } = await supabase
      .from("follow_ups")
      .select("*")
      .eq("business_id", targetBusinessId)
      .order("scheduled_for", { ascending: true });

    if (error) throw error;
    return (data ?? []) as FollowUp[];
  },

  async getByLeadId(leadId: string): Promise<FollowUp[]> {
    const { data, error } = await supabase
      .from("follow_ups")
      .select("*")
      .eq("lead_id", leadId)
      .order("scheduled_for", { ascending: true });

    if (error) throw error;
    return (data ?? []) as FollowUp[];
  },

  async create(payload: FollowUpInsert): Promise<FollowUp> {
    const { data, error } = await supabase.from("follow_ups").insert(payload).select().single();
    if (error) throw error;
    return data as FollowUp;
  },

  async update(id: string, payload: FollowUpUpdate): Promise<FollowUp> {
    const { data, error } = await supabase.from("follow_ups").update(payload).eq("id", id).select().single();
    if (error) throw error;
    return data as FollowUp;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("follow_ups").delete().eq("id", id);
    if (error) throw error;
  },
};
