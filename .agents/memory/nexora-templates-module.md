---
name: Nexora Templates module
description: Design decisions and patterns for the Billing → Templates Supabase module.
---

# Nexora Templates Module

## Schema
- Table: `templates` — all columns in `supabase/schema_templates.sql`
- Storage bucket: `billing-template-logos` (public bucket, logos served as public URLs)
- RLS: same pattern as all other Nexora tables — `exists (select 1 from public.business where id = business_id and owner_id = auth.uid())`

## Key decisions
- `is_default` is per `(business_id, template_type)` — only one default per type per business; setDefault() does an unset-all then set-one two-step (no DB transaction from client)
- Logo uploads land in `billing-template-logos/<businessId>/<timestamp>.<ext>`; only the public URL is stored in `logo_url`
- Copies from duplicate() always have `is_default: false` and `status: active`

## Supabase client pattern (critical)
`supabase` export from `src/lib/supabase.ts` is a **Proxy object**, NOT a function.
- **CORRECT**: `supabase.from("templates").select(...)` 
- **WRONG**: `supabase().from("templates").select(...)` — causes TS2349 "not callable"

## File locations
- `src/services/templates.ts` — CRUD service
- `src/hooks/useTemplates.ts` — React Query hooks (optimistic updates on setDefault + updateStatus)
- `src/components/billing/tabs/TemplatesTab.tsx` — full UI with search/filter/pagination/create/edit/duplicate/delete/preview/setDefault/activate/deactivate
- `supabase/schema_templates.sql` — run in Supabase SQL Editor to apply

**Why:** Templates needed full Supabase wiring to replace mock invoiceTemplates array; schema_templates.sql must be manually applied by the user in Supabase SQL Editor.
