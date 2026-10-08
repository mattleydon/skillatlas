-- Identity Geography V0.1 is Profile expression, NOT competitive attribution.
-- Preserve all existing values and privacy flags; only retarget identity FKs.
create type public.identity_place_type as enum ('sovereign_country', 'constituent_country');
create table public.identity_places (
  id text primary key,
  name text not null,
  place_type public.identity_place_type not null,
  sovereign_country_id text unique references public.countries(id) on delete restrict,
  parent_country_id text references public.countries(id) on delete restrict,
  iso2 text,
  flag_code text,
  region text not null,
  constraint identity_places_scope check (
    (place_type = 'sovereign_country' and sovereign_country_id = id
      and sovereign_country_id is not null and parent_country_id is null and iso2 is not null)
    or (place_type = 'constituent_country' and sovereign_country_id is null
      and parent_country_id is not null and iso2 is null)
  )
);
create index identity_places_parent_country_idx on public.identity_places(parent_country_id);
alter table public.identity_places enable row level security;
revoke all on public.identity_places from public, anon, authenticated;
grant select on public.identity_places to anon, authenticated;
create policy "Public identity place references" on public.identity_places
  for select to anon, authenticated using (true);

insert into public.identity_places (id, name, place_type, sovereign_country_id, iso2, flag_code, region)
  select id, name, 'sovereign_country', id, iso2, lower(iso2), region from public.countries;
insert into public.identity_places (id, name, place_type, parent_country_id, flag_code, region) values
  ('scotland', 'Scotland', 'constituent_country', 'united-kingdom', 'gb-sct', 'Europe'),
  ('england', 'England', 'constituent_country', 'united-kingdom', 'gb-eng', 'Europe'),
  ('wales', 'Wales', 'constituent_country', 'united-kingdom', 'gb-wls', 'Europe'),
  -- No dedicated Northern Ireland flag is asserted; clients show a neutral placeholder.
  ('northern-ireland', 'Northern Ireland', 'constituent_country', 'united-kingdom', null, 'Europe');

alter table public.profiles
  drop constraint profiles_representing_country_id_fkey,
  drop constraint profiles_birth_country_id_fkey,
  drop constraint profiles_residence_country_id_fkey,
  add constraint profiles_representing_country_id_fkey foreign key (representing_country_id)
    references public.identity_places(id) on delete set null,
  add constraint profiles_birth_country_id_fkey foreign key (birth_country_id)
    references public.identity_places(id) on delete set null,
  add constraint profiles_residence_country_id_fkey foreign key (residence_country_id)
    references public.identity_places(id) on delete set null;
alter table public.profile_heritage_countries
  drop constraint profile_heritage_countries_country_id_fkey,
  add constraint profile_heritage_countries_country_id_fkey foreign key (country_id)
    references public.identity_places(id) on delete restrict;

-- Retain the established public-only projection and its privacy gates. The
-- owner-edit RPC remains security invoker; the new FKs validate its same inputs.
create or replace function public.get_public_member_profile(p_username text)
returns table (
  username text, display_name text, bio text, created_at timestamptz,
  representing_country jsonb, birth_country jsonb, residence_country jsonb,
  city_town text, heritage jsonb, avatar_version uuid,
  favourite_game_ids text[], platform_ids text[], gaming_since smallint
)
language sql stable security definer set search_path = '' as $$
  select profile.username::text, profile.display_name, profile.bio, profile.created_at,
    case when representing.id is null then null else jsonb_build_object(
      'id', representing.id, 'iso2', representing.iso2, 'name', representing.name,
      'region', representing.region, 'flag_code', representing.flag_code,
      'place_type', representing.place_type, 'parent_country_id', representing.parent_country_id) end,
    case when profile.birth_country_is_public and born.id is not null then jsonb_build_object(
      'id', born.id, 'iso2', born.iso2, 'name', born.name, 'region', born.region,
      'flag_code', born.flag_code, 'place_type', born.place_type, 'parent_country_id', born.parent_country_id) else null end,
    case when profile.residence_country_is_public and residence.id is not null then jsonb_build_object(
      'id', residence.id, 'iso2', residence.iso2, 'name', residence.name, 'region', residence.region,
      'flag_code', residence.flag_code, 'place_type', residence.place_type,
      'parent_country_id', residence.parent_country_id) else null end,
    case when profile.city_town_is_public then profile.city_town else null end,
    case when profile.heritage_is_public then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', place.id, 'iso2', place.iso2, 'name', place.name, 'region', place.region,
        'flag_code', place.flag_code, 'place_type', place.place_type, 'parent_country_id', place.parent_country_id,
        'position', heritage.position) order by heritage.position)
      from public.profile_heritage_countries heritage
      join public.identity_places place on place.id = heritage.country_id
      where heritage.profile_id = profile.id), '[]'::jsonb) else null end,
    profile.avatar_version,
    case when profile.favourite_games_is_public then
      coalesce((select array_agg(game.game_id order by game.position)
        from public.profile_favourite_games game where game.profile_id = profile.id), '{}'::text[])
      else null end,
    case when profile.platforms_is_public then profile.platform_ids else null end,
    case when profile.gaming_since_is_public then profile.gaming_since else null end
  from public.profiles profile
  left join public.identity_places representing on representing.id = profile.representing_country_id
  left join public.identity_places born on born.id = profile.birth_country_id
  left join public.identity_places residence on residence.id = profile.residence_country_id
  where lower(profile.username::text) = lower(p_username)
  limit 1;
$$;
revoke all on function public.get_public_member_profile(text) from public, anon, authenticated;
grant execute on function public.get_public_member_profile(text) to anon, authenticated;
comment on table public.identity_places is 'Profile identity expression only. Parent context does not imply competitive attribution. Competitive geography remains public.countries (195).';
notify pgrst, 'reload schema';
