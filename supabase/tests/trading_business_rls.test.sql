create extension if not exists pgtap with schema extensions;

begin;
select extensions.plan(10);

insert into auth.users (
  id, aud, role, email, encrypted_password, confirmed_at,
  raw_app_meta_data, raw_user_meta_data
) values
  ('71000000-0000-4000-8000-000000000001','authenticated','authenticated','trading-owner@example.test','',now(),'{}','{}'),
  ('71000000-0000-4000-8000-000000000002','authenticated','authenticated','trading-cashier@example.test','',now(),'{}','{}'),
  ('71000000-0000-4000-8000-000000000003','authenticated','authenticated','tailor-owner@example.test','',now(),'{}','{}');

insert into public.businesses (id,name,business_type,created_by) values
  ('72000000-0000-4000-8000-000000000001','Trading RLS Test','trading','71000000-0000-4000-8000-000000000001'),
  ('72000000-0000-4000-8000-000000000002','Tailor RLS Test','tailor','71000000-0000-4000-8000-000000000003');

insert into public.business_members (business_id,user_id,role) values
  ('72000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000001','owner'),
  ('72000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000002','staff'),
  ('72000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000003','owner');

insert into public.products (
  id,business_id,name,sku,unit_price,stock_quantity,low_stock_threshold,created_by
) values
  ('73000000-0000-4000-8000-000000000001','72000000-0000-4000-8000-000000000001','Test item','TR-1',100,10,2,'71000000-0000-4000-8000-000000000001');

insert into public.business_member_permissions (
  business_id,user_id,permission,allowed,updated_by
) values
  ('72000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000002','products.manage',false,'71000000-0000-4000-8000-000000000001');

select extensions.ok(
  not exists (select 1 from pg_policies where schemaname='public' and tablename='products' and policyname='Members update business products'),
  'legacy broad product update policy is removed'
);
select extensions.ok(
  not exists (select 1 from pg_policies where schemaname='public' and tablename='inventory_movements' and policyname='Members create inventory movements'),
  'legacy direct inventory movement policy is removed'
);
select extensions.ok(
  not pg_catalog.has_table_privilege('authenticated','public.sales','INSERT'),
  'authenticated clients cannot bypass sale RPC'
);
select extensions.ok(
  pg_catalog.has_function_privilege('authenticated','public.create_trading_sale(uuid,uuid,jsonb,numeric,text,text,text)','EXECUTE'),
  'authenticated clients can call the atomic sale RPC'
);
select extensions.ok(
  not pg_catalog.has_function_privilege('anon','public.create_trading_sale(uuid,uuid,jsonb,numeric,text,text,text)','EXECUTE'),
  'anonymous clients cannot call the sale RPC'
);

set local role authenticated;
select pg_catalog.set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000002',true);

select extensions.is(
  (select count(*)::integer from public.products where business_id='72000000-0000-4000-8000-000000000001'),
  1,
  'trading cashier can read their business products'
);
select extensions.throws_ok(
  $$ insert into public.products (business_id,name,unit_price,stock_quantity,created_by)
     values ('72000000-0000-4000-8000-000000000001','Forbidden product',10,1,'71000000-0000-4000-8000-000000000002') $$,
  '42501',
  null,
  'trading cashier without products.manage cannot insert products'
);
select extensions.throws_ok(
  $$ insert into public.inventory_movements (business_id,product_id,movement_type,quantity,created_by)
     values ('72000000-0000-4000-8000-000000000001','73000000-0000-4000-8000-000000000001','stock_out',1,'71000000-0000-4000-8000-000000000002') $$,
  '42501',
  null,
  'trading cashier cannot forge inventory movements directly'
);
select extensions.is(
  (select count(*)::integer from public.businesses where id='72000000-0000-4000-8000-000000000002'),
  0,
  'trading cashier cannot read a different Tailor business'
);

reset role;
set local role authenticated;
select pg_catalog.set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000003',true);
select extensions.lives_ok(
  $ insert into public.products (business_id,name,unit_price,stock_quantity,created_by)
     values ('72000000-0000-4000-8000-000000000002','Tailor legacy product',25,2,'71000000-0000-4000-8000-000000000003') $,
  'Tailor owner retains the existing ability to add products'
);

select * from extensions.finish();
rollback;
