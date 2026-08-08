# SkillAtlas Style Guide

This guide records the visual language already used across SkillAtlas. New work should extend these patterns instead of introducing a separate design system.

## Brand palette

| Colour | Value | Current use |
| --- | --- | --- |
| Turquoise | `#19d3cf` | Primary accent, active navigation, positive movement, scores, focus rings, and primary selections |
| Pink | `#ff2fa8` | Secondary accent, rank numbers, negative movement, structural borders, and alternate selections |
| Light canvas | `#F8FAFC` to `#EEF7FA` | Page backgrounds and light atlas gradients |
| Light surface | `#FFFFFF` | Cards, controls, menus, and table surfaces, usually with slight transparency |
| Primary light text | `#111827` | Headings and high-emphasis content |
| Dark canvas | `#2f3a46` | Main dark-mode background |
| Dark surfaces | `#354250`, `#273341`, `#202b37` | Cards, controls, menus, and layered dark surfaces |
| Primary dark text | `#e8eef7` | High-emphasis dark-mode text |
| Muted dark text | `#cbd5e1` | Supporting dark-mode text |

Use turquoise and pink at reduced opacity for borders, glows, chips, and background decoration. Reserve solid accent fills for selected controls and important actions so the interface does not become visually noisy.

## Light and dark modes

- Every page and component must work in both modes.
- Light mode uses a pale slate canvas, translucent white surfaces, dark slate text, and subtle shadows.
- Dark mode uses layered charcoal surfaces rather than pure black, with pale slate text and softened borders.
- Keep turquoise and pink recognisable in both modes; adjust opacity and surrounding contrast rather than replacing the brand colours.
- Inputs, tables, menus, cards, charts, and overlays must all receive an intentional dark treatment.
- Preserve the current theme toggle, stored preference, smooth theme transition, and light/dark title-logo swap.
- Respect `prefers-reduced-motion` when adding transitions or animation.

## Visual language

SkillAtlas combines a clean atlas interface with a restrained gaming aesthetic:

- Use soft turquoise and pink radial gradients, fine grid lines, globe/map motifs, and large low-opacity rings for atmosphere.
- Keep decorative layers behind content and low contrast enough to preserve readability.
- Use translucent panels and backdrop blur to create depth without heavy skeuomorphism.
- Prefer crisp data presentation and clear hierarchy over excessive neon, glow, or animation.
- Motion should support orientation: subtle fades, small translations, map movement, and the existing header shrink are appropriate.

## Header and navigation

- Use one shared header/navigation implementation across every standard page.
- The header remains fixed, uses a translucent blurred surface, and has a subtle pink bottom border.
- Preserve the existing logo and title assets, their links, and the compact header state triggered by scrolling.
- Keep the title readable and the theme toggle accessible at every viewport width.
- Desktop navigation order is: `Rankings | World Map | Countries | Players | Forum | About`.
- Rankings is the homepage and owns a dropdown containing `Rankings`, `User Rankings`, and `Live Rankings`.
- Never show User Rankings or Live Rankings as separate top-level items.
- Use the visible label `Players`, even though the current route is `/profiles`.
- Forum links to `/forum`; About remains the final top-level item and should align beneath the theme control where the layout permits.
- Active pages use turquoise text. Standard links use slate text with a turquoise hover state.
- The Rankings dropdown uses a rounded, blurred card with a soft turquoise/pink wash, pink border, concise descriptions, and turquoise active state.
- On compact layouts, replace the full navigation row with a menu that preserves the same order and Rankings hierarchy. Do not allow header content or controls to overflow horizontally.

## Cards, borders, and surfaces

- Use `rounded-3xl` for primary sections, hero panels, and large feature cards.
- Use `rounded-2xl` for compact statistics, filters, search fields, and supporting panels.
- Use fully rounded pills for tags, filters, scores, and small actions.
- Primary panels typically use translucent white surfaces around 88-92% opacity, backdrop blur, and a subtle shadow.
- Pink borders at roughly 35-45% opacity provide the main structural outline.
- Turquoise borders identify focus, selection, or positive emphasis.
- Neutral gray borders separate table rows, quiet controls, and nested content.
- In dark mode, convert surfaces to layered charcoal and neutral borders to muted slate while retaining accent borders.
- Interactive cards may lift slightly, strengthen their turquoise border, and gain a larger shadow on hover. Static cards should not move.

## Typography hierarchy

The current interface uses a practical sans-serif stack: Arial, Helvetica, then the system sans-serif fallback.

- Hero and page titles: bold or black, tightly tracked, generally `text-3xl` to `text-4xl` on larger screens.
- Section titles: black weight with tight tracking, generally `text-lg` to `text-2xl`.
- Key statistics and ranking values: black weight, sized for importance from `text-base` through `text-3xl`.
- Eyebrows and data labels: `10-12px`, bold or black, uppercase, with wide letter spacing around `0.17em-0.28em`.
- Body copy: usually `14-16px`, normal to semibold, with relaxed line height and muted slate colour.
- Tags and metadata: `11-12px`, semibold or bold, concise, and readable without relying on colour alone.
- Preserve hierarchy on mobile by reducing large headings slightly; do not shrink body text or controls below comfortable reading and interaction sizes.

## Spacing and layout consistency

- Use the existing Tailwind spacing rhythm based on 4px increments.
- Standard panel padding is commonly `p-5` or `p-6`; compact cards and controls use `p-3` or `p-4`.
- Common grid and flex gaps are `gap-3` through `gap-6`.
- Separate major sections with approximately `mb-6` and keep related labels, titles, and descriptions closer together.
- Standard page content is centred in a `max-w-7xl` container.
- Maintain consistent outer gutters. Reduce desktop padding on phones, but keep at least 16px between content and viewport edges.
- Avoid one-off spacing values unless required by a map, chart, or fixed header interaction.

## Hover, focus, and selected states

- Use transitions around 160-300ms for colour, border, opacity, shadow, and small transforms.
- Default hover emphasis is turquoise text or border. Pink is appropriate for secondary/alternate controls or negative actions.
- Selected primary controls use a solid turquoise fill with white text and a soft turquoise shadow.
- Selected alternate or time-period controls may use a solid pink fill with white text and a soft pink shadow.
- Focused form controls use a turquoise border and a visible soft turquoise ring.
- Table rows use a very light turquoise or neutral surface on hover.
- Active, hover, focus, disabled, and selected states must remain distinguishable in both themes and must not depend on colour alone.

## Charts and ranking colours

- Turquoise represents positive movement, upward trends, strength, active scores, and favourable momentum.
- Pink represents negative movement, downward trends, rank numbering, loss, or contrasting comparison data.
- Neutral slate or gray represents baselines, inactive data, axes, supporting labels, and unchanged values.
- Use turquoise for the primary line in neutral single-series charts.
- In directional charts, use turquoise for rising data and pink for falling data; pair colour with arrows, signs, or labels.
- Use subtle accent fills and glows behind data. Keep plotting areas and labels high contrast in both modes.
- Apply the same meaning consistently across charts, tables, badges, and summary cards. Do not reverse positive and negative colours between pages.
- Ranking order must remain legible without colour; position, numbers, labels, and movement indicators carry the primary meaning.

## Responsive expectations

- Treat 390px, 768px, 1024px, and 1440px as practical review widths.
- Start with a single-column mobile layout, then introduce multi-column grids at the existing `sm`, `md`, `lg`, and `xl` breakpoints when space permits.
- Preserve the established desktop layout at 1024px and above unless a feature specifically requires another treatment.
- Reflow metadata, filters, actions, and statistics instead of forcing fixed or minimum widths.
- Search fields and primary controls should fill their container on narrow screens.
- Wide tables, charts, and category rows need an intentional responsive treatment such as a compact card layout or polished, scrollbar-hidden horizontal region.
- Prevent document-level horizontal overflow. Titles, tags, previews, activity details, statistics, and actions must remain reachable.
- Touch targets should remain comfortably usable, and hover-only behavior must have keyboard and touch equivalents.
