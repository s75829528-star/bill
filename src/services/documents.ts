/**
 * documents.ts — Supabase service for the Billing Documents module.
 *
 * Files are stored in the "billing-documents" private bucket.
 * Path pattern: {business_id}/{document_id}/{sanitized_file_name}
 * Metadata is stored in the public.documents table.
 */

import { supabase } from "../lib/supabase";

// ── Constants ──────────────────────────────────────────────────────

export const BUCKET = "billing-documents";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** Maps MIME type → display extension */
export const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/csv": "csv",
  "text/plain": "txt",
  "application/zip": "zip",
};

export const EXT_TO_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_TO_EXT).map(([mime, ext]) => [ext, mime])
);

export const DOCUMENT_TYPES = [
  "Invoice",
  "Quotation",
  "Credit Note",
  "Payment Receipt",
  "GST",
  "Purchase Order",
  "Delivery Challan",
  "Customer Attachment",
  "Import File",
  "Other",
] as const;

export const LINKED_MODULES = [
  { value: "invoices", label: "Invoices" },
  { value: "quotations", label: "Quotations" },
  { value: "credit_notes", label: "Credit Notes" },
  { value: "payments", label: "Payments" },
  { value: "customers", label: "Customers" },
  { value: "products", label: "Products" },
] as const;

// ── Types ──────────────────────────────────────────────────────────

export interface DbDocument {
  id: string;
  business_id: string;
  document_name: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  linked_module: string | null;
  linked_record_id: string | null;
  uploaded_by: string | null;
  uploaded_by_email: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentFilters {
  search?: string;
  docType?: string;
  fileType?: string;    // e.g. "pdf", "jpg"
  linkedModule?: string;
  dateFrom?: string;   // YYYY-MM-DD
  dateTo?: string;     // YYYY-MM-DD
  showArchived?: boolean;
}

export interface UploadParams {
  businessId: string;
  file: File;
  documentName: string;
  documentType: string;
  linkedModule?: string;
  linkedRecordId?: string;
}

// ── Helpers ────────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// ── Service ────────────────────────────────────────────────────────

export const documentsService = {
  /** Throws if file type or size is not allowed. */
  validateFile(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB — maximum is 10 MB`
      );
    }
    if (!MIME_TO_EXT[file.type]) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "unknown";
      throw new Error(
        `Unsupported file type ".${ext}". Allowed: PDF, PNG, JPG, WEBP, DOCX, XLSX, CSV, TXT, ZIP`
      );
    }
  },

  /** Upload a file to Storage and insert a metadata row. */
  async uploadDocument(params: UploadParams): Promise<DbDocument> {
    const { businessId, file, documentName, documentType, linkedModule, linkedRecordId } = params;

    this.validateFile(file);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const docId = crypto.randomUUID();
    const safeName = sanitizeFileName(file.name);
    const filePath = `${businessId}/${docId}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { contentType: file.type, upsert: false });

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    const { data, error: insertError } = await supabase
      .from("documents")
      .insert({
        id: docId,
        business_id: businessId,
        document_name: documentName,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        linked_module: linkedModule || null,
        linked_record_id: linkedRecordId || null,
        uploaded_by: user.id,
        uploaded_by_email: user.email ?? null,
      })
      .select()
      .single();

    if (insertError) {
      // Clean up the orphaned file so storage stays consistent
      await supabase.storage.from(BUCKET).remove([filePath]);
      throw new Error(`Database error: ${insertError.message}`);
    }

    return data as DbDocument;
  },

  /** Fetch documents with optional filters and pagination. */
  async getAll(
    businessId: string,
    filters: DocumentFilters = {},
    page = 1,
    pageSize = 10
  ): Promise<{ documents: DbDocument[]; total: number }> {
    let query = supabase
      .from("documents")
      .select("*", { count: "exact" })
      .eq("business_id", businessId)
      .eq("is_archived", filters.showArchived ?? false)
      .order("created_at", { ascending: false });

    if (filters.search?.trim()) {
      const s = filters.search.trim();
      query = query.or(`document_name.ilike.%${s}%,file_name.ilike.%${s}%`);
    }
    if (filters.docType) {
      query = query.eq("document_type", filters.docType);
    }
    if (filters.linkedModule) {
      query = query.eq("linked_module", filters.linkedModule);
    }
    if (filters.fileType) {
      const mime = EXT_TO_MIME[filters.fileType.toLowerCase()];
      if (mime) query = query.eq("mime_type", mime);
    }
    if (filters.dateFrom) {
      query = query.gte("created_at", `${filters.dateFrom}T00:00:00`);
    }
    if (filters.dateTo) {
      query = query.lte("created_at", `${filters.dateTo}T23:59:59`);
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return { documents: (data ?? []) as DbDocument[], total: count ?? 0 };
  },

  /** Delete the file from Storage and remove the metadata row. */
  async delete(id: string, filePath: string): Promise<void> {
    // Remove from storage (best-effort — don't block on storage errors)
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (storageError) console.warn("[documents] storage delete warning:", storageError.message);

    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from("documents")
      .update({ is_archived: true })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from("documents")
      .update({ is_archived: false })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async rename(id: string, documentName: string): Promise<void> {
    const { error } = await supabase
      .from("documents")
      .update({ document_name: documentName.trim() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async move(
    id: string,
    linkedModule: string | null,
    linkedRecordId: string | null
  ): Promise<void> {
    const { error } = await supabase
      .from("documents")
      .update({ linked_module: linkedModule, linked_record_id: linkedRecordId })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  /** Replace the physical file while keeping the metadata row. */
  async replaceFile(id: string, file: File): Promise<void> {
    this.validateFile(file);

    const { data: existing, error: fetchError } = await supabase
      .from("documents")
      .select("file_path, business_id")
      .eq("id", id)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    const safeName = sanitizeFileName(file.name);
    const newPath = `${existing.business_id}/${id}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(newPath, file, { contentType: file.type, upsert: true });
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    // Remove old file if path changed (e.g. different filename)
    if (existing.file_path !== newPath) {
      await supabase.storage.from(BUCKET).remove([existing.file_path]);
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({
        file_name: file.name,
        file_path: newPath,
        file_size: file.size,
        mime_type: file.type,
      })
      .eq("id", id);
    if (updateError) throw new Error(updateError.message);
  },

  /** Create a time-limited signed URL for download or preview. */
  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, expiresIn);
    if (error) throw new Error(error.message);
    return data.signedUrl;
  },
};
