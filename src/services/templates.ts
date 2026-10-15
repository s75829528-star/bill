/**
 * templates.ts — Supabase CRUD service for the Billing Templates module.
 *
 * Supports: create, update, delete, duplicate, set-default,
 * activate/deactivate, and logo upload via Supabase Storage.
 */

import { supabase } from "../lib/supabase";

// ── Types ──────────────────────────────────────────────────────────

export type TemplateType =
  | "gst_invoice"
  | "quotation"
  | "credit_note"
  | "payment_receipt"
  | "purchase_order"
  | "delivery_challan"
  | "proforma_invoice"
  | "debit_note";

export type TemplateStatus = "active" | "inactive";

export type FontFamily = "inter" | "roboto" | "poppins" | "lato" | "opensans";

export interface DbTemplate {
  id: string;
  business_id: string;
  template_name: string;
  template_type: TemplateType;
  header_text: string | null;
  footer_text: string | null;
  terms_conditions: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: FontFamily;
  show_logo: boolean;
  show_signature: boolean;
  show_qr_code: boolean;
  show_payment_details: boolean;
  show_bank_details: boolean;
  is_default: boolean;
  status: TemplateStatus;
  created_at: string;
  updated_at: string;
}

export type DbTemplateInsert = Omit<DbTemplate, "id" | "created_at" | "updated_at">;
export type DbTemplateUpdate = Partial<Omit<DbTemplate, "id" | "business_id" | "created_at" | "updated_at">>;

export interface TemplateInput {
  templateName: string;
  templateType: TemplateType;
  headerText?: string;
  footerText?: string;
  termsConditions?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: FontFamily;
  showLogo: boolean;
  showSignature: boolean;
  showQrCode: boolean;
  showPaymentDetails: boolean;
  showBankDetails: boolean;
  isDefault: boolean;
  status: TemplateStatus;
}

// ── Label helpers (exported for UI use) ───────────────────────────

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  gst_invoice:       "GST Invoice",
  quotation:         "Quotation",
  credit_note:       "Credit Note",
  payment_receipt:   "Payment Receipt",
  purchase_order:    "Purchase Order",
  delivery_challan:  "Delivery Challan",
  proforma_invoice:  "Proforma Invoice",
  debit_note:        "Debit Note",
};

export const FONT_FAMILY_LABELS: Record<FontFamily, string> = {
  inter:    "Inter",
  roboto:   "Roboto",
  poppins:  "Poppins",
  lato:     "Lato",
  opensans: "Open Sans",
};

export const TEMPLATE_TYPES: TemplateType[] = [
  "gst_invoice",
  "quotation",
  "credit_note",
  "payment_receipt",
  "purchase_order",
  "delivery_challan",
  "proforma_invoice",
  "debit_note",
];

// ── Helpers ────────────────────────────────────────────────────────

function toInsert(input: TemplateInput, businessId: string): DbTemplateInsert {
  return {
    business_id:          businessId,
    template_name:        input.templateName.trim(),
    template_type:        input.templateType,
    header_text:          input.headerText?.trim() || null,
    footer_text:          input.footerText?.trim() || null,
    terms_conditions:     input.termsConditions?.trim() || null,
    logo_url:             input.logoUrl || null,
    primary_color:        input.primaryColor,
    secondary_color:      input.secondaryColor,
    font_family:          input.fontFamily,
    show_logo:            input.showLogo,
    show_signature:       input.showSignature,
    show_qr_code:         input.showQrCode,
    show_payment_details: input.showPaymentDetails,
    show_bank_details:    input.showBankDetails,
    is_default:           input.isDefault,
    status:               input.status,
  };
}

// ── Service ────────────────────────────────────────────────────────

export const templatesService = {
  // ── Fetch all templates for a business ────────────────────────────
  async getAll(businessId: string): Promise<DbTemplate[]> {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as DbTemplate[];
  },

  // ── Create ────────────────────────────────────────────────────────
  async create(input: TemplateInput, businessId: string): Promise<DbTemplate> {
    if (input.isDefault) {
      await supabase
        .from("templates")
        .update({ is_default: false })
        .eq("business_id", businessId)
        .eq("template_type", input.templateType);
    }

    const { data, error } = await supabase
      .from("templates")
      .insert(toInsert(input, businessId))
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as DbTemplate;
  },

  // ── Update ────────────────────────────────────────────────────────
  async update(id: string, input: TemplateInput, businessId: string): Promise<DbTemplate> {
    if (input.isDefault) {
      await supabase
        .from("templates")
        .update({ is_default: false })
        .eq("business_id", businessId)
        .eq("template_type", input.templateType)
        .neq("id", id);
    }

    const { data, error } = await supabase
      .from("templates")
      .update({
        template_name:        input.templateName.trim(),
        template_type:        input.templateType,
        header_text:          input.headerText?.trim() || null,
        footer_text:          input.footerText?.trim() || null,
        terms_conditions:     input.termsConditions?.trim() || null,
        logo_url:             input.logoUrl || null,
        primary_color:        input.primaryColor,
        secondary_color:      input.secondaryColor,
        font_family:          input.fontFamily,
        show_logo:            input.showLogo,
        show_signature:       input.showSignature,
        show_qr_code:         input.showQrCode,
        show_payment_details: input.showPaymentDetails,
        show_bank_details:    input.showBankDetails,
        is_default:           input.isDefault,
        status:               input.status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as DbTemplate;
  },

  // ── Delete ────────────────────────────────────────────────────────
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  // ── Duplicate ─────────────────────────────────────────────────────
  async duplicate(id: string, businessId: string): Promise<DbTemplate> {
    const { data: source, error: fetchErr } = await supabase
      .from("templates")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !source) throw new Error(fetchErr?.message ?? "Template not found");

    const copy = source as DbTemplate;
    const { data, error } = await supabase
      .from("templates")
      .insert({
        business_id:          businessId,
        template_name:        `${copy.template_name} (Copy)`,
        template_type:        copy.template_type,
        header_text:          copy.header_text,
        footer_text:          copy.footer_text,
        terms_conditions:     copy.terms_conditions,
        logo_url:             copy.logo_url,
        primary_color:        copy.primary_color,
        secondary_color:      copy.secondary_color,
        font_family:          copy.font_family,
        show_logo:            copy.show_logo,
        show_signature:       copy.show_signature,
        show_qr_code:         copy.show_qr_code,
        show_payment_details: copy.show_payment_details,
        show_bank_details:    copy.show_bank_details,
        is_default:           false,
        status:               "active",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as DbTemplate;
  },

  // ── Set as default for its type ───────────────────────────────────
  async setDefault(id: string, businessId: string, templateType: TemplateType): Promise<void> {
    const { error: unsetErr } = await supabase
      .from("templates")
      .update({ is_default: false })
      .eq("business_id", businessId)
      .eq("template_type", templateType);

    if (unsetErr) throw new Error(unsetErr.message);

    const { error } = await supabase
      .from("templates")
      .update({ is_default: true })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  // ── Activate / Deactivate ─────────────────────────────────────────
  async updateStatus(id: string, status: TemplateStatus): Promise<void> {
    const { error } = await supabase
      .from("templates")
      .update({ status })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  // ── Get default template for a document type ──────────────────────
  async getDefault(businessId: string, templateType: TemplateType): Promise<DbTemplate | null> {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("business_id", businessId)
      .eq("template_type", templateType)
      .eq("is_default", true)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as DbTemplate) ?? null;
  },

  // ── Upload logo to Supabase Storage ───────────────────────────────
  async uploadLogo(file: File, businessId: string): Promise<string> {
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${businessId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("billing-template-logos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data } = supabase.storage
      .from("billing-template-logos")
      .getPublicUrl(path);

    return data.publicUrl;
  },
};
