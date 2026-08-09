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

## High-resolution microstate geometry

`world-microstates-10m.geo.json` contains the 28 Natural Earth 1:10m Admin 0
country polygons needed to complete the 195-country Countries atlas when the
1:110m layer has no usable geometry. The checked-in file is a minimal extract,
not a replacement world dataset. It preserves real coastlines and boundaries;
SkillAtlas does not render substitute dots or fabricated shapes.

- Original data: [Natural Earth](https://www.naturalearthdata.com/)
- Source repository: [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector)
- Source revision: `ca96624a56bd078437bca8184e78163e5039ad19`
- Source file: `geojson/ne_10m_admin_0_countries.geojson`
- Included features: `AD`, `AG`, `BB`, `BH`, `CV`, `DM`, `FM`, `GD`, `KI`,
  `KM`, `KN`, `LC`, `LI`, `MC`, `MH`, `MT`, `MU`, `MV`, `NR`, `PW`, `SC`,
  `SG`, `SM`, `ST`, `TO`, `TV`, `VA`, `VC`
- Local file SHA-256: `7273AFC6CFF92F5FB119A4D3CDB22442898B7AC126CB53481DF1DC92F9A2E367`

Natural Earth makes this dataset available in the public domain. The Countries
atlas loads both polygon layers locally and has no runtime dependency on the
source repository.

## World coastline overlay

`world-coastline-110m.geo.json` contains the Natural Earth 1:110m coastline
linework used to give the Countries atlas a clear coast-versus-border visual
hierarchy. It is checked in and served locally alongside the country geometry.

- Original data: [Natural Earth](https://www.naturalearthdata.com/)
- Source repository: [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector)
- Source revision: `ca96624a56bd078437bca8184e78163e5039ad19`
- Source file: `geojson/ne_110m_coastline.geojson`
- Local file SHA-256: `851F581FF5FFB844DEED8AE1A9CE22E3C4BB3D74FA342CADB5D8E39B41AE7C3C`

Natural Earth makes this dataset available in the public domain. The atlas uses
the Natural Earth 1 projection for a calm, compact small-scale world view and
does not request geographic data from an external runtime URL.

## Retained tiny-country reference points

`world-country-markers-110m.geo.json` contains Natural Earth's 1:110m Admin 0
tiny-country point layer. It is retained for provenance and possible label
placement work, but the Countries atlas no longer renders these points as
visible country substitutes.

- Original data: [Natural Earth](https://www.naturalearthdata.com/)
- Source repository: [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector)
- Source revision: `ca96624a56bd078437bca8184e78163e5039ad19`
- Source file: `geojson/ne_110m_admin_0_tiny_countries.geojson`
- Local file SHA-256: `753C4B167361F0F1223091D52F98AADDFB9101529EEF263CC094057E43228C40`

The marker layer contains points, not polygon boundaries. Natural Earth makes
this dataset available in the public domain. Additional sourced label-point
references are documented in `data/README.md`.
