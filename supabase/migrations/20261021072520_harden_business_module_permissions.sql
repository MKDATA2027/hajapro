-- Keep trigger-only SECURITY DEFINER functions inaccessible through PostgREST RPC.
revoke all on function public.notify_business_order_created() from public, anon, authenticated;
revoke all on function public.notify_business_order_status() from public, anon, authenticated;
revoke all on function public.notify_business_payment_recorded() from public, anon, authenticated;
revoke all on function public.prevent_order_overpayment() from public, anon, authenticated;

-- Cover the new foreign keys with indexes for deletes and joins.
create index if not exists orders_customer_business_fk_idx on public.orders(customer_id, business_id);
create index if not exists orders_created_by_idx on public.orders(created_by);
create index if not exists products_created_by_idx on public.products(created_by);
create index if not exists inventory_movements_product_business_idx on public.inventory_movements(product_id, business_id);
create index if not exists inventory_movements_created_by_idx on public.inventory_movements(created_by);
create index if not exists order_payments_order_business_idx on public.order_payments(order_id, business_id);
create index if not exists order_payments_recorded_by_idx on public.order_payments(recorded_by);
create index if not exists order_payments_verified_by_idx on public.order_payments(verified_by);
create index if not exists app_notifications_business_idx on public.app_notifications(business_id);
