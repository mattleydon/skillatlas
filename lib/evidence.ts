import { COUNTRY_FIXTURE_SOURCE, RANKING_FIXTURE_SOURCE } from "@/data/public-evidence-sources";
import type { DataTimestamps, SourceReference } from "@/lib/data-foundations";

/** Publication state is separate from how a claim was formed. */
export const DATA_STATES = {
  canonical: { label: "CANONICAL", meaning: "An admitted authoritative current value within its stated scope." },
  provisional: { label: "PROVISIONAL", meaning: "Admitted as usable, but not yet fully canonical or stable. Not demonstration data." },
  fixture: { label: "FIXTURE / DEMO", meaning: "Demonstration data used to develop the experience, not verified competitive intelligence." },
  unavailable: { label: "UNAVAILABLE", meaning: "The concept or value exists, but its information is not currently available." },
  unknown: { label: "UNKNOWN", meaning: "SkillAtlas does not currently know enough to make the claim." },
} as const;

export type DataState = keyof typeof DATA_STATES;
export type EpistemicState = "observed" | "derived" | "interpretation" | "inferred-intent" | "forecast" | "unknown-unresolved";
export type EvidenceSource = Readonly<{
  id: string;
  label: string;
  kind: "reference" | "fixture" | "competitive-evidence";
}>;
// A future assessment must carry its basis, not merely a decorative level.
export type Confidence = Readonly<{ status: "unknown" }> | Readonly<{
  status: "assessed";
  label: string;
  rationale: string;
  sourceIds: readonly [string, ...string[]];
}>;
export type EvidenceSummary = Readonly<{
  state: DataState;
  explanation: string;
  limitations: readonly string[];
  evidenceStatus: "available" | "unavailable" | "unknown";
  confidence: Confidence;
  sources?: readonly EvidenceSource[];
  epistemicState?: EpistemicState;
  methodologyVersion?: string;
  timestamps?: DataTimestamps;
  references?: readonly SourceReference[];
}>;

export const UNKNOWN_CONFIDENCE: Confidence = { status: "unknown" };

export const RANKING_EVIDENCE: EvidenceSummary = {
  state: "fixture",
  explanation: "Overall positions follow the stored country fixture order. Scores and rank movements are stored demonstration values. Overall score change is the difference between the final two fixture history points. Game positions follow the ordered game fixtures, not a verified competitive model.",
  limitations: [
    "Summary leaders and movements describe only the current filtered fixture field. Game coverage is a small demonstration subset; absence does not mean weakness.",
    "No approved production scoring methodology, verified results or defensible country attribution supports these values. Fixture histories are not observed historical snapshots.",
  ],
  evidenceStatus: "unavailable",
  confidence: UNKNOWN_CONFIDENCE,
  sources: [
    COUNTRY_FIXTURE_SOURCE,
    RANKING_FIXTURE_SOURCE,
  ],
  references: [
    { sourceId: COUNTRY_FIXTURE_SOURCE.id, itemReference: "sovereignCountries competitive fixture fields" },
    { sourceId: RANKING_FIXTURE_SOURCE.id, itemReference: "GAME_RANKING_FIXTURES and overall fixture projection" },
  ],
};

export const DOSSIER_EVIDENCE: EvidenceSummary = {
  ...RANKING_EVIDENCE,
  explanation: "Global rank, score, movement and strongest-game labels are country fixtures. Regional rank orders those same fixtures within the region. Game positions describe the ordered game fixture subset only. The admitted geographic catalogue does not validate competitive claims.",
};

export const ATLAS_EVIDENCE: EvidenceSummary = {
  state: "fixture",
  explanation: "Globe intensity and standing use the active ranking fixtures. Confidence is UNKNOWN; verified spatial relationships are UNAVAILABLE. Colour is not evidence of regional dominance or a causal explanation.",
  limitations: ["Open Country Intelligence for the fixture breakdown and known gaps. Missing fixture coverage is not evidence of weakness."],
  evidenceStatus: "unavailable",
  confidence: UNKNOWN_CONFIDENCE,
};
