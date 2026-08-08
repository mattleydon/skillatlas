# SkillAtlas Roadmap

SkillAtlas is being developed as a focused, country-level gaming and esports atlas. Priorities should move forward in order, with a polished and reliable MVP taking precedence over feature expansion.

## Phase 1: Country-level MVP

### Objective

Deliver a stable, responsive, and deployable foundation for the complete country-level SkillAtlas experience.

### Major features

- Stable shared navigation
- Rankings
- World Map
- Countries
- Players
- Forum
- User Rankings
- Live Rankings
- Responsive design across desktop, tablet, and mobile
- Reliable preview and production deployments

### Dependencies

- Consistent shared layout, navigation, theme, and design system
- Reliable country-level data and existing brand assets
- Responsive and cross-browser quality assurance
- Passing Next.js builds and correctly configured Vercel environments

### Definition of done

- Every core page is reachable through the agreed navigation and works without regressions.
- Light and dark modes are consistent, and layouts remain usable without clipping or overflow at supported viewport sizes.
- Rankings, map, country, player, forum, and community-ranking experiences provide a coherent MVP.
- `npm run build` succeeds and Vercel preview and production deployments are stable.

## Phase 2: Persistent community platform

### Objective

Replace prototype community interactions with secure, persistent user and forum functionality.

### Major features

- Supabase backend for core product data
- Authentication
- Real forum threads and replies
- User profiles
- Moderation tools and workflows
- Persistent voting

### Dependencies

- A reviewed Supabase schema and environment configuration
- Authentication and account-recovery decisions
- Row Level Security policies and role-based permissions
- Moderation rules, reporting flows, and abuse protections
- Stable Phase 1 routes and user experience

### Definition of done

- Users can securely sign in, manage a profile, create threads, post replies, and vote.
- Forum content and votes persist correctly across sessions and deployments.
- Moderators can review reports and manage content using documented permissions.
- Backend policies protect private or privileged data, and production builds and deployments remain stable.

## Phase 3: Ranking and community depth

### Objective

Improve the quality, transparency, and usefulness of rankings while expanding country-level insight and community participation.

### Major features

- Ranking methodology improvements
- Richer country analytics
- Support for more games
- Additional community features

### Dependencies

- Trustworthy data sources and a documented ranking methodology
- A mature Phase 2 data model and moderation foundation
- Extensible game, country, and ranking schemas
- Performance planning for larger datasets and richer visualisations

### Definition of done

- Ranking methodology is documented, explainable, and applied consistently.
- Country analytics use verified data and remain clear on desktop and mobile.
- New games can be added without duplicating page or ranking logic.
- New community features are persistent, moderated, and demonstrably useful to the country-level product.

## Future: Deeper geographic layers

### Objective

Expand below the country level only after the country-based product is mature and there is validated user demand.

### Major features

- States and provinces
- Districts and cities
- Deeper geographic ranking, map, and discovery layers

### Dependencies

- Explicit product approval beyond the current MVP scope
- Reliable and comparable subnational gaming and esports data
- A scalable geographic hierarchy, routing model, and map experience
- Proven country-level adoption and a clear user need

### Definition of done

- Expansion has been explicitly prioritised after the country-level roadmap is complete.
- Geographic levels have clear data standards and do not fragment or weaken country rankings.
- Navigation, search, rankings, maps, moderation, and responsive layouts support the added hierarchy coherently.

Until these conditions are met, states, provinces, districts, cities, and other deeper layers remain out of scope.
