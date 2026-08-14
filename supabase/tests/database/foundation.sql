begin;

select plan(3);

select has_schema('public', 'public schema is available to repository migrations');

select ok(
  to_regclass('public.countries') is not null,
  'canonical countries table is present'
);

select ok(
  to_regclass('public.profiles') is not null,
  'member profiles table is present'
);

select * from finish();

rollback;
