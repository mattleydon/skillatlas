# World country boundaries

`world-countries-110m.geo.json` contains Natural Earth 1:110m Admin 0 country
polygons. SkillAtlas serves this checked-in copy locally so the World Map does
not depend on a third-party runtime request.

- Original data: [Natural Earth](https://www.naturalearthdata.com/)
- GeoJSON conversion: [martynafford/natural-earth-geojson](https://github.com/martynafford/natural-earth-geojson)
- Source revision: `0b9a6ceb0a7032713abd9460ac1e995a9c60cd1e`
- Source file: `110m/cultural/ne_110m_admin_0_countries.json`
- Local file SHA-256: `A2FABA6D84AEB04246240EE301C5E94A1A32B0E294A2C97094262FD0A6AE3C16`

Natural Earth states that its raster and vector map data are in the public
domain. The GeoJSON conversion repository distributes the converted dataset
under the CC0 1.0 license. Attribution is not required, but this notice is
retained for provenance and reproducibility.

## Tiny-country markers

`world-country-markers-110m.geo.json` contains Natural Earth's 1:110m Admin 0
tiny-country point layer. The Countries atlas will use these points only when a
visible sovereign country has no usable polygon at this scale.

- Original data: [Natural Earth](https://www.naturalearthdata.com/)
- Source repository: [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector)
- Source revision: `ca96624a56bd078437bca8184e78163e5039ad19`
- Source file: `geojson/ne_110m_admin_0_tiny_countries.geojson`
- Local file SHA-256: `753C4B167361F0F1223091D52F98AADDFB9101529EEF263CC094057E43228C40`

The marker layer contains points, not substitute polygon boundaries. Natural
Earth makes this dataset available in the public domain. Additional sourced
label-point fallbacks for microstates are documented in `data/README.md`.
