# Application database coverage

Coverage is based on a repository-wide scan of source files for Supabase client calls and the local SQL files. “No direct query found” means no direct call was found in this source scan; it does not prove that a feature never uses remote data indirectly or that a live database object does not exist.

| Application area | Observed tables, RPCs, and storage | Source files | Local schema source |
|---|---|---|---|
| Authentication and profile creation | Supabase Auth; `public.profiles`; `handle_new_user` trigger on `auth.users` | `src/services/auth.ts`, `src/contexts/AuthContext.tsx`, login/signup/callback/password/email routes | `supabase/schema.sql` |
| Business profile and onboarding | `public.business` | `src/services/business.ts`, `src/contexts/BusinessContext.tsx`, `src/routes/_authenticated/onboarding.tsx` | `supabase/schema.sql` |
| CRM customers | `public.customers`, `public.customer_notes` | `src/services/customers.ts` and CRM customer screens | `supabase/customers_schema.sql` |
| Inventory catalog and stock | `public.categories`, `public.suppliers`, `public.brands`, `public.products`, `public.inventory_movements`; `get_brands_page`; `process_inventory_movement` trigger | `src/services/products.ts`, `src/services/brands.ts`, `src/services/inventoryMovements.ts`, inventory screens | `supabase/schema.sql`; `supabase/schema_brands.sql` is an upgrade source |
| Purchasing | `public.purchase_orders`, `purchase_order_items`, `goods_received_notes`, `goods_received_note_items`, `purchase_bills`, `purchase_bill_payments`; `create_purchase_order`, `receive_purchase_goods`, `create_purchase_bill`, `record_purchase_bill_payment` | `src/services/purchaseFlow.ts`, purchase-order and purchase-bill screens | `supabase/schema_purchase_flow.sql` |
| Invoices | `public.invoices`, `public.invoice_items` | `src/services/invoices.ts`, billing screens, `src/server/ai-business-context.ts` | `supabase/schema_billing.sql` |
| Quotations and credit notes | `public.quotations`, `public.quotation_items`, `public.credit_notes`, `public.credit_note_items` | `src/services/quotations.ts`, `src/services/creditNotes.ts`, billing screens | `supabase/schema.sql` |
| Payments | `public.payments`, `public.payment_allocations` | `src/services/payments.ts`, billing screens | `supabase/schema_payments.sql` |
| Recurring invoices | `public.recurring_invoices`, `public.recurring_invoice_items` | `src/services/recurring.ts`, billing screens | `supabase/schema_recurring.sql` |
| Documents and uploads | `public.documents`; private `billing-documents` bucket; policies on `storage.objects` | `src/services/documents.ts`, billing document screen | `supabase/schema_documents.sql` |
| Billing templates and logos | `public.templates`; public `billing-template-logos` bucket; policies on `storage.objects` | `src/services/templates.ts`, billing template screen | `supabase/schema_templates.sql` |
| AI history and business context | `public.ai_conversations`, `public.ai_messages`; reads from business, invoices, products, customers, and inventory movements | `src/services/aiConversations.ts`, `src/server/ai-business-context.ts`, `src/routes/api/ai-chat.ts` | `supabase/schema_ai_conversations.sql` and relevant module SQL |
| Finance, analytics, and reporting | No direct Supabase table/RPC call found in the scanned source; mapping not observed | `src/components/finance`, `src/components/reports`, `src/hooks/useDashboardData.ts` | No corresponding local SQL definition identified by the direct-call scan |
| Other CRM tabs (leads, activities, groups, follow-ups) | No direct Supabase table/RPC call found in the scanned source | `src/components/crm` | No corresponding local SQL definition identified by the direct-call scan |

## Access for which live definitions remain unknown

No generated database types, migration directory, or checked-in Supabase project configuration was found. Remote objects not declared in local SQL remain unverified. Supabase Auth and Storage internals are managed schemas; this snapshot records only the application trigger, bucket declarations, and storage policies present in the repository.
