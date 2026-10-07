import type { DataState } from "@/lib/evidence";

/** Internal references, not a public serialization contract. Member IDs are private. */
export type EntityKind = "country" | "game" | "player" | "team" | "member";
export type EntityRef = Readonly<{ kind: EntityKind; id: string }>;
export type EntityIdentity = EntityRef & Readonly<{
  displayName: string;
  route?: string;
  aliases: readonly string[];
  historicalNames?: readonly string[];
}>;
export function entityKey(entity: EntityRef): string {
  return `${entity.kind}:${entity.id}`;
}

/** Unknown/unavailable values carry no placeholder payload (including zero). */
export type Knowledge<T> = Readonly<{ status: "known"; value: T }>
  | Readonly<{ status: "unknown" | "unavailable"; reason: string }>;

export const RIGHTS_STATES = ["permitted", "public-open", "licensed", "restricted", "unknown", "prohibited"] as const;
export const UPDATE_CADENCES = ["realtime", "hourly", "daily", "weekly", "event-driven", "manual", "irregular", "unknown"] as const;
export const ADMISSION_STATES = ["discovered", "collected", "validated", "admitted", "rejected", "superseded", "needs-review"] as const;
export type AdmissionState = (typeof ADMISSION_STATES)[number];
export type Actor = Readonly<{ kind: "person" | "system"; id: string }>;
export type Review = Readonly<{
  status: "approved" | "rejected" | "needs-review";
  actor: Actor;
  reviewedAt: string;
  reason: string;
}>;
export type SourceRecord = Readonly<{
  id: string;
  name: string;
  type: "reference" | "fixture" | "competitive";
  origin: string;
  rights: (typeof RIGHTS_STATES)[number];
  rightsNotes: string;
  access: "local-file" | "manual" | "api" | "public-download";
  reliabilityNotes: string;
  cadence: (typeof UPDATE_CADENCES)[number];
  active: boolean;
  notes: string;
  // Rights labels alone never authorize production use. This is scope-specific.
  usageReview?: Review & Readonly<{ scope: "reference" | "competitive" }>;
}>;

/** All timestamps are optional until honestly established; UTC ISO-8601 only. */
export type DataTimestamps = Readonly<{
  sourceUpdatedAt?: string;
  observedAt?: string;
  collectedAt?: string;
  admittedAt?: string;
  recalculatedAt?: string;
}>;
/** Reject timezone-less dates and normalized impossible dates such as February 30. */
export function isDataTimestamp(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === (value.includes(".") ? value : value.replace("Z", ".000Z"));
}
export type SourceReference = Readonly<{ sourceId: string; itemReference: string }>;
export type Admission = Readonly<{
  state: AdmissionState;
  review?: Review;
  admittedBy?: Actor;
  rejectionReason?: string;
  supersededBy?: string;
  notes?: string;
}>;
/** A future persisted record contract; this unit does not ingest or store records. */
export type EvidenceRecord = Readonly<{
  id: string;
  subject: EntityRef;
  field: string;
  value: Knowledge<unknown>;
  origin: "fixture" | "source" | "ai";
  scope: "reference" | "competitive";
  derivation: "observed" | "derived";
  dataState: DataState;
  sources: readonly SourceReference[];
  timestamps: DataTimestamps;
  methodologyVersion?: string;
  admission?: Admission;
  dependsOnEvidenceIds?: readonly string[];
}>;

export const PERSON_ATTRIBUTION_DIMENSIONS = ["citizenship", "birthplace", "residence", "competitive-eligibility", "represented-country"] as const;
export const TEAM_ATTRIBUTION_DIMENSIONS = ["organisation-hq", "legal-registration", "declared-region", "roster-composition", "event-registration", "league-region"] as const;
export type AttributionDimension = (typeof PERSON_ATTRIBUTION_DIMENSIONS)[number] | (typeof TEAM_ATTRIBUTION_DIMENSIONS)[number];
export type CountryAttribution = Readonly<{
  subject: EntityRef;
  dimension: AttributionDimension;
  // Regions remain regions; never turn a league's region into a guessed country.
  value: Knowledge<Readonly<{ countryIds: readonly string[]; region?: string }>>;
  evidenceIds: readonly string[];
  context?: string; // e.g. eligibility rules, roster date or event reference
}>;
export type RankingAttributionPolicy = Readonly<{
  methodologyVersion: string;
  dimension: AttributionDimension;
  multiCountryRule: string;
  missingAttribution: "exclude-and-disclose";
}>;
/** Exact dimension only. No birthplace/residence/team-HQ fallback. */
export function selectAttributions(records: readonly CountryAttribution[], subject: EntityRef, dimension: AttributionDimension) {
  return records.filter((record) => entityKey(record.subject) === entityKey(subject) && record.dimension === dimension);
}

export const CORRECTION_KINDS = ["factual", "source", "attribution", "methodology", "stale-data", "duplicate-entity", "mis-linked-entity"] as const;
export type Correction = Readonly<{
  id: string;
  evidenceId: string;
  kind: (typeof CORRECTION_KINDS)[number];
  state: "reported" | "under-review" | "accepted" | "rejected" | "applied";
  reason: string;
  reportedAt: string;
  reportedBy: Actor;
  review?: Review;
  replacementEvidenceId?: string;
}>;
export type AuditChange = Readonly<{
  id: string;
  subject: EntityRef;
  field: string;
  oldValue: Knowledge<unknown>;
  newValue: Knowledge<unknown>;
  reason: string;
  evidenceIds: readonly string[];
  changedAt: string;
  actor: Actor;
  correctionId?: string;
}>;
export const QA_ISSUE_TYPES = ["missing-required-field", "duplicate-entity", "conflicting-source", "stale-source", "invalid-country-attribution", "orphan-relationship", "impossible-value", "unexpected-schema-value"] as const;
export type DataIssue = Readonly<{
  type: (typeof QA_ISSUE_TYPES)[number];
  path: string;
  message: string;
}>;
