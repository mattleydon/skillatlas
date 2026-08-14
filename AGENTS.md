# SkillAtlas Engineering Rules

## Product
SkillAtlas is a country-based gaming and esports atlas.

Core pages:
- Rankings
- World Map
- Countries
- Players
- Forum
- User Rankings
- Live Rankings
- About

## Product scope
- Initial release focuses on countries.
- States, provinces, cities, and districts are future expansion only.
- Do not implement them unless explicitly requested.
- Avoid feature creep.
- Prefer a polished MVP over adding too many features.

## Design
- Light/white theme plus dark mode.
- Turquoise: #19d3cf
- Pink: #ff2fa8
- Clean futuristic atlas / gaming aesthetic.
- Fully responsive on desktop, tablet, and mobile.
- Preserve the existing SkillAtlas visual language.

## Navigation
Top-level navigation must be:
Rankings | World Map | Countries | Players | Forum | About

Rankings dropdown contains:
- Rankings
- User Rankings
- Live Rankings

Never:
- show User Rankings as a separate top-level navigation item
- show Live Rankings as a separate top-level navigation item
- use Profiles instead of Players in visible navigation

## Development rules
- Always inspect the current implementation before editing.
- Never replace newer working code with an older implementation.
- Preserve existing functionality unless explicitly asked to remove it.
- Prefer shared components instead of duplicated implementations.
- Use feature branches for meaningful changes.
- Run npm run build after substantial changes.
- Fix TypeScript/build errors before reporting completion.
- Review git diff before committing.
- Do not commit, push, or merge unless explicitly instructed.
- Summarise every changed file after a task.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
