# SkillAtlas Database and Account Architecture

> **Status:** The Supabase Auth foundation, canonical country catalogue, and public member profiles described under “Current implementation” are implemented. Everything under “Approved future work” remains proposed and must not be treated as an available schema.

## Current implementation

### Identity boundary

Supabase Auth owns private account identity in `auth.users`. `public.profiles` is the separate, public SkillAtlas member identity. The application never copies email, provider IDs, verification state, tokens, session data, passwords, or moderation/security metadata into the public schema.

Profiles are created explicitly through `/account/onboarding`; there is no `auth.users` trigger. An authenticated account without a profile is a valid, recoverable `PROFILE_INCOMPLETE` state.

### `public.countries`

**Purpose:** Production reference catalogue for the reviewed 195-country sovereign scope used by profile foreign keys.

| Column | Definition |
| --- | --- |
| `id` | Stable SkillAtlas text ID, primary key |
| `iso2` | Unique uppercase ISO 3166-1 alpha-2 code |
| `name` | Canonical display name |
| `region` | One of Africa, Asia, Europe, Middle East, North America, Oceania, or South America |

The table deliberately contains no rankings, scores, trends, identity copy, or prototype intelligence. Reference rows are inserted deterministically by the production migration and must match `data/countries.ts`. Anonymous and authenticated clients may read the catalogue; ordinary clients receive no write privileges.

### `public.profiles`

**Purpose:** Minimal public identity for ordinary SkillAtlas members.

| Column | Definition |
| --- | --- |
| `id` | UUID primary key and foreign key to `auth.users(id) on delete cascade` |
| `username` | Immutable `citext`, unique and constrained to the V0.1 username policy |
| `display_name` | Public, editable display name, 1–50 characters |
| `country_id` | Optional text foreign key to `public.countries(id) on delete set null` |
| `created_at` | Database-generated `timestamptz` |
| `updated_at` | Database-generated and trigger-maintained `timestamptz` |

Usernames are 3–24 lowercase ASCII letters, numbers, or underscores, must start and end with a letter or number, are case-insensitively unique, and reject the reviewed reserved-name set. V0.1 clients may not update usernames.

RLS and column privileges provide these boundaries:

- Anonymous and authenticated visitors may read public profile rows.
- An authenticated user may insert only a profile whose `id` equals `auth.uid()`.
- The owner may update only `display_name` and `country_id`.
- Non-owners cannot modify a profile.
- Ordinary client roles cannot update ownership/system fields or delete profiles.
- Country, username, display-name, and timestamp invariants are enforced in the database as well as the application.

The Auth-user cascade applies only to the current profile-only model. Retention policy must be revisited before Forum or vote foreign keys are introduced. There is no self-service account deletion UI.

### Reproducibility and tests

- `supabase/migrations/20260812031320_create_member_profiles.sql` creates both implemented tables, policies, grants, constraints, and the canonical reference rows.
- `npm.cmd run countries:reference:check` verifies the migration’s 195 country tuples exactly match the reviewed application source.
- `npm.cmd run supabase:reset` replays the schema locally.
- `npm.cmd run supabase:test:db` runs pgTAP schema, catalogue, and two-account RLS tests.
- `npm.cmd run supabase:types` regenerates `types/database.ts` from the local public schema.

No service-role client exists in application code. Ordinary development must not link to or push schema changes to a hosted Supabase project.

## Current application behavior

- Verified email OTP authentication and cookie/session refresh use the request-scoped `@supabase/ssr` helpers.
- `/account` distinguishes signed out, profile incomplete, profile complete, and query/configuration failure.
- `/account/onboarding` creates the authenticated user’s profile through an RLS-protected Server Action.
- `/members/[username]` reads only public profile and country columns.
- `lib/account/participation.ts` exposes a domain-neutral gate for future writes; PR 2 does not connect it to Forum or User Rankings.
- The optional hosted `skillatlas_page_comments` integration in `app/theme-provider.tsx` is unchanged and is not reproduced by a speculative migration.

## Approved future work

The following areas are not implemented by the current schema:

- User Rankings votes, events, allowance logic, and Community Score
- Forum categories, threads, replies, moderation, and persistent voting
- Games, authoritative rankings, ranking history, and live ranking events
- Professional-player-to-member linking
- Avatars/storage, bios, favourite games, social links, roles, reputation, badges, notifications, and relationships

Future migrations must preserve the country-only MVP, use reviewed foreign keys and constraints, enable RLS before API exposure, capture source provenance where relevant, and ship with policy tests. Forum/vote retention and Auth-user deletion behavior require a separate governance decision once those schemas are designed.

## Hosted deployment boundary

A future human-reviewed non-production rollout requires applying the repository migration, retaining the reviewed Auth configuration, and setting the public Supabase environment variables in that environment. This repository workflow does not run `supabase link`, `supabase db push`, or mutate hosted Auth/RLS settings.
