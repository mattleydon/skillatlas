# SkillAtlas

SkillAtlas is a country-based gaming and esports atlas for exploring rankings, countries, players, and community discussion. The current product is a responsive MVP with light and dark themes.

## Core pages

| Page | Route |
| --- | --- |
| Rankings | `/` |
| World Map | `/world-map` |
| Countries | `/countries` |
| Players | `/profiles` |
| Forum | `/forum` |
| User Rankings | `/user-rankings` |
| Live Rankings | `/live-rankings` |
| About | `/about` |

## Tech stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Supabase for page comments, verified email OTP sessions, and member profiles
- Vercel for deployment
- npm with `package-lock.json`

## Run locally

Use a current Node.js LTS release and npm.

```bash
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to `.env.local` and provide the public Supabase values used by the environment:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never put a service-role key, database password, SMTP credential, or Supabase access token in a `NEXT_PUBLIC_` variable. Public browsing continues to work if Supabase is unavailable; account routes show a scoped unavailable state.

## Local Supabase and email OTP

Local Supabase requires Docker Desktop. The CLI is pinned in this repository, so a global Supabase installation is not the canonical workflow.

```bash
npm.cmd run supabase:start
npm.cmd exec supabase -- status -o env
```

Map the local `API_URL` and `ANON_KEY` output to the two `NEXT_PUBLIC_` names in `.env.local`, then restart `npm.cmd run dev`. Request a code at `/auth/sign-up` or `/auth/sign-in`, read it in local Mailpit at [http://127.0.0.1:54324](http://127.0.0.1:54324), verify at `/auth/verify`, and continue from `/account` to the short member-profile onboarding flow. Completed public member identities are available at `/members/[username]`.

Useful local commands:

```bash
npm.cmd run supabase:reset
npm.cmd run supabase:test:db
npm.cmd run supabase:types
npm.cmd run countries:reference:check
npm.cmd run supabase:stop
```

- `supabase:reset` replays repository migrations against the local stack only.
- `supabase:test:db` runs the pgTAP database tests in `supabase/tests/database`.
- `supabase:types` refreshes `types/database.ts` from the local public schema.
- `countries:reference:check` confirms the migration catalogue exactly matches the canonical 195 sovereign records in `data/countries.ts`.
- Local test members are created through the same email OTP and `/account/onboarding` flow as the application; no development member activity is seeded.
- Local Auth uses the repository-controlled code-only email template. Production SMTP and hosted Auth-template changes are future operational work.
- Ordinary setup must not use `supabase db push`, link to a hosted project, or change hosted Auth/RLS settings.
- The existing hosted `skillatlas_page_comments` schema is not reproduced by a speculative migration; see `supabase/migrations/README.md`.

## Build

```bash
npm.cmd run build
npm.cmd run start
```

Run `npm.cmd run lint` for the configured ESLint checks.

## Project structure

```text
app/                 App Router pages, including Auth, account onboarding, and public members
lib/account/         Server-only account-state, participation, and profile validation helpers
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
