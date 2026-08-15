# SkillAtlas

SkillAtlas is a country-based gaming and esports atlas for exploring rankings, countries, players, and community discussion. The current product is a responsive MVP with light and dark themes.

## Core pages

| Page | Route |
| --- | --- |
| Rankings | `/` |
| Atlas | `/world-map` |
| Countries | `/countries` |
| Games | `/games` |
| Players | `/profiles` |
| Teams | `/teams` |
| Members | `/members` |
| Forum | `/forum` |
| User Rankings | `/user-rankings` |
| Live Rankings | `/live-rankings` |
| About | `/about` |

## Tech stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Supabase for page comments, verified email OTP sessions, and privacy-aware member profiles
- Vercel for deployment
- npm with `package-lock.json`

## Run locally

Use a current Node.js LTS release and npm.

```bash
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to `.env.local` and provide the local public Supabase values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never put a service-role key, database password, SMTP credential, or Supabase access token in a `NEXT_PUBLIC_` variable. Public browsing continues to work if Supabase is unavailable; account routes show a scoped unavailable state.

`npm.cmd run dev` and a local `npm.cmd run start` check the effective environment before Next.js starts. They refuse any Supabase URL other than `http://127.0.0.1:54321` by default, so a stale hosted value in `.env.local` cannot silently receive local Auth, profile, or page-comment writes. The check never prints keys or rewrites environment files.

## Local Supabase and email OTP

Local Supabase requires Docker Desktop. The CLI is pinned in this repository, so a global Supabase installation is not the canonical workflow.

```bash
npm.cmd run supabase:start
npm.cmd exec supabase -- status -o env
```

Map the local `API_URL` and `ANON_KEY` output to the two `NEXT_PUBLIC_` names in `.env.local`, then restart `npm.cmd run dev`. Request a code at `/auth/sign-up` or `/auth/sign-in`, read it in local Mailpit at [http://127.0.0.1:54324](http://127.0.0.1:54324), verify at `/auth/verify`, and continue from `/account` to the short member-profile onboarding flow. Completed profiles support a case-preserved username, bio, Representing, private-by-default country identity, and ordered Heritage. Public member identities are available at `/members/[username]` through an explicit privacy-filtered database projection.

Deliberate browser validation against a hosted Supabase project requires separate approval and an unmistakable process-level opt-in: `SKILLATLAS_ALLOW_HOSTED_SUPABASE=approved-nonproduction`. Confirm the target is the approved non-production project before using it, keep the override out of `.env*` files, and remove it immediately after that process. The override must never be used for Production. Vercel Preview is unaffected because this safeguard runs only before the local development command.

Useful local commands:

```bash
npm.cmd run supabase:reset
npm.cmd run supabase:test:db
npm.cmd run supabase:types
npm.cmd run countries:reference:check
npm.cmd run supabase:stop
```

- `supabase:reset` replays repository migrations against the local stack only.
- `supabase:test:db` runs pgTAP schema, RLS, privacy-leakage, username, Heritage, and account-isolation tests in `supabase/tests/database`.
- `supabase:types` refreshes `types/database.ts` from the local public schema.
- `supabase:verify-local` runs the same fail-closed environment check used before local development.
- `countries:reference:check` confirms the migration catalogue exactly matches the canonical 195 sovereign records in `data/countries.ts`.
- Local test members are created through the same email OTP and `/account/onboarding` flow as the application; no development member activity is seeded.
- Local Auth uses the repository-controlled code-only email template. Production SMTP and hosted Auth-template changes are future operational work.
- Ordinary setup must not use `supabase db push`, link to a hosted project, or change hosted Auth/RLS settings.
- The existing hosted `skillatlas_page_comments` schema is not reproduced by a speculative migration; see `supabase/migrations/README.md`.

### Hosted Preview email testing

The hosted Preview environment currently uses Resend test-mode SMTP with the `onboarding@resend.dev` sender. In this mode, email can be delivered only to the address authorized by the Resend account; arbitrary recipient testing is intentionally unavailable until a SkillAtlas sending domain is verified. Rejection of another recipient is a hosted test-environment limitation, not an application Auth failure.

Production SMTP and verified-domain configuration remain separate launch requirements. Never commit SMTP passwords, API keys, sender secrets, or authorized recipient addresses to the repository.

## Build

```bash
npm.cmd run build
npm.cmd run start
```

Run `npm.cmd run lint` for the configured ESLint checks.

## Project structure

```text
app/                 App Router pages, including Auth, account onboarding, and public members
lib/account/         Server-only account state, public DTO, participation, and profile validation helpers
lib/supabase/        Browser, server, configuration, and session-refresh helpers
supabase/            Local stack config, migrations, email template, and pgTAP tests
types/database.ts    Generated local public-schema TypeScript types
public/              Static SkillAtlas images and brand assets
package.json         Project scripts and dependencies
next.config.ts       Next.js configuration
postcss.config.mjs   Tailwind/PostCSS configuration
tsconfig.json        TypeScript configuration
```

## Deployment

SkillAtlas uses Vercel's standard Next.js deployment flow and does not require a custom `vercel.json`. Connect the repository to a Vercel project, use the default `npm run build` command, and configure the public Supabase environment variables in Vercel when page comments or account access are required. Hosted Auth email templates, redirect URLs, and production SMTP require separate human-approved Supabase configuration; local setup does not mutate them. Pull requests can use Vercel preview deployments before changes reach the production branch.

## MVP scope

The initial SkillAtlas release focuses on country-level rankings, discovery, and community features. States, provinces, cities, and districts are future expansion areas and are intentionally outside the current MVP.
