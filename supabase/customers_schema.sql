-- ─────────────────────────────────────────────────────────────────
-- Nexora — Customers table
-- Run in Supabase SQL Editor after schema.sql and business_schema.sql
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.customers (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.business(id) on delete cascade,

  -- Identity
  customer_code    text not null,
  name             text not null,
  company_name     text,
  contact_person   text,

  -- Contact
  email            text,
  phone            text not null default '',

  -- Tax IDs
  gst_number       text,
  pan_number       text,

  -- Address
  address          text,
  shipping_address text,
  city             text,
  state            text,
  country          text not null default 'India',
  postal_code      text,

  -- Financials
  credit_limit     numeric not null default 0,
  credit_days      integer not null default 30,
  opening_balance  numeric not null default 0,

  -- CRM metadata
  customer_group   text not null default 'Retail',
  status           text not null default 'active',
  rating           integer not null default 3 check (rating between 1 and 5),

  notes            text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- One unique code per business
  unique(business_id, customer_code)
);

-- ── Row Level Security ───────────────────────────────────────────
alter table public.customers enable row level security;

create policy "customers_select_own"
  on public.customers for select
  using (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

create policy "customers_insert_own"
  on public.customers for insert
  with check (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

create policy "customers_update_own"
  on public.customers for update
  using (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

create policy "customers_delete_own"
  on public.customers for delete
  using (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

-- ── updated_at trigger ───────────────────────────────────────────
drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- Customer Notes
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.customer_notes (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  text        text not null,
  author      text not null default 'You',
  created_at  timestamptz not null default now()
);

alter table public.customer_notes enable row level security;

create policy "customer_notes_select_own"
  on public.customer_notes for select
  using (
    customer_id in (
      select id from public.customers
      where business_id = (select id from public.business where owner_id = auth.uid() limit 1)
    )
  );

create policy "customer_notes_insert_own"
  on public.customer_notes for insert
  with check (
    customer_id in (
      select id from public.customers
      where business_id = (select id from public.business where owner_id = auth.uid() limit 1)
    )
  );

create policy "customer_notes_delete_own"
  on public.customer_notes for delete
  using (
    customer_id in (
      select id from public.customers
      where business_id = (select id from public.business where owner_id = auth.uid() limit 1)
    )
  );
