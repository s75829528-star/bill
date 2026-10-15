---
name: Nexora invoices DB integration
description: How InvoiceBuilder, InvoicesTab, and Dashboard were wired to real Supabase invoice data
---

## Files Created
- `src/services/invoices.ts` — `invoicesService.getAll/create/update/delete`; `dbToInvoice` adapter; `isUUID` helper; stock movements fired in `create()` unless `skipMovements=true`
- `src/hooks/useInvoicesQuery.ts` — `useInvoices`, `useCreateInvoice`, `useUpdateInvoice`, `useDeleteInvoice`; create mutation accepts `{ invoice, dbProducts?, skipMovements? }`

## Key Design Decisions

### Customer adapter in InvoiceBuilder
`DbCustomer` fields differ from billing-data `Customer` (gst_number vs gstin, contact_person vs contactPerson, shipping_address vs shippingAddress). InvoiceBuilder maps `dbRawCustomers` to a `localCustomers` array inline inside the component — no separate type file.

**Why:** Avoids changing the `Customer` type in billing-data (used elsewhere), and the mapping is trivial.

### emptyLine() decoupled from products
`emptyLine()` returns blank strings/0 values. When editing an invoice, lineItems are initialized without product details, then a `useEffect` fills them once `products` (from `useProducts`) load.

**Why:** Products aren't available synchronously at component mount time.

### skipMovements flag on invoicesService.create
Duplicate-invoice flow passes `skipMovements: true` to avoid double-deducting stock from a draft copy.

**Why:** Duplicates are drafts, not sales. Stock should only move on real invoices.

### resolveCustomer in InvoicesTab
`getCustomer()` (mock) replaced by `resolveCustomer(id)` which looks up `dbCustomers` from `useCustomers`. Returns `{ name, gstin, contactPerson }` or undefined. Used in search filter, table rows, and CSV export.

### buildCSV now takes resolver param
`buildCSV(rows, resolveCustomer)` — resolver passed as parameter since `buildCSV` is module-scope.

### LiveStatCards in dashboard
Replaces static `statCards` const. Calls `useInvoices`, `useProducts`, `useCustomers`. Shows "—" while loading. One card (Monthly Profit) is still static placeholder.

### StatCardData type
After removing `statCards` const, `StatCard` uses an inline `StatCardData` type instead of `typeof statCards[0]`.

## DB Tables
- `public.invoices`, `public.invoice_items` — created by `supabase/schema_billing.sql` (run in Supabase SQL editor after schema.sql)
- RLS policies scope all rows to `business_id`
- DB trigger `process_inventory_movement` auto-updates stock; throws if stock goes negative
