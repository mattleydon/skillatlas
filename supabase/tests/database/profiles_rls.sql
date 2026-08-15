begin;

select plan(20);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'member-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'member-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'member-c@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '99999999-9999-4999-8999-999999999999', 'authenticated', 'authenticated', 'member-d@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, username, display_name, username_case_correction_available, created_at, updated_at)
values
  ('22222222-2222-4222-8222-222222222222', 'member_b', 'Member B', true, '2020-01-01 00:00:00+00', '2020-01-01 00:00:00+00'),
  ('33333333-3333-4333-8333-333333333333', 'member_c', 'Member C', true, now(), now());

set local role anon;

select is((select count(*) from public.countries), 195::bigint, 'anonymous visitors may read canonical countries');
select throws_ok('select count(*) from public.profiles', '42501', null, 'anonymous visitors cannot read raw profiles');
select throws_ok(
  $$insert into public.profiles (id, username, display_name) values ('11111111-1111-4111-8111-111111111111', 'Member_A', 'Member A')$$,
  '42501', null, 'signed-out visitors cannot create profiles'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.profiles (id, username, display_name, representing_country_id) values ('11111111-1111-4111-8111-111111111111', 'Member_A', 'Member A', 'australia')$$,
  'an authenticated member may create a mixed-case profile they own'
);
select is((select username::text from public.profiles where id = '11111111-1111-4111-8111-111111111111'), 'Member_A', 'stored username capitalization is preserved');
select is((select count(*) from public.profiles), 1::bigint, 'authenticated raw profile reads are owner-only');
select lives_ok(
  $$update public.profiles set display_name = 'Member A Updated', bio = 'Atlas member' where id = '11111111-1111-4111-8111-111111111111'$$,
  'an owner may update approved profile identity fields'
);
select is((select display_name from public.profiles where id = '11111111-1111-4111-8111-111111111111'), 'Member A Updated', 'owner profile update is persisted');
select throws_ok(
  $$update public.profiles set username = 'MEMBER_A' where id = '11111111-1111-4111-8111-111111111111'$$,
  '22023', null, 'new PR3 profiles do not receive the legacy capitalization correction'
);
select throws_ok(
  $$insert into public.profiles (id, username, display_name) values ('22222222-2222-4222-8222-222222222222', 'Other_Member', 'Other Member')$$,
  '42501', null, 'a member cannot create a profile for another Auth UUID'
);

select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select lives_ok($$update public.profiles set username = 'Member_B' where id = '22222222-2222-4222-8222-222222222222'$$, 'an eligible existing member may correct capitalization once');
select is((select username::text from public.profiles where id = '22222222-2222-4222-8222-222222222222'), 'Member_B', 'capitalization correction preserves the approved spelling');
select ok((select username_case_corrected_at is not null and not username_case_correction_available from public.profiles where id = '22222222-2222-4222-8222-222222222222'), 'capitalization correction is audited and consumed');
select throws_ok($$update public.profiles set username = 'MEMBER_B' where id = '22222222-2222-4222-8222-222222222222'$$, '22023', null, 'a second capitalization correction is rejected');

select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select throws_ok($$update public.profiles set username = 'Member_X' where id = '33333333-3333-4333-8333-333333333333'$$, '22023', null, 'a non-case-changing rename is rejected');
select lives_ok($$update public.profiles set display_name = 'Attempted cross-account update' where id = '22222222-2222-4222-8222-222222222222'$$, 'a cross-account update is safely filtered by RLS');
select is((select display_name from public.profiles where id = '33333333-3333-4333-8333-333333333333'), 'Member C', 'another member can read only their own raw profile');
select throws_ok($$delete from public.profiles where id = '33333333-3333-4333-8333-333333333333'$$, '42501', null, 'member API roles cannot delete profiles');

reset role;
select throws_ok(
  $$insert into public.profiles (id, username, display_name) values ('11111111-1111-4111-8111-111111111111', 'member_a', 'Duplicate')$$,
  '23505', null, 'case-insensitive username uniqueness rejects collisions'
);
select throws_ok(
  $$insert into public.profiles (id, username, display_name) values ('99999999-9999-4999-8999-999999999999', 'Admin', 'Reserved')$$,
  '23514', null, 'reserved usernames are rejected under any capitalization'
);

select * from finish();

rollback;
