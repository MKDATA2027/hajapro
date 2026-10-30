-- Restrict updates to payment review fields and notification read state only.
revoke update on public.order_payments from authenticated;
grant update (status, verified_by, verified_at) on public.order_payments to authenticated;

revoke update on public.app_notifications from authenticated;
grant update (read_at) on public.app_notifications to authenticated;
