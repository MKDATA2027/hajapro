-- Create in-app notifications from real business events and guard payment verification.
create or replace function public.notify_business_order_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.app_notifications (business_id, user_id, title, body)
  select new.business_id, m.user_id, 'Sabon oda', 'An ƙirƙiri oda: ' || new.title
  from public.business_members m
  where m.business_id = new.business_id and m.user_id <> new.created_by;
  return new;
end;
$$;

create or replace function public.notify_business_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.app_notifications (business_id, user_id, title, body)
    select new.business_id, m.user_id, 'An sabunta oda', 'An canza matsayin "' || new.title || '" zuwa ' || new.status
    from public.business_members m
    where m.business_id = new.business_id and m.user_id <> (select auth.uid());
  end if;
  return new;
end;
$$;

create or replace function public.notify_business_payment_recorded()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare order_title text;
begin
  select o.title into order_title from public.orders o where o.id = new.order_id and o.business_id = new.business_id;
  insert into public.app_notifications (business_id, user_id, title, body)
  select new.business_id, m.user_id, 'Biyan kuɗi yana jiran dubawa', 'An rubuta biyan kuɗi na ' || new.amount::text || ' kan oda: ' || coalesce(order_title, 'Oda')
  from public.business_members m
  where m.business_id = new.business_id and m.user_id <> new.recorded_by and m.role in ('owner','manager');
  return new;
end;
$$;

create or replace function public.prevent_order_overpayment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare order_total numeric(12,2); verified_other numeric(12,2);
begin
  if new.status = 'verified' and (tg_op = 'INSERT' or old.status is distinct from 'verified') then
    select o.total_amount into order_total
    from public.orders o
    where o.id = new.order_id and o.business_id = new.business_id
    for update;
    if order_total is null then raise exception 'Order not found for payment'; end if;
    select coalesce(sum(p.amount), 0) into verified_other
    from public.order_payments p
    where p.order_id = new.order_id and p.business_id = new.business_id
      and p.status = 'verified' and p.id <> new.id;
    if verified_other + new.amount > order_total then
      raise exception 'Verified payments cannot exceed the order total';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_notify_created on public.orders;
create trigger orders_notify_created after insert on public.orders
for each row execute function public.notify_business_order_created();

drop trigger if exists orders_notify_status on public.orders;
create trigger orders_notify_status after update of status on public.orders
for each row execute function public.notify_business_order_status();

drop trigger if exists payments_notify_recorded on public.order_payments;
create trigger payments_notify_recorded after insert on public.order_payments
for each row execute function public.notify_business_payment_recorded();

drop trigger if exists payments_prevent_overpayment on public.order_payments;
create trigger payments_prevent_overpayment before insert or update of status on public.order_payments
for each row execute function public.prevent_order_overpayment();

grant usage, select on sequence public.orders_order_number_seq to authenticated;
grant select, insert on public.order_payments to authenticated;
grant update (status, verified_by, verified_at) on public.order_payments to authenticated;
grant select, insert on public.inventory_movements to authenticated;
grant update (read_at) on public.app_notifications to authenticated;
