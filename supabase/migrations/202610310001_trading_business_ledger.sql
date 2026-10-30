-- Trading Business ledger foundation for HAJAPRO / MK Business Manager.
-- Additive only: existing tailoring orders, payments, customers and inventory rows are preserved.
-- This migration deliberately keeps buying costs in a separate protected table; products remain
-- readable to permitted cashiers without exposing purchase prices through the products table.

alter table public.products
  add column if not exists archived_at timestamptz;

create table if not exists public.product_costs (
  product_id uuid primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  current_unit_cost numeric(12,2) not null default 0 check (current_unit_cost >= 0),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  constraint product_costs_product_business_fk
    foreign key (product_id, business_id)
    references public.products(id, business_id) on delete cascade
);
create index if not exists product_costs_business_idx on public.product_costs(business_id);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 160),
  phone text,
  email text,
  address text,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint suppliers_id_business_unique unique (id, business_id)
);
create index if not exists suppliers_business_name_idx on public.suppliers(business_id, name);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sale_number bigint generated always as identity,
  customer_id uuid,
  status text not null default 'completed'
    check (status in ('completed','part_paid','credit','cancelled','returned')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id),
  cancel_reason text,
  constraint sales_customer_business_fk
    foreign key (customer_id, business_id)
    references public.customers(id, business_id) on delete restrict,
  constraint sales_id_business_unique unique (id, business_id),
  constraint sales_discount_lte_subtotal check (discount_amount <= subtotal),
  constraint sales_total_matches_subtotal check (total_amount = subtotal - discount_amount)
);
create index if not exists sales_business_created_idx on public.sales(business_id, created_at desc);
create index if not exists sales_customer_business_idx on public.sales(customer_id, business_id);
create index if not exists sales_created_by_idx on public.sales(created_by);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sale_id uuid not null,
  product_id uuid not null,
  product_name_snapshot text not null,
  quantity numeric(12,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  unit_cost_snapshot numeric(12,2) not null check (unit_cost_snapshot >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  constraint sale_items_sale_business_fk
    foreign key (sale_id, business_id) references public.sales(id, business_id) on delete restrict,
  constraint sale_items_product_business_fk
    foreign key (product_id, business_id) references public.products(id, business_id) on delete restrict
);
create index if not exists sale_items_sale_business_idx on public.sale_items(sale_id, business_id);
create index if not exists sale_items_product_business_idx on public.sale_items(product_id, business_id);

create table if not exists public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sale_id uuid not null,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash','bank_transfer','pos','other')),
  reference text,
  note text,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  reversed_at timestamptz,
  reversed_by uuid references auth.users(id),
  reversal_reason text,
  constraint sale_payments_sale_business_fk
    foreign key (sale_id, business_id) references public.sales(id, business_id) on delete restrict
);
create index if not exists sale_payments_sale_business_idx on public.sale_payments(sale_id, business_id);
create index if not exists sale_payments_business_created_idx on public.sale_payments(business_id, created_at desc);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  supplier_id uuid,
  purchase_number bigint generated always as identity,
  status text not null default 'received' check (status in ('received','cancelled')),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  due_date date,
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id),
  cancel_reason text,
  constraint purchases_supplier_business_fk
    foreign key (supplier_id, business_id) references public.suppliers(id, business_id) on delete restrict,
  constraint purchases_id_business_unique unique (id, business_id)
);
create index if not exists purchases_business_created_idx on public.purchases(business_id, created_at desc);
create index if not exists purchases_supplier_business_idx on public.purchases(supplier_id, business_id);

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  purchase_id uuid not null,
  product_id uuid not null,
  product_name_snapshot text not null,
  quantity numeric(12,2) not null check (quantity > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  constraint purchase_items_purchase_business_fk
    foreign key (purchase_id, business_id) references public.purchases(id, business_id) on delete restrict,
  constraint purchase_items_product_business_fk
    foreign key (product_id, business_id) references public.products(id, business_id) on delete restrict
);
create index if not exists purchase_items_purchase_business_idx on public.purchase_items(purchase_id, business_id);

create table if not exists public.supplier_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  supplier_id uuid not null,
  purchase_id uuid,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash','bank_transfer','pos','other')),
  reference text,
  note text,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  reversed_at timestamptz,
  reversed_by uuid references auth.users(id),
  reversal_reason text,
  constraint supplier_payments_supplier_business_fk
    foreign key (supplier_id, business_id) references public.suppliers(id, business_id) on delete restrict,
  constraint supplier_payments_purchase_business_fk
    foreign key (purchase_id, business_id) references public.purchases(id, business_id) on delete restrict
);
create index if not exists supplier_payments_business_created_idx on public.supplier_payments(business_id, created_at desc);
create index if not exists supplier_payments_supplier_business_idx on public.supplier_payments(supplier_id, business_id);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category text not null check (char_length(btrim(category)) between 2 and 80),
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash','bank_transfer','pos','other')),
  expense_date date not null default current_date,
  note text,
  receipt_path text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reversed_at timestamptz,
  reversed_by uuid references auth.users(id),
  reversal_reason text
);
create index if not exists expenses_business_date_idx on public.expenses(business_id, expense_date desc);

-- Permissions are explicit and default-deny for non-owners. Owners always retain full access.
create table if not exists public.business_member_permissions (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null check (permission in (
    'sales.view_all','sales.create','sales.cancel','sales.record_payment',
    'products.view','products.manage','products.view_cost',
    'inventory.view','inventory.view_value','inventory.adjust','inventory.purchase',
    'customers.view','customers.view_debt','customers.manage','customers.record_payment',
    'suppliers.view','suppliers.manage','suppliers.record_payment',
    'expenses.view','expenses.create','expenses.manage',
    'reports.view','reports.view_profit','ai.use'
  )),
  allowed boolean not null default false,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (business_id, user_id, permission),
  constraint member_permission_membership_fk
    foreign key (business_id, user_id)
    references public.business_members(business_id, user_id) on delete cascade
);
create index if not exists business_member_permissions_user_idx
  on public.business_member_permissions(user_id, business_id);

create or replace function public.has_business_permission(p_business_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select (select auth.uid()) is not null
    and (
      exists (
        select 1 from public.business_members m
        where m.business_id = p_business_id
          and m.user_id = (select auth.uid())
          and m.role = 'owner'
      ) or exists (
        select 1 from public.business_member_permissions p
        where p.business_id = p_business_id
          and p.user_id = (select auth.uid())
          and p.permission = p_permission
          and p.allowed = true
      )
    );
$function$;
revoke all on function public.has_business_permission(uuid, text) from public, anon;
grant execute on function public.has_business_permission(uuid, text) to authenticated;

alter table public.product_costs enable row level security;
alter table public.suppliers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_payments enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.supplier_payments enable row level security;
alter table public.expenses enable row level security;
alter table public.business_member_permissions enable row level security;

create policy "Permitted members read product costs" on public.product_costs
  for select to authenticated using (public.has_business_permission(business_id, 'products.view_cost'));
create policy "Permitted members manage product costs" on public.product_costs
  for all to authenticated
  using (public.has_business_permission(business_id, 'products.manage'))
  with check (
    updated_by = (select auth.uid())
    and public.has_business_permission(business_id, 'products.manage')
  );

create policy "Permitted members read suppliers" on public.suppliers
  for select to authenticated using (public.has_business_permission(business_id, 'suppliers.view'));
create policy "Permitted members create suppliers" on public.suppliers
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and public.has_business_permission(business_id, 'suppliers.manage')
  );
create policy "Permitted members update suppliers" on public.suppliers
  for update to authenticated
  using (public.has_business_permission(business_id, 'suppliers.manage'))
  with check (public.has_business_permission(business_id, 'suppliers.manage'));

create policy "Members read permitted sales" on public.sales
  for select to authenticated using (
    public.has_business_permission(business_id, 'sales.view_all')
    or (created_by = (select auth.uid()) and public.has_business_permission(business_id, 'sales.create'))
  );
create policy "Permitted members create sales" on public.sales
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and public.has_business_permission(business_id, 'sales.create')
  );
create policy "Permitted members update sales" on public.sales
  for update to authenticated
  using (public.has_business_permission(business_id, 'sales.cancel'))
  with check (public.has_business_permission(business_id, 'sales.cancel'));

create policy "Members read sale items through permitted sales" on public.sale_items
  for select to authenticated using (
    exists (select 1 from public.sales s where s.id = sale_items.sale_id
      and s.business_id = sale_items.business_id)
  );
create policy "Permitted members create sale items" on public.sale_items
  for insert to authenticated with check (
    exists (select 1 from public.sales s where s.id = sale_items.sale_id
      and s.business_id = sale_items.business_id and s.created_by = (select auth.uid()))
    and public.has_business_permission(business_id, 'sales.create')
  );

create policy "Members read sale payments" on public.sale_payments
  for select to authenticated using (
    public.has_business_permission(business_id, 'sales.view_all')
    or (recorded_by = (select auth.uid()) and public.has_business_permission(business_id, 'sales.create'))
  );
create policy "Permitted members record sale payments" on public.sale_payments
  for insert to authenticated with check (
    recorded_by = (select auth.uid())
    and public.has_business_permission(business_id, 'sales.record_payment')
  );

create policy "Permitted members read purchases" on public.purchases
  for select to authenticated using (public.has_business_permission(business_id, 'inventory.purchase'));
create policy "Permitted members create purchases" on public.purchases
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and public.has_business_permission(business_id, 'inventory.purchase')
  );
create policy "Permitted members read purchase items" on public.purchase_items
  for select to authenticated using (public.has_business_permission(business_id, 'inventory.purchase'));
create policy "Permitted members create purchase items" on public.purchase_items
  for insert to authenticated with check (
    exists (select 1 from public.purchases p where p.id = purchase_items.purchase_id
      and p.business_id = purchase_items.business_id and p.created_by = (select auth.uid()))
    and public.has_business_permission(business_id, 'inventory.purchase')
  );

create policy "Permitted members read supplier payments" on public.supplier_payments
  for select to authenticated using (public.has_business_permission(business_id, 'suppliers.view'));
create policy "Permitted members record supplier payments" on public.supplier_payments
  for insert to authenticated with check (
    recorded_by = (select auth.uid())
    and public.has_business_permission(business_id, 'suppliers.record_payment')
  );

create policy "Permitted members read expenses" on public.expenses
  for select to authenticated using (public.has_business_permission(business_id, 'expenses.view'));
create policy "Permitted members create expenses" on public.expenses
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and public.has_business_permission(business_id, 'expenses.create')
  );
create policy "Permitted members update expenses" on public.expenses
  for update to authenticated
  using (public.has_business_permission(business_id, 'expenses.manage'))
  with check (public.has_business_permission(business_id, 'expenses.manage'));

create policy "Members read own permissions" on public.business_member_permissions
  for select to authenticated using (
    user_id = (select auth.uid())
    or exists (select 1 from public.business_members m
      where m.business_id = business_member_permissions.business_id
        and m.user_id = (select auth.uid()) and m.role = 'owner')
  );
create policy "Owners manage member permissions" on public.business_member_permissions
  for all to authenticated
  using (exists (select 1 from public.business_members m
    where m.business_id = business_member_permissions.business_id
      and m.user_id = (select auth.uid()) and m.role = 'owner'))
  with check (
    updated_by = (select auth.uid())
    and exists (select 1 from public.business_members m
      where m.business_id = business_member_permissions.business_id
        and m.user_id = (select auth.uid()) and m.role = 'owner')
  );

grant select, insert, update on public.product_costs to authenticated;
grant select, insert, update on public.suppliers to authenticated;
grant select, insert, update on public.sales, public.sale_items, public.sale_payments to authenticated;
grant select, insert, update on public.purchases, public.purchase_items, public.supplier_payments to authenticated;
grant select, insert, update on public.expenses to authenticated;
grant select, insert, update, delete on public.business_member_permissions to authenticated;
grant usage, select on sequence public.sales_sale_number_seq, public.purchases_purchase_number_seq to authenticated;


-- Audit trail for financial, stock and permission changes.
create table if not exists public.business_audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  action text not null check (char_length(action) between 1 and 100),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);
create index if not exists business_audit_logs_business_created_idx
  on public.business_audit_logs(business_id, created_at desc);
alter table public.business_audit_logs enable row level security;
create policy "Authorized members read audit log" on public.business_audit_logs
  for select to authenticated
  using (public.has_business_permission(business_id, 'reports.view'));
revoke all on public.business_audit_logs from anon, authenticated;
grant select on public.business_audit_logs to authenticated;

-- A single database transaction creates a sale, records its snapshots, deducts stock,
-- writes stock movements, and records any money received. Direct table writes are
-- intentionally revoked below so callers cannot bypass these invariants.
create or replace function public.create_trading_sale(
  p_business_id uuid,
  p_customer_id uuid,
  p_items jsonb,
  p_payment_amount numeric default 0,
  p_payment_method text default 'cash',
  p_reference text default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_sale_id uuid;
  v_subtotal numeric(12,2);
  v_payment numeric(12,2) := coalesce(p_payment_amount, 0);
  v_item record;
  v_product public.products%rowtype;
  v_unit_price numeric(12,2);
  v_quantity numeric(12,2);
  v_unit_cost numeric(12,2);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one sale item is required';
  end if;
  if v_payment < 0 then raise exception 'Payment cannot be negative'; end if;
  if p_payment_method not in ('cash','bank_transfer','pos','other') then
    raise exception 'Unsupported payment method';
  end if;
  if not exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.business_type = 'trading'
  ) then raise exception 'Trading business not found'; end if;
  if not public.has_business_permission(p_business_id, 'sales.create') then
    raise exception 'You do not have permission to create sales';
  end if;
  if p_customer_id is not null and not exists (
    select 1 from public.customers c
    where c.id = p_customer_id and c.business_id = p_business_id
  ) then raise exception 'Customer does not belong to this business'; end if;

  -- Lock every selected product before validating stock to prevent overselling
  -- when two cashiers check out simultaneously.
  for v_item in
    select distinct (x->>'product_id')::uuid as product_id
    from jsonb_array_elements(p_items) x
    order by 1
  loop
    select * into v_product
    from public.products p
    where p.id = v_item.product_id and p.business_id = p_business_id
      and p.archived_at is null
    for update;
    if not found then raise exception 'A selected product is unavailable'; end if;
  end loop;

  if exists (
    select 1
    from (
      select (x->>'product_id')::uuid product_id,
             sum((x->>'quantity')::numeric) quantity
      from jsonb_array_elements(p_items) x
      group by (x->>'product_id')::uuid
    ) requested
    left join public.products p
      on p.id = requested.product_id and p.business_id = p_business_id
    where p.id is null
       or requested.quantity <= 0
       or requested.quantity > p.stock_quantity
  ) then raise exception 'Insufficient stock or invalid quantity'; end if;

  if exists (
    select 1
    from jsonb_array_elements(p_items) x
    left join public.products p
      on p.id = (x->>'product_id')::uuid and p.business_id = p_business_id
    where not (x ? 'product_id') or not (x ? 'quantity') or not (x ? 'unit_price')
       or (x->>'quantity')::numeric <= 0
       or (x->>'unit_price')::numeric < 0
       or p.id is null
       or (x->>'unit_price')::numeric <> p.unit_price
  ) then raise exception 'Invalid item or unauthorized price override'; end if;

  select round(sum((x->>'quantity')::numeric * (x->>'unit_price')::numeric), 2)
    into v_subtotal
  from jsonb_array_elements(p_items) x;
  if v_payment > v_subtotal then raise exception 'Payment exceeds sale total'; end if;
  if v_payment < v_subtotal and p_customer_id is null then
    raise exception 'A named customer is required for credit or part payment';
  end if;

  insert into public.sales (
    business_id, customer_id, status, subtotal, discount_amount, total_amount,
    note, created_by
  ) values (
    p_business_id, p_customer_id,
    case when v_payment = v_subtotal then 'completed'
         when v_payment > 0 then 'part_paid' else 'credit' end,
    v_subtotal, 0, v_subtotal, nullif(btrim(p_note), ''), v_user_id
  ) returning id into v_sale_id;

  for v_item in
    select (x->>'product_id')::uuid product_id,
           sum((x->>'quantity')::numeric) quantity,
           (x->>'unit_price')::numeric unit_price
    from jsonb_array_elements(p_items) x
    group by (x->>'product_id')::uuid, (x->>'unit_price')::numeric
  loop
    select * into v_product from public.products
    where id = v_item.product_id and business_id = p_business_id;
    select pc.current_unit_cost into v_unit_cost
    from public.product_costs pc
    where pc.product_id = v_item.product_id and pc.business_id = p_business_id;
    if not found then
      raise exception 'Purchase cost is missing for product %', v_product.name;
    end if;

    insert into public.sale_items (
      business_id, sale_id, product_id, product_name_snapshot,
      quantity, unit_price, unit_cost_snapshot, line_total
    ) values (
      p_business_id, v_sale_id, v_item.product_id, v_product.name,
      v_item.quantity, v_item.unit_price, v_unit_cost,
      round(v_item.quantity * v_item.unit_price, 2)
    );

    update public.products
    set stock_quantity = stock_quantity - v_item.quantity,
        updated_at = now()
    where id = v_item.product_id and business_id = p_business_id;

    insert into public.inventory_movements (
      business_id, product_id, movement_type, quantity, note, created_by
    ) values (
      p_business_id, v_item.product_id, 'stock_out', v_item.quantity,
      'Trading sale ' || v_sale_id::text, v_user_id
    );
  end loop;

  if v_payment > 0 then
    insert into public.sale_payments (
      business_id, sale_id, amount, payment_method, reference, note, recorded_by
    ) values (
      p_business_id, v_sale_id, v_payment, p_payment_method,
      nullif(btrim(p_reference), ''), 'Manually recorded at checkout', v_user_id
    );
  end if;

  insert into public.business_audit_logs (
    business_id, actor_id, action, entity_type, entity_id, new_values
  ) values (
    p_business_id, v_user_id, 'sale.created', 'sale', v_sale_id,
    jsonb_build_object('total_amount', v_subtotal, 'payment_amount', v_payment,
                       'customer_id', p_customer_id)
  );
  return v_sale_id;
end;
$$;

revoke all on function public.create_trading_sale(uuid, uuid, jsonb, numeric, text, text, text) from public, anon;
grant execute on function public.create_trading_sale(uuid, uuid, jsonb, numeric, text, text, text) to authenticated;

-- The sale RPC is the only authenticated write path for sales and their line items.
revoke insert, update, delete on public.sales, public.sale_items from authenticated;
revoke insert, update, delete on public.sale_payments from authenticated;
revoke insert, update, delete on public.inventory_movements from authenticated;
