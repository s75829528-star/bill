-- Nexora — Leads and follow-ups
-- Run after schema.sql, business_schema.sql, and customers_schema.sql.

create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.business(id) on delete cascade,
  customer_id      uuid references public.customers(id) on delete set null,
  full_name        text not null,
  company_name     text,
  email            text,
  phone            text not null default '',
  source           text not null default 'website'
                   check (source in ('website', 'social', 'referral', 'walk_in', 'campaign', 'other')),
  status           text not null default 'new'
                   check (status in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  value            numeric not null default 0,
  notes            text,
  next_followup_at timestamptz,
  converted_at     timestamptz,
  created_by       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (id, business_id)
);

create index if not exists idx_leads_business_status
  on public.leads (business_id, status);

create index if not exists idx_leads_business_next_followup
  on public.leads (business_id, next_followup_at);

alter table public.leads enable row level security;

drop policy if exists leads_select_own on public.leads;
create policy leads_select_own
  on public.leads for select
  using (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

drop policy if exists leads_insert_own on public.leads;
create policy leads_insert_own
  on public.leads for insert
  with check (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

drop policy if exists leads_update_own on public.leads;
create policy leads_update_own
  on public.leads for update
  using (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  )
  with check (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

drop policy if exists leads_delete_own on public.leads;
create policy leads_delete_own
  on public.leads for delete
  using (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create table if not exists public.follow_ups (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.business(id) on delete cascade,
  lead_id       uuid not null,
  scheduled_for timestamptz not null,
  channel       text not null default 'call'
                check (channel in ('call', 'whatsapp', 'email', 'visit', 'other')),
  status        text not null default 'scheduled'
                check (status in ('scheduled', 'completed', 'missed', 'cancelled')),
  notes         text,
  completed_at  timestamptz,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  foreign key (lead_id, business_id)
    references public.leads(id, business_id) on delete cascade
);

create index if not exists idx_follow_ups_business_lead
  on public.follow_ups (business_id, lead_id, scheduled_for);

create index if not exists idx_follow_ups_business_status
  on public.follow_ups (business_id, status, scheduled_for);

alter table public.follow_ups enable row level security;

drop policy if exists follow_ups_select_own on public.follow_ups;
create policy follow_ups_select_own
  on public.follow_ups for select
  using (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

drop policy if exists follow_ups_insert_own on public.follow_ups;
create policy follow_ups_insert_own
  on public.follow_ups for insert
  with check (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

drop policy if exists follow_ups_update_own on public.follow_ups;
create policy follow_ups_update_own
  on public.follow_ups for update
  using (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  )
  with check (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

drop policy if exists follow_ups_delete_own on public.follow_ups;
create policy follow_ups_delete_own
  on public.follow_ups for delete
  using (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

drop trigger if exists follow_ups_updated_at on public.follow_ups;
create trigger follow_ups_updated_at
  before update on public.follow_ups
  for each row execute function public.set_updated_at();
