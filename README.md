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
- Supabase for page comments
- Vercel for deployment
- npm with `package-lock.json`

## Run locally

Use a current Node.js LTS release and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To enable Supabase-backed page comments, add these values to `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

The rest of the site can run without those optional comment settings.

## Build

```bash
npm run build
npm run start
```

Run `npm run lint` for the configured ESLint checks.

## Project structure

```text
app/                 App Router pages, shared layout, theme, and global styles
public/              Static SkillAtlas images and brand assets
package.json         Project scripts and dependencies
next.config.ts       Next.js configuration
postcss.config.mjs   Tailwind/PostCSS configuration
tsconfig.json        TypeScript configuration
```

## Deployment

SkillAtlas uses Vercel's standard Next.js deployment flow and does not require a custom `vercel.json`. Connect the repository to a Vercel project, use the default `npm run build` command, and configure the Supabase environment variables in Vercel when page comments are required. Pull requests can use Vercel preview deployments before changes reach the production branch.

## MVP scope

The initial SkillAtlas release focuses on country-level rankings, discovery, and community features. States, provinces, cities, and districts are future expansion areas and are intentionally outside the current MVP.
