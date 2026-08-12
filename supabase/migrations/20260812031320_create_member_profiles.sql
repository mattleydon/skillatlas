create extension if not exists citext with schema extensions;

create table public.countries (
  id text primary key,
  iso2 text not null unique,
  name text not null,
  region text not null,
  constraint countries_id_format check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint countries_iso2_format check (iso2 ~ '^[A-Z]{2}$'),
  constraint countries_name_format check (
    name = btrim(name)
    and char_length(name) between 1 and 80
  ),
  constraint countries_region_scope check (
    region in (
      'Africa',
      'Asia',
      'Europe',
      'Middle East',
      'North America',
      'Oceania',
      'South America'
    )
  )
);

insert into public.countries (id, iso2, name, region)
values
-- BEGIN GENERATED CANONICAL COUNTRIES
  ('denmark', 'DK', 'Denmark', 'Europe'),
  ('south-korea', 'KR', 'South Korea', 'Asia'),
  ('china', 'CN', 'China', 'Asia'),
  ('usa', 'US', 'USA', 'North America'),
  ('brazil', 'BR', 'Brazil', 'South America'),
  ('france', 'FR', 'France', 'Europe'),
  ('sweden', 'SE', 'Sweden', 'Europe'),
  ('germany', 'DE', 'Germany', 'Europe'),
  ('japan', 'JP', 'Japan', 'Asia'),
  ('united-kingdom', 'GB', 'United Kingdom', 'Europe'),
  ('canada', 'CA', 'Canada', 'North America'),
  ('australia', 'AU', 'Australia', 'Oceania'),
  ('netherlands', 'NL', 'Netherlands', 'Europe'),
  ('india', 'IN', 'India', 'Asia'),
  ('turkey', 'TR', 'Turkey', 'Middle East'),
  ('finland', 'FI', 'Finland', 'Europe'),
  ('poland', 'PL', 'Poland', 'Europe'),
  ('spain', 'ES', 'Spain', 'Europe'),
  ('south-africa', 'ZA', 'South Africa', 'Africa'),
  ('mexico', 'MX', 'Mexico', 'North America'),
  ('saudi-arabia', 'SA', 'Saudi Arabia', 'Middle East'),
  ('argentina', 'AR', 'Argentina', 'South America'),
  ('new-zealand', 'NZ', 'New Zealand', 'Oceania'),
  ('nigeria', 'NG', 'Nigeria', 'Africa'),
  ('afghanistan', 'AF', 'Afghanistan', 'Asia'),
  ('albania', 'AL', 'Albania', 'Europe'),
  ('algeria', 'DZ', 'Algeria', 'Africa'),
  ('andorra', 'AD', 'Andorra', 'Asia'),
  ('angola', 'AO', 'Angola', 'Africa'),
  ('antigua-and-barbuda', 'AG', 'Antigua and Barbuda', 'North America'),
  ('armenia', 'AM', 'Armenia', 'Europe'),
  ('austria', 'AT', 'Austria', 'Europe'),
  ('azerbaijan', 'AZ', 'Azerbaijan', 'Europe'),
  ('bahamas', 'BS', 'Bahamas', 'North America'),
  ('bahrain', 'BH', 'Bahrain', 'Middle East'),
  ('bangladesh', 'BD', 'Bangladesh', 'Asia'),
  ('barbados', 'BB', 'Barbados', 'North America'),
  ('belarus', 'BY', 'Belarus', 'Europe'),
  ('belgium', 'BE', 'Belgium', 'Europe'),
  ('belize', 'BZ', 'Belize', 'North America'),
  ('benin', 'BJ', 'Benin', 'Africa'),
  ('bhutan', 'BT', 'Bhutan', 'Asia'),
  ('bolivia', 'BO', 'Bolivia', 'South America'),
  ('bosnia-and-herzegovina', 'BA', 'Bosnia and Herzegovina', 'Europe'),
  ('botswana', 'BW', 'Botswana', 'Africa'),
  ('brunei', 'BN', 'Brunei', 'Asia'),
  ('bulgaria', 'BG', 'Bulgaria', 'Europe'),
  ('burkina-faso', 'BF', 'Burkina Faso', 'Africa'),
  ('burundi', 'BI', 'Burundi', 'Africa'),
  ('cabo-verde', 'CV', 'Cabo Verde', 'Africa'),
  ('cambodia', 'KH', 'Cambodia', 'Asia'),
  ('cameroon', 'CM', 'Cameroon', 'Africa'),
  ('central-african-republic', 'CF', 'Central African Republic', 'Africa'),
  ('chad', 'TD', 'Chad', 'Africa'),
  ('chile', 'CL', 'Chile', 'South America'),
  ('colombia', 'CO', 'Colombia', 'South America'),
  ('comoros', 'KM', 'Comoros', 'Africa'),
  ('costa-rica', 'CR', 'Costa Rica', 'North America'),
  ('croatia', 'HR', 'Croatia', 'Europe'),
  ('cuba', 'CU', 'Cuba', 'North America'),
  ('cyprus', 'CY', 'Cyprus', 'Middle East'),
  ('czechia', 'CZ', 'Czechia', 'Europe'),
  ('c-te-divoire', 'CI', 'Côte d’Ivoire', 'Africa'),
  ('djibouti', 'DJ', 'Djibouti', 'Africa'),
  ('dominica', 'DM', 'Dominica', 'North America'),
  ('dominican-republic', 'DO', 'Dominican Republic', 'North America'),
  ('dr-congo', 'CD', 'DR Congo', 'Africa'),
  ('ecuador', 'EC', 'Ecuador', 'South America'),
  ('egypt', 'EG', 'Egypt', 'Middle East'),
  ('el-salvador', 'SV', 'El Salvador', 'North America'),
  ('equatorial-guinea', 'GQ', 'Equatorial Guinea', 'Africa'),
  ('eritrea', 'ER', 'Eritrea', 'Africa'),
  ('estonia', 'EE', 'Estonia', 'Europe'),
  ('eswatini', 'SZ', 'Eswatini', 'Africa'),
  ('ethiopia', 'ET', 'Ethiopia', 'Africa'),
  ('fiji', 'FJ', 'Fiji', 'Oceania'),
  ('gabon', 'GA', 'Gabon', 'Africa'),
  ('gambia', 'GM', 'Gambia', 'Africa'),
  ('georgia', 'GE', 'Georgia', 'Europe'),
  ('ghana', 'GH', 'Ghana', 'Africa'),
  ('greece', 'GR', 'Greece', 'Europe'),
  ('grenada', 'GD', 'Grenada', 'North America'),
  ('guatemala', 'GT', 'Guatemala', 'North America'),
  ('guinea', 'GN', 'Guinea', 'Africa'),
  ('guinea-bissau', 'GW', 'Guinea-Bissau', 'Africa'),
  ('guyana', 'GY', 'Guyana', 'South America'),
  ('haiti', 'HT', 'Haiti', 'North America'),
  ('honduras', 'HN', 'Honduras', 'North America'),
  ('hungary', 'HU', 'Hungary', 'Asia'),
  ('iceland', 'IS', 'Iceland', 'Europe'),
  ('indonesia', 'ID', 'Indonesia', 'Asia'),
  ('iran', 'IR', 'Iran', 'Middle East'),
  ('iraq', 'IQ', 'Iraq', 'Middle East'),
  ('ireland', 'IE', 'Ireland', 'Europe'),
  ('israel', 'IL', 'Israel', 'Middle East'),
  ('italy', 'IT', 'Italy', 'Europe'),
  ('jamaica', 'JM', 'Jamaica', 'North America'),
  ('jordan', 'JO', 'Jordan', 'Middle East'),
  ('kazakhstan', 'KZ', 'Kazakhstan', 'Asia'),
  ('kenya', 'KE', 'Kenya', 'Africa'),
  ('kiribati', 'KI', 'Kiribati', 'Oceania'),
  ('kuwait', 'KW', 'Kuwait', 'Middle East'),
  ('kyrgyzstan', 'KG', 'Kyrgyzstan', 'Asia'),
  ('laos', 'LA', 'Laos', 'Asia'),
  ('latvia', 'LV', 'Latvia', 'Europe'),
  ('lebanon', 'LB', 'Lebanon', 'Middle East'),
  ('lesotho', 'LS', 'Lesotho', 'Africa'),
  ('liberia', 'LR', 'Liberia', 'Africa'),
  ('libya', 'LY', 'Libya', 'Africa'),
  ('liechtenstein', 'LI', 'Liechtenstein', 'Europe'),
  ('lithuania', 'LT', 'Lithuania', 'Europe'),
  ('luxembourg', 'LU', 'Luxembourg', 'Europe'),
  ('madagascar', 'MG', 'Madagascar', 'Africa'),
  ('malawi', 'MW', 'Malawi', 'Africa'),
  ('malaysia', 'MY', 'Malaysia', 'Asia'),
  ('maldives', 'MV', 'Maldives', 'Asia'),
  ('mali', 'ML', 'Mali', 'Africa'),
  ('malta', 'MT', 'Malta', 'Europe'),
  ('marshall-islands', 'MH', 'Marshall Islands', 'Oceania'),
  ('mauritania', 'MR', 'Mauritania', 'Africa'),
  ('mauritius', 'MU', 'Mauritius', 'Africa'),
  ('micronesia', 'FM', 'Micronesia', 'Oceania'),
  ('moldova', 'MD', 'Moldova', 'Europe'),
  ('monaco', 'MC', 'Monaco', 'Europe'),
  ('mongolia', 'MN', 'Mongolia', 'Asia'),
  ('montenegro', 'ME', 'Montenegro', 'Asia'),
  ('morocco', 'MA', 'Morocco', 'Africa'),
  ('mozambique', 'MZ', 'Mozambique', 'Africa'),
  ('myanmar', 'MM', 'Myanmar', 'Asia'),
  ('namibia', 'NA', 'Namibia', 'Africa'),
  ('nauru', 'NR', 'Nauru', 'Oceania'),
  ('nepal', 'NP', 'Nepal', 'Asia'),
  ('nicaragua', 'NI', 'Nicaragua', 'North America'),
  ('niger', 'NE', 'Niger', 'Africa'),
  ('north-korea', 'KP', 'North Korea', 'Asia'),
  ('north-macedonia', 'MK', 'North Macedonia', 'Europe'),
  ('norway', 'NO', 'Norway', 'Europe'),
  ('oman', 'OM', 'Oman', 'Middle East'),
  ('pakistan', 'PK', 'Pakistan', 'Asia'),
  ('palau', 'PW', 'Palau', 'Oceania'),
  ('palestine', 'PS', 'Palestine', 'Middle East'),
  ('panama', 'PA', 'Panama', 'North America'),
  ('papua-new-guinea', 'PG', 'Papua New Guinea', 'Oceania'),
  ('paraguay', 'PY', 'Paraguay', 'South America'),
  ('peru', 'PE', 'Peru', 'South America'),
  ('philippines', 'PH', 'Philippines', 'Asia'),
  ('portugal', 'PT', 'Portugal', 'Europe'),
  ('qatar', 'QA', 'Qatar', 'Middle East'),
  ('republic-of-the-congo', 'CG', 'Republic of the Congo', 'Africa'),
  ('romania', 'RO', 'Romania', 'Europe'),
  ('russia', 'RU', 'Russia', 'Europe'),
  ('rwanda', 'RW', 'Rwanda', 'Africa'),
  ('saint-kitts-and-nevis', 'KN', 'Saint Kitts and Nevis', 'North America'),
  ('saint-lucia', 'LC', 'Saint Lucia', 'North America'),
  ('saint-vincent-and-the-grenadines', 'VC', 'Saint Vincent and the Grenadines', 'North America'),
  ('samoa', 'WS', 'Samoa', 'Oceania'),
  ('san-marino', 'SM', 'San Marino', 'Europe'),
  ('sao-tome-and-principe', 'ST', 'Sao Tome and Principe', 'Africa'),
  ('senegal', 'SN', 'Senegal', 'Africa'),
  ('serbia', 'RS', 'Serbia', 'Europe'),
  ('seychelles', 'SC', 'Seychelles', 'Africa'),
  ('sierra-leone', 'SL', 'Sierra Leone', 'Africa'),
  ('singapore', 'SG', 'Singapore', 'Asia'),
  ('slovakia', 'SK', 'Slovakia', 'Europe'),
  ('slovenia', 'SI', 'Slovenia', 'Europe'),
  ('solomon-islands', 'SB', 'Solomon Islands', 'Oceania'),
  ('somalia', 'SO', 'Somalia', 'Africa'),
  ('south-sudan', 'SS', 'South Sudan', 'Africa'),
  ('sri-lanka', 'LK', 'Sri Lanka', 'Asia'),
  ('sudan', 'SD', 'Sudan', 'Africa'),
  ('suriname', 'SR', 'Suriname', 'South America'),
  ('switzerland', 'CH', 'Switzerland', 'Europe'),
  ('syria', 'SY', 'Syria', 'Middle East'),
  ('tajikistan', 'TJ', 'Tajikistan', 'Asia'),
  ('tanzania', 'TZ', 'Tanzania', 'Africa'),
  ('thailand', 'TH', 'Thailand', 'Asia'),
  ('timor-leste', 'TL', 'Timor-Leste', 'Asia'),
  ('togo', 'TG', 'Togo', 'Africa'),
  ('tonga', 'TO', 'Tonga', 'Oceania'),
  ('trinidad-and-tobago', 'TT', 'Trinidad and Tobago', 'North America'),
  ('tunisia', 'TN', 'Tunisia', 'Africa'),
  ('turkmenistan', 'TM', 'Turkmenistan', 'Asia'),
  ('tuvalu', 'TV', 'Tuvalu', 'Oceania'),
  ('uganda', 'UG', 'Uganda', 'Africa'),
  ('ukraine', 'UA', 'Ukraine', 'Europe'),
  ('united-arab-emirates', 'AE', 'United Arab Emirates', 'Middle East'),
  ('uruguay', 'UY', 'Uruguay', 'South America'),
  ('uzbekistan', 'UZ', 'Uzbekistan', 'Asia'),
  ('vanuatu', 'VU', 'Vanuatu', 'Oceania'),
  ('vatican-city', 'VA', 'Vatican City', 'Europe'),
  ('venezuela', 'VE', 'Venezuela', 'South America'),
  ('vietnam', 'VN', 'Vietnam', 'Asia'),
  ('yemen', 'YE', 'Yemen', 'Middle East'),
  ('zambia', 'ZM', 'Zambia', 'Africa'),
  ('zimbabwe', 'ZW', 'Zimbabwe', 'Africa')
-- END GENERATED CANONICAL COUNTRIES
;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext not null unique,
  display_name text not null,
  country_id text references public.countries(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_lowercase check (username::text = lower(username::text)),
  constraint profiles_username_format check (
    username::text ~ '^[a-z0-9](?:[a-z0-9_]{1,22}[a-z0-9])$'
  ),
  constraint profiles_username_not_reserved check (
    username::text not in (
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
  constraint profiles_display_name_format check (
    display_name = btrim(display_name)
    and char_length(display_name) between 1 and 50
    and display_name !~ '[[:cntrl:]]'
  )
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.countries enable row level security;
alter table public.profiles enable row level security;

revoke all on table public.countries from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;

grant select on table public.countries to anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant insert (id, username, display_name, country_id) on table public.profiles to authenticated;
grant update (display_name, country_id) on table public.profiles to authenticated;

create policy "Countries are publicly readable"
on public.countries
for select
to anon, authenticated
using (true);

create policy "Profiles are publicly readable"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "Members create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Members update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
