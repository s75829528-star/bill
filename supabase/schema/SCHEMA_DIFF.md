# Schema diff status

## Comparison result

A live Supabase schema dump was not available in this workspace. This report does not claim a live diff or a complete database inventory.

| Category | Result |
|---|---|
| Verified matching definitions | None; no live comparison was performed. |
| Objects present in Supabase but absent from the prior local SQL | Unknown until a read-only live dump is supplied. |
| Locally defined objects absent from Supabase | Unknown until a read-only live dump is supplied. |
| Objects whose definitions could not be verified | All repository-derived objects and Supabase-managed objects outside the inspected local SQL. |

The repository contains 11 original SQL files. The canonical local snapshot represents 29 unique tables, 10 functions, 19 triggers, 57 policies, 17 explicit indexes, 3 sequences, 1 extension, 2 storage buckets, and 2 schema grants. These counts describe local source definitions only, not the deployed database.

## Known local-source overlaps

- `supabase/business_schema.sql` is an alternate business-table definition and repeats timestamp and owner-policy setup from `supabase/schema.sql`.
- `supabase/schema_brands.sql` repeats the brands table and `get_brands_page` function, and includes a legacy `products.brand_id` type conversion that can drop the old text column. It remains unchanged and is excluded from the canonical snapshot.
- `supabase/schema_templates.sql` repeats the `pgcrypto` extension and `set_updated_at()` function. The generated snapshot defines each shared object once.

## Read-only verification needed

See `README.md` for the Supabase CLI schema-dump command and `LIVE_SCHEMA_AUDIT.sql` for `SELECT`-only catalog queries. Compare those results before marking any local object as matching or absent.
