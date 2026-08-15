begin;

select plan(36);

select has_table('public', 'countries', 'countries table exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'profile_heritage_countries', 'profile Heritage table exists');

select is((select count(*) from public.countries), 195::bigint, 'countries contains exactly 195 sovereign records');
select is((select count(distinct id) from public.countries), 195::bigint, 'country ids are unique');
select is((select count(distinct iso2) from public.countries), 195::bigint, 'country ISO2 codes are unique');
select is((select count(*) from public.countries where name = '' or name <> btrim(name)), 0::bigint, 'country names are non-empty and trimmed');
select is(
  (select count(*) from public.countries where region not in ('Africa', 'Asia', 'Europe', 'Middle East', 'North America', 'Oceania', 'South America')),
  0::bigint,
  'countries use only canonical regions'
);

select ok((select relrowsecurity from pg_class where oid = 'public.countries'::regclass), 'countries has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.profile_heritage_countries'::regclass), 'profile Heritage has RLS enabled');

select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and contype = 'p'),
  'profiles has a primary key'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.profile_heritage_countries'::regclass and contype = 'p'),
  'profile Heritage has a primary key'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and contype = 'f' and confrelid = 'auth.users'::regclass),
  'profiles id references auth.users'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_representing_country_id_fkey'),
  'Representing references countries'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_birth_country_id_fkey'),
  'Born references countries'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_residence_country_id_fkey'),
  'Lives In references countries'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.profile_heritage_countries'::regclass and confrelid = 'public.profiles'::regclass),
  'profile Heritage references profiles'
);
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.profile_heritage_countries'::regclass and confrelid = 'public.countries'::regclass),
  'profile Heritage references countries'
);

select col_type_is('public', 'profiles', 'username', 'extensions.citext', 'usernames retain case-preserving citext storage');
select ok(
  exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and contype = 'u' and pg_get_constraintdef(oid) like 'UNIQUE (username)%'),
  'profile usernames remain case-insensitively unique'
);
select col_has_default('public', 'profiles', 'created_at', 'created_at is database-generated');
select col_has_default('public', 'profiles', 'updated_at', 'updated_at is database-generated');
select col_default_is('public', 'profiles', 'birth_country_is_public', 'false', 'Born defaults private');
select col_default_is('public', 'profiles', 'residence_country_is_public', 'false', 'Lives In defaults private');
select col_default_is('public', 'profiles', 'city_town_is_public', 'false', 'City / Town defaults private');
select col_default_is('public', 'profiles', 'heritage_is_public', 'false', 'Heritage defaults private');

select has_trigger('public', 'profiles', 'profiles_set_updated_at', 'profiles has a database-managed updated_at trigger');
select has_trigger('public', 'profiles', 'profiles_enforce_username_correction', 'profiles enforces one-time capitalization correction');

select is(
  (select count(*) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'profiles' and grantee in ('anon', 'authenticated') and privilege_type = 'DELETE'),
  0::bigint,
  'member API roles have no profile delete privilege'
);
select is(
  (select count(*) from information_schema.role_table_grants where table_schema = 'public' and table_name = 'profiles' and grantee = 'anon' and privilege_type = 'SELECT'),
  0::bigint,
  'anonymous clients have no raw profile SELECT grant'
);

select ok(to_regprocedure('public.get_public_member_profile(text)') is not null, 'public-safe member RPC exists');
select ok(to_regprocedure('public.update_profile_country_identity(text,text,text,text,boolean,boolean,boolean,boolean,text[])') is not null, 'atomic country identity RPC exists');
select ok(has_function_privilege('anon', 'public.get_public_member_profile(text)', 'EXECUTE'), 'anonymous clients may execute only the public member projection');
select ok(not has_function_privilege('anon', 'public.update_profile_country_identity(text,text,text,text,boolean,boolean,boolean,boolean,text[])', 'EXECUTE'), 'anonymous clients cannot update country identity');
select ok(has_function_privilege('authenticated', 'public.update_profile_country_identity(text,text,text,text,boolean,boolean,boolean,boolean,text[])', 'EXECUTE'), 'authenticated clients may call the owner-scoped country identity mutation');

select * from finish();

rollback;
