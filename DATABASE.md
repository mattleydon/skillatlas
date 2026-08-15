# SkillAtlas Database and Account Architecture

> **Status:** Supabase Auth, the canonical country catalogue, privacy-aware member profiles, and ordered Heritage are implemented locally through the reviewed repository migrations. Community persistence and competitive-intelligence data remain proposed future work.

## Identity and privacy boundary

Supabase Auth owns private account identity in `auth.users`. `public.profiles` is the authenticated member's SkillAtlas identity record. Email, provider data, tokens, sessions, passwords, and moderation/security metadata are never copied into the public schema.

Raw `public.profiles` rows are owner-readable only. Anonymous visitors and other authenticated members cannot query them. Public `/members/[username]` reads go through `public.get_public_member_profile(text)`, a security-definer RPC with an empty `search_path`, fully qualified relations, explicit output columns, and grants limited to `anon` and `authenticated`. Its payload contains no Auth UUID and conditionally exposes only fields approved by the member's privacy controls.

Profiles are created explicitly through `/account/onboarding`; there is no `auth.users` trigger. An authenticated account without a profile remains a valid, recoverable `PROFILE_INCOMPLETE` state.

## Implemented tables

### `public.countries`

The production reference catalogue for the reviewed 195-country sovereign scope. It contains stable SkillAtlas ID, uppercase ISO2 code, canonical name, and canonical region. Anonymous and authenticated clients may read it; ordinary clients cannot write it.

### `public.profiles`

| Column | Purpose |
| --- | --- |
| `id` | UUID primary key and `auth.users(id)` foreign key; owner identity only |
| `username` | Case-preserving `citext`, unique case-insensitively |
| `display_name` | Public editable display name, 1–50 characters |
| `bio` | Optional public plain text, up to 280 characters and three lines |
| `representing_country_id` | Optional public Representing country; migrated from PR2 `country_id` |
| `birth_country_id` | Optional Born country, private by default |
| `residence_country_id` | Optional Lives In country, private by default |
| `city_town` | Optional plain-text City / Town, private by default |
| `*_is_public` | Explicit privacy controls for Born, Lives In, City / Town, and Heritage |
| `username_case_correction_available` | Migration-granted eligibility for existing PR2 members only |
| `username_case_corrected_at` | Audit timestamp for the consumed correction |
| `created_at` / `updated_at` | Database-generated timestamps; `updated_at` is trigger-managed |

Usernames allow 3–24 ASCII letters, numbers, or underscores, must start and end with a letter or number, preserve selected capitalization, reject reserved names case-insensitively, and remain unique case-insensitively. New profiles are immutable. Existing PR2 rows receive one database-enforced capitalization-only correction; it cannot change the case-folded identity and cannot be used twice.

### `public.profile_heritage_countries`

Normalized ordered Heritage with `profile_id`, `country_id`, and `position`.

- Zero to five canonical countries.
- No duplicates.
- Positions are 1–5 and unique per profile.
- Profile deletion cascades; country deletion restricts.
- Raw reads and all mutations are owner-only under RLS.
- `public.update_profile_country_identity(...)` replaces the list atomically, preserving contiguous order.
- Heritage is absent from the public projection unless `heritage_is_public` is enabled.

## RLS and privileges

- `countries`: public read, no ordinary writes.
- `profiles`: authenticated owner SELECT/INSERT/UPDATE only; no anonymous raw SELECT and no ordinary DELETE.
- `profile_heritage_countries`: authenticated owner SELECT/INSERT/UPDATE/DELETE only.
- Server Actions re-authenticate and derive ownership from `auth.uid()`; client-supplied UUID ownership is not accepted.
- `get_public_member_profile(text)`: public-safe read RPC only; no UUID, email, private locations, privacy flags, security metadata, or unapproved internal timestamps.
- `update_profile_country_identity(...)`: authenticated security-invoker mutation; validates ownership, list size, duplicates, foreign keys, and ordering in one transaction.

## Current application behavior

- Verified eight-digit email OTP authentication uses request-scoped `@supabase/ssr` clients.
- `/account` distinguishes signed out, profile incomplete, profile complete, and unavailable states.
- `/account/onboarding` creates a case-preserving username and optional Representing country.
- `/account` provides separate Profile / Identity and Country Identity actions.
- `/members/[username]` uses only the public-safe RPC, resolves case-insensitively, and redirects alternate casing to the stored canonical spelling.
- `lib/account/participation.ts` remains the domain-neutral gate for future community writes.

## Migrations and reproducibility

- `20260812031320_create_member_profiles.sql`: canonical PR2 countries/profile baseline.
- `20260814225124_extended_identity_privacy.sql`: PR3A identity, privacy, Heritage, RPC, RLS, and username correction.
- `npm.cmd run supabase:reset`: replay migrations locally.
- `npm.cmd run supabase:test:db`: run pgTAP schema, privacy, RLS, username, Heritage, and account-isolation tests.
- `npm.cmd run countries:reference:check`: verify exact parity with `data/countries.ts`.
- `npm.cmd run supabase:types`: regenerate `types/database.ts` from the local public schema.

No service-role client exists in application code. Ordinary development must not link to or push schema changes to hosted Supabase.

## Approved future work

Not implemented here: avatars/storage, favourite games, platforms, gaming history, following/social graph, Forum persistence, User Rankings persistence, notifications, blocking/muting, direct messages, Personal Atlas, OAuth/passkeys, games, authoritative rankings, ranking history, or live ranking events.

Future migrations must preserve the country-only MVP, use reviewed constraints and foreign keys, enable RLS before API exposure, capture provenance where relevant, and ship with policy/leakage tests.
