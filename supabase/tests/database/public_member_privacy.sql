begin;

select plan(23);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'privacy-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'privacy-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (
  id, username, display_name, bio, representing_country_id, birth_country_id,
  residence_country_id, city_town
)
values
  ('44444444-4444-4444-8444-444444444444', 'Privacy_A', 'Privacy A', 'Public bio', 'australia', 'japan', 'denmark', 'Sydney'),
  ('55555555-5555-4555-8555-555555555555', 'Privacy_B', 'Privacy B', null, null, null, null, null);

insert into public.profile_heritage_countries (profile_id, country_id, position)
values
  ('44444444-4444-4444-8444-444444444444', 'new-zealand', 1),
  ('44444444-4444-4444-8444-444444444444', 'ireland', 2);

set local role anon;

select throws_ok('select * from public.profiles', '42501', null, 'anonymous raw profile access is denied');
select is((select count(*) from public.get_public_member_profile('privacy_a')), 1::bigint, 'public lookup is case-insensitive');
select is((select username from public.get_public_member_profile('PRIVACY_A')), 'Privacy_A', 'public lookup preserves stored capitalization');
select ok(not (select to_jsonb(member) ? 'id' from public.get_public_member_profile('Privacy_A') as member), 'public payload contains no Auth UUID field');
select is((select birth_country from public.get_public_member_profile('Privacy_A')), null::jsonb, 'private Born is absent');
select is((select residence_country from public.get_public_member_profile('Privacy_A')), null::jsonb, 'private Lives In is absent');
select is((select city_town from public.get_public_member_profile('Privacy_A')), null::text, 'private City / Town is absent');
select is((select heritage from public.get_public_member_profile('Privacy_A')), null::jsonb, 'private Heritage is absent');
select is((select bio from public.get_public_member_profile('Privacy_A')), 'Public bio', 'approved public bio is returned');
select is((select representing_country ->> 'id' from public.get_public_member_profile('Privacy_A')), 'australia', 'Representing is public when selected');

reset role;
update public.profiles set birth_country_is_public = true where id = '44444444-4444-4444-8444-444444444444';
set local role anon;
select is((select birth_country ->> 'id' from public.get_public_member_profile('Privacy_A')), 'japan', 'public Born is exposed when enabled');
select is((select residence_country from public.get_public_member_profile('Privacy_A')), null::jsonb, 'enabling Born does not expose Lives In');

reset role;
update public.profiles set residence_country_is_public = true where id = '44444444-4444-4444-8444-444444444444';
set local role anon;
select is((select residence_country ->> 'id' from public.get_public_member_profile('Privacy_A')), 'denmark', 'public Lives In is exposed when enabled');
select is((select city_town from public.get_public_member_profile('Privacy_A')), null::text, 'Lives In visibility does not expose City / Town');

reset role;
update public.profiles set city_town_is_public = true where id = '44444444-4444-4444-8444-444444444444';
set local role anon;
select is((select city_town from public.get_public_member_profile('Privacy_A')), 'Sydney', 'public City / Town is exposed when enabled');

reset role;
update public.profiles set heritage_is_public = true where id = '44444444-4444-4444-8444-444444444444';
set local role anon;
select is((select jsonb_array_length(heritage) from public.get_public_member_profile('Privacy_A')), 2, 'public Heritage exposes only the ordered list');
select is((select heritage -> 0 ->> 'id' from public.get_public_member_profile('Privacy_A')), 'new-zealand', 'public Heritage preserves position order');
select is((select count(*) from public.get_public_member_profile('does-not-exist')), 0::bigint, 'nonexistent member returns no row and no account leak');

reset role;
update public.profiles
set birth_country_is_public = false, residence_country_is_public = false,
    city_town_is_public = false, heritage_is_public = false
where id = '44444444-4444-4444-8444-444444444444';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select is((select birth_country from public.get_public_member_profile('Privacy_A')), null::jsonb, 'owner authentication does not widen public RPC output');
select is((select birth_country_id from public.profiles where id = '44444444-4444-4444-8444-444444444444'), 'japan', 'owner retains private raw access to their own Born value');
select ok(not (select to_jsonb(member) ? 'id' from public.get_public_member_profile('Privacy_A') as member), 'authenticated public payload still contains no Auth UUID');
select is((select count(*) from public.profiles where id = '55555555-5555-4555-8555-555555555555'), 0::bigint, 'owner cannot read another member raw profile');
select is((select count(*) from public.get_public_member_profile('Privacy_B')), 1::bigint, 'authenticated visitors retain safe public member reads');

select * from finish();

rollback;
