# SkillAtlas Intelligence UI Style Guide

This guide defines the canonical visual direction for SkillAtlas. The design system evolves the existing brand and product architecture; it does not replace working routes, navigation, light/dark mode, or product concepts.

During the incremental migration, existing pages may still use older presentation patterns. New work and deliberately migrated pages should follow this guide instead of reproducing the legacy rounded-card system.

## Design character

SkillAtlas is a modern digital atlas and a global competitive gaming intelligence network.

The interface should feel:

- analytical
- technological
- precise
- dense
- contemporary
- data-driven
- globally connected

It must not become:

- literal military software
- a retro terminal interface
- cyberpunk
- cluttered science fiction
- a conventional oversized gaming dashboard

Atmospheric map grids, geography, restrained glows, and technical metadata are appropriate when they support orientation or meaning. Decorative effects must not compete with the underlying information.

## Core rule

If information and interface chrome compete for space, the information should win.

Maps, rankings, tables, charts, comparisons, and live/change indicators should occupy more visual space than their headings or containers. Prefer internal structure and alignment over wrapping every item in another card.

## Brand and colour semantics

The SkillAtlas brand colours remain unchanged:

| Colour | Value | Canonical meaning |
| --- | --- | --- |
| Turquoise | `#19d3cf` | Active and selected states, positive movement, map geography, primary chart/data series, links, and focus |
| Pink | `#ff2fa8` | Negative movement, alerts, exceptional change, and meaningful secondary signals |
| Dark charcoal | `#2f3a46` | Primary dark-mode canvas |
| Light canvas | `#F8FAFC` | Primary light-mode canvas |

Pink is not the default structural border colour. Neutral borders define ordinary structure. Accent borders should indicate a meaningful state.

Colour must not carry meaning alone. Pair movement and status colours with signs, arrows, labels, icons, position, or explanatory text.

## Light and dark modes

- Every migrated page and component must support both modes intentionally.
- Light mode uses the light canvas, crisp white and pale-slate surfaces, dark primary text, and restrained shadows.
- Dark mode uses layered charcoal surfaces rather than pure black.
- Turquoise and pink retain the same semantic meanings in both modes.
- Inputs, menus, tables, charts, overlays, and map legends require explicit theme treatment.
- Preserve the existing theme toggle, stored preference, and transition behavior. The shared header wordmark now uses theme-aware live text rather than a title-image swap.
- The Intelligence UI semantic tokens in `app/globals.css` coexist with the legacy theme layer until pages adopt them explicitly.

## Geometry and surfaces

Canonical defaults:

- panel radius: `0px`
- control radius: `0px`
- small structural radius: `0px`
- borders: thin `1px` rules
- panel padding: generally `12-20px`
- panel and layout gaps: generally `10-16px`
- related regions: separate with internal dividers before adding nested cards
- shadows: quiet and used only where elevation or layering is meaningful

Avoid pill shapes unless the semantic purpose genuinely calls for a pill, such as a compact status, live state, or short categorical badge. Buttons, filters, selects, tabs, search fields, metrics, and ordinary containers should not become pills by default.

Avoid large translucent SaaS cards, decorative structural pink borders, generous empty padding, nested bubbles, and sparse one-metric panels.

## Typography hierarchy

The Hybrid Intelligence system has two complementary layers, self-hosted once through `next/font` in the root layout: **IBM Plex Mono** for instrumentation and **IBM Plex Sans** (not Condensed) for reading. Typography roles live in `app/typography.css`; colours and spacing remain separate tokens. Brand styles stay in `app/globals.css` and must not inherit page-title roles.

### Shadow Atlas brand lockup

- Preserve the original PNG symbol and its geometry. A CSS mask using that same PNG's alpha silhouette overlays the shared wordmark gradient at 85% opacity, retaining a little original shading. The symbol overlay uses light `saturate(1.25) brightness(1.1) contrast(1.12)` for stronger colour definition against white, and dark `saturate(1.04) brightness(1.11)` for a modest lift. The image beneath remains the fallback, with light `saturate(1.05) brightness(1.08) contrast(1.06)` and dark `saturate(0.94) brightness(1.05) contrast(1.03)`. These filters affect only the symbol, not the wordmark. Keep turquoise and pink vibrant and recognisable without neon effects; no blur, cropping, shadows or new raster artwork.
- Render the wordmark as crisp Plex Sans: `SKILL` uses the actual light `300` face in primary text, while `ATLAS` remains regular `400` with a continuous turquoise-to-pink gradient. Both symbol and ATLAS share `--sa-brand-gradient` (`#19d3cf` to `#ff2fa8` in both themes). The extra self-hosted Sans weight is for SKILL only; body and interface weights are unchanged. Forced-colour mode uses system link text and the original image. Preserve the existing brand-link footprint and navigation grid.
- The descriptor is **GLOBAL GAMING INTELLIGENCE**, regular Plex Mono, low-priority technical text, without decorative lines. It is hidden below `640px` rather than reduced to illegible type.
- Keep original title PNGs intact for retained legacy consumers; the shared header no longer renders their baked-in old tagline.

### Shared interface roles

| Role/class | Layer and weight | Use |
| --- | --- | --- |
| `sa-type-page-title` | Mono 500 | All page titles: **17.92px** desktop/tablet, **14.08px** phone, line-height 1.2. Do not add competing size/weight utilities. |
| `sa-type-heading` | Mono 500 | Section/panel headings; keep existing compact slot sizes. |
| `sa-type-label` | Mono 400, uppercase, 0.12em tracking | Breadcrumbs, form labels, table headings, status/micro-labels. DataLabel consumes this role. Preserve breadcrumb sizes. |
| `sa-type-meta` | Mono 400, 0.02em tracking | Timestamps, counters and short technical metadata. |
| `sa-type-data` | Mono 500, tabular numerals | Rank, score, movement and OTP digits. OTP retains its deliberate digit spacing. |
| `sa-type-control` | Mono 500 | Short technical actions, game/period controls. |
| `sa-type-reading-control` | Sans 500 | Longer actions and country/game option names where Mono impairs reading. |
| `sa-type-body` | Sans 400 | Prose, Profile bio, form instructions/helpers/errors and longer descriptions. Also the default inherited reading layer. |
| `sa-type-intro` | Sans 400 | Page descriptions: 15px desktop/tablet, 14px phone, line-height 1.4. |

Muted/secondary prose uses the same reading role plus the existing text-colour token; it does not need a duplicate typography class. Dense header slots retain their approved 8–14px sizes; their labels and values use the shared weight/tracking tokens. Menu descriptions explicitly use Sans, including inside Mono controls. Field values use Sans 400; numbers use the data role intentionally rather than making an entire table monospace.

Use `--sa-weight-regular` (400) and `--sa-weight-medium` (500) for CSS modules and shared header styles. 600 (`--sa-weight-emphasis`) is reserved for exceptional emphasis; 300 is exclusive to the approved SKILL wordmark. There are no legacy bold/black aliases disguising heavier classes. Normal interface text must not request 700–950.

Avoid arbitrary font families, synthetic heavy weights, broad “all uppercase/all buttons = Mono” selectors, and page-specific title overrides. Keep plain-text Profile/Forum content readable. Native emoji may retain the platform emoji stack; decorative arcade glyphs may retain their deliberate display size/tracking. Typography roles are theme-independent.

## Information density and layout

- Use consistent alignment, dividers, columns, and compact toolbars to establish hierarchy.
- Group related metrics into strips or grids instead of separate cards.
- Keep headers proportionate to the data region they describe.
- The shared page shell uses a compact title/description hierarchy with a `4px` description gap. Keep existing panel padding, status alignment and comfortable control targets; reduce typographic dominance rather than squeezing the interface.
- Prefer compact tables and lists where scanning is more useful than card browsing.
- Do not manufacture density with irrelevant metadata or decorative charts.
- Shared page frames use `--sa-header-expanded-height` for the header offset and `--sa-page-gutter` for the initial gap below it and symmetric horizontal padding: `12px` below `1024px` and `14px` from `1024px`. Rankings uses the full available document width without viewport-unit or one-sided scrollbar compensation. Measure its panel edges against `document.documentElement.clientWidth`, excluding the scrollbar: left, right and initial top insets must agree within 1px. Preserve existing centered maximum widths elsewhere: `1600px` for Players, Forum, Atlas and About; `max-w-7xl` (`1280px`) for Countries, User Rankings and Live Rankings; and About's inner `1320px` limit. Keep intentionally narrow Auth/member forms, destination placeholders and body-copy line lengths unchanged. The shared Auth shell must not add a second top inset inside its content frame. SkillInvaders remains a full-viewport game rather than adopting page-shell padding over its playfield.
- Preserve clear empty, loading, error, and selected states.

## Controls and responsive density

- Desktop controls may use a compact `40px` height.
- Touch and mobile controls should remain at least approximately `44px` where appropriate.
- Search, selects, tabs, and filter controls should use consistent border, radius, label, focus, and disabled treatments.
- Prefer a compact custom-styled native select over the browser-default visual treatment.
- On narrow screens, reflow toolbars and metrics rather than forcing desktop proportions.
- Never trade away readable text, keyboard focus, or comfortable touch targets merely to increase density.
- Prevent document-level horizontal overflow at practical review widths of `390px`, `768px`, `1024px`, and `1440px`.

## Data visualisation

Prefer compact, purposeful visualisations such as:

- sparklines
- mini bars
- signed deltas
- trend indicators
- ranking movement
- historical movement
- percentage distributions
- timestamps
- regional comparisons
- live and status indicators

Charts must communicate real information. Do not add decorative graphs or fabricate data to fill a panel.

Turquoise is the primary neutral/positive series. Pink represents negative movement, alerts, or a meaningful secondary comparison. Neutral slate is used for baselines, axes, inactive data, and context.

Ranking order must remain understandable through number, position, and text without relying on colour.

## Maps and geographic interfaces

- Geography is the primary visual content, not decoration.
- Give map canvases more space than their headings, controls, or legends.
- Use fine grid lines, restrained borders, and clear selected/hovered states.
- Keep controls compact and group technical map metadata coherently.
- Geographic travel may take longer than ordinary UI motion when the eye needs to follow the movement.
- Preserve pointer, touch, and keyboard equivalents for map selection.
- Never change map projection, hit testing, selection, zoom, or navigation behavior as an incidental consequence of a visual refactor.

## Header and navigation

- Continue using the single shared header implementation.
- Preserve the symbol asset, brand-link footprints, theme toggle, active-route styling, sticky and compact-scroll behavior, desktop navigation, and mobile menu behavior. Use the Shadow Atlas live-text lockup described above.
- Desktop navigation order is `Rankings | Atlas | Explore | Forum | About`.
- Explore contains `Countries | Games | Players | Teams | Members`.
- The Rankings dropdown contains `Rankings`, `User Rankings`, and `Live Rankings`.
- User Rankings and Live Rankings must not appear as separate top-level items.
- Use `Players`, not `Profiles`, in visible navigation.
- Desktop navigation uses regular `14px` Plex Mono in a compact, content-sized group with `48px` gaps between items. Including each trigger's `4px` side padding, visible label gaps are `56px`. The content-sized nav track has no extra inline inset; the `52px` gap to the right-anchored `160px` system block plus About's final `4px` padding preserves that same visible `56px` cadence. Spare width belongs to the brand-side track (minimum `432px`), keeping a deliberate logo/title gap instead of distributing the nav items. Preserve the `1280px` desktop breakpoint.
- Desktop Profile and Display controls use `40px` rows; mobile controls retain at least `44px` targets. Their structural corners are square, like panels and menus.
- The header has no top border or shadow and one `1px solid var(--sa-border-subtle)` bottom rule, matching main panel borders. No accent colour, gradient, or glow.
- Desktop active navigation uses primary text and a close, thin `1px` turquoise underline attached to the text-label span only, without a pink leading marker. Desktop top-level labels have no decorative chevrons; expandable families retain their menu semantics and keyboard controls. Mobile disclosure indicators remain. Retain comfortable hit targets independently of the narrow visual indicator.
- Navigation Console category/system labels and medium destination names use Plex Mono at distinct sizes. Preserve the console's layout, focus behavior and disclosures.
- Technical text uses a contrast-safe slate in both themes (`#52647b` light, `#a6b4c6` dark); active mobile text stays dark in light mode with turquoise as the indicator.
- Any future Intelligence UI restyle of the header must be performed as a dedicated, regression-tested change rather than as a side effect of a page migration.

## Interaction, focus, and selected states

- Active and selected states use turquoise by default.
- Positive deltas use turquoise; negative deltas use pink.
- Hover should clarify interactivity without decorative lifting or oversized shadow changes.
- Focus indicators must remain clearly visible in both modes.
- Selected, hover, focus, disabled, live, and alert states must remain distinguishable without relying only on colour.
- Keep control and map semantics available to keyboard and assistive-technology users.

## Motion

Canonical timings:

| Motion | Duration |
| --- | --- |
| Fast feedback | `160ms` |
| Standard interface change | `240ms` |
| Navigation and menu change | `300ms` |
| Geographic/map travel | approximately `400-500ms` |

Use restrained ease-in-out motion. Movement should communicate navigation, change, live activity, or data updates.

Avoid:

- bounce
- spring
- elastic motion
- decorative floating

Respect `prefers-reduced-motion`. Reduced motion must not remove essential state feedback.

## Visible surface coverage

User Rankings, Live Rankings and the minimal country destination use the shared page frame and square panel/control tokens, including their table badges, game filters and action buttons. The floating page-comments panel and account privacy controls follow the same geometry; comment prose remains Plex Sans. Atlas camera labels use regular/medium weights rather than synthetic heavy faces. Country flags use the shared `CountryFlag` presentation with context-specific alignment slots: `sm` 32×20px for tables/lists, `md` 40×24px (default), `lg` 48×32px, and `xl` 64×40px. Slots are transparent and borderless in both variants: no visible plate or dark side framing. Contained images preserve native proportions without stretching, so visible flag sizes can vary within aligned rows. Dark-mode flags use `saturate(0.55) brightness(0.78) contrast(1.08)`; light mode uses `saturate(0.65) brightness(0.9) contrast(1.05)`. No shadow, glow, or crop. The existing FlagCDN source remains unchanged; no additional provider is introduced. Circular geography, status dots, emoji artwork and the functional Live rank-wheel geometry are intentional exceptions, not rounded cards.

## Incremental adoption

- Do not apply the new semantic tokens globally to legacy page components.
- A migrated page should adopt semantic tokens and validated shared primitives explicitly.
- Create shared components from proven page usage rather than speculative APIs.
- Preserve working functionality and responsive behavior while changing presentation.
- Validate every migrated page in light and dark mode, with keyboard interaction, reduced motion, and the standard responsive review widths.
