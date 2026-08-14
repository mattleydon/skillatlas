begin;

select plan(16);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'member-a@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'member-b@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

set local role anon;

select is(
  (select count(*) from public.countries),
  195::bigint,
  'anonymous visitors may read canonical countries'
);

select is(
  (select count(*) from public.profiles),
  0::bigint,
  'anonymous visitors may read the public profile catalogue'
);

select throws_ok(
  $$
    insert into public.profiles (id, username, display_name)
    values ('11111111-1111-4111-8111-111111111111', 'member_a', 'Member A')
  $$,
  '42501',
  null,
  'signed-out visitors cannot create profiles'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    insert into public.profiles (id, username, display_name, country_id)
    values (
      '11111111-1111-4111-8111-111111111111',
      'member_a',
      'Member A',
      'australia'
    )
  $$,
  'an authenticated member may create their own profile'
);

select throws_ok(
  $$
    insert into public.profiles (id, username, display_name)
    values ('22222222-2222-4222-8222-222222222222', 'other_member', 'Other Member')
  $$,
  '42501',
  null,
  'a member cannot create a profile for another Auth UUID'
);

select lives_ok(
  $$
    update public.profiles
    set display_name = 'Member A Updated', country_id = null
    where id = '11111111-1111-4111-8111-111111111111'
  $$,
  'an owner may update approved profile fields'
);

select is(
  (select display_name from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'Member A Updated',
  'owner profile update is persisted'
);

select throws_ok(
  $$
    update public.profiles
    set username = 'renamed_member'
    where id = '11111111-1111-4111-8111-111111111111'
  $$,
  '42501',
  null,
  'username cannot be changed through the member API role'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    insert into public.profiles (id, username, display_name, country_id)
    values (
      '22222222-2222-4222-8222-222222222222',
      'member_b',
      'Member B',
      'not-a-country'
    )
  $$,
  '23503',
  null,
  'invalid country ids are rejected by the foreign key'
);

reset role;

insert into public.profiles (id, username, display_name, created_at, updated_at)
values (
  '22222222-2222-4222-8222-222222222222',
  'member_b',
  'Member B',
  '2020-01-01 00:00:00+00',
  '2020-01-01 00:00:00+00'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    update public.profiles
    set display_name = 'Attempted cross-account update'
    where id = '22222222-2222-4222-8222-222222222222'
  $$,
  'a cross-account update is safely filtered by RLS'
);

select is(
  (select display_name from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  'Member B',
  'a member cannot modify another public profile'
);

select throws_ok(
  $$delete from public.profiles where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501',
  null,
  'member API roles cannot delete profiles'
);

reset role;

select throws_ok(
  $$
    update public.profiles
    set username = 'Member_B'
    where id = '22222222-2222-4222-8222-222222222222'
  $$,
  '23514',
  null,
  'uppercase username variants are rejected'
);

select throws_ok(
  $$
    update public.profiles
    set username = 'member_a'
    where id = '22222222-2222-4222-8222-222222222222'
  $$,
  '23505',
  null,
  'case-insensitive username uniqueness rejects collisions'
);

select throws_ok(
  $$
    update public.profiles
    set username = 'admin'
    where id = '22222222-2222-4222-8222-222222222222'
  $$,
  '23514',
  null,
  'reserved usernames are rejected by the database'
);

update public.profiles
set display_name = 'Member B Updated'
where id = '22222222-2222-4222-8222-222222222222';

select ok(
  (
    select updated_at > '2020-01-01 00:00:00+00'::timestamptz
    from public.profiles
    where id = '22222222-2222-4222-8222-222222222222'
  ),
  'updated_at is database-managed on profile updates'
);

select * from finish();

rollback;
