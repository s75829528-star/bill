-- ─────────────────────────────────────────────────────────────────
-- Nexora — Business table
-- Run this in your Supabase SQL Editor after schema.sql
-- ─────────────────────────────────────────────────────────────────

create table if not exists public.business (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references auth.users(id) on delete cascade,

  -- Business Info
  business_name         text,
  business_type         text,
  logo_url              text,

  -- Owner Details
  owner_name            text,
  phone                 text,
  email                 text,

  -- Business Details
  gst_number            text,
  pan_number            text,
  currency              text not null default 'INR',
  timezone              text not null default 'Asia/Kolkata',
  financial_year        text not null default 'April-March',

  -- Address
  address               text,
  city                  text,
  state                 text,
  country               text not null default 'India',
  postal_code           text,

  -- Preferences
  invoice_prefix        text not null default 'INV',
  invoice_number_format text not null default 'INV-{YYYY}-{####}',
  tax_enabled           boolean not null default true,
  language              text not null default 'en',
  theme                 text not null default 'light',

  -- Onboarding flag
  onboarding_completed  boolean not null default false,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- One business record per user
  unique(owner_id)
);

-- ── Row Level Security ───────────────────────────────────────────
alter table public.business enable row level security;

create policy "business_select_own"
  on public.business for select
  using (auth.uid() = owner_id);

create policy "business_insert_own"
  on public.business for insert
  with check (auth.uid() = owner_id);

create policy "business_update_own"
  on public.business for update
  using (auth.uid() = owner_id);

-- ── updated_at trigger ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists business_updated_at on public.business;
create trigger business_updated_at
  before update on public.business
  for each row execute function public.set_updated_at();
