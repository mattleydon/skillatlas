begin;
select no_plan();

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777777', 'authenticated', 'authenticated', 'identity-v2-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '88888888-8888-4888-8888-888888888888', 'authenticated', 'authenticated', 'identity-v2-b@example.test', '', now(), '{}', '{}', now(), now());
insert into public.profiles(id, username, display_name) values
  ('77777777-7777-4777-8777-777777777777', 'Identity_A', 'Identity A'),
  ('88888888-8888-4888-8888-888888888888', 'Identity_B', 'Identity B');

select is((select count(*) from public.profile_game_catalogue), 6::bigint, 'canonical Game reference scope');
select is((select public from storage.buckets where id = 'member-avatars'), true, 'avatar bytes are explicitly public identity');
select is((select file_size_limit from storage.buckets where id = 'member-avatars'), 262144::bigint, 'bounded stored avatar bytes');
select is((select allowed_mime_types from storage.buckets where id = 'member-avatars'), array['image/webp'], 'only processed WebP in avatar bucket');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}', true);
select lives_ok($$select public.update_profile_gaming_identity(array['cs2','league'], false, array['pc','mobile'], false, 2012, false)$$, 'owner saves voluntary private identity');
select is((select platform_ids from public.profiles), array['pc','mobile'], 'owner sees own platform choices');
select is((select gaming_since from public.profiles), 2012::smallint, 'owner sees declared year');
select is((select array_agg(game_id order by position) from public.profile_favourite_games), array['cs2','league'], 'favourites persist in explicit order');
select throws_ok($$select public.update_profile_gaming_identity(array['invented'], false, '{}', false, 0, false)$$, '23503', null, 'invalid Game ID rejected by FK');
select throws_ok($$select public.update_profile_gaming_identity(array['cs2','cs2'], false, '{}', false, 0, false)$$, '23514', null, 'duplicate games rejected');
select throws_ok($$select public.update_profile_gaming_identity('{}', false, array['invented'], false, 0, false)$$, '23514', null, 'invalid platform rejected');
select throws_ok($$select public.update_profile_gaming_identity('{}', false, array['pc','pc'], false, 0, false)$$, '23514', null, 'duplicate platforms rejected');
select throws_ok($$update public.profiles set platform_ids = array['pc','pc']$$, '23514', null, 'direct writes cannot bypass unique platform validation');
select throws_ok($$select public.update_profile_gaming_identity('{}', false, '{}', false, 9999, false)$$, '23514', null, 'future year rejected');
select throws_ok($$select public.update_profile_gaming_identity('{}', false, '{}', false, -1, false)$$, '23514', null, 'invalid year rejected');
select is((select gaming_since from public.profiles), 2012::smallint, 'failed saves roll back atomically');
select is((select count(*) from public.profiles where username = 'Identity_B'), 0::bigint, 'other raw profile not readable');
with changed as (update public.profiles set gaming_since = 2010 where username = 'Identity_B' returning id)
select is((select count(*) from changed), 0::bigint, 'other profile not writable');
select throws_ok($$insert into public.profile_favourite_games values ('88888888-8888-4888-8888-888888888888','cs2',1)$$, '42501', null, 'other favourites not writable');

reset role;
set local role anon;
select throws_ok('select * from public.profile_favourite_games', '42501', null, 'anonymous raw favourite reads denied');
select is((select favourite_game_ids from public.get_public_member_profile('Identity_A')), null::text[], 'private games never exposed');
select is((select platform_ids from public.get_public_member_profile('Identity_A')), null::text[], 'private platforms never exposed');
select is((select gaming_since from public.get_public_member_profile('Identity_A')), null::smallint, 'private year never exposed');
select ok(not (select to_jsonb(member) ? 'id' from public.get_public_member_profile('Identity_A') member), 'public projection never exposes Auth ID');
select throws_ok($$select public.update_profile_gaming_identity('{}', false, '{}', false, 0, false)$$, '42501', null, 'anonymous mutations denied');

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}', true);
select lives_ok($$select public.update_profile_gaming_identity(array['league','cs2'], true, array['pc'], true, 2012, true)$$, 'owner publishes and reorders');
select is((select favourite_game_ids from public.get_public_member_profile('Identity_A')), array['league','cs2'], 'public projection preserves new order');
select is((select platform_ids from public.get_public_member_profile('Identity_A')), array['pc'], 'public platforms appear');
select is((select gaming_since from public.get_public_member_profile('Identity_A')), 2012::smallint, 'public year appears');
select lives_ok($$select public.update_profile_gaming_identity(array['cs2'], false, array['pc'], false, 2012, false)$$, 'owner makes values private again and removes favourite');
select is((select favourite_game_ids from public.get_public_member_profile('Identity_A')), null::text[], 'private cycle hides games even from owner public view');
select lives_ok($$select public.update_profile_gaming_identity('{}', true, '{}', true, 0, true)$$, 'owner clears all optional identity');
select is((select gaming_since from public.profiles), null::smallint, 'clear year persists null');
select is((select count(*) from public.profile_favourite_games), 0::bigint, 'removed favourites are deleted, not retained');
select is((select platforms_is_public from public.profiles), false, 'clear resets visibility');

-- Metadata-only policy fixtures rolled back below, never real Storage file deletion.
select lives_ok($$insert into storage.objects(bucket_id,name,owner_id) values ('member-avatars','identity_a/avatar.webp','77777777-7777-4777-8777-777777777777')$$, 'owner may write their fixed avatar path');
select throws_ok($$insert into storage.objects(bucket_id,name) values ('member-avatars','identity_b/avatar.webp')$$, '42501', null, 'owner cannot write another avatar');
select throws_ok($$insert into storage.objects(bucket_id,name) values ('member-avatars','identity_a/extra.webp')$$, '42501', null, 'arbitrary bucket writes rejected');
select lives_ok($$update storage.objects set metadata = '{"test":"replacement"}' where bucket_id = 'member-avatars' and name = 'identity_a/avatar.webp'$$, 'owner replacement policy');
select lives_ok($$update public.profiles set avatar_version = '99999999-9999-4999-8999-999999999999'$$, 'owner publishes avatar version');
select is((select avatar_version from public.get_public_member_profile('Identity_A')), '99999999-9999-4999-8999-999999999999'::uuid, 'public avatar version contains no owner Auth ID');

reset role;
set local role anon;
select is((select count(*) from storage.objects where bucket_id = 'member-avatars'), 0::bigint, 'anonymous metadata/listing does not expose owner UUID');
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"88888888-8888-4888-8888-888888888888","role":"authenticated"}', true);
with changed as (update storage.objects set metadata = '{}' where name = 'identity_a/avatar.webp' returning id)
select is((select count(*) from changed), 0::bigint, 'other member cannot replace avatar');
select throws_ok($$delete from storage.objects where name = 'identity_a/avatar.webp'$$,
  '42501', null, 'Storage rejects direct SQL deletion, including another member asset');
reset role;
select throws_ok($$delete from public.profiles where username = 'Identity_A'$$, '23503', null, 'administrative deletion fails closed until Storage API cleanup');
select throws_ok($$delete from auth.users where id = '77777777-7777-4777-8777-777777777777'$$, '23503', null, 'account cascade also requires avatar cleanup');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}', true);
select throws_ok($$delete from storage.objects where bucket_id = 'member-avatars' and name = 'identity_a/avatar.webp'$$,
  '42501', null, 'owner must use Storage API for physical removal; tested in local API suite');
select lives_ok($$update public.profiles set avatar_version = null$$, 'owner restores initials state');
reset role;
select lives_ok($$delete from auth.users where id = '88888888-8888-4888-8888-888888888888'$$, 'account without stored files can be deleted');
select is((select count(*) from public.get_public_member_profile('Identity_B')), 0::bigint, 'deleted identity no longer public');
select * from finish();
rollback;
