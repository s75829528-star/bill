-- Generated, repository-derived schema snapshot.
-- Source: supabase/schema.sql (lines 488-681)
-- Repository evidence only; live Supabase definitions remain unverified.

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
