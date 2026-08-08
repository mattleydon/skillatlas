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
