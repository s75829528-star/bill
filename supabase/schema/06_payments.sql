-- Generated, repository-derived schema snapshot.
-- Source: supabase/schema_payments.sql
-- Repository evidence only; live Supabase definitions remain unverified.

-- ============================================================
-- Nexora — Payments Schema
-- Run in the Supabase SQL Editor after schema_billing.sql
-- ============================================================

-- ============================================================
-- Payments
-- ============================================================
create table if not exists public.payments (
  id                uuid primary key default gen_random_uuid(),
  business_id       uuid not null,
  payment_number    text not null,
  invoice_id        uuid references public.invoices(id) on delete set null,
  customer_id       uuid references public.customers(id) on delete set null,
  amount            numeric(14,2) not null check (amount > 0),
  mode              text not null default 'cash',
  status            text not null default 'received'
    check (status in ('received','pending','refunded','cancelled','voided','failed','completed')),
  payment_date      date not null default current_date,
  transaction_ref   text,
  notes             text,
  currency          text not null default 'INR',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (business_id, payment_number)
);

alter table public.payments enable row level security;

drop policy if exists "Business owner can manage payments" on public.payments;
create policy "Business owner can manage payments"
  on public.payments for all
  using (
    exists (
      select 1 from public.business
      where id = business_id and owner_id = auth.uid()
    )
  );

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
  before update on public.payments
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Payment Allocations (allows one payment to cover many invoices)
-- ============================================================
create table if not exists public.payment_allocations (
  id               uuid primary key default gen_random_uuid(),
  payment_id       uuid not null references public.payments(id) on delete cascade,
  invoice_id       uuid not null references public.invoices(id) on delete cascade,
  amount_allocated numeric(14,2) not null check (amount_allocated > 0),
  created_at       timestamptz not null default now()
);

alter table public.payment_allocations enable row level security;

drop policy if exists "Business owner can manage payment allocations" on public.payment_allocations;
create policy "Business owner can manage payment allocations"
  on public.payment_allocations for all
  using (
    exists (
      select 1
      from   public.payments p
      join   public.business b on b.id = p.business_id
      where  p.id = payment_id
        and  b.owner_id = auth.uid()
    )
  );
