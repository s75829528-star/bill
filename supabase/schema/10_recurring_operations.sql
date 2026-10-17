-- Generated, repository-derived schema snapshot.
-- Source: supabase/schema_recurring.sql
-- Repository evidence only; live Supabase definitions remain unverified.

-- ============================================================
-- Nexora — Recurring Invoices Schema
-- Run in the Supabase SQL Editor after schema_billing.sql
-- ============================================================

-- ============================================================
-- Recurring Invoices
-- ============================================================
create table if not exists public.recurring_invoices (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null,
  series_number        text not null,
  template_name        text not null,
  customer_id          uuid references public.customers(id) on delete set null,
  frequency            text not null default 'monthly'
    check (frequency in ('daily','weekly','monthly','quarterly','half-yearly','yearly','custom')),
  custom_interval_days integer,
  start_date           date not null default current_date,
  end_date             date,
  next_billing_date    date not null,
  last_generated_date  date,
  status               text not null default 'active'
    check (status in ('active','paused','completed','cancelled','expired')),
  currency             text not null default 'INR',
  notes                text,
  terms                text,
  invoices_generated   integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (business_id, series_number)
);

alter table public.recurring_invoices enable row level security;

drop policy if exists "Business owner can manage recurring invoices" on public.recurring_invoices;
create policy "Business owner can manage recurring invoices"
  on public.recurring_invoices for all
  using (
    exists (
      select 1 from public.business
      where id = business_id and owner_id = auth.uid()
    )
  );

drop trigger if exists set_recurring_invoices_updated_at on public.recurring_invoices;
create trigger set_recurring_invoices_updated_at
  before update on public.recurring_invoices
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Recurring Invoice Items
-- ============================================================
create table if not exists public.recurring_invoice_items (
  id                    uuid primary key default gen_random_uuid(),
  recurring_invoice_id  uuid not null references public.recurring_invoices(id) on delete cascade,
  product_id            uuid references public.products(id) on delete set null,
  product_name          text not null,
  product_sku           text,
  hsn_code              text,
  quantity              numeric(10,3) not null default 1 check (quantity > 0),
  unit_price            numeric(12,2) not null default 0 check (unit_price >= 0),
  discount_percent      numeric(5,2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  gst_percent           numeric(5,2) not null default 18 check (gst_percent >= 0),
  created_at            timestamptz not null default now()
);

alter table public.recurring_invoice_items enable row level security;

drop policy if exists "Business owner can manage recurring invoice items" on public.recurring_invoice_items;
create policy "Business owner can manage recurring invoice items"
  on public.recurring_invoice_items for all
  using (
    exists (
      select 1
      from   public.recurring_invoices ri
      join   public.business b on b.id = ri.business_id
      where  ri.id = recurring_invoice_id
        and  b.owner_id = auth.uid()
    )
  );
