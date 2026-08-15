-- SkillAtlas Accounts V0.1 PR 3A: extended member identity and public privacy boundary.

alter table public.profiles
  rename column country_id to representing_country_id;

alter table public.profiles
  rename constraint profiles_country_id_fkey to profiles_representing_country_id_fkey;

alter table public.profiles
  drop constraint profiles_username_lowercase,
  drop constraint profiles_username_format,
  drop constraint profiles_username_not_reserved;

alter table public.profiles
  add column bio text,
  add column birth_country_id text references public.countries(id) on delete set null,
  add column residence_country_id text references public.countries(id) on delete set null,
  add column city_town text,
  add column birth_country_is_public boolean not null default false,
  add column residence_country_is_public boolean not null default false,
  add column city_town_is_public boolean not null default false,
  add column heritage_is_public boolean not null default false,
  add column username_case_correction_available boolean not null default true,
  add column username_case_corrected_at timestamptz,
  add constraint profiles_username_format check (
    username::text ~ '^[A-Za-z0-9](?:[A-Za-z0-9_]{1,22}[A-Za-z0-9])$'
  ),
  add constraint profiles_username_not_reserved check (
    lower(username::text) not in (
      'admin',
      'administrator',
      'api',
      'auth',
      'account',
      'accounts',
      'member',
      'members',
      'profile',
      'profiles',
      'rankings',
      'user-rankings',
      'live-rankings',
      'world-map',
      'countries',
      'players',
      'forum',
      'about',
      'settings',
      'support',
      'help',
      'system',
      'skillatlas'
    )
  ),
  add constraint profiles_bio_format check (
    bio is null
    or (
      bio = btrim(bio)
      and char_length(bio) between 1 and 280
      and array_length(string_to_array(bio, E'\n'), 1) <= 3
      and replace(bio, E'\n', '') !~ '[[:cntrl:]]'
    )
  ),
  add constraint profiles_city_town_format check (
    city_town is null
    or (
      city_town = btrim(city_town)
      and char_length(city_town) between 1 and 80
      and city_town !~ '[[:cntrl:]]'
    )
  ),
  add constraint profiles_birth_visibility_requires_country check (
    not birth_country_is_public or birth_country_id is not null
  ),
  add constraint profiles_residence_visibility_requires_country check (
    not residence_country_is_public or residence_country_id is not null
  ),
  add constraint profiles_city_visibility_requires_value check (
    not city_town_is_public or city_town is not null
  ),
  add constraint profiles_username_case_correction_state check (
    not username_case_correction_available or username_case_corrected_at is null
  );

-- The column-add default marks rows that predate this migration as eligible
-- without firing the profile updated_at trigger. New rows default to ineligible.
alter table public.profiles
  alter column username_case_correction_available set default false;

create index profiles_username_casefold_idx
on public.profiles (lower(username::text));

create function public.enforce_profile_username_correction()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.username::text is distinct from old.username::text then
    if not old.username_case_correction_available
      or old.username_case_corrected_at is not null then
      raise exception 'username is immutable'
        using errcode = '22023';
    end if;

    if lower(new.username::text) <> lower(old.username::text) then
      raise exception 'only capitalization may be corrected'
        using errcode = '22023';
    end if;

    new.username_case_correction_available = false;
    new.username_case_corrected_at = now();
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_username_correction() from public, anon, authenticated;

create trigger profiles_enforce_username_correction
before update of username on public.profiles
for each row
execute function public.enforce_profile_username_correction();

create table public.profile_heritage_countries (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  country_id text not null references public.countries(id) on delete restrict,
  position smallint not null,
  primary key (profile_id, country_id),
  constraint profile_heritage_position_unique unique (profile_id, position),
  constraint profile_heritage_position_range check (position between 1 and 5)
);

create index profile_heritage_country_id_idx
on public.profile_heritage_countries (country_id);

alter table public.profile_heritage_countries enable row level security;

revoke all on table public.profile_heritage_countries from anon, authenticated;
grant select, insert, update, delete on table public.profile_heritage_countries to authenticated;

create policy "Members read their own heritage"
on public.profile_heritage_countries
for select
to authenticated
using ((select auth.uid()) = profile_id);

create policy "Members add their own heritage"
on public.profile_heritage_countries
for insert
to authenticated
with check ((select auth.uid()) = profile_id);

create policy "Members update their own heritage"
on public.profile_heritage_countries
for update
to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

create policy "Members remove their own heritage"
on public.profile_heritage_countries
for delete
to authenticated
using ((select auth.uid()) = profile_id);

drop policy "Profiles are publicly readable" on public.profiles;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, username, display_name, bio, representing_country_id)
  on table public.profiles to authenticated;
grant update (
  username,
  display_name,
  bio,
  representing_country_id,
  birth_country_id,
  residence_country_id,
  city_town,
  birth_country_is_public,
  residence_country_is_public,
  city_town_is_public,
  heritage_is_public
) on table public.profiles to authenticated;

create policy "Members read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create function public.update_profile_country_identity(
  p_representing_country_id text,
  p_birth_country_id text,
  p_residence_country_id text,
  p_city_town text,
  p_birth_country_is_public boolean,
  p_residence_country_is_public boolean,
  p_city_town_is_public boolean,
  p_heritage_is_public boolean,
  p_heritage_country_ids text[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  member_id uuid := (select auth.uid());
  heritage_count integer := coalesce(cardinality(p_heritage_country_ids), 0);
begin
  if member_id is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if heritage_count > 5 then
    raise exception 'heritage is limited to five countries'
      using errcode = '23514';
  end if;

  if heritage_count <> (
    select count(distinct country_id)
    from unnest(coalesce(p_heritage_country_ids, '{}'::text[])) as country_id
  ) then
    raise exception 'heritage countries must be unique'
      using errcode = '23514';
  end if;

  update public.profiles
  set
    representing_country_id = nullif(p_representing_country_id, ''),
    birth_country_id = nullif(p_birth_country_id, ''),
    residence_country_id = nullif(p_residence_country_id, ''),
    city_town = nullif(btrim(p_city_town), ''),
    birth_country_is_public = p_birth_country_is_public,
    residence_country_is_public = p_residence_country_is_public,
    city_town_is_public = p_city_town_is_public,
    heritage_is_public = p_heritage_is_public
  where id = member_id;

  if not found then
    raise exception 'member profile not found'
      using errcode = 'P0002';
  end if;

  delete from public.profile_heritage_countries
  where profile_id = member_id;

  insert into public.profile_heritage_countries (profile_id, country_id, position)
  select member_id, country_id, position::smallint
  from unnest(coalesce(p_heritage_country_ids, '{}'::text[]))
    with ordinality as heritage(country_id, position);
end;
$$;

revoke all on function public.update_profile_country_identity(
  text, text, text, text, boolean, boolean, boolean, boolean, text[]
) from public, anon, authenticated;
grant execute on function public.update_profile_country_identity(
  text, text, text, text, boolean, boolean, boolean, boolean, text[]
) to authenticated;

create function public.get_public_member_profile(p_username text)
returns table (
  username text,
  display_name text,
  bio text,
  created_at timestamptz,
  representing_country jsonb,
  birth_country jsonb,
  residence_country jsonb,
  city_town text,
  heritage jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.username::text,
    profile.display_name,
    profile.bio,
    profile.created_at,
    case
      when representing.id is null then null
      else jsonb_build_object(
        'id', representing.id,
        'iso2', representing.iso2,
        'name', representing.name,
        'region', representing.region
      )
    end,
    case
      when profile.birth_country_is_public and born.id is not null then jsonb_build_object(
        'id', born.id,
        'iso2', born.iso2,
        'name', born.name,
        'region', born.region
      )
      else null
    end,
    case
      when profile.residence_country_is_public and residence.id is not null then jsonb_build_object(
        'id', residence.id,
        'iso2', residence.iso2,
        'name', residence.name,
        'region', residence.region
      )
      else null
    end,
    case when profile.city_town_is_public then profile.city_town else null end,
    case
      when profile.heritage_is_public then coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', country.id,
              'iso2', country.iso2,
              'name', country.name,
              'region', country.region,
              'position', heritage_country.position
            )
            order by heritage_country.position
          )
          from public.profile_heritage_countries as heritage_country
          join public.countries as country on country.id = heritage_country.country_id
          where heritage_country.profile_id = profile.id
        ),
        '[]'::jsonb
      )
      else null
    end
  from public.profiles as profile
  left join public.countries as representing on representing.id = profile.representing_country_id
  left join public.countries as born on born.id = profile.birth_country_id
  left join public.countries as residence on residence.id = profile.residence_country_id
  where lower(profile.username::text) = lower(p_username)
  limit 1;
$$;

revoke all on function public.get_public_member_profile(text) from public, anon, authenticated;
grant execute on function public.get_public_member_profile(text) to anon, authenticated;
