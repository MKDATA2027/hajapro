-- Private customer and garment photos for tailoring workspaces.
-- Existing customer records remain valid; photo paths are nullable.
alter table public.customers
  add column if not exists customer_photo_path text,
  add column if not exists garment_photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-media',
  'customer-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Object paths start with the business UUID. Membership is checked on every
-- storage operation, so files cannot be read across business workspaces.
create policy "Business members upload customer media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'customer-media'
  and exists (
    select 1
    from public.business_members m
    where m.business_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
  )
);

create policy "Business members read customer media"
on storage.objects for select to authenticated
using (
  bucket_id = 'customer-media'
  and exists (
    select 1
    from public.business_members m
    where m.business_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
  )
);

create policy "Business members update customer media"
on storage.objects for update to authenticated
using (
  bucket_id = 'customer-media'
  and exists (
    select 1
    from public.business_members m
    where m.business_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
  )
)
with check (
  bucket_id = 'customer-media'
  and exists (
    select 1
    from public.business_members m
    where m.business_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
  )
);

create policy "Business members delete customer media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'customer-media'
  and exists (
    select 1
    from public.business_members m
    where m.business_id::text = (storage.foldername(name))[1]
      and m.user_id = (select auth.uid())
  )
);
