create index if not exists customers_created_by_idx on public.customers (created_by);
create index if not exists measurements_created_by_idx on public.measurements (created_by);
create index if not exists measurements_customer_business_fk_idx on public.measurements (customer_id, business_id);
