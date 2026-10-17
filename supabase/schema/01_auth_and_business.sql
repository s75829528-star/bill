-- Generated, repository-derived schema snapshot.
-- Source: supabase/schema.sql (lines 1-127)
-- Repository evidence only; live Supabase definitions remain unverified.

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
