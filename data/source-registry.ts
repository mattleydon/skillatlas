import "server-only";
import type { SourceRecord } from "@/lib/data-foundations";
import { COUNTRY_FIXTURE_SOURCE, RANKING_FIXTURE_SOURCE } from "@/data/public-evidence-sources";

// These existing Evidence IDs are retained as opaque identifiers, even if files move.
export const COUNTRY_FIXTURE_SOURCE_ID = COUNTRY_FIXTURE_SOURCE.id;
export const RANKING_FIXTURE_SOURCE_ID = RANKING_FIXTURE_SOURCE.id;
const fixture = (id: string, name: string, origin: string): SourceRecord => ({
  id, name, origin, type: "fixture", rights: "unknown", access: "local-file",
  rightsNotes: "No production competitive-data usage review has been recorded.",
  reliabilityNotes: "Prototype values; not verified competitive observations.",
  cadence: "manual", active: true, notes: "Active means consumed locally, not an enabled provider or ingestion job.",
});

/** Inventory of existing origins only. No asserted reviewer, admission date or SLA. */
export const SOURCE_REGISTRY: readonly SourceRecord[] = [
  fixture(COUNTRY_FIXTURE_SOURCE_ID, COUNTRY_FIXTURE_SOURCE.label, "data/countries.ts"),
  fixture(RANKING_FIXTURE_SOURCE_ID, RANKING_FIXTURE_SOURCE.label, "data/country-rankings.ts"),
  fixture("skillatlas-player-fixtures", "Player fixture data", "app/profiles/player-data.ts"),
  {
    id: "skillatlas-country-identity", name: "SkillAtlas country identity catalogue", type: "reference",
    origin: "data/countries.ts#sovereignCountries", rights: "unknown", access: "local-file",
    rightsNotes: "Catalogue usage has no separate recorded rights review; do not infer competitive usage permission.",
    reliabilityNotes: "Existing approved 195-country identity scope only; excludes scores, achievements and histories in the same file.",
    cadence: "manual", active: true, notes: "249 retained source records include 54 territories/areas outside current sovereign scope.",
  },
  {
    id: "skillatlas-game-identity", name: "SkillAtlas game catalogue", type: "reference",
    origin: "constants/games.ts#GAME_DEFINITIONS", rights: "unknown", access: "local-file",
    rightsNotes: "No recorded production usage review. Naming a game does not establish rights to third-party data or assets.",
    reliabilityNotes: "Six existing product identifiers/labels, not competitive evidence.",
    cadence: "manual", active: true, notes: "Preserve case-sensitive IDs, including rocketLeague.",
  },
  {
    id: "natural-earth-local-geography", name: "Locally stored Natural Earth geography", type: "reference",
    origin: "public/data/README.md", rights: "public-open", access: "local-file",
    rightsNotes: "The existing provenance notice records Natural Earth public-domain data and CC0 conversion. This is not a new legal conclusion or usage approval.",
    reliabilityNotes: "Cartographic reference only; local notice pins upstream revisions and SHA-256 hashes for each asset.",
    cadence: "manual", active: true, notes: "Use an individual asset/revision as itemReference. No external runtime dependency or competitive-data claim.",
  },
];

export function getSourceById(id: string): SourceRecord | undefined {
  return SOURCE_REGISTRY.find((source) => source.id === id);
}
