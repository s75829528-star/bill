---
name: Nexora Recurring Invoices module
description: Implementation details, schema, and key patterns for the Billing → Recurring module.
---

# Nexora Recurring Invoices

## What was built
- `supabase/schema_recurring.sql` — tables `recurring_invoices` + `recurring_invoice_items` with RLS (must be run in Supabase SQL Editor after schema_billing.sql)
- `src/services/recurring.ts` — full CRUD + `generateInvoice()` backend function ready for future scheduler
- `src/hooks/useRecurringQuery.ts` — React Query hooks (useRecurringInvoices, useCreateRecurring, useUpdateRecurring, useDeleteRecurring, useUpdateRecurringStatus, useDuplicateRecurring, useGenerateInvoice)
- `src/components/billing/tabs/RecurringTab.tsx` — fully Supabase-backed; mock data removed

## Key decisions

**RecurringInvoice type fields are optional** (`seriesNumber?`, `currency?`, `notes?`, `terms?`, `items?`) — this keeps the existing seed data in billing-data.ts valid. The DB adapter always populates all fields.

**Series number format**: `REC-YYYY-0001` — same sequential pattern as INV/QT/CN. Generated in `recurringService` via a `.like('series_number', 'REC-YYYY-%')` query.

**DbProduct.gst field**: It's `tax_rate` (not `gst_percent`) — maps to `taxPercent` in the UI product type.

**SecondaryButton** has no `disabled` prop — use conditional `onClick={isPending ? undefined : handler}` pattern instead.

**computeFirstBillingDate** advances the next billing date past today on first creation. Edit form preserves the stored `next_billing_date` (user can override manually).

**Auto-generation function** (`recurringService.generateInvoice`): creates a real invoice via `invoicesService.create`, advances `next_billing_date`, increments `invoices_generated`, and sets status to `completed` if `end_date` is passed. Ready for future cron/scheduled jobs — no cron implemented yet.

**Why:**
Future scheduled jobs can call `recurringService.generateInvoice(id, businessId, products, invoiceNumber)` without any UI changes.
