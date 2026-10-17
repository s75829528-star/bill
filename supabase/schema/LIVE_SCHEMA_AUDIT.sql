-- Read-only catalog inspection for Nexora.
-- Every statement below is SELECT-only. Run in the Supabase SQL Editor.
-- Results may include Supabase-managed objects; distinguish those from app-owned objects.

-- Public table columns, defaults, nullability, identity, and generated expressions.
select
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default,
  is_identity,
  identity_generation,
  is_generated,
  generation_expression
from information_schema.columns
where table_schema = 'public'
order by table_schema, table_name, ordinal_position;

-- Primary, foreign, unique, check, and exclusion constraints for public tables.
select
  n.nspname as schema_name,
  c.relname as table_name,
  con.conname as constraint_name,
  con.contype as constraint_type,
  pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname, con.conname;

-- Index definitions.
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- Views and materialized views.
select schemaname, viewname as object_name, definition
from pg_views
where schemaname = 'public'
union all
select schemaname, matviewname as object_name, definition
from pg_matviews
where schemaname = 'public'
order by schemaname, object_name;

-- Application functions and procedures in public, with exact definitions.
select
  n.nspname as schema_name,
  p.proname as routine_name,
  p.prokind as routine_kind,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind in ('f', 'p')
order by p.proname, arguments;

-- User-defined triggers on public tables and the application trigger on auth.users.
select
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid, true) as definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal
  and (
    n.nspname = 'public'
    or (n.nspname = 'auth' and c.relname = 'users')
  )
order by n.nspname, c.relname, t.tgname;

-- RLS enabled/forced flags for public tables.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

-- Policies, including application policies on Supabase Storage.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- User-defined enum and domain types in public.
select
  n.nspname as schema_name,
  t.typname as type_name,
  t.typtype as type_kind,
  e.enumlabel,
  e.enumsortorder
from pg_type t
join pg_namespace n on n.oid = t.typnamespace
left join pg_enum e on e.enumtypid = t.oid
where n.nspname = 'public'
  and t.typtype in ('e', 'd')
order by t.typname, e.enumsortorder;

-- Sequence definitions and attributes; does not return current sequence values.
select
  sequence_schema,
  sequence_name,
  data_type,
  start_value,
  minimum_value,
  maximum_value,
  increment,
  cycle_option
from information_schema.sequences
where sequence_schema = 'public'
order by sequence_name;

-- Installed extensions and their schemas/versions.
select e.extname, n.nspname as schema_name, e.extversion
from pg_extension e
join pg_namespace n on n.oid = e.extnamespace
order by e.extname;

-- Table-level grants on public tables.
select table_schema, table_name, grantee, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
order by table_name, grantee, privilege_type;

-- Schema-level grants for schemas relevant to the application.
select
  n.nspname as schema_name,
  coalesce(r.rolname, 'PUBLIC') as grantee,
  a.privilege_type,
  a.is_grantable
from pg_namespace n
cross join lateral aclexplode(
  coalesce(n.nspacl, acldefault('n', n.nspowner))
) as a
left join pg_roles r on r.oid = a.grantee
where n.nspname in ('public', 'auth', 'storage')
order by n.nspname, grantee, a.privilege_type;

-- Storage bucket configuration.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;
