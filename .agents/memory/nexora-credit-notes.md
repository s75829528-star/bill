---
name: Nexora Credit Notes module
description: Architecture and decisions for the Credit Notes Supabase integration — tables, service, hooks, UI wiring.
---

# Nexora Credit Notes — Supabase Integration

## Tables added to supabase/schema.sql
- `credit_notes` — header row; RLS via `exists (select 1 from business where id=business_id and owner_id=auth.uid())`
- `credit_note_items` — line items; RLS via join through `credit_notes`
- Status values: `draft | issued | applied | voided` (NOT the old mock values issued/adjusted/refunded)

## Type changes in billing-data.ts
- `CreditNoteStatus` changed from `"issued" | "adjusted" | "refunded"` → `"draft" | "issued" | "applied" | "voided"`
- `CreditNote` interface extended with `items: CreditNoteItem[]`, `grandTotal`, `subtotal`, `discountTotal`, `taxTotal`, `creditNoteDate`, `notes`, `createdAt`, `updatedAt`; `amount` kept as `@deprecated` alias

## Service: src/services/creditNotes.ts
- `computeCNTotals(items)` — calculates subtotal (pre-tax), discountTotal, taxTotal, grandTotal
- `create()` — generates CN number, inserts header + items, triggers inventory "in" movements if status=issued
- `update(id, previousStatus, payload)` — replaces items (delete+insert), triggers movements on draft→issued transition
- `void(id)` — sets status=voided (no movement reversal by design)
- `duplicate(source, businessId)` — creates draft copy
- DB field name caveat: use `discount_total / tax_total / grand_total` in the DB insert, NOT `discountTotal` etc.

## Hook: src/hooks/useCreditNotesQuery.ts
- Follows exact same pattern as `useInvoicesQuery.ts`
- On issued status: invalidates `["products", businessId]` and `["inventory_movements", businessId]`

## UI: CreditNotesTab.tsx
- Imports `useBusiness` from BusinessContext for `businessId`
- Form auto-fills customer + line items when an invoice is selected
- Action buttons: View (all), Edit (draft only), Print, Email (mailto:), Duplicate, Void (non-draft/non-voided), Delete (draft only)
- Loading skeletons while React Query fetches

## PrimaryButton shared component
- Added `disabled?: boolean` prop to `src/components/inventory/shared.tsx` PrimaryButton (affects all billing/inventory/CRM UIs that use it)

**Why:** The spec required a Save button that disables during mutation. Since PrimaryButton is a shared primitive, adding `disabled` there is the right fix.

## SecondaryButton onClick limitation
- `SecondaryButton.onClick` is typed as `() => void` — no event arg. If you need form submit context (e.g. "save draft" vs "send"), use a mutable ref to store intent and call a single `onSubmit` handler on the form element.
- Do not cast `(e) => ...` to get around this — TypeScript will reject it. Use a `type="submit"` `<button>` styled inline instead if you need two submit modes.
