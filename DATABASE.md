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
- Extended Identity V2 adds independent optional Avatar and Gaming Identity saves; neither changes profile-completion status or participation eligibility.
- `/members/[username]` uses only the public-safe RPC, resolves case-insensitively, and redirects alternate casing to the stored canonical spelling.
- `lib/account/participation.ts` remains the domain-neutral gate for future community writes.

## Migrations and reproducibility

- `20260812031320_create_member_profiles.sql`: canonical PR2 countries/profile baseline.
- `20260814225124_extended_identity_privacy.sql`: PR3A identity, privacy, Heritage, RPC, RLS, and username correction.
- `20261007054039_profile_extended_identity_v2.sql`: private-by-default gaming identity, ordered Game foreign keys, public avatar bucket/policies and deletion cleanup guard.
- `npm.cmd run supabase:reset`: replay migrations locally.
- `npm.cmd run supabase:test:db`: run pgTAP schema, privacy, RLS, username, Heritage, and account-isolation tests.
- `npm.cmd run countries:reference:check`: verify exact parity with `data/countries.ts`.
- `npm.cmd run supabase:types`: regenerate `types/database.ts` from the local public schema.

No service-role client exists in application code. Ordinary development must not link to or push schema changes to hosted Supabase.

## Profile Identity Data Contract V0.1 — Extended Identity V2

**Minimal identity is complete identity.** All fields below belong to the Profile/member identity system. They are explicitly member-declared/uploaded identity, not verified history, observed behaviour, inferred interest, expertise, or personalisation consent. Public visibility permits identity display only; it does not authorise Feed, notification, recommendation or Search reranking.

| Field | Source / visibility | Explicit lifecycle / fallback |
| --- | --- | --- |
| Avatar | Member upload; public identity when set | Upload, replace, remove; initials on absence or image failure. No private-avatar state. |
| Favourite Games | Declared canonical Game IDs; private by default, one explicit public switch | Add, order, remove; omit empty/private visitor section. No Product “Top N” maximum approved; membership is bounded only by the current catalogue, not a schema list-length cap. |
| Platforms | Declared V0.1 taxonomy; private by default, one explicit public switch | Select/remove PC, PlayStation, Xbox, Nintendo, Mobile; omit empty/private visitor section. These are broad gaming platforms, not hardware/device records. |
| Gaming Since | Declared year; private by default, explicit public switch | Set/edit/clear a four-digit year no later than current UTC year; omit empty/private visitor value. No age/skill inference or historical verification. |

Values plus visibility remain canonical owner data; the existing public RPC filters them before serialization. No duplicate public records, activity/history objects, completion incentives or mandatory extended onboarding.

### Avatar asset contract

- JPEG, PNG or WebP input, at most 2 MiB and 16 megapixels; reject animation and malformed/unsupported bytes. Server decode, auto-orient, centre-crop and encode a metadata-free 512×512 WebP (quality 82), at most 256 KiB. Original files are not retained.
- Public `member-avatars` image bucket; one fixed `<case-folded-username>/avatar.webp` object per profile. This exposes no Auth UUID in URLs. Raw Storage metadata/listing and writes remain owner-only; anonymous visitors can retrieve the image bytes, not owner metadata. Upload is explicit consent to publish the image. No service-role client in the app.
- Replacement overwrites the bounded asset, then changes an opaque avatar version. Public app image URLs use that version; responses are not cached. Removal deletes via the Storage API, then clears the version. Image failures always restore initials.
- A failed upload leaves the current image unchanged; a failed metadata update after successful storage write is reported for retry. Fixed paths prevent replacement orphans. Concurrent owner operations are last-write-wins, not a history store.
- Profile/account deletion remains administrative. A database guard refuses profile deletion while its avatar object exists: remove it through Storage API first, then delete the account/profile. Never delete `storage.objects` rows with SQL. Administrative removal must also clear the avatar version; this preserves a future moderation seam without building moderation.
- An interrupted first upload can leave at most one public image not yet attached to the Profile projection. Owner removal handles it even without a published avatar version. Operators must remove that object before administrative deletion. No automatic retention or background cleanup job is introduced.
- Before large-scale community rollout: define avatar reporting, administrative abuse response and operational cleanup ownership. This unit does not supply automated moderation.

## Profile Identity Geography V0.1

Profile identity is member-declared expression, not competitive attribution.
“Representing: Scotland” means only that a member chooses Scotland as part of
their public identity. It does not assign competitive results, eligibility or scores.

- Competitive geography stays at 195 sovereign countries in `data/countries.ts`
  and `public.countries`, used by Rankings, Countries, Atlas, routes and Global Search.
- Profile geography uses `lib/account/identity-geography.ts` and `public.identity_places`:
  the same 195 stable IDs plus Scotland, England, Wales and Northern Ireland.
  These four are typed `constituent_country`, with parent `united-kingdom` for
  context only. No implicit attribution, fixtures, competitive routes or global search entities.
- Representing, Born, Lives In and ordered Heritage reference identity places.
  City / Town remains alongside Lives In. Existing privacy defaults and the
  explicit privacy-filtered public RPC are preserved.
- The migration adds an RLS-enabled, read-only catalogue and retargets four
  Profile foreign keys without rewriting values, timestamps or visibility flags.
  Existing column and RPC parameter names remain compatible. Public JSON adds
  type, parent and flag metadata; sovereign ISO codes remain available.
- Scotland, England and Wales use existing FlagCDN asset conventions. Northern
  Ireland uses a neutral fallback rather than asserting a dedicated flag.
- Hosted rollout requires the pending Profile V2 and Identity Geography migrations
  in order, before deploying the corresponding app. No hosted schema is changed here.
- Rollback requires first checking that no Profile or Heritage references a
  constituent ID, restoring the preceding RPC/FKs, then dropping the catalogue/enum.
  Never convert identities to UK or delete values silently to force a rollback.

## Local typography and access-code wording

Pinned Fontsource IBM Plex packages supply WOFF2 files to `next/font/local`.
Sans 300/400/500/600 and Mono 400/500/600 preserve existing role variables,
sizes, weights, tracking and brand treatment. Dev/build/rendering no longer
requires Google Fonts downloads. Next serves the bundled fonts from the app's
own origin; the packages retain their upstream OFL licences.

Sign-in send/resend copy is conditional for known and unknown addresses alike.
Existing masked unknown-account responses, `shouldCreateUser: false`, cookies,
cooldowns and email OTP verification remain unchanged. Create account stays a
separate explicit action; sign-in never silently creates an account.

## Approved future work

Not implemented here: observed gaming history, following/social graph, Forum persistence, User Rankings persistence, notifications, blocking/muting, direct messages, Personal Atlas, OAuth/passkeys, authoritative rankings, ranking history, or live ranking events.

Future migrations must preserve the country-only MVP, use reviewed constraints and foreign keys, enable RLS before API exposure, capture provenance where relevant, and ship with policy/leakage tests.
