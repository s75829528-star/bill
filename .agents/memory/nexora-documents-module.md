---
name: Nexora Documents module
description: Fully Supabase-backed file upload/management system in Billing → Documents tab.
---

# Nexora Documents Module

## Schema
- Table: `public.documents` in `supabase/schema_documents.sql`
- RLS pattern: `exists (select 1 from public.business where id = business_id and owner_id = auth.uid())`
- Storage bucket: `billing-documents` (private, 10 MB limit)
- Storage path pattern: `{business_id}/{document_id}/{sanitized_file_name}`
- Extra column `uploaded_by_email text` — stored at upload time so display doesn't need auth.users join

## Files
- `src/services/documents.ts` — BUCKET constant, MIME_TO_EXT map, DOCUMENT_TYPES, LINKED_MODULES, full CRUD + storage
- `src/hooks/useDocumentsQuery.ts` — useDocuments(businessId, filters, page, pageSize) returns `{ documents, total }`; separate mutation hooks for upload/delete/archive/restore/rename/move/replace
- `src/components/billing/tabs/DocumentsTab.tsx` — keeps original 8 doc-type cards (real counts via useInvoices/useQuotations/useCreditNotes/useRecurringInvoices); replaces old Recent sections with FileManager component

## Key decisions
- `documentsService.validateFile()` throws descriptive errors for unsupported types and files over 10 MB — must be called before upload
- `getSignedUrl(filePath, expiresIn)` creates time-limited signed URLs; used for both download (60s) and preview (300s)
- `replaceFile()` uploads to `{business_id}/{id}/{new_name}`, upsert:true, then removes old path if name changed
- Delete is best-effort on storage (logs warning) then hard-deletes the DB row
- `placeholderData: (prev) => prev` used on useDocuments for smooth pagination (TanStack Query v5 pattern)

**Why:** `useState` initializers and direct function calls during render that set state caused React hook corruption — always use `useEffect` for side effects triggered by prop changes (e.g. loading signed URLs when dialog opens, syncing form inputs when selected doc changes).
