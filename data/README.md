# Country atlas data

## Trust presentation V0.1

`lib/evidence.ts` separates publication states (canonical, provisional, fixture,
unavailable, unknown) from reasoning states (observed, derived, interpretation,
inferred intent, forecast, unknown/unresolved). Geographic catalogue admission
does not admit competitive fields stored in the same record.

Rankings, Country Dossiers and Atlas share `app/components/evidence/evidence-ui.tsx`.
The public explanation is `/about/methodology`. Current competitive summaries
are explicitly fixture/demo, with unavailable competitive evidence and unknown
confidence. Repository fixture paths identify value origins, not supporting
competitive evidence. No methodology version or data-update timestamp is
invented from a release date.

The typed summary accepts registered source IDs/labels/kinds, explicit source-item
references, optional individually named timestamps,
methodology version, evidence status, limitations and justified future confidence.
An assessed confidence requires a rationale and source identifiers; these hooks
do not approve any dataset or activate ingestion. Current ranking values and
calculations are unchanged. Extend the summaries only with admitted evidence;
do not relabel fixtures as provisional or canonical.

## Data Foundations V0.1 — internal operating policy

Contracts live in `lib/data-foundations.ts`, checks in `lib/data-validation.ts`,
and the inventory of existing origins in `data/source-registry.ts`.
These are typed internal hooks, not an ingestion API, persistence layer, complete
external-JSON parser or authorization service. No provider, scheduler, admin UI,
database migration or production data integration is activated by this unit.

The operational source registry is server-only. Public Evidence imports only the
explicit ID/label/kind allowlist in `data/public-evidence-sources.ts`; rights,
reliability and review notes are not serialized into public summaries or bundled
into client code. Tests check the allowlist against the registry. Inactive sources
remain identifiable in historical records but cannot support new admission.

### Entity identity

| Entity | Durable identity | Display / address (not identity) |
| --- | --- | --- |
| Country | Existing `CountryAtlasRecord.id`, e.g. `usa`, `c-te-divoire` | `name`, ISO flag code, current country route/query |
| Game | Existing `GAME_DEFINITIONS.id`, including case-sensitive `rocketLeague` | Game name, aliases, `/games#entity-{id}` |
| Player | Existing `PrototypePlayer.id` | Handle, real-name label, `/profiles?player={id}`; all current players are fixtures |
| Team | No canonical team records yet; assign a persistent ID when supported | A prototype player's team text is not a team ID or verified organisation |
| Member | Existing private `profiles.id` UUID linked to Auth | Case-preserving username/public route and editable display name |

Preserve these IDs even if a display name or address changes. Do not regenerate
IDs from labels; existing slug-shaped IDs remain opaque stable keys. Entity
references are `(kind, id)` to prevent cross-kind collisions. `EntityIdentity`
separates identity, route, aliases and optional historical names without building
a second catalogue or historical-name database. Future renames need explicit
redirect/alias mapping, not a rewritten ID. Teams must not be inferred from text.

Member UUIDs are **internal only**, not public evidence/search payloads. The
current public-profile allowlist and privacy controls remain authoritative.
Global Search's username-based member key is a presentation key, not a replacement
database identity. A future public opaque member ID needs a separate privacy
decision. Members and competitive players are not interchangeable entities.

Search continues to use `lib/search-catalogue.ts`, `constants/search-aliases.ts`
and existing routes. No labels, aliases, IDs, directory visibility or search
semantics change. No Events/Tournaments/Matches model is introduced; future
domain models can reuse source references, clocks, reviews and audit contracts
without converting today's tables into a polymorphic entity store.

### Country Attribution Policy V0.1

There is no universal "belongs to country" field or fallback chain.

- Person/player: citizenship (possibly multiple), birthplace, residence,
  competitive eligibility and represented country are separate dimensions.
- Team/organisation: HQ, legal registration, declared region, roster composition,
  event registration and league region are separate dimensions.
- Country values reference the existing sovereign catalogue. Regions remain
  explicit region labels, not guessed countries. Unknown attribution has a reason
  and **no value payload**. Missing attribution must not become the person's birth
  country, their employer's HQ, a fixture association or a guessed nationality.
- Each known attribution needs evidence references. Record context such as event,
  eligibility rules and roster date; conflicting claims remain separate for review.
  Country lists do not imply equal weighting or prove roster percentages.
- A future ranking methodology must declare a version, attribution dimension,
  multi-country allocation rule and missing-data treatment. V0.1 requires
  exclude-and-disclose for missing attribution; no scoring formula is approved.
  `selectAttributions` returns exact-dimension claims, never resolves conflicts or
  silently chooses the first claim. Consumers must review ambiguity before use.
- Account Representing/Born/Lives In/Heritage remain member-provided identity with
  their existing privacy rules. They are **not** verified citizenship, eligibility
  or permission to use private values for competitive ranking.

Hypothetical example: a player born in France, resident in Germany, eligible for
France and employed by a US organisation has four distinct facts. Birth does not
prove citizenship; employment does not make the player American. An eligibility
methodology would inspect eligibility evidence, not residence or employer HQ.

Hypothetical team: US legal registration, a majority Danish roster and a European
league describe three dimensions. US registration does not establish HQ; a Danish
majority is not a whole-team nationality; Europe is not a country. A roster-based
method needs dated roster evidence and an explicit allocation rule. These examples
are policy illustrations only, not new claims about real entities.

### Sources, usage rights and cadence

Registry fields: stable ID, name, type (reference/fixture/competitive), origin,
rights status/notes, access method, reliability notes, expected cadence, active
flag, notes and optional scope-specific usage review. Existing Evidence IDs
`data/countries.ts` and `data/country-rankings.ts` are retained as opaque IDs even
if the origin file later moves. Public labels remain human-readable.

Country identity and competitive fixtures in the same file are distinct source
scopes. Natural Earth's existing local notice supplies pinned asset origins,
revisions and hashes; `itemReference` must identify the actual asset/revision.
The registry inventories that notice, not a newly verified external licence.

Rights: `permitted`, `public-open`, `licensed`, `restricted`, `unknown`,
`prohibited`. Unknown/restricted/prohibited block production-use eligibility.
Even permitted/open/licensed require an active non-fixture source and an explicit
approved usage review for the requested reference or competitive scope. Review
records need an actor, date and reason. These are operational checks, not legal
advice; a status field cannot prove licence compliance. No reviewer or approval
has been invented for existing entries, so none passes this **future admission**
gate today. This does not silently revoke the already-approved geographic product
catalogue or turn its competitive fields into authoritative facts.

Cadence: realtime, hourly, daily, weekly, event-driven, manual, irregular, unknown.
It expresses an expectation, not a job, SLA or evidence of freshness. Current local
origins are manual. `active` means locally in use, not an enabled upstream provider.
Future licensed access, freshness tolerances and responsible reviewers require
explicit approval; no paused provider is reactivated.

### Evidence, clocks and admission

`EvidenceRecord` names subject/field, explicit known/unknown/unavailable value,
origin, reference/competitive scope, observation/derivation, existing `DataState`,
source ID + item reference, clocks, optional methodology, admission and dependency
IDs. `EvidenceSummary` reuses those references/clocks for the existing trust UI.
Confidence remains the existing separate Evidence contract; no inferred rating.

| Clock | Meaning |
| --- | --- |
| `sourceUpdatedAt` | Timestamp claimed by the source for its own item |
| `observedAt` | When SkillAtlas actually observed that item/value |
| `collectedAt` | When SkillAtlas captured the observation |
| `admittedAt` | When reviewed use was admitted by SkillAtlas |
| `recalculatedAt` | When SkillAtlas last computed the derived value |

Use UTC ISO-8601; omit unknown clocks. Never copy a build time, file mtime,
deployment time or another clock into a missing timestamp. Source and recalculation
clocks have independent meanings. Observation must not follow collection/admission.
UI labels identify each known clock; fixtures show UNKNOWN, not a fabricated date.
Profile `created_at`/`updated_at` remain account persistence timestamps, not evidence
admission or competitive freshness.

Lifecycle: discovered → collected → validated → admitted. Earlier states may be
rejected or need review; needs-review/rejected records require renewed validation
before admission. Admitted records may need review or be superseded; superseded
records are terminal, with a different replacement reference. This lifecycle is
**not** a second set of publication states. Canonical/provisional requires reviewed
admission; fetched, validated or AI-produced data is not automatically authoritative.
Derived admitted values additionally require methodology version. Approval requires
source-use permission, item references, observation/collection/admission clocks,
approved review and an admitting actor. Validation does not confer permission.

Fixtures cannot be admitted or promoted, even by changing their origin label when
a source is still marked fixture. Existing competitive summaries retain
FIXTURE / DEMO, unavailable evidence, unknown confidence and no review dates.
Identity catalogue approval is not transferable to scores/history in the same file.

### Corrections, audit and QA

Correction kinds: factual, source, attribution, methodology, stale data, duplicate
entity, mis-linked entity. Lifecycle: reported → under-review → accepted/rejected;
accepted → applied only after a replacement is validated/admitted. Preserve the
original and supersede it; do not rewrite admitted history in place. Store review,
reason and replacement evidence reference. No public submission workflow is built.

`AuditChange` records entity/field, explicit old/new values (including unknown),
reason, evidence IDs, timestamp, actor/system and optional correction ID.
`dependsOnEvidenceIds` supports later impact review/recalculation without a lineage
graph. Persistence must enforce existence, acyclic dependencies, append-only audit
and actor authorization when it is introduced; types alone do not enforce them.

QA vocabulary: missing required field, duplicate entity, conflicting source, stale
source, invalid country attribution, orphan relationship, impossible value,
unexpected schema value. Current pure checks cover source duplicates/vocabulary,
rights eligibility, clocks, admission prerequisites and attribution validity.
Conflict arbitration, staleness thresholds and domain-specific score ranges are
not guessed. Unknown is not zero, blank text, a default country or confidence.

Run `node --test scripts/data-foundations.test.mjs scripts/evidence.test.mjs
scripts/global-search.test.mjs` (one line), then full tests/build/typecheck/lint.
No local reset, migration, hosted schema access or provider call is needed.

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
