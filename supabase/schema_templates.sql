-- ── Billing Templates ─────────────────────────────────────────────
-- Run this in the Supabase SQL Editor.

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";

-- ── templates table ────────────────────────────────────────────────
create table if not exists public.templates (
  id                   uuid primary key default gen_random_uuid(),
  business_id          uuid not null references public.business(id) on delete cascade,
  template_name        text not null,
  template_type        text not null,                          -- 'gst_invoice' | 'quotation' | 'credit_note' | 'payment_receipt' | 'purchase_order' | 'delivery_challan' | 'proforma_invoice' | 'debit_note'
  header_text          text,
  footer_text          text,
  terms_conditions     text,
  logo_url             text,
  primary_color        text not null default '#2563eb',
  secondary_color      text not null default '#f8fafc',
  font_family          text not null default 'inter',
  show_logo            boolean not null default true,
  show_signature       boolean not null default false,
  show_qr_code         boolean not null default false,
  show_payment_details boolean not null default true,
  show_bank_details    boolean not null default false,
  is_default           boolean not null default false,
  status               text not null default 'active',         -- 'active' | 'inactive'
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ── updated_at trigger ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists templates_updated_at on public.templates;
create trigger templates_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────
alter table public.templates enable row level security;

-- Business owner can read their own templates
create policy "templates_select" on public.templates
  for select using (
    exists (
      select 1 from public.business
      where id = business_id and owner_id = auth.uid()
    )
  );

-- Business owner can insert templates for their business
create policy "templates_insert" on public.templates
  for insert with check (
    exists (
      select 1 from public.business
      where id = business_id and owner_id = auth.uid()
    )
  );

-- Business owner can update their own templates
create policy "templates_update" on public.templates
  for update using (
    exists (
      select 1 from public.business
      where id = business_id and owner_id = auth.uid()
    )
  );

-- Business owner can delete their own templates
create policy "templates_delete" on public.templates
  for delete using (
    exists (
      select 1 from public.business
      where id = business_id and owner_id = auth.uid()
    )
  );

-- ── Indexes ────────────────────────────────────────────────────────
create index if not exists templates_business_id_idx on public.templates(business_id);
create index if not exists templates_type_idx on public.templates(template_type);
create index if not exists templates_default_idx on public.templates(business_id, template_type, is_default)
  where is_default = true;

-- ── Storage bucket for template logos ─────────────────────────────
-- Run in Supabase Dashboard → Storage → New bucket:
--   Name: billing-template-logos
--   Public: true (so logo URLs work in PDF previews)
-- Or via SQL:
insert into storage.buckets (id, name, public)
  values ('billing-template-logos', 'billing-template-logos', true)
  on conflict (id) do nothing;

-- Storage RLS: allow authenticated users to manage files in their own folder
create policy "template_logos_select" on storage.objects
  for select using (bucket_id = 'billing-template-logos');

create policy "template_logos_insert" on storage.objects
  for insert with check (
    bucket_id = 'billing-template-logos' and auth.role() = 'authenticated'
  );

create policy "template_logos_delete" on storage.objects
  for delete using (
    bucket_id = 'billing-template-logos' and auth.role() = 'authenticated'
  );
