begin;

select plan(15);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'heritage-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777777', 'authenticated', 'authenticated', 'heritage-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, username, display_name)
values
  ('66666666-6666-4666-8666-666666666666', 'Heritage_A', 'Heritage A'),
  ('77777777-7777-4777-8777-777777777777', 'Heritage_B', 'Heritage B');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}', true);

select lives_ok(
  $$select public.update_profile_country_identity('australia', 'japan', 'denmark', 'Sydney', false, false, false, false, array['ireland','new-zealand','canada'])$$,
  'owner may atomically save country identity and ordered Heritage'
);
select is((select count(*) from public.profile_heritage_countries), 3::bigint, 'three Heritage countries are stored');
select is((select string_agg(country_id, ',' order by position) from public.profile_heritage_countries), 'ireland,new-zealand,canada', 'Heritage order is preserved');
select is((select array_agg(position order by position) from public.profile_heritage_countries), array[1,2,3]::smallint[], 'Heritage positions are contiguous');
select throws_ok(
  $$select public.update_profile_country_identity('', '', '', '', false, false, false, false, array['australia','australia'])$$,
  '23514', null, 'duplicate Heritage countries are rejected'
);
select throws_ok(
  $$select public.update_profile_country_identity('', '', '', '', false, false, false, false, array['australia','japan','denmark','ireland','canada','brazil'])$$,
  '23514', null, 'a sixth Heritage country is rejected'
);
select throws_ok(
  $$select public.update_profile_country_identity('', '', '', '', false, false, false, false, array['not-a-country'])$$,
  '23503', null, 'an invalid Heritage country is rejected by the canonical foreign key'
);
select lives_ok(
  $$select public.update_profile_country_identity('', '', '', '', false, false, false, true, array['brazil','japan'])$$,
  'Heritage replacement is atomic and reusable'
);
select is((select count(*) from public.profile_heritage_countries), 2::bigint, 'replacement removes stale Heritage rows');
select is((select string_agg(country_id, ',' order by position) from public.profile_heritage_countries), 'brazil,japan', 'replacement preserves the new order');
select lives_ok(
  $$select public.update_profile_country_identity('', '', '', '', false, false, false, false, array[]::text[])$$,
  'zero Heritage countries is valid'
);
select is((select count(*) from public.profile_heritage_countries), 0::bigint, 'empty replacement clears Heritage');

select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}', true);
select lives_ok(
  $$select public.update_profile_country_identity('', '', '', '', false, false, false, false, array['canada'])$$,
  'second owner may manage only their own Heritage'
);
select throws_ok(
  $$insert into public.profile_heritage_countries (profile_id, country_id, position) values ('66666666-6666-4666-8666-666666666666', 'australia', 1)$$,
  '42501', null, 'cross-account Heritage mutation is rejected'
);
select ok((select not heritage_is_public from public.profiles where id = '77777777-7777-4777-8777-777777777777'), 'Heritage remains private by default');

select * from finish();

rollback;
