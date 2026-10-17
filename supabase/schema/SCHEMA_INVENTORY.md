# Schema inventory

This inventory describes the generated local snapshot only. Exact columns, defaults, constraints, and relationships are in the listed SQL files; no item has been compared with the live database.

## Counts

- Original root SQL files audited: 11.
- Unique table definitions in the canonical local snapshot: 29.
- Functions: 10; triggers: 19; RLS policies: 57; explicit indexes: 17.
- Sequences: 3; extensions: 1; storage buckets: 2; schema grants: 2.
- Views/materialized views and custom enum/domain types found in local SQL: none.

Every status below is repository-only, not live verification. Supabase-managed auth/storage internals are not counted as application-owned objects.

## Tables

| Object | Type | Source → snapshot | Verification |
|---|---|---|---|
| public.profiles | table | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| public.business | table | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| public.categories | table | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| public.suppliers | table | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| public.brands | table | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| public.products | table | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| public.inventory_movements | table | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| public.customers | table | supabase/customers_schema.sql → supabase/schema/03_customers_crm.sql | Repository-defined only; live Supabase verification unavailable. |
| public.customer_notes | table | supabase/customers_schema.sql → supabase/schema/03_customers_crm.sql | Repository-defined only; live Supabase verification unavailable. |
| public.invoices | table | supabase/schema_billing.sql → supabase/schema/04_billing.sql | Repository-defined only; live Supabase verification unavailable. |
| public.invoice_items | table | supabase/schema_billing.sql → supabase/schema/04_billing.sql | Repository-defined only; live Supabase verification unavailable. |
| public.credit_notes | table | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| public.credit_note_items | table | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| public.quotations | table | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| public.quotation_items | table | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| public.payments | table | supabase/schema_payments.sql → supabase/schema/06_payments.sql | Repository-defined only; live Supabase verification unavailable. |
| public.payment_allocations | table | supabase/schema_payments.sql → supabase/schema/06_payments.sql | Repository-defined only; live Supabase verification unavailable. |
| public.purchase_orders | table | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| public.purchase_order_items | table | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| public.goods_received_notes | table | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| public.goods_received_note_items | table | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| public.purchase_bills | table | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| public.purchase_bill_payments | table | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| public.documents | table | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| public.templates | table | supabase/schema_templates.sql (deduplicated) → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |
| public.recurring_invoices | table | supabase/schema_recurring.sql → supabase/schema/10_recurring_operations.sql | Repository-defined only; live Supabase verification unavailable. |
| public.recurring_invoice_items | table | supabase/schema_recurring.sql → supabase/schema/10_recurring_operations.sql | Repository-defined only; live Supabase verification unavailable. |
| public.ai_conversations | table | supabase/schema_ai_conversations.sql → supabase/schema/11_ai_conversations.sql | Repository-defined only; live Supabase verification unavailable. |
| public.ai_messages | table | supabase/schema_ai_conversations.sql → supabase/schema/11_ai_conversations.sql | Repository-defined only; live Supabase verification unavailable. |

## Functions and procedures

| Object | Type | Source → snapshot | Verification |
|---|---|---|---|
| public.handle_new_user | function | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| public.set_updated_at | function | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| public.get_brands_page | function | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| public.process_inventory_movement | function | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| public.create_purchase_order | function | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| public.receive_purchase_goods | function | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| public.create_purchase_bill | function | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| public.record_purchase_bill_payment | function | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| public.documents_set_updated_at | function | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| public.update_ai_conversation_timestamp | function | supabase/schema_ai_conversations.sql → supabase/schema/11_ai_conversations.sql | Repository-defined only; live Supabase verification unavailable. |

## Triggers

| Object | Type | Source → snapshot | Verification |
|---|---|---|---|
| on_auth_user_created | trigger (auth.users) | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| set_profiles_updated_at | trigger (public.profiles) | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| set_business_updated_at | trigger (public.business) | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| set_categories_updated_at | trigger (public.categories) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| set_suppliers_updated_at | trigger (public.suppliers) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| set_brands_updated_at | trigger (public.brands) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| set_products_updated_at | trigger (public.products) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| process_inventory_movement_trigger | trigger (public.inventory_movements) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| customers_updated_at | trigger (public.customers) | supabase/customers_schema.sql → supabase/schema/03_customers_crm.sql | Repository-defined only; live Supabase verification unavailable. |
| set_invoices_updated_at | trigger (public.invoices) | supabase/schema_billing.sql → supabase/schema/04_billing.sql | Repository-defined only; live Supabase verification unavailable. |
| set_credit_notes_updated_at | trigger (public.credit_notes) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| set_quotations_updated_at | trigger (public.quotations) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| set_payments_updated_at | trigger (public.payments) | supabase/schema_payments.sql → supabase/schema/06_payments.sql | Repository-defined only; live Supabase verification unavailable. |
| set_purchase_orders_updated_at | trigger (public.purchase_orders) | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| set_purchase_bills_updated_at | trigger (public.purchase_bills) | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| documents_updated_at | trigger (public.documents) | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| templates_updated_at | trigger (public.templates) | supabase/schema_templates.sql (deduplicated) → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |
| set_recurring_invoices_updated_at | trigger (public.recurring_invoices) | supabase/schema_recurring.sql → supabase/schema/10_recurring_operations.sql | Repository-defined only; live Supabase verification unavailable. |
| trigger_ai_conversation_updated | trigger (public.ai_conversations) | supabase/schema_ai_conversations.sql → supabase/schema/11_ai_conversations.sql | Repository-defined only; live Supabase verification unavailable. |

## Row-level security policies

| Object | Type | Source → snapshot | Verification |
|---|---|---|---|
| Users can view their own profile | policy (public.profiles) | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| Users can update their own profile | policy (public.profiles) | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| business: owner select | policy (public.business) | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| business: owner insert | policy (public.business) | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| business: owner update | policy (public.business) | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| categories: owner full access | policy (public.categories) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| suppliers: owner full access | policy (public.suppliers) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| brands: owner full access | policy (public.brands) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| products: owner full access | policy (public.products) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| inventory_movements: owner full access | policy (public.inventory_movements) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| customers_select_own | policy (public.customers) | supabase/customers_schema.sql → supabase/schema/03_customers_crm.sql | Repository-defined only; live Supabase verification unavailable. |
| customers_insert_own | policy (public.customers) | supabase/customers_schema.sql → supabase/schema/03_customers_crm.sql | Repository-defined only; live Supabase verification unavailable. |
| customers_update_own | policy (public.customers) | supabase/customers_schema.sql → supabase/schema/03_customers_crm.sql | Repository-defined only; live Supabase verification unavailable. |
| customers_delete_own | policy (public.customers) | supabase/customers_schema.sql → supabase/schema/03_customers_crm.sql | Repository-defined only; live Supabase verification unavailable. |
| customer_notes_select_own | policy (public.customer_notes) | supabase/customers_schema.sql → supabase/schema/03_customers_crm.sql | Repository-defined only; live Supabase verification unavailable. |
| customer_notes_insert_own | policy (public.customer_notes) | supabase/customers_schema.sql → supabase/schema/03_customers_crm.sql | Repository-defined only; live Supabase verification unavailable. |
| customer_notes_delete_own | policy (public.customer_notes) | supabase/customers_schema.sql → supabase/schema/03_customers_crm.sql | Repository-defined only; live Supabase verification unavailable. |
| Business owner can manage invoices | policy (public.invoices) | supabase/schema_billing.sql → supabase/schema/04_billing.sql | Repository-defined only; live Supabase verification unavailable. |
| Business owner can manage invoice items | policy (public.invoice_items) | supabase/schema_billing.sql → supabase/schema/04_billing.sql | Repository-defined only; live Supabase verification unavailable. |
| credit_notes: owner select | policy (public.credit_notes) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| credit_notes: owner insert | policy (public.credit_notes) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| credit_notes: owner update | policy (public.credit_notes) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| credit_notes: owner delete | policy (public.credit_notes) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| credit_note_items: owner select | policy (public.credit_note_items) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| credit_note_items: owner insert | policy (public.credit_note_items) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| credit_note_items: owner delete | policy (public.credit_note_items) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| quotations: owner select | policy (public.quotations) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| quotations: owner insert | policy (public.quotations) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| quotations: owner update | policy (public.quotations) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| quotations: owner delete | policy (public.quotations) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| quotation_items: owner select | policy (public.quotation_items) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| quotation_items: owner insert | policy (public.quotation_items) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| quotation_items: owner delete | policy (public.quotation_items) | supabase/schema.sql → supabase/schema/05_credit_notes_quotations.sql | Repository-defined only; live Supabase verification unavailable. |
| Business owner can manage payments | policy (public.payments) | supabase/schema_payments.sql → supabase/schema/06_payments.sql | Repository-defined only; live Supabase verification unavailable. |
| Business owner can manage payment allocations | policy (public.payment_allocations) | supabase/schema_payments.sql → supabase/schema/06_payments.sql | Repository-defined only; live Supabase verification unavailable. |
| purchase_orders: owner full access | policy (public.purchase_orders) | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| purchase_order_items: owner full access | policy (public.purchase_order_items) | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| goods_received_notes: owner full access | policy (public.goods_received_notes) | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| goods_received_note_items: owner full access | policy (public.goods_received_note_items) | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| purchase_bills: owner full access | policy (public.purchase_bills) | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| purchase_bill_payments: owner full access | policy (public.purchase_bill_payments) | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| documents_select | policy (public.documents) | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| documents_insert | policy (public.documents) | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| documents_update | policy (public.documents) | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| documents_delete | policy (public.documents) | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| documents_storage_all | policy (storage.objects) | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| templates_select | policy (public.templates) | supabase/schema_templates.sql (deduplicated) → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |
| templates_insert | policy (public.templates) | supabase/schema_templates.sql (deduplicated) → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |
| templates_update | policy (public.templates) | supabase/schema_templates.sql (deduplicated) → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |
| templates_delete | policy (public.templates) | supabase/schema_templates.sql (deduplicated) → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |
| template_logos_select | policy (storage.objects) | supabase/schema_templates.sql (deduplicated) → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |
| template_logos_insert | policy (storage.objects) | supabase/schema_templates.sql (deduplicated) → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |
| template_logos_delete | policy (storage.objects) | supabase/schema_templates.sql (deduplicated) → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |
| Business owner can manage recurring invoices | policy (public.recurring_invoices) | supabase/schema_recurring.sql → supabase/schema/10_recurring_operations.sql | Repository-defined only; live Supabase verification unavailable. |
| Business owner can manage recurring invoice items | policy (public.recurring_invoice_items) | supabase/schema_recurring.sql → supabase/schema/10_recurring_operations.sql | Repository-defined only; live Supabase verification unavailable. |
| Business owners can manage their conversations | policy (public.ai_conversations) | supabase/schema_ai_conversations.sql → supabase/schema/11_ai_conversations.sql | Repository-defined only; live Supabase verification unavailable. |
| Business owners can manage their messages | policy (public.ai_messages) | supabase/schema_ai_conversations.sql → supabase/schema/11_ai_conversations.sql | Repository-defined only; live Supabase verification unavailable. |

## Indexes

| Object | Type | Source → snapshot | Verification |
|---|---|---|---|
| brands_business_name_idx | index (public.brands) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| products_business_sku_idx | index (public.products) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| products_business_barcode_idx | index (public.products) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| inventory_movements_product_idx | index (public.inventory_movements) | supabase/schema.sql → supabase/schema/02_inventory.sql | Repository-defined only; live Supabase verification unavailable. |
| purchase_orders_business_idx | index (public.purchase_orders) | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| purchase_order_items_order_idx | index (public.purchase_order_items) | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| goods_received_notes_order_idx | index (public.goods_received_notes) | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| purchase_bills_business_idx | index (public.purchase_bills) | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| documents_business_id_idx | index (public.documents) | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| documents_business_created_idx | index (public.documents) | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| documents_business_archived_idx | index (public.documents) | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| documents_linked_module_idx | index (public.documents) | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| templates_business_id_idx | index (public.templates) | supabase/schema_templates.sql (deduplicated) → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |
| templates_type_idx | index (public.templates) | supabase/schema_templates.sql (deduplicated) → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |
| templates_default_idx | index (public.templates) | supabase/schema_templates.sql (deduplicated) → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |
| idx_ai_conversations_business | index (public.ai_conversations) | supabase/schema_ai_conversations.sql → supabase/schema/11_ai_conversations.sql | Repository-defined only; live Supabase verification unavailable. |
| idx_ai_messages_conversation | index (public.ai_messages) | supabase/schema_ai_conversations.sql → supabase/schema/11_ai_conversations.sql | Repository-defined only; live Supabase verification unavailable. |

## Other objects

| Object | Type | Source → snapshot | Verification |
|---|---|---|---|
| public.purchase_order_number_seq | sequence | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| public.goods_received_number_seq | sequence | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| public.purchase_bill_number_seq | sequence | supabase/schema_purchase_flow.sql → supabase/schema/07_purchase_flow.sql | Repository-defined only; live Supabase verification unavailable. |
| pgcrypto | extension | supabase/schema_templates.sql (extension) → supabase/schema/00_extensions_and_types.sql | Repository-defined only; live Supabase verification unavailable. |
| grant usage  on schema public to postgres, anon, authenticated, service_role; | schema grant (public) | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| grant create on schema public to postgres, authenticated, service_role; | schema grant (public) | supabase/schema.sql → supabase/schema/01_auth_and_business.sql | Repository-defined only; live Supabase verification unavailable. |
| billing-documents | storage bucket (private, 10 MiB limit) | supabase/schema_documents.sql → supabase/schema/08_documents.sql | Repository-defined only; live Supabase verification unavailable. |
| billing-template-logos | storage bucket (public) | supabase/schema_templates.sql → supabase/schema/09_templates.sql | Repository-defined only; live Supabase verification unavailable. |

## Local SQL sources not duplicated in the snapshot

- supabase/business_schema.sql repeats the business table, shared timestamp function, and owner policies under different policy/trigger names. The canonical snapshot uses the definition in supabase/schema.sql once.
- supabase/schema_brands.sql repeats brands and get_brands_page and also contains a legacy products.brand_id conversion that can drop the old text column. The snapshot uses the current UUID definitions in supabase/schema.sql and excludes this upgrade script.
- supabase/schema_templates.sql repeats pgcrypto and set_updated_at; the generated snapshot keeps each shared definition once.
- No supabase/migrations directory, supabase/config.toml, or generated database type file was found.

Table DDL includes the constraints explicitly declared in the source. Unnamed constraints retain PostgreSQL-assigned names and are not inferred. Supabase-only objects remain unknown.
