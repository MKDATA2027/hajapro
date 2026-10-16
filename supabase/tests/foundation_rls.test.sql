create extension if not exists pgtap with schema extensions;

begin;

select extensions.plan(13);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'owner-a@example.test', '', now(), '{}', '{}'),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'owner-b@example.test', '', now(), '{}', '{}');

insert into public.businesses (id, name, business_type, created_by)
values
  ('20000000-0000-4000-8000-000000000001', 'Private workspace A', 'tailor', '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002', 'Private workspace B', 'trading', '10000000-0000-4000-8000-000000000002');

insert into public.business_members (business_id, user_id, role)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'owner');

select extensions.ok(
  not pg_catalog.has_table_privilege('anon', 'public.businesses', 'SELECT'),
  'anonymous users cannot select businesses'
);
select extensions.ok(
  not pg_catalog.has_table_privilege('anon', 'public.business_members', 'SELECT'),
  'anonymous users cannot select memberships'
);
select extensions.ok(
  not pg_catalog.has_table_privilege('authenticated', 'public.businesses', 'INSERT'),
  'authenticated clients cannot insert businesses directly'
);
select extensions.ok(
  not pg_catalog.has_table_privilege('authenticated', 'public.business_members', 'INSERT'),
  'authenticated clients cannot grant memberships directly'
);
select extensions.ok(
  pg_catalog.has_function_privilege('authenticated', 'public.create_business(text,public.business_type)', 'EXECUTE'),
  'authenticated users can execute the owner provisioning RPC'
);
select extensions.ok(
  not pg_catalog.has_function_privilege('anon', 'public.create_business(text,public.business_type)', 'EXECUTE'),
  'anonymous users cannot execute the owner provisioning RPC'
);
select extensions.is(
  (select array_agg(enumlabel order by enumsortorder)::text[] from pg_catalog.pg_enum where enumtypid = 'public.business_type'::regtype),
  array['tailor', 'trading']::text[],
  'business type is restricted to the supported options'
);

set local role anon;
select extensions.throws_ok(
  $$ select public.create_business('Anonymous workspace', 'tailor') $$,
  '42501',
  'permission denied for function create_business',
  'anonymous requests cannot create businesses'
);
reset role;

set local role authenticated;
select pg_catalog.set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select extensions.is(
  (select count(*)::integer from public.businesses),
  1,
  'a user can see only businesses where they are a member'
);
select extensions.is(
  (select count(*)::integer from public.business_members),
  1,
  'a user can see only their own membership rows'
);
select extensions.is(
  (select count(*)::integer from public.businesses where id = '20000000-0000-4000-8000-000000000002'),
  0,
  'a user cannot read another business by its identifier'
);
select extensions.ok(
  public.create_business('Workspace created through RPC', 'trading') is not null,
  'an authenticated user can create a workspace through the owner RPC'
);
select extensions.is(
  (select count(*)::integer from public.businesses),
  2,
  'the RPC-created workspace is visible to its owner'
);

select * from extensions.finish();
rollback;