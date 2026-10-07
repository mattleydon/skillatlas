import type { EvidenceSource } from "@/lib/evidence";

// Explicit public allowlist. Operational rights/review notes live in the server-only registry.
// Preserve existing IDs as opaque identifiers even if origin files move.
export const COUNTRY_FIXTURE_SOURCE: EvidenceSource = {
  id: "data/countries.ts", label: "Country catalogue fixture data", kind: "fixture",
};
export const RANKING_FIXTURE_SOURCE: EvidenceSource = {
  id: "data/country-rankings.ts", label: "Country ranking fixture data", kind: "fixture",
};
