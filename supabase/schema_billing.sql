-- ============================================================
-- Nexora — Billing Schema Extension
-- Run AFTER schema.sql in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- Invoices
-- ============================================================
create table if not exists public.invoices (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null,
  customer_id      uuid references public.customers(id) on delete set null,
  invoice_number   text not null,
  invoice_date     date not null default current_date,
  due_date         date,
  status           text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  payment_status   text not null default 'pending'
    check (payment_status in ('paid', 'pending', 'partial', 'overdue')),
  payment_mode     text not null default 'cash',
  amount_paid      numeric(14,2) not null default 0,
  is_inter_state   boolean not null default false,
  place_of_supply  text,
  notes            text,
  internal_notes   text,
  terms            text,
  salesperson      text,
  reference_number text,
  po_number        text,
  delivery_date    date,
  delivery_address text,
  billing_address  text,
  currency         text not null default 'INR',
  exchange_rate    numeric(12,6) not null default 1,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (business_id, invoice_number)
);

alter table public.invoices enable row level security;

drop policy if exists "Business owner can manage invoices" on public.invoices;
create policy "Business owner can manage invoices"
  on public.invoices for all
  using (
    exists (
      select 1 from public.business
      where id = business_id and owner_id = auth.uid()
    )
  );

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
  before update on public.invoices
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Invoice Items
-- ============================================================
create table if not exists public.invoice_items (
  id               uuid primary key default gen_random_uuid(),
  invoice_id       uuid not null references public.invoices(id) on delete cascade,
  product_id       uuid references public.products(id) on delete set null,
  product_name     text not null,
  product_sku      text,
  hsn_code         text,
  quantity         integer not null check (quantity > 0),
  unit_price       numeric(12,2) not null,
  discount_percent numeric(5,2) not null default 0,
  gst_percent      numeric(5,2) not null default 18,
  created_at       timestamptz not null default now()
);

alter table public.invoice_items enable row level security;

drop policy if exists "Business owner can manage invoice items" on public.invoice_items;
create policy "Business owner can manage invoice items"
  on public.invoice_items for all
  using (
    exists (
      select 1
      from   public.invoices inv
      join   public.business b on b.id = inv.business_id
      where  inv.id = invoice_items.invoice_id
        and  b.owner_id = auth.uid()
    )
  );
