create index if not exists business_members_user_id_idx
  on public.business_members (user_id);

create index if not exists businesses_created_by_idx
  on public.businesses (created_by);
