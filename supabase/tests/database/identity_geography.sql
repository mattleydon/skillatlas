begin;
select no_plan();

select is((select count(*) from public.countries), 195::bigint, 'competitive geography stays 195');
select is((select count(*) from public.identity_places), 199::bigint, 'Profile identity geography has 199 places');
select is((select count(*) from public.identity_places where place_type = 'constituent_country'
  and parent_country_id = 'united-kingdom' and sovereign_country_id is null), 4::bigint, 'four UK children carry no competitive attribution');
select is((select count(*) from public.countries where id in ('scotland','england','wales','northern-ireland')), 0::bigint, 'constituents are not competitive records');
select is((select count(*) from public.countries c join public.identity_places p using (id)
  where p.name = c.name and p.iso2 = c.iso2 and p.region = c.region and p.sovereign_country_id = c.id), 195::bigint, 'legacy sovereign identities preserved');
select ok((select relrowsecurity from pg_class where oid = 'public.identity_places'::regclass), 'identity catalogue has RLS');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'identity-geography@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());
insert into public.profiles (id, username, display_name, representing_country_id)
values ('66666666-6666-4666-8666-666666666666', 'IdentityGeo', 'Identity Geography', 'australia');

set local role anon;
select is((select count(*) from public.identity_places), 199::bigint, 'anonymous can read reference catalogue');
select throws_ok($$insert into public.identity_places (id,name,place_type,region) values ('fake','Fake','constituent_country','Europe')$$, '42501', null, 'anonymous cannot create places');
select throws_ok($$update public.identity_places set name = 'Changed' where id = 'scotland'$$, '42501', null, 'anonymous cannot edit places');
select throws_ok($$delete from public.identity_places where id = 'scotland'$$, '42501', null, 'anonymous cannot delete places');
select throws_ok($$select public.update_profile_country_identity('scotland','england','wales','Cardiff',false,false,false,false,array['northern-ireland'])$$, '42501', null, 'anonymous cannot save Profile identity');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}', true);
select is((select count(*) from public.identity_places), 199::bigint, 'members can read reference catalogue');
select throws_ok($$insert into public.identity_places (id,name,place_type,region) values ('fake','Fake','constituent_country','Europe')$$, '42501', null, 'member cannot create places');
select throws_ok($$update public.identity_places set name = 'Changed' where id = 'scotland'$$, '42501', null, 'member cannot edit catalogue');
select throws_ok($$delete from public.identity_places where id = 'scotland'$$, '42501', null, 'member cannot delete catalogue');
select lives_ok($$select public.update_profile_country_identity('scotland','england','wales','Cardiff',false,false,false,false,array['northern-ireland','ireland'])$$, 'owner persists all four fields');
select is((select representing_country_id from public.profiles where username = 'IdentityGeo'), 'scotland', 'Representing persists');
select is((select birth_country_id from public.profiles where username = 'IdentityGeo'), 'england', 'Born persists');
select is((select residence_country_id from public.profiles where username = 'IdentityGeo'), 'wales', 'Lives In persists');
select is((select array_agg(country_id order by position) from public.profile_heritage_countries), array['northern-ireland','ireland'], 'owner sees ordered private Heritage');

set local role anon;
select is((select representing_country ->> 'id' from public.get_public_member_profile('IdentityGeo')), 'scotland', 'chosen Representing is public');
select is((select representing_country ->> 'parent_country_id' from public.get_public_member_profile('IdentityGeo')), 'united-kingdom', 'public identity carries geographic context');
select is((select representing_country ->> 'flag_code' from public.get_public_member_profile('IdentityGeo')), 'gb-sct', 'public identity carries flag reference');
select is((select birth_country from public.get_public_member_profile('IdentityGeo')), null::jsonb, 'private Born hidden');
select is((select residence_country from public.get_public_member_profile('IdentityGeo')), null::jsonb, 'private Lives In hidden');
select is((select city_town from public.get_public_member_profile('IdentityGeo')), null::text, 'private City hidden');
select is((select heritage from public.get_public_member_profile('IdentityGeo')), null::jsonb, 'private Heritage hidden');
select throws_ok('select * from public.profiles', '42501', null, 'raw Profiles still protected');

set local role authenticated;
select lives_ok($$select public.update_profile_country_identity('scotland','england','wales','Cardiff',true,true,true,true,array['ireland','northern-ireland'])$$, 'owner opts in and reorders');
set local role anon;
select is((select birth_country ->> 'name' from public.get_public_member_profile('IdentityGeo')), 'England', 'public Born correct');
select is((select residence_country ->> 'name' from public.get_public_member_profile('IdentityGeo')), 'Wales', 'public Lives In correct');
select is((select city_town from public.get_public_member_profile('IdentityGeo')), 'Cardiff', 'opted-in City correct');
select is((select heritage -> 0 ->> 'id' from public.get_public_member_profile('IdentityGeo')), 'ireland', 'reordered public Heritage first');
select is((select heritage -> 1 ->> 'id' from public.get_public_member_profile('IdentityGeo')), 'northern-ireland', 'reordered public Heritage second');
select is((select heritage -> 1 ->> 'flag_code' from public.get_public_member_profile('IdentityGeo')), null::text, 'Northern Ireland does not assert a flag');

set local role authenticated;
select lives_ok($$select public.update_profile_country_identity('united-kingdom','australia','ireland','Dublin',false,false,false,true,array['northern-ireland'])$$, 'legacy sovereigns still save and Heritage removal works');
select is((select jsonb_array_length(heritage) from public.get_public_member_profile('IdentityGeo')), 1, 'removed Heritage absent');
select is((select representing_country ->> 'id' from public.get_public_member_profile('IdentityGeo')), 'united-kingdom', 'UK remains selectable');
select throws_ok($$select public.update_profile_country_identity('invented-place','','','',false,false,false,false,array[]::text[])$$, '23503', null, 'unknown place rejected');
select is((select representing_country_id from public.profiles where username = 'IdentityGeo'), 'united-kingdom', 'failed save leaves prior identity intact');

select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}', true);
select is((select count(*) from public.profiles where username = 'IdentityGeo'), 0::bigint, 'other user cannot read private identity');
select is((select count(*) from public.profile_heritage_countries where profile_id = '66666666-6666-4666-8666-666666666666'), 0::bigint, 'other user cannot read raw Heritage');
select lives_ok($$update public.profiles set representing_country_id = 'scotland' where id = '66666666-6666-4666-8666-666666666666'$$, 'cross-owner update affects no rows');
select is((select representing_country ->> 'id' from public.get_public_member_profile('IdentityGeo')), 'united-kingdom', 'cross-owner attempt changed nothing');
select * from finish();
rollback;
