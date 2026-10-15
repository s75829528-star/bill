-- ============================================================
-- Nexora — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Grant schema access (required for newer Supabase projects)
-- Run this block first if you get "permission denied for schema public":
--   grant usage  on schema public to postgres, anon, authenticated, service_role;
--   grant create on schema public to postgres, authenticated, service_role;
grant usage  on schema public to postgres, anon, authenticated, service_role;
grant create on schema public to postgres, authenticated, service_role;

-- 1. Profiles table
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  avatar_url  text,
  business_name text,
  business_type text,
  is_onboarded  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Row-level security
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Business profile table (one row per user — drives the wizard)
-- ============================================================

create table if not exists public.business (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null unique references auth.users(id) on delete cascade,
  business_name         text,
  business_type         text,
  logo_url              text,
  owner_name            text,
  phone                 text,
  email                 text,
  gst_number            text,
  pan_number            text,
  currency              text not null default 'INR',
  timezone              text not null default 'Asia/Kolkata',
  financial_year        text not null default 'April-March',
  address               text,
  city                  text,
  state                 text,
  country               text not null default 'India',
  postal_code           text,
  invoice_prefix        text not null default 'INV',
  invoice_number_format text not null default 'INV-{YYYY}-{####}',
  tax_enabled           boolean not null default true,
  language              text not null default 'en',
  theme                 text not null default 'light',
  onboarding_completed  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.business enable row level security;

create policy "business: owner select"
  on public.business for select
  using (auth.uid() = owner_id);

create policy "business: owner insert"
  on public.business for insert
  with check (auth.uid() = owner_id);

create policy "business: owner update"
  on public.business for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop trigger if exists set_business_updated_at on public.business;
create trigger set_business_updated_at
  before update on public.business
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Inventory: Categories
-- ============================================================

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  name        text not null,
  description text,
  color       text not null default 'bg-slate-100',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories: owner full access"
  on public.categories for all
  using (
    exists (select 1 from public.business where id = business_id and owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.business where id = business_id and owner_id = auth.uid())
  );

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
  before update on public.categories
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Inventory: Suppliers
-- ============================================================

create table if not exists public.suppliers (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null,
  name               text not null,
  contact_person     text,
  phone              text,
  email              text,
  gst_number         text,
  pan                text,
  city               text,
  address            text,
  state              text,
  pincode            text,
  payment_terms      text,
  lead_time_days     integer not null default 0,
  outstanding_amount numeric(12,2) not null default 0,
  rating             numeric(3,1) not null default 0,
  total_purchases    numeric(14,2) not null default 0,
  products_supplied  integer not null default 0,
  bank_name          text,
  account_number     text,
  ifsc               text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.suppliers enable row level security;

create policy "suppliers: owner full access"
  on public.suppliers for all
  using (
    exists (select 1 from public.business where id = business_id and owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.business where id = business_id and owner_id = auth.uid())
  );

drop trigger if exists set_suppliers_updated_at on public.suppliers;
create trigger set_suppliers_updated_at
  before update on public.suppliers
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Inventory: Products
-- ============================================================

-- Inventory: Brands
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

create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null,
  sku            text not null,
  barcode        text,
  name           text not null,
  description    text,
  category_id    uuid references public.categories(id) on delete set null,
  supplier_id    uuid references public.suppliers(id) on delete set null,
  purchase_price numeric(12,2) not null default 0,
  selling_price  numeric(12,2) not null default 0,
  tax_rate       numeric(5,2) not null default 18,
  unit           text,
  opening_stock  integer not null default 0,
  current_stock  integer not null default 0,
  minimum_stock  integer not null default 0,
  maximum_stock  integer not null default 0,
  status         text not null default 'active'
                   check (status in ('active', 'inactive', 'archived')),
  image_url      text,
  -- Extended fields used by the existing UI
  mrp            numeric(12,2) not null default 0,
  cost_price     numeric(12,2) not null default 0,
  hsn_code       text,
  brand_id       uuid,
  unit_id        text,
  reorder_qty    integer not null default 0,
  lead_time_days integer not null default 0,
  weight         numeric(8,3),
  dimensions     jsonb,
  color          text,
  size           text,
  material       text,
  subcategory    text,
  manufacturer   text,
  internal_notes text,
  tags           text[],
  emoji          text not null default '📦',
  foreign key (brand_id, business_id)
    references public.brands(id, business_id) on delete restrict,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Unique SKU per business
create unique index if not exists products_business_sku_idx
  on public.products (business_id, sku);

-- Unique non-empty barcode per business
create unique index if not exists products_business_barcode_idx
  on public.products (business_id, barcode)
  where barcode is not null and barcode <> '';

alter table public.products enable row level security;

create policy "products: owner full access"
  on public.products for all
  using (
    exists (select 1 from public.business where id = business_id and owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.business where id = business_id and owner_id = auth.uid())
  );

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- Paginated brand listing with database-side search, filters, sorting,
-- and product counts. The function is invoker-security by default, so
-- brands/products RLS remains in force for authenticated callers.
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

-- ============================================================
-- Inventory: Movements
-- ============================================================

create table if not exists public.inventory_movements (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null,
  product_id        uuid not null references public.products(id) on delete cascade,
  movement_type     text not null check (movement_type in ('in', 'out', 'adjustment')),
  adjustment_type   text check (adjustment_type in ('increase', 'decrease')),
  adjustment_reason text,
  quantity          integer not null check (quantity > 0),
  previous_stock    integer not null default 0,
  new_stock         integer not null default 0,
  reference         text,
  supplier_id       uuid references public.suppliers(id) on delete set null,
  reason            text,
  notes             text,
  created_by        text,
  created_at        timestamptz not null default now()
);

alter table public.inventory_movements enable row level security;

create policy "inventory_movements: owner full access"
  on public.inventory_movements for all
  using (
    exists (select 1 from public.business where id = business_id and owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.business where id = business_id and owner_id = auth.uid())
  );

-- Index: fast lookup by product
create index if not exists inventory_movements_product_idx
  on public.inventory_movements (business_id, product_id, created_at desc);

-- ── Trigger: auto-update product stock on every movement ─────────

create or replace function public.process_inventory_movement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_current_stock integer;
  v_net_change    integer;
  v_new_stock     integer;
begin
  -- Lock the product row and read current stock
  select current_stock into v_current_stock
  from public.products where id = new.product_id for update;

  -- Compute net change based on movement type
  if new.movement_type = 'in' then
    v_net_change := new.quantity;
  elsif new.movement_type = 'out' then
    v_net_change := -new.quantity;
  elsif new.movement_type = 'adjustment' then
    if new.adjustment_type = 'increase' then
      v_net_change := new.quantity;
    else
      v_net_change := -new.quantity;
    end if;
  else
    v_net_change := 0;
  end if;

  v_new_stock := v_current_stock + v_net_change;

  -- Prevent negative stock
  if v_new_stock < 0 then
    raise exception 'Insufficient stock. Current: %, requested to remove: %',
      v_current_stock, new.quantity
      using errcode = 'insufficient_stock';
  end if;

  -- Stamp previous / new stock on the movement row before it is written
  new.previous_stock := v_current_stock;
  new.new_stock      := v_new_stock;

  -- Update product stock
  update public.products set current_stock = v_new_stock where id = new.product_id;

  return new;
end;
$$;

drop trigger if exists process_inventory_movement_trigger on public.inventory_movements;
create trigger process_inventory_movement_trigger
  before insert on public.inventory_movements
  for each row execute function public.process_inventory_movement();

-- ============================================================
-- Credit Notes
-- ============================================================

create table if not exists public.credit_notes (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references public.business(id) on delete cascade,
  credit_note_number text not null,
  credit_note_date   date not null default current_date,
  invoice_id         uuid,  -- soft reference to invoices.id (no FK to avoid ordering issues)
  customer_id        uuid references public.customers(id) on delete set null,
  reason             text not null default '',
  notes              text,
  status             text not null default 'draft'
                     check (status in ('draft','issued','applied','voided')),
  subtotal           numeric(14,2) not null default 0,
  discount_total     numeric(14,2) not null default 0,
  tax_total          numeric(14,2) not null default 0,
  grand_total        numeric(14,2) not null default 0,
  created_by         uuid references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.credit_notes enable row level security;

create policy "credit_notes: owner select"
  on public.credit_notes for select
  using (exists (
    select 1 from public.business where id = business_id and owner_id = auth.uid()
  ));

create policy "credit_notes: owner insert"
  on public.credit_notes for insert
  with check (exists (
    select 1 from public.business where id = business_id and owner_id = auth.uid()
  ));

create policy "credit_notes: owner update"
  on public.credit_notes for update
  using (exists (
    select 1 from public.business where id = business_id and owner_id = auth.uid()
  ));

create policy "credit_notes: owner delete"
  on public.credit_notes for delete
  using (exists (
    select 1 from public.business where id = business_id and owner_id = auth.uid()
  ));

drop trigger if exists set_credit_notes_updated_at on public.credit_notes;
create trigger set_credit_notes_updated_at
  before update on public.credit_notes
  for each row execute procedure public.set_updated_at();

-- Credit Note Line Items

create table if not exists public.credit_note_items (
  id                uuid primary key default gen_random_uuid(),
  credit_note_id    uuid not null references public.credit_notes(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  product_name      text not null,
  product_sku       text,
  quantity          numeric(10,3) not null default 1 check (quantity > 0),
  unit_price        numeric(14,2) not null default 0 check (unit_price >= 0),
  discount_percent  numeric(5,2) not null default 0,
  gst_percent       numeric(5,2) not null default 0,
  created_at        timestamptz not null default now()
);

alter table public.credit_note_items enable row level security;

create policy "credit_note_items: owner select"
  on public.credit_note_items for select
  using (exists (
    select 1 from public.credit_notes cn
    join public.business b on b.id = cn.business_id
    where cn.id = credit_note_id and b.owner_id = auth.uid()
  ));

create policy "credit_note_items: owner insert"
  on public.credit_note_items for insert
  with check (exists (
    select 1 from public.credit_notes cn
    join public.business b on b.id = cn.business_id
    where cn.id = credit_note_id and b.owner_id = auth.uid()
  ));

create policy "credit_note_items: owner delete"
  on public.credit_note_items for delete
  using (exists (
    select 1 from public.credit_notes cn
    join public.business b on b.id = cn.business_id
    where cn.id = credit_note_id and b.owner_id = auth.uid()
  ));

-- ============================================================
-- Quotations
-- ============================================================

create table if not exists public.quotations (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references public.business(id) on delete cascade,
  quote_number         text not null,
  quote_date           date not null default current_date,
  expiry_date          date,
  customer_id          uuid references public.customers(id) on delete set null,
  billing_address      text,
  status               text not null default 'draft'
                       check (status in ('draft','sent','approved','rejected','expired','converted')),
  subtotal             numeric(14,2) not null default 0,
  discount_total       numeric(14,2) not null default 0,
  tax_total            numeric(14,2) not null default 0,
  grand_total          numeric(14,2) not null default 0,
  notes                text,
  internal_notes       text,
  terms                text,
  converted_invoice_id uuid,  -- soft reference to invoices.id (no FK to avoid ordering issues)
  created_by           uuid references auth.users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.quotations enable row level security;

create policy "quotations: owner select"
  on public.quotations for select
  using (exists (
    select 1 from public.business where id = business_id and owner_id = auth.uid()
  ));

create policy "quotations: owner insert"
  on public.quotations for insert
  with check (exists (
    select 1 from public.business where id = business_id and owner_id = auth.uid()
  ));

create policy "quotations: owner update"
  on public.quotations for update
  using (exists (
    select 1 from public.business where id = business_id and owner_id = auth.uid()
  ));

create policy "quotations: owner delete"
  on public.quotations for delete
  using (exists (
    select 1 from public.business where id = business_id and owner_id = auth.uid()
  ));

drop trigger if exists set_quotations_updated_at on public.quotations;
create trigger set_quotations_updated_at
  before update on public.quotations
  for each row execute procedure public.set_updated_at();

-- Quotation Line Items

create table if not exists public.quotation_items (
  id               uuid primary key default gen_random_uuid(),
  quotation_id     uuid not null references public.quotations(id) on delete cascade,
  product_id       uuid references public.products(id) on delete set null,
  product_name     text not null,
  product_sku      text,
  quantity         numeric(10,3) not null default 1 check (quantity > 0),
  unit_price       numeric(14,2) not null default 0 check (unit_price >= 0),
  discount_percent numeric(5,2) not null default 0,
  gst_percent      numeric(5,2) not null default 0,
  created_at       timestamptz not null default now()
);

alter table public.quotation_items enable row level security;

create policy "quotation_items: owner select"
  on public.quotation_items for select
  using (exists (
    select 1 from public.quotations q
    join public.business b on b.id = q.business_id
    where q.id = quotation_id and b.owner_id = auth.uid()
  ));

create policy "quotation_items: owner insert"
  on public.quotation_items for insert
  with check (exists (
    select 1 from public.quotations q
    join public.business b on b.id = q.business_id
    where q.id = quotation_id and b.owner_id = auth.uid()
  ));

create policy "quotation_items: owner delete"
  on public.quotation_items for delete
  using (exists (
    select 1 from public.quotations q
    join public.business b on b.id = q.business_id
    where q.id = quotation_id and b.owner_id = auth.uid()
  ));
