-- Purchase Orders → Goods Receipts → Purchase Bills
-- Run after supabase/schema.sql in the Supabase SQL editor.

create sequence if not exists public.purchase_order_number_seq;
create sequence if not exists public.goods_received_number_seq;
create sequence if not exists public.purchase_bill_number_seq;

create table if not exists public.purchase_orders (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.business(id) on delete cascade,
  po_number        text not null,
  supplier_id      uuid not null references public.suppliers(id) on delete restrict,
  status           text not null default 'draft'
                   check (status in ('draft','pending-approval','approved','ordered','partially-received','received','cancelled')),
  created_date     date not null default current_date,
  expected_date    date not null default current_date,
  notes            text not null default '',
  supplier_notes   text,
  approved_by      text,
  approved_date    date,
  reference_number text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (business_id, po_number)
);

create table if not exists public.purchase_order_items (
  id               uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  business_id      uuid not null references public.business(id) on delete cascade,
  product_id       uuid not null references public.products(id) on delete restrict,
  quantity         integer not null check (quantity > 0),
  received_qty     integer not null default 0 check (received_qty >= 0 and received_qty <= quantity),
  unit_price       numeric(14,2) not null default 0 check (unit_price >= 0),
  created_at       timestamptz not null default now()
);

create table if not exists public.goods_received_notes (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.business(id) on delete cascade,
  grn_number       text not null,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete restrict,
  supplier_id      uuid not null references public.suppliers(id) on delete restrict,
  received_date    date not null default current_date,
  received_by      text not null,
  notes            text not null default '',
  reference_number text,
  created_at       timestamptz not null default now(),
  unique (business_id, grn_number)
);

create table if not exists public.goods_received_note_items (
  id               uuid primary key default gen_random_uuid(),
  goods_received_note_id uuid not null references public.goods_received_notes(id) on delete cascade,
  product_id       uuid not null references public.products(id) on delete restrict,
  ordered_qty      integer not null check (ordered_qty >= 0),
  received_qty     integer not null check (received_qty > 0),
  quality_status   text not null default 'ok'
                   check (quality_status in ('ok','partial','rejected'))
);

create table if not exists public.purchase_bills (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.business(id) on delete cascade,
  bill_number      text not null,
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  po_number        text not null default '—',
  supplier_id      uuid not null references public.suppliers(id) on delete restrict,
  bill_date        date not null default current_date,
  due_date         date not null default current_date,
  subtotal         numeric(14,2) not null default 0 check (subtotal >= 0),
  gst_amount       numeric(14,2) not null default 0 check (gst_amount >= 0),
  total            numeric(14,2) not null default 0 check (total >= 0),
  amount_paid      numeric(14,2) not null default 0 check (amount_paid >= 0 and amount_paid <= total),
  payment_status   text not null default 'unpaid'
                   check (payment_status in ('unpaid','partial','paid','overdue')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (business_id, bill_number)
);

create table if not exists public.purchase_bill_payments (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references public.business(id) on delete cascade,
  purchase_bill_id uuid not null references public.purchase_bills(id) on delete cascade,
  amount           numeric(14,2) not null check (amount > 0),
  payment_date     date not null default current_date,
  created_by       text,
  created_at       timestamptz not null default now()
);

-- RLS: purchase order items/GRN children are scoped through business_id or parent ownership.
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.goods_received_notes enable row level security;
alter table public.goods_received_note_items enable row level security;
alter table public.purchase_bills enable row level security;
alter table public.purchase_bill_payments enable row level security;

drop policy if exists "purchase_orders: owner full access" on public.purchase_orders;
create policy "purchase_orders: owner full access" on public.purchase_orders for all
  using (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()));

drop policy if exists "purchase_order_items: owner full access" on public.purchase_order_items;
create policy "purchase_order_items: owner full access" on public.purchase_order_items for all
  using (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()));

drop policy if exists "goods_received_notes: owner full access" on public.goods_received_notes;
create policy "goods_received_notes: owner full access" on public.goods_received_notes for all
  using (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()));

drop policy if exists "goods_received_note_items: owner full access" on public.goods_received_note_items;
create policy "goods_received_note_items: owner full access" on public.goods_received_note_items for all
  using (exists (
    select 1 from public.goods_received_notes n
    join public.business b on b.id = n.business_id
    where n.id = goods_received_note_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.goods_received_notes n
    join public.business b on b.id = n.business_id
    where n.id = goods_received_note_id and b.owner_id = auth.uid()
  ));

drop policy if exists "purchase_bills: owner full access" on public.purchase_bills;
create policy "purchase_bills: owner full access" on public.purchase_bills for all
  using (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()));

drop policy if exists "purchase_bill_payments: owner full access" on public.purchase_bill_payments;
create policy "purchase_bill_payments: owner full access" on public.purchase_bill_payments for all
  using (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.business b where b.id = business_id and b.owner_id = auth.uid()));

create index if not exists purchase_orders_business_idx on public.purchase_orders (business_id, created_at desc);
create index if not exists purchase_order_items_order_idx on public.purchase_order_items (purchase_order_id);
create index if not exists goods_received_notes_order_idx on public.goods_received_notes (purchase_order_id, received_date desc);
create index if not exists purchase_bills_business_idx on public.purchase_bills (business_id, bill_date desc);

drop trigger if exists set_purchase_orders_updated_at on public.purchase_orders;
create trigger set_purchase_orders_updated_at before update on public.purchase_orders
  for each row execute function public.set_updated_at();
drop trigger if exists set_purchase_bills_updated_at on public.purchase_bills;
create trigger set_purchase_bills_updated_at before update on public.purchase_bills
  for each row execute function public.set_updated_at();

-- Atomic PO creation. The UI only supplies validated IDs from the current business.
create or replace function public.create_purchase_order(
  p_business_id uuid,
  p_supplier_id uuid,
  p_status text,
  p_expected_date date,
  p_notes text,
  p_supplier_notes text,
  p_reference_number text,
  p_items jsonb
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := gen_random_uuid();
  v_number text := 'PO-' || extract(year from current_date)::text || '-' ||
    lpad(nextval('public.purchase_order_number_seq')::text, 4, '0');
  v_item jsonb;
begin
  insert into purchase_orders (id, business_id, po_number, supplier_id, status, expected_date, notes, supplier_notes, reference_number)
  values (v_id, p_business_id, v_number, p_supplier_id, p_status, coalesce(p_expected_date, current_date),
          coalesce(p_notes, ''), nullif(p_supplier_notes, ''), nullif(p_reference_number, ''));

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into purchase_order_items (purchase_order_id, business_id, product_id, quantity, unit_price)
    values (v_id, p_business_id, (v_item->>'product_id')::uuid, (v_item->>'quantity')::integer, (v_item->>'unit_price')::numeric);
  end loop;
  return v_id;
end;
$$;

-- Atomic receipt: creates the GRN, updates PO quantities/status, and inserts
-- inventory movements so the existing stock trigger updates product stock.
create or replace function public.receive_purchase_goods(
  p_business_id uuid,
  p_purchase_order_id uuid,
  p_received_by text,
  p_reference_number text,
  p_notes text,
  p_items jsonb
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_order purchase_orders%rowtype;
  v_grn_id uuid := gen_random_uuid();
  v_grn_number text := 'GRN-' || extract(year from current_date)::text || '-' ||
    lpad(nextval('public.goods_received_number_seq')::text, 4, '0');
  v_item jsonb;
  v_po_item purchase_order_items%rowtype;
  v_received integer;
  v_all_received boolean;
begin
  select * into v_order from purchase_orders
  where id = p_purchase_order_id and business_id = p_business_id
  for update;
  if not found then raise exception 'Purchase order not found'; end if;
  if v_order.status not in ('ordered','partially-received') then
    raise exception 'Goods can only be received for an ordered purchase order';
  end if;

  insert into goods_received_notes (id, business_id, grn_number, purchase_order_id, supplier_id, received_by, notes, reference_number)
  values (v_grn_id, p_business_id, v_grn_number, v_order.id, v_order.supplier_id,
          nullif(trim(p_received_by), ''), coalesce(p_notes, ''), nullif(p_reference_number, ''));

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_received := (v_item->>'received_qty')::integer;
    if v_received <= 0 then continue; end if;
    select * into v_po_item from purchase_order_items
    where id = (v_item->>'purchase_order_item_id')::uuid
      and purchase_order_id = v_order.id
    for update;
    if not found then raise exception 'Purchase order item not found'; end if;
    if v_received > v_po_item.quantity - v_po_item.received_qty then
      raise exception 'Received quantity exceeds remaining quantity';
    end if;

    insert into goods_received_note_items (goods_received_note_id, product_id, ordered_qty, received_qty, quality_status)
    values (v_grn_id, v_po_item.product_id, v_po_item.quantity, v_received,
            case when v_received = v_po_item.quantity then 'ok' else 'partial' end);

    insert into inventory_movements (
      business_id, product_id, movement_type, adjustment_type, adjustment_reason,
      quantity, reference, supplier_id, reason, notes, created_by
    ) values (
      p_business_id, v_po_item.product_id, 'in', null, null, v_received, v_grn_number,
      v_order.supplier_id, 'Purchase order receipt', coalesce(p_notes, ''), p_received_by
    );

    update purchase_order_items
      set received_qty = received_qty + v_received
      where id = v_po_item.id;
  end loop;

  select bool_and(received_qty >= quantity) into v_all_received
  from purchase_order_items where purchase_order_id = v_order.id;
  update purchase_orders set status = case when v_all_received then 'received' else 'partially-received' end
  where id = v_order.id;
  return v_grn_id;
end;
$$;

create or replace function public.create_purchase_bill(
  p_business_id uuid,
  p_purchase_order_id uuid,
  p_supplier_id uuid,
  p_po_number text,
  p_bill_date date,
  p_due_date date,
  p_subtotal numeric,
  p_gst_amount numeric,
  p_total numeric,
  p_amount_paid numeric
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := gen_random_uuid();
  v_paid numeric := greatest(0, least(coalesce(p_amount_paid, 0), p_total));
  v_status text;
  v_number text := 'BILL-' || extract(year from current_date)::text || '-' ||
    lpad(nextval('public.purchase_bill_number_seq')::text, 4, '0');
begin
  v_status := case when v_paid >= p_total then 'paid'
                   when v_paid > 0 then 'partial'
                   when coalesce(p_due_date, current_date) < current_date then 'overdue'
                   else 'unpaid' end;
  insert into purchase_bills (
    id, business_id, bill_number, purchase_order_id, po_number, supplier_id,
    bill_date, due_date, subtotal, gst_amount, total, amount_paid, payment_status
  ) values (
    v_id, p_business_id, v_number, p_purchase_order_id, coalesce(p_po_number, '—'), p_supplier_id,
    coalesce(p_bill_date, current_date), coalesce(p_due_date, current_date),
    greatest(0, p_subtotal), greatest(0, p_gst_amount), greatest(0, p_total), v_paid, v_status
  );
  update suppliers set outstanding_amount = outstanding_amount + p_total, total_purchases = total_purchases + p_total
  where id = p_supplier_id and business_id = p_business_id;
  if v_paid > 0 then
    insert into purchase_bill_payments (business_id, purchase_bill_id, amount, created_by)
    values (p_business_id, v_id, v_paid, null);
    update suppliers set outstanding_amount = greatest(0, outstanding_amount - v_paid)
    where id = p_supplier_id and business_id = p_business_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.record_purchase_bill_payment(
  p_business_id uuid,
  p_purchase_bill_id uuid,
  p_amount numeric,
  p_created_by text
) returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_bill purchase_bills%rowtype;
  v_paid numeric;
  v_status text;
begin
  select * into v_bill from purchase_bills
  where id = p_purchase_bill_id and business_id = p_business_id for update;
  if not found then raise exception 'Purchase bill not found'; end if;
  if p_amount <= 0 then raise exception 'Payment must be greater than zero'; end if;
  if v_bill.amount_paid >= v_bill.total then raise exception 'Purchase bill is already fully paid'; end if;
  v_paid := least(v_bill.total, v_bill.amount_paid + p_amount);
  v_status := case when v_paid >= v_bill.total then 'paid'
                   when v_paid > 0 then 'partial'
                   when v_bill.due_date < current_date then 'overdue'
                   else 'unpaid' end;
  insert into purchase_bill_payments (business_id, purchase_bill_id, amount, created_by)
  values (p_business_id, v_bill.id, v_paid - v_bill.amount_paid, p_created_by);
  update purchase_bills set amount_paid = v_paid, payment_status = v_status where id = v_bill.id;
  update suppliers set outstanding_amount = greatest(0, outstanding_amount - (v_paid - v_bill.amount_paid))
  where id = v_bill.supplier_id and business_id = p_business_id;
end;
$$;