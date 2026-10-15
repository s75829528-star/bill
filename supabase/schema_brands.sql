-- Nexora Inventory Brands upgrade
-- Run after the existing schema.sql in the Supabase SQL editor.
--
-- This script is safe for databases where the brands table is absent.
-- Existing non-UUID product brand IDs cannot be mapped to database brands,
-- so they are cleared rather than causing the migration to fail.

create table if not exists public.brands (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.business(id) on delete cascade,
  name         text not null,
  description  text,
  logo_url     text,
  logo_initial text,
  logo_color   text not null default 'bg-blue-500',
  website      text,
  status       text not null default 'active'
                 check (status in ('active', 'inactive')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, business_id)
);

alter table public.brands add column if not exists logo_initial text;
alter table public.brands add column if not exists logo_color text not null default 'bg-blue-500';
alter table public.brands add column if not exists logo_url text;
alter table public.brands add column if not exists website text;
alter table public.brands add column if not exists status text not null default 'active';
alter table public.brands add column if not exists created_at timestamptz not null default now();
alter table public.brands add column if not exists updated_at timestamptz not null default now();

create unique index if not exists brands_business_name_idx
  on public.brands (business_id, lower(name));

alter table public.brands enable row level security;
drop policy if exists "brands: owner full access" on public.brands;
create policy "brands: owner full access"
  on public.brands for all
  using (
    exists (select 1 from public.business where id = business_id and owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.business where id = business_id and owner_id = auth.uid())
  );

drop trigger if exists set_brands_updated_at on public.brands;
create trigger set_brands_updated_at
  before update on public.brands
  for each row execute procedure public.set_updated_at();

-- Convert the old text brand_id column to UUID without attempting to cast
-- arbitrary legacy/mock identifiers such as "b1".
do $$
declare
  brand_id_type text;
begin
  select udt_name into brand_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'products'
    and column_name = 'brand_id';

  if brand_id_type = 'text' then
    alter table public.products add column if not exists brand_id_uuid uuid;
    update public.products
    set brand_id_uuid = brand_id::uuid
    where brand_id is not null
      and brand_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
    alter table public.products drop column brand_id;
    alter table public.products rename column brand_id_uuid to brand_id;
  elsif brand_id_type is null then
    alter table public.products add column brand_id uuid;
  end if;
end $$;

alter table public.products drop constraint if exists products_brand_id_fkey;
alter table public.products drop constraint if exists products_brand_business_fkey;
alter table public.products
  add constraint products_brand_business_fkey
  foreign key (brand_id, business_id)
  references public.brands(id, business_id)
  on delete restrict;

create or replace function public.get_brands_page(
  p_business_id uuid,
  p_search text default null,
  p_status text default null,
  p_has_products boolean default null,
  p_created_from timestamptz default null,
  p_sort_by text default 'name',
  p_sort_direction text default 'asc',
  p_page integer default 1,
  p_page_size integer default 8
)
returns table (
  id uuid,
  business_id uuid,
  name text,
  description text,
  logo_url text,
  logo_initial text,
  logo_color text,
  website text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  product_count bigint,
  total_count bigint
)
language sql
stable
as $$
  with grouped as (
    select
      br.id,
      br.business_id,
      br.name,
      br.description,
      br.logo_url,
      br.logo_initial,
      br.logo_color,
      br.website,
      br.status,
      br.created_at,
      br.updated_at,
      count(pr.id)::bigint as product_count
    from public.brands br
    left join public.products pr
      on pr.brand_id = br.id
     and pr.business_id = br.business_id
    where br.business_id = p_business_id
      and (p_search is null or (
        br.name ilike '%' || trim(p_search) || '%'
        or coalesce(br.description, '') ilike '%' || trim(p_search) || '%'
      ))
      and (p_status is null or br.status = p_status)
      and (p_created_from is null or br.created_at >= p_created_from)
    group by br.id
    having p_has_products is null or ((count(pr.id) > 0) = p_has_products)
  ),
  counted as (
    select grouped.*, count(*) over ()::bigint as total_count
    from grouped
  )
  select *
  from counted
  order by
    case when p_sort_by = 'name' and p_sort_direction = 'asc' then name end asc,
    case when p_sort_by = 'name' and p_sort_direction = 'desc' then name end desc,
    case when p_sort_by = 'created_at' and p_sort_direction = 'asc' then created_at end asc,
    case when p_sort_by = 'created_at' and p_sort_direction = 'desc' then created_at end desc,
    case when p_sort_by = 'updated_at' and p_sort_direction = 'asc' then updated_at end asc,
    case when p_sort_by = 'updated_at' and p_sort_direction = 'desc' then updated_at end desc,
    case when p_sort_by = 'product_count' and p_sort_direction = 'asc' then product_count end asc,
    case when p_sort_by = 'product_count' and p_sort_direction = 'desc' then product_count end desc,
    name asc
  limit greatest(1, least(100, p_page_size))
  offset greatest(0, p_page - 1) * greatest(1, least(100, p_page_size));
$$;