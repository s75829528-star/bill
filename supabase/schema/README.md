# Nexora SQL schema snapshot

## Scope and verification status

This directory is a repository-derived snapshot assembled from the existing SQL files. A live Supabase catalog connection was not available, so none of these definitions has been verified against the deployed database. Do not treat this snapshot as the complete production schema or as migration history.

The original SQL files in `supabase/` are unchanged. The duplicate business and brand-upgrade scripts are documented in `SCHEMA_INVENTORY.md` and are not duplicated in this canonical snapshot.

## Files and dependency order

Use this order only in a disposable, isolated Supabase/PostgreSQL test database:

1. `00_extensions_and_types.sql` — `pgcrypto`; no custom SQL types were found in the local files.
2. `01_auth_and_business.sql` — profile/auth trigger, business table, shared timestamp function, policies, and schema grants.
3. `02_inventory.sql` — categories, suppliers, brands, products, inventory movements, brand paging function, and stock trigger.
4. `03_customers_crm.sql` — customers and customer notes.
5. `04_billing.sql` — invoices and invoice items.
6. `05_credit_notes_quotations.sql` — credit notes/items and quotations/items.
7. `06_payments.sql` — payments and allocations; depends on invoices and customers.
8. `07_purchase_flow.sql` — purchase orders, receipts, supplier bills/payments, sequences, and RPCs; depends on business and inventory tables.
9. `08_documents.sql` — document metadata, storage bucket, and storage policy.
10. `09_templates.sql` — templates and logo bucket/policies; uses the shared `set_updated_at()` function.
11. `10_recurring_operations.sql` — recurring invoices/items; depends on billing, customers, and products.
12. `11_ai_conversations.sql` — conversations/messages; depends on business.

This is a dependency order, not a promise that the files can be replayed over an existing database. Some source policies are created without `DROP POLICY IF EXISTS`, and the snapshot includes grants and storage-bucket inserts.

## Safety

- No generated SQL was run against Supabase or production.
- Do not execute these files against the live project as an import or recovery step.
- Run execution checks only against a new isolated test database. Do not reset or drop the existing Supabase project.
- Keep any live schema dump private and out of commits if it exposes internal schema or security details.
- A schema snapshot does not replace the original migration history.

## Read-only live schema retrieval

The repository has no linked Supabase CLI project or migration directory, and no live database connection was available here. On a trusted machine with the Supabase CLI, authenticate and link the intended project, then dump only the `public` schema:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db dump --linked --schema public --file supabase/schema/live-public-schema.sql
```

Replace `YOUR_PROJECT_REF` before running. Do not put a database password, access token, or service-role key in a command, SQL file, or repository. The dump reads the remote schema and writes the result locally; it does not apply schema changes or dump table rows.

For storage bucket settings, storage policies, RLS flags, routine definitions, and other catalog metadata, run the `SELECT`-only statements in `LIVE_SCHEMA_AUDIT.sql` in the Supabase SQL Editor. The resulting dump and query output are required before `SCHEMA_DIFF.md` can be completed.

## Validation performed

The snapshot was assembled from local SQL source files and statically inventoried. Definitions were not executed or validated by a PostgreSQL server: no isolated database, Supabase project configuration, or migration setup is present in the repository. Therefore, this snapshot is not certified to recreate the live database.
