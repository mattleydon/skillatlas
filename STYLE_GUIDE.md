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
- Preserve the existing theme toggle, stored preference, title-logo swap, and transition behavior.
- The Intelligence UI semantic tokens in `app/globals.css` coexist with the legacy theme layer until pages adopt them explicitly.

## Geometry and surfaces

Canonical defaults:

- panel radius: approximately `10px`
- control radius: approximately `8px`
- small radius: approximately `6px`
- borders: thin `1px` rules
- panel padding: generally `12-20px`
- panel and layout gaps: generally `10-16px`
- related regions: separate with internal dividers before adding nested cards
- shadows: quiet and used only where elevation or layering is meaningful

Avoid pill shapes unless the semantic purpose genuinely calls for a pill, such as a compact status, live state, or short categorical badge. Buttons, filters, selects, tabs, search fields, metrics, and ordinary containers should not become pills by default.

Avoid large translucent SaaS cards, decorative structural pink borders, generous empty padding, nested bubbles, and sparse one-metric panels.

## Typography hierarchy

The primary interface remains a clean system sans-serif. Use the technical/data font stack selectively rather than making the entire site monospace.

Approximate hierarchy:

| Role | Size |
| --- | --- |
| Page title | `32-40px` |
| Section heading | `20-24px` |
| Panel heading | `14-18px` |
| Body and data | `13-15px` |
| Technical label | `10-12px`, uppercase |
| Major metric | `20-28px` |

Restrained monospace or semi-monospace treatment is appropriate for:

- rankings
- scores
- percentages
- timestamps
- deltas
- technical metadata

Technical labels should be concise. Wide tracking may be used carefully, but labels should not create excessive vertical space.

## Information density and layout

- Use consistent alignment, dividers, columns, and compact toolbars to establish hierarchy.
- Group related metrics into strips or grids instead of separate cards.
- Keep headers proportionate to the data region they describe.
- Prefer compact tables and lists where scanning is more useful than card browsing.
- Do not manufacture density with irrelevant metadata or decorative charts.
- Keep standard page gutters and the established responsive container behavior unless a map or data table requires a deliberate exception.
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
- Preserve the logo/title assets, theme toggle, active-route styling, sticky and compact-scroll behavior, desktop navigation, and mobile menu behavior.
- Desktop navigation order remains `Rankings | World Map | Countries | Players | Forum | About`.
- The Rankings dropdown contains `Rankings`, `User Rankings`, and `Live Rankings`.
- User Rankings and Live Rankings must not appear as separate top-level items.
- Use `Players`, not `Profiles`, in visible navigation.
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

## Incremental adoption

- Do not apply the new semantic tokens globally to legacy page components.
- A migrated page should adopt semantic tokens and validated shared primitives explicitly.
- Create shared components from proven page usage rather than speculative APIs.
- Preserve working functionality and responsive behavior while changing presentation.
- Validate every migrated page in light and dark mode, with keyboard interaction, reduced motion, and the standard responsive review widths.
