---
name: Nexora Payments module
description: Implementation details, schema, and key patterns for the Billing → Payments module.
---

# Nexora Payments Module

## What was built
- `supabase/schema_payments.sql` — `payments` + `payment_allocations` tables with RLS (run after schema_billing.sql)
- `src/services/payments.ts` — full CRUD; create/refund/void/delete all call `adjustInvoiceBalance()` to keep invoices in sync
- `src/hooks/usePaymentsQuery.ts` — React Query hooks (usePayments, useCreatePayment, useUpdatePayment, useDeletePayment, useRefundPayment, useVoidPayment)
- `src/components/billing/tabs/PaymentsTab.tsx` — fully Supabase-backed; mock data removed; Edit/Refund/Void/Delete/Preview action buttons added

## Key decisions

**PaymentTxn extended** — added optional `invoiceNumber?`, `customerName?`, `customerCity?`, `currency?` fields populated from DB joins. Code that previously called `getInvoice(pay.invoiceId)` / `getCustomer(pay.customerId)` now reads these fields directly.

**PaymentTxnStatus extended** — added `"voided" | "failed" | "completed"` to the existing `"received" | "pending" | "refunded" | "cancelled"` union. BillingStatusPill handles unknowns via fallback slate style.

**Invoice balance sync** — `adjustInvoiceBalance(invoiceId, delta)` fetches invoice_items, recomputes grand total, derives payment_status (paid/partial/pending), and updates the invoice row. Called on: create (+amount), refund/void/delete (−amount). Update does NOT re-adjust balance.

**Outstanding shown in modal** — invoice dropdown shows `Outstanding: ₹X` and amount field is capped to that balance with validation.

**Invoice join** — `payments` query selects `invoices(invoice_number)` and `customers(name, city)` via Supabase foreign-key joins; no separate lookup calls needed at the UI level.

**Why:**
Keeping invoice balance in sync from the payments service (not a DB trigger) makes it easy to test and reason about; triggers would be harder to debug. The `adjustInvoiceBalance` helper is the single source of truth for this logic.
