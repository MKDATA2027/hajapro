create type public.business_type as enum ('tailor', 'trading');
create type public.business_role as enum ('owner', 'manager', 'staff');

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  business_type public.business_type not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.business_role not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

alter table public.businesses enable row level security;
alter table public.business_members enable row level security;

create policy "Business members can read their businesses"
  on public.businesses for select to authenticated
  using (
    exists (
      select 1
      from public.business_members as membership
      where membership.business_id = businesses.id
        and membership.user_id = (select auth.uid())
    )
  );

create policy "Users can read their own memberships"
  on public.business_members for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.businesses, public.business_members from anon, authenticated;
grant usage on type public.business_type, public.business_role to authenticated;
grant select on public.businesses, public.business_members to authenticated;

create function public.create_business(
  p_name text,
  p_type public.business_type
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_business_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 2 and 100 then
    raise exception 'Invalid business name';
  end if;

  insert into public.businesses (name, business_type, created_by)
  values (btrim(p_name), p_type, current_user_id)
  returning id into new_business_id;

  insert into public.business_members (business_id, user_id, role)
  values (new_business_id, current_user_id, 'owner');

  return new_business_id;
end;
$$;

revoke all on function public.create_business(text, public.business_type)
  from public, anon, authenticated;
grant execute on function public.create_business(text, public.business_type) to authenticated;