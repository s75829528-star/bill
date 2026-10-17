-- Nexora — Customer groups
-- Run after schema.sql, business_schema.sql, and customers_schema.sql.

create table if not exists public.customer_groups (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business(id) on delete cascade,
  name        text not null check (length(btrim(name)) > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists customer_groups_business_name_lower_key
  on public.customer_groups (business_id, lower(name));

create index if not exists idx_customer_groups_business
  on public.customer_groups (business_id);

alter table public.customer_groups enable row level security;

drop policy if exists customer_groups_select_own on public.customer_groups;
create policy customer_groups_select_own
  on public.customer_groups for select
  using (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

drop policy if exists customer_groups_insert_own on public.customer_groups;
create policy customer_groups_insert_own
  on public.customer_groups for insert
  with check (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

drop policy if exists customer_groups_update_own on public.customer_groups;
create policy customer_groups_update_own
  on public.customer_groups for update
  using (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  )
  with check (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

drop policy if exists customer_groups_delete_own on public.customer_groups;
create policy customer_groups_delete_own
  on public.customer_groups for delete
  using (
    business_id = (select id from public.business where owner_id = auth.uid() limit 1)
  );

drop trigger if exists customer_groups_updated_at on public.customer_groups;
create trigger customer_groups_updated_at
  before update on public.customer_groups
  for each row execute function public.set_updated_at();

-- Preserve groups that were previously represented only by customer rows.
insert into public.customer_groups (business_id, name)
select distinct business_id, btrim(customer_group)
from public.customers
where btrim(customer_group) <> ''
on conflict do nothing;
