-- ── Documents ──────────────────────────────────────────────────────
-- Stores metadata for files uploaded to the billing-documents storage bucket.
-- File path pattern: {business_id}/{document_id}/{sanitized_file_name}
--
-- Run this in the Supabase SQL Editor for project mcjuscqaqvaqbpbgmwoh

-- ── Table ──────────────────────────────────────────────────────────
create table if not exists public.documents (
  id               uuid        primary key default gen_random_uuid(),
  business_id      uuid        not null references public.business(id) on delete cascade,
  document_name    text        not null,
  document_type    text        not null default 'Other',
  file_name        text        not null,
  file_path        text        not null unique,
  file_size        bigint      not null default 0,
  mime_type        text        not null default 'application/octet-stream',
  linked_module    text,           -- 'invoices' | 'quotations' | 'credit_notes' | 'payments' | 'customers' | 'products'
  linked_record_id text,
  uploaded_by      uuid        references auth.users(id),
  uploaded_by_email text,          -- stored at upload time for easy display
  is_archived      boolean     not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Indices ────────────────────────────────────────────────────────
create index if not exists documents_business_id_idx
  on public.documents (business_id);

create index if not exists documents_business_created_idx
  on public.documents (business_id, created_at desc);

create index if not exists documents_business_archived_idx
  on public.documents (business_id, is_archived);

create index if not exists documents_linked_module_idx
  on public.documents (business_id, linked_module);

-- ── Row Level Security ─────────────────────────────────────────────
alter table public.documents enable row level security;

create policy "documents_select"
  on public.documents for select
  using (
    exists (
      select 1 from public.business
      where id = business_id and owner_id = auth.uid()
    )
  );

create policy "documents_insert"
  on public.documents for insert
  with check (
    exists (
      select 1 from public.business
      where id = business_id and owner_id = auth.uid()
    )
  );

create policy "documents_update"
  on public.documents for update
  using (
    exists (
      select 1 from public.business
      where id = business_id and owner_id = auth.uid()
    )
  );

create policy "documents_delete"
  on public.documents for delete
  using (
    exists (
      select 1 from public.business
      where id = business_id and owner_id = auth.uid()
    )
  );

-- ── Updated-at trigger ─────────────────────────────────────────────
create or replace function public.documents_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists documents_updated_at on public.documents;
create trigger documents_updated_at
  before update on public.documents
  for each row execute procedure public.documents_set_updated_at();

-- ── Storage bucket ─────────────────────────────────────────────────
-- Creates the billing-documents bucket (private, 10 MB limit)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'billing-documents',
  'billing-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'application/zip'
  ]
)
on conflict (id) do nothing;

-- ── Storage RLS ────────────────────────────────────────────────────
-- Path = {business_id}/{document_id}/{file_name}
-- split_part(name, '/', 1) extracts the business_id prefix
create policy "documents_storage_all"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'billing-documents'
    and exists (
      select 1 from public.business
      where id::text = split_part(name, '/', 1)
      and owner_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'billing-documents'
    and exists (
      select 1 from public.business
      where id::text = split_part(name, '/', 1)
      and owner_id = auth.uid()
    )
  );
