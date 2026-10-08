-- Profile Extended Identity V2: optional, member-declared identity only.
-- No existing profile values or PR3A privacy rules are changed.
create table public.profile_game_catalogue (id text primary key);
-- Mirror canonical IDs only; names/routes remain constants/games.ts.
insert into public.profile_game_catalogue (id) values
  ('cs2'), ('league'), ('valorant'), ('fortnite'), ('rocketLeague'), ('chess');
alter table public.profile_game_catalogue enable row level security;
revoke all on public.profile_game_catalogue from anon, authenticated;
grant select on public.profile_game_catalogue to anon, authenticated;
create policy "Public game identity references" on public.profile_game_catalogue
  for select to anon, authenticated using (true);

alter table public.profiles
  add column avatar_version uuid,
  add column favourite_games_is_public boolean not null default false,
  add column platform_ids text[] not null default '{}',
  add column platforms_is_public boolean not null default false,
  add column gaming_since smallint,
  add column gaming_since_is_public boolean not null default false,
  add constraint profiles_platform_scope check (
    array_position(platform_ids, null) is null
    and platform_ids <@ array['pc','playstation','xbox','nintendo','mobile']::text[]
    and cardinality(platform_ids) <= 5
    and coalesce(array_ndims(platform_ids), 1) = 1
    and cardinality(platform_ids) =
      ('pc' = any(platform_ids))::integer + ('playstation' = any(platform_ids))::integer
      + ('xbox' = any(platform_ids))::integer + ('nintendo' = any(platform_ids))::integer
      + ('mobile' = any(platform_ids))::integer
  ),
  add constraint profiles_platform_visibility check (
    not platforms_is_public or cardinality(platform_ids) > 0
  ),
  add constraint profiles_gaming_since_year check (
    gaming_since is null or gaming_since between 1000 and extract(year from now() at time zone 'UTC')
  ),
  add constraint profiles_gaming_since_visibility check (
    not gaming_since_is_public or gaming_since is not null
  );
grant update (avatar_version, favourite_games_is_public, platform_ids,
  platforms_is_public, gaming_since, gaming_since_is_public)
  on public.profiles to authenticated;

create table public.profile_favourite_games (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null references public.profile_game_catalogue(id) on delete restrict,
  position integer not null check (position > 0),
  primary key (profile_id, game_id),
  unique (profile_id, position)
);
create index profile_favourite_games_game_idx on public.profile_favourite_games(game_id);
alter table public.profile_favourite_games enable row level security;
revoke all on public.profile_favourite_games from anon, authenticated;
grant select, insert, update, delete on public.profile_favourite_games to authenticated;
create policy "Members read own favourite games" on public.profile_favourite_games
  for select to authenticated using ((select auth.uid()) = profile_id);
create policy "Members add own favourite games" on public.profile_favourite_games
  for insert to authenticated with check ((select auth.uid()) = profile_id);
create policy "Members update own favourite games" on public.profile_favourite_games
  for update to authenticated using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);
create policy "Members remove own favourite games" on public.profile_favourite_games
  for delete to authenticated using ((select auth.uid()) = profile_id);

create function public.update_profile_gaming_identity(
  p_game_ids text[], p_games_is_public boolean,
  p_platform_ids text[], p_platforms_is_public boolean,
  p_gaming_since integer, p_gaming_since_is_public boolean
) returns void language plpgsql security invoker set search_path = '' as $$
declare member_id uuid := (select auth.uid());
begin
  if member_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if p_game_ids is null or p_platform_ids is null
    or cardinality(p_game_ids) <> (select count(distinct id) from unnest(p_game_ids) id)
    or cardinality(p_platform_ids) <> (select count(distinct id) from unnest(p_platform_ids) id)
  then raise exception 'identity selections must be unique and non-null' using errcode = '23514'; end if;
  -- Serialize concurrent whole-list saves on the owner row.
  update public.profiles set
    favourite_games_is_public = p_games_is_public and cardinality(p_game_ids) > 0,
    platform_ids = p_platform_ids,
    platforms_is_public = p_platforms_is_public and cardinality(p_platform_ids) > 0,
    gaming_since = nullif(p_gaming_since, 0),
    gaming_since_is_public = p_gaming_since_is_public and nullif(p_gaming_since, 0) is not null
  where id = member_id;
  if not found then raise exception 'profile required' using errcode = 'P0002'; end if;
  delete from public.profile_favourite_games where profile_id = member_id;
  insert into public.profile_favourite_games (profile_id, game_id, position)
    select member_id, id, position::integer
    from unnest(p_game_ids) with ordinality as games(id, position);
end;
$$;
revoke all on function public.update_profile_gaming_identity(text[], boolean, text[], boolean, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.update_profile_gaming_identity(text[], boolean, text[], boolean, integer, boolean)
  to authenticated;

-- Keep the established explicit PR3A public projection; append only filtered identity.
drop function public.get_public_member_profile(text);
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
  heritage jsonb,
  avatar_version uuid,
  favourite_game_ids text[],
  platform_ids text[],
  gaming_since smallint
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
    end,
    profile.avatar_version,
    case when profile.favourite_games_is_public then
      coalesce((select array_agg(game.game_id order by game.position)
        from public.profile_favourite_games game where game.profile_id = profile.id), '{}'::text[])
      else null end,
    case when profile.platforms_is_public then profile.platform_ids else null end,
    case when profile.gaming_since_is_public then profile.gaming_since else null end
  from public.profiles as profile
  left join public.countries as representing on representing.id = profile.representing_country_id
  left join public.countries as born on born.id = profile.birth_country_id
  left join public.countries as residence on residence.id = profile.residence_country_id
  where lower(profile.username::text) = lower(p_username)
  limit 1;
$$;

revoke all on function public.get_public_member_profile(text) from public, anon, authenticated;
grant execute on function public.get_public_member_profile(text) to anon, authenticated;


-- Avatars are explicitly public identity assets. Raw metadata/list/write access remains owner-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-avatars', 'member-avatars', true, 262144, array['image/webp']);

create policy "Members read own avatar asset" on storage.objects for select to authenticated
using (bucket_id = 'member-avatars' and name = (
  select lower(username::text) || '/avatar.webp' from public.profiles where id = (select auth.uid())
));
create policy "Members upload own avatar asset" on storage.objects for insert to authenticated
with check (bucket_id = 'member-avatars' and name = (
  select lower(username::text) || '/avatar.webp' from public.profiles where id = (select auth.uid())
));
create policy "Members replace own avatar asset" on storage.objects for update to authenticated
using (bucket_id = 'member-avatars' and name = (
  select lower(username::text) || '/avatar.webp' from public.profiles where id = (select auth.uid())
))
with check (bucket_id = 'member-avatars' and name = (
  select lower(username::text) || '/avatar.webp' from public.profiles where id = (select auth.uid())
));
create policy "Members remove own avatar asset" on storage.objects for delete to authenticated
using (bucket_id = 'member-avatars' and name = (
  select lower(username::text) || '/avatar.webp' from public.profiles where id = (select auth.uid())
));
-- Guard administrative cascades: SQL deletion must never orphan the stored file.
create function public.require_avatar_cleanup_before_profile_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'member-avatars'
    and name = lower(old.username::text) || '/avatar.webp') then
    raise exception 'Remove the avatar through Storage API before deleting this profile/account'
      using errcode = '23503';
  end if;
  return old;
end;
$$;
revoke all on function public.require_avatar_cleanup_before_profile_delete() from public, anon, authenticated;
create trigger profiles_require_avatar_cleanup before delete on public.profiles
for each row execute function public.require_avatar_cleanup_before_profile_delete();
