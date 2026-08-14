begin;

select plan(18);

select has_table('public', 'countries', 'countries table exists');
select has_table('public', 'profiles', 'profiles table exists');

select is(
  (select count(*) from public.countries),
  195::bigint,
  'countries contains exactly 195 sovereign records'
);

select is(
  (select count(distinct id) from public.countries),
  195::bigint,
  'country ids are unique'
);

select is(
  (select count(distinct iso2) from public.countries),
  195::bigint,
  'country ISO2 codes are unique'
);

select is(
  (select count(*) from public.countries where name = '' or name <> btrim(name)),
  0::bigint,
  'country names are non-empty and trimmed'
);

select is(
  (
    select count(*)
    from public.countries
    where region not in (
      'Africa',
      'Asia',
      'Europe',
      'Middle East',
      'North America',
      'Oceania',
      'South America'
    )
  ),
  0::bigint,
  'countries use only canonical regions'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.countries'::regclass),
  'countries has RLS enabled'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has RLS enabled'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'p'
      and conkey = array[
        (select attnum from pg_attribute where attrelid = 'public.profiles'::regclass and attname = 'id')
      ]::smallint[]
  ),
  'profiles id is the primary key'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'f'
      and confrelid = 'auth.users'::regclass
  ),
  'profiles id references auth.users'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'f'
      and confrelid = 'public.countries'::regclass
  ),
  'profiles country_id references countries'
);

select col_type_is(
  'public',
  'profiles',
  'username',
  'extensions.citext',
  'profile usernames use case-insensitive citext storage'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) like 'UNIQUE (username)%'
  ),
  'profile usernames have database uniqueness'
);

select col_has_default('public', 'profiles', 'created_at', 'created_at is database-generated');
select col_has_default('public', 'profiles', 'updated_at', 'updated_at is database-generated');

select has_trigger(
  'public',
  'profiles',
  'profiles_set_updated_at',
  'profiles has a database-managed updated_at trigger'
);

select is(
  (
    select count(*)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'profiles'
      and grantee in ('anon', 'authenticated')
      and privilege_type = 'DELETE'
  ),
  0::bigint,
  'member API roles have no profile delete privilege'
);

select * from finish();

rollback;
