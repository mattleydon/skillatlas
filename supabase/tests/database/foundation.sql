begin;

select plan(2);

select has_schema('public', 'public schema is available to repository migrations');

select ok(
  to_regclass('public.profiles') is null,
  'PR 1 does not create the deferred public.profiles table'
);

select * from finish();

rollback;
