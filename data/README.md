# Country atlas data

This directory contains the application-facing country catalogue used by the
Countries experience. The classification is a product scope decision, not a
statement about international recognition or disputed boundaries.

## Initial visible country set

The public Countries atlas uses 195 records:

- 193 United Nations Member States.
- The Holy See and the State of Palestine, the two current United Nations
  non-member observer States.

`countries.ts` retains all 249 pre-existing ISO-style country, territory, and
area records. It exports:

- `allCountries`: all 249 source records.
- `sovereignCountries`: the 195 records visible in the initial Countries atlas.
- `territoryAndAreaRecords`: the remaining 54 records, retained for possible
  future use but not exposed as countries in the initial release.

The explicit `SOVEREIGN_COUNTRY_CODES` list makes the product boundary
reviewable. Taiwan and Western Sahara remain in the retained non-visible set
under this initial UN-based definition. Kosovo was not present in the original
249-record source. Antarctica, dependencies, and other geographic areas are
also retained but excluded from the visible atlas.

No source records or legacy fields were deleted during extraction. The legacy
identity, aura, strengths, weakness, description, and trend fields remain only
to preserve existing data while the Countries page is rebuilt; the v2 cards
and country routes will not display that personality system. `topGames` is
optional and remains unset unless reliable data is added.

## Map coverage

The 195 visible countries have complete polygon-based selection coverage in the
2D atlas:

- 167 have usable polygons in `public/data/world-countries-110m.geo.json`.
- The remaining 28 use a minimal extract of Natural Earth 1:10m Admin 0
  polygons in `public/data/world-microstates-10m.geo.json`.

The 1:10m extract is pinned to Natural Earth vector repository revision
`ca96624a56bd078437bca8184e78163e5039ad19`. Natural Earth data is public
domain. The prior 1:110m tiny-country points and sourced label positions remain
available as reference data, but the Countries atlas does not render them as
visible country substitutes and does not invent polygon boundaries.

## References

- [United Nations Member States](https://www.un.org/en/about-us/member-states)
- [United Nations non-member observer States](https://www.un.org/en/about-us/non-member-states)
- [Natural Earth](https://www.naturalearthdata.com/)
- [Natural Earth vector repository](https://github.com/nvkelso/natural-earth-vector)
