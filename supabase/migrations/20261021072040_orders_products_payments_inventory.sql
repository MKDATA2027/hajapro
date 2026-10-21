-- HAJAPRO order management, products, inventory, payment records and in-app notifications.
-- Every record is business-scoped and protected by membership RLS. Payment verification is manual.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid,
  order_number bigint generated always as identity,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  description text,
  status text not null default 'new' check (status in ('new','measuring','cutting','sewing','fitting','ready','completed','cancelled')),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  due_date date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_customer_business_fk foreign key (customer_id, business_id) references public.customers(id, business_id) on delete restrict,
  constraint orders_deposit_lte_total check (deposit_amount <= total_amount),
  constraint orders_id_business_unique unique (id, business_id)
);
create index if not exists orders_business_created_idx on public.orders(business_id, created_at desc);
create index if not exists orders_business_due_idx on public.orders(business_id, due_date) where status not in ('completed','cancelled');

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  sku text,
  category text,
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  stock_quantity numeric(12,2) not null default 0 check (stock_quantity >= 0),
  low_stock_threshold numeric(12,2) not null default 2 check (low_stock_threshold >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_business_sku_unique unique (business_id, sku),
  constraint products_id_business_unique unique (id, business_id)
);
create index if not exists products_business_name_idx on public.products(business_id, name);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null,
  movement_type text not null check (movement_type in ('stock_in','stock_out','adjustment')),
  quantity numeric(12,2) not null check (quantity > 0),
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint inventory_product_business_fk foreign key (product_id, business_id) references public.products(id, business_id) on delete cascade
);
create index if not exists inventory_movements_business_created_idx on public.inventory_movements(business_id, created_at desc);

create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  order_id uuid not null,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null default 'cash' check (payment_method in ('cash','bank_transfer','pos','other')),
  reference text,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  note text,
  recorded_by uuid not null references auth.users(id),
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint payment_order_business_fk foreign key (order_id, business_id) references public.orders(id, business_id) on delete cascade
);
create index if not exists order_payments_business_created_idx on public.order_payments(business_id, created_at desc);

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists app_notifications_user_created_idx on public.app_notifications(user_id, created_at desc);

alter table public.orders enable row level security;
alter table public.products enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.order_payments enable row level security;
alter table public.app_notifications enable row level security;

create policy "Members read business orders" on public.orders for select to authenticated using (exists(select 1 from public.business_members m where m.business_id=orders.business_id and m.user_id=(select auth.uid())));
create policy "Members create business orders" on public.orders for insert to authenticated with check (created_by=(select auth.uid()) and exists(select 1 from public.business_members m where m.business_id=orders.business_id and m.user_id=(select auth.uid())));
create policy "Members update business orders" on public.orders for update to authenticated using (exists(select 1 from public.business_members m where m.business_id=orders.business_id and m.user_id=(select auth.uid()))) with check (exists(select 1 from public.business_members m where m.business_id=orders.business_id and m.user_id=(select auth.uid())));
create policy "Owners managers delete orders" on public.orders for delete to authenticated using (exists(select 1 from public.business_members m where m.business_id=orders.business_id and m.user_id=(select auth.uid()) and m.role in ('owner','manager')));

create policy "Members read business products" on public.products for select to authenticated using (exists(select 1 from public.business_members m where m.business_id=products.business_id and m.user_id=(select auth.uid())));
create policy "Members create business products" on public.products for insert to authenticated with check (created_by=(select auth.uid()) and exists(select 1 from public.business_members m where m.business_id=products.business_id and m.user_id=(select auth.uid())));
create policy "Members update business products" on public.products for update to authenticated using (exists(select 1 from public.business_members m where m.business_id=products.business_id and m.user_id=(select auth.uid()))) with check (exists(select 1 from public.business_members m where m.business_id=products.business_id and m.user_id=(select auth.uid())));
create policy "Owners managers delete products" on public.products for delete to authenticated using (exists(select 1 from public.business_members m where m.business_id=products.business_id and m.user_id=(select auth.uid()) and m.role in ('owner','manager')));

create policy "Members read inventory movements" on public.inventory_movements for select to authenticated using (exists(select 1 from public.business_members m where m.business_id=inventory_movements.business_id and m.user_id=(select auth.uid())));
create policy "Members create inventory movements" on public.inventory_movements for insert to authenticated with check (created_by=(select auth.uid()) and exists(select 1 from public.business_members m where m.business_id=inventory_movements.business_id and m.user_id=(select auth.uid())));

create policy "Members read order payments" on public.order_payments for select to authenticated using (exists(select 1 from public.business_members m where m.business_id=order_payments.business_id and m.user_id=(select auth.uid())));
create policy "Members record order payments" on public.order_payments for insert to authenticated with check (recorded_by=(select auth.uid()) and status='pending' and verified_by is null and verified_at is null and exists(select 1 from public.business_members m where m.business_id=order_payments.business_id and m.user_id=(select auth.uid())));
create policy "Owners managers verify payments" on public.order_payments for update to authenticated using (exists(select 1 from public.business_members m where m.business_id=order_payments.business_id and m.user_id=(select auth.uid()) and m.role in ('owner','manager'))) with check (exists(select 1 from public.business_members m where m.business_id=order_payments.business_id and m.user_id=(select auth.uid()) and m.role in ('owner','manager')));

create policy "Users read own business notifications" on public.app_notifications for select to authenticated using (user_id=(select auth.uid()) and exists(select 1 from public.business_members m where m.business_id=app_notifications.business_id and m.user_id=(select auth.uid())));
create policy "Users update own notification read state" on public.app_notifications for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "Members create notifications" on public.app_notifications for insert to authenticated with check (exists(select 1 from public.business_members m where m.business_id=app_notifications.business_id and m.user_id=(select auth.uid())));

grant select, insert, update, delete on public.orders, public.products to authenticated;
grant select, insert on public.inventory_movements to authenticated;
grant select, insert on public.order_payments to authenticated;
grant update (status, verified_by, verified_at) on public.order_payments to authenticated;
grant select, update, insert on public.app_notifications to authenticated;
