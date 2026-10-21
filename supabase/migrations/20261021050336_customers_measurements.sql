-- HAJAPRO customer records and tailoring measurements.
-- All rows are scoped to businesses through membership-based RLS.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  phone text,
  email text,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_email_length check (email is null or char_length(email) <= 254),
  constraint customers_phone_length check (phone is null or char_length(phone) <= 40),
  constraint customers_id_business_unique unique (id, business_id)
);

create index if not exists customers_business_created_idx on public.customers (business_id, created_at desc);
create index if not exists customers_business_name_idx on public.customers (business_id, full_name);

create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null,
  label text not null check (char_length(btrim(label)) between 2 and 100),
  measurement_values jsonb not null default '{}'::jsonb check (jsonb_typeof(measurement_values) = 'object'),
  unit text not null default 'inches' check (unit in ('inches', 'cm')),
  notes text,
  recorded_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint measurements_customer_business_fk foreign key (customer_id, business_id)
    references public.customers(id, business_id) on delete cascade
);

create index if not exists measurements_business_customer_idx on public.measurements (business_id, customer_id, recorded_at desc);
alter table public.customers enable row level security;
alter table public.measurements enable row level security;

create policy "Business members can read customers" on public.customers for select to authenticated
using (exists (select 1 from public.business_members m where m.business_id = customers.business_id and m.user_id = (select auth.uid())));

create policy "Business members can add customers" on public.customers for insert to authenticated
with check (created_by = (select auth.uid()) and exists (select 1 from public.business_members m where m.business_id = customers.business_id and m.user_id = (select auth.uid())));

create policy "Business members can update customers" on public.customers for update to authenticated
using (exists (select 1 from public.business_members m where m.business_id = customers.business_id and m.user_id = (select auth.uid())))
with check (exists (select 1 from public.business_members m where m.business_id = customers.business_id and m.user_id = (select auth.uid())));

create policy "Business owners and managers can delete customers" on public.customers for delete to authenticated
using (exists (select 1 from public.business_members m where m.business_id = customers.business_id and m.user_id = (select auth.uid()) and m.role in ('owner', 'manager')));

create policy "Business members can read measurements" on public.measurements for select to authenticated
using (exists (select 1 from public.business_members m where m.business_id = measurements.business_id and m.user_id = (select auth.uid())));

create policy "Business members can add measurements" on public.measurements for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (select 1 from public.business_members m where m.business_id = measurements.business_id and m.user_id = (select auth.uid()))
  and exists (select 1 from public.customers c where c.id = measurements.customer_id and c.business_id = measurements.business_id)
);

create policy "Business members can update measurements" on public.measurements for update to authenticated
using (exists (select 1 from public.business_members m where m.business_id = measurements.business_id and m.user_id = (select auth.uid())))
with check (
  exists (select 1 from public.business_members m where m.business_id = measurements.business_id and m.user_id = (select auth.uid()))
  and exists (select 1 from public.customers c where c.id = measurements.customer_id and c.business_id = measurements.business_id)
);

create policy "Business owners and managers can delete measurements" on public.measurements for delete to authenticated
using (exists (select 1 from public.business_members m where m.business_id = measurements.business_id and m.user_id = (select auth.uid()) and m.role in ('owner', 'manager')));

grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.measurements to authenticated;
