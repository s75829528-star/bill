---
name: Nexora Quotations module
description: Architecture and decisions for the Quotations Supabase integration — tables, service, hooks, UI wiring.
---

# Nexora Quotations — Supabase Integration

## Tables added to supabase/schema.sql
- `quotations` — header row; RLS via `exists (select 1 from business where id = business_id and owner_id = auth.uid())`
- `quotation_items` — line items; RLS via join through `quotations`
- Status values: `draft | sent | approved | rejected | expired | converted`
  - NOTE: existing billing-data.ts mock used "accepted" — changed to "approved" to match spec. Both "accepted" and "approved" status pills exist in shared.tsx statusStyles for backward compat.

## Type changes in billing-data.ts
- `QuotationStatus`: added `"approved"` and `"converted"` (removed old `"accepted"`)
- `Quotation` interface extended: `billingAddress`, `internalNotes`, `terms`, `subtotal`, `discountTotal`, `taxTotal`, `grandTotal`, `createdAt`, `updatedAt`; `convertedInvoiceNumber` optional
- Seed data updated with spread of `_emptyQT` defaults for new required fields

## Service: src/services/quotations.ts
- `generateNumber(businessId)` → `QT-{YYYY}-{####}`
- `generateInvoiceNumber(businessId)` → `INV-{YYYY}-{####}` (for convert-to-invoice)
- `computeQTTotals(items)` — same pattern as creditNotes.ts
- `convertToInvoice()` — calls `invoicesService.create()` with `skipMovements=true`, then updates quotation to `converted` with `converted_invoice_id`
- DB field names: snake_case (discount_total, tax_total, grand_total)

## Hook: src/hooks/useQuotationsQuery.ts
- `useConvertToInvoice` — on success invalidates both `["quotations", businessId]` and `["invoices", businessId]`

## UI: QuotationsTab.tsx (full rewrite)
- Imports `useBusiness().business?.id` (NOT `businessId` — BusinessContext only exposes `business` object)
- Product search in line-items table: live filter by name/SKU/barcode from `useProducts(businessId)` (DbProduct)
- Two-mode form submit ("Save Draft" → status=draft, "Create" → status=sent): use a mutable ref (`saveAsDraftRef`) to track intent; both buttons are `type="submit"` native buttons styled inline
- Actions per status: Send (draft→sent), Approve (sent→approved), Reject (draft/sent→rejected), Mark Expired (sent/approved→expired), Convert (approved/sent→converted), Edit (draft/sent only), Duplicate, Print, Email (mailto:), Share (navigator.share + clipboard fallback), Delete (draft only)
- Loading skeletons while React Query fetches

**Why:** Quote product search needed DbProduct (not mock) to support name/SKU/barcode search. BusinessContext only surfaces `business?.id`, not a top-level `businessId`.
