import { DATA_STATES } from "@/lib/evidence";
import { ADMISSION_STATES, RIGHTS_STATES, UPDATE_CADENCES, PERSON_ATTRIBUTION_DIMENSIONS, TEAM_ATTRIBUTION_DIMENSIONS, isDataTimestamp } from "@/lib/data-foundations";
import type { AdmissionState, CountryAttribution, DataIssue, DataTimestamps, EvidenceRecord, RankingAttributionPolicy, Review, SourceRecord } from "@/lib/data-foundations";

const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const issue = (type: DataIssue["type"], path: string, message: string): DataIssue => ({ type, path, message });
export { isDataTimestamp } from "@/lib/data-foundations";
const validReviewMetadata = (review: Review | undefined) => review && ["approved", "rejected", "needs-review"].includes(review.status)
  && text(review.actor?.id) && ["person", "system"].includes(review.actor?.kind)
  && text(review.reason) && isDataTimestamp(review.reviewedAt);
const validReview = (review: Review | undefined) => review?.status === "approved" && validReviewMetadata(review);

/** Typed internal-record checks, not a parser for arbitrary external JSON. */
export function validateSourceRegistry(sources: readonly SourceRecord[]): DataIssue[] {
  const issues: DataIssue[] = [];
  const seen = new Set<string>();
  for (const source of sources) {
    if (!/^[a-z0-9][a-zA-Z0-9._/-]*$/.test(source.id)) issues.push(issue("unexpected-schema-value", "source.id", "Invalid stable source ID."));
    if (seen.has(source.id)) issues.push(issue("duplicate-entity", source.id, "Duplicate source ID."));
    seen.add(source.id);
    for (const field of ["name", "origin", "rightsNotes", "reliabilityNotes", "notes"] as const) {
      if (!text(source[field])) issues.push(issue("missing-required-field", `${source.id}.${field}`, "Explicit source context is required."));
    }
    if (!RIGHTS_STATES.includes(source.rights) || !UPDATE_CADENCES.includes(source.cadence)
      || !["reference", "fixture", "competitive"].includes(source.type)
      || !["local-file", "manual", "api", "public-download"].includes(source.access) || typeof source.active !== "boolean") {
      issues.push(issue("unexpected-schema-value", source.id, "Invalid source metadata vocabulary."));
    }
    if (source.usageReview && (!validReviewMetadata(source.usageReview) || !["reference", "competitive"].includes(source.usageReview.scope))) {
      issues.push(issue("unexpected-schema-value", `${source.id}.usageReview`, "Usage approval must have a scope, actor, timestamp and reason."));
    }
  }
  return issues;
}

/** Operational gate, not legal advice. Public/open alone is not permission. */
export function sourceAllowsProductionUse(source: SourceRecord, scope: "reference" | "competitive"): boolean {
  return validateSourceRegistry([source]).length === 0 && source.active && source.type !== "fixture"
    && ["permitted", "public-open", "licensed"].includes(source.rights)
    && Boolean(validReview(source.usageReview)) && source.usageReview?.scope === scope;
}

const transitions: Readonly<Record<AdmissionState, readonly AdmissionState[]>> = {
  discovered: ["collected", "rejected", "needs-review"],
  collected: ["validated", "rejected", "needs-review"],
  validated: ["admitted", "rejected", "needs-review"],
  admitted: ["superseded", "needs-review"],
  rejected: ["needs-review"],
  superseded: [],
  "needs-review": ["validated", "rejected"],
};
export function canTransitionAdmission(from: AdmissionState, to: AdmissionState): boolean {
  return Object.hasOwn(transitions, from) && transitions[from].includes(to);
}
export function validateTimestamps(timestamps: DataTimestamps): DataIssue[] {
  const issues: DataIssue[] = [];
  for (const [field, value] of Object.entries(timestamps)) {
    if (!["sourceUpdatedAt", "observedAt", "collectedAt", "admittedAt", "recalculatedAt"].includes(field)) issues.push(issue("unexpected-schema-value", field, "Use an explicit timestamp meaning, not a generic update time."));
    if (value !== undefined && !isDataTimestamp(value)) issues.push(issue("unexpected-schema-value", field, "Expected a real UTC ISO-8601 timestamp."));
  }
  // Source publication and recalculation clocks are independent; do not impose a made-up sequence.
  for (const [before, after] of [["observedAt", "collectedAt"], ["collectedAt", "admittedAt"], ["observedAt", "admittedAt"]] as const) {
    if (timestamps[before] && timestamps[after] && Date.parse(timestamps[before]) > Date.parse(timestamps[after])) {
      issues.push(issue("impossible-value", after, `${after} cannot precede ${before}.`));
    }
  }
  return issues;
}

export function validateEvidenceRecord(record: EvidenceRecord, sources: readonly SourceRecord[]): DataIssue[] {
  const issues = [...validateSourceRegistry(sources), ...validateTimestamps(record.timestamps)];
  for (const [path, value] of [["id", record.id], ["subject.id", record.subject.id], ["field", record.field]]) {
    if (!text(value)) issues.push(issue("missing-required-field", path, "Stable identity and field are required."));
  }
  if (!Object.hasOwn(DATA_STATES, record.dataState) || !["fixture", "source", "ai"].includes(record.origin)
    || !["reference", "competitive"].includes(record.scope) || !["observed", "derived"].includes(record.derivation)
    || !["country", "game", "player", "team", "member"].includes(record.subject.kind)) {
    issues.push(issue("unexpected-schema-value", record.id, "Invalid record vocabulary."));
  }
  const registered = record.sources.map((reference) => {
    const source = sources.find((candidate) => candidate.id === reference.sourceId);
    if (!source) issues.push(issue("orphan-relationship", reference.sourceId, "Source is not registered."));
    if (!text(reference.itemReference)) issues.push(issue("missing-required-field", reference.sourceId, "Source item reference is required."));
    return source;
  });
  const fixture = record.origin === "fixture" || registered.some((source) => source?.type === "fixture");
  const publishable = record.dataState === "canonical" || record.dataState === "provisional";
  if (fixture && (record.dataState !== "fixture" || record.admission?.state === "admitted" || record.timestamps.admittedAt)) {
    issues.push(issue("unexpected-schema-value", "dataState", "Fixtures cannot be admitted or promoted into production facts."));
  }
  if (record.value.status === "known") {
    if (record.value.value === undefined || record.value.value === null || record.value.value === "") issues.push(issue("missing-required-field", "value", "Missing information must be explicit UNKNOWN/UNAVAILABLE."));
    if (typeof record.value.value === "number" && !Number.isFinite(record.value.value)) issues.push(issue("impossible-value", "value", "Known numeric values must be finite."));
    if (["unknown", "unavailable"].includes(record.dataState)) issues.push(issue("unexpected-schema-value", "value", "Unknown/unavailable records must not carry known payloads."));
  } else if (!["unknown", "unavailable"].includes(record.value.status) || !text(record.value.reason) || "value" in record.value || publishable) {
    issues.push(issue("unexpected-schema-value", "value", "Unknown/unavailable requires a reason, no payload, and no authoritative value claim."));
  }
  const admission = record.admission;
  if (admission?.review && !validReviewMetadata(admission.review)) issues.push(issue("unexpected-schema-value", "admission.review", "Review requires a decision, actor, timestamp and reason."));
  if (admission && !ADMISSION_STATES.includes(admission.state)) issues.push(issue("unexpected-schema-value", "admission.state", "Unknown admission state."));
  if (publishable && admission?.state !== "admitted") issues.push(issue("missing-required-field", "admission", "Canonical/provisional publication requires explicit admission."));
  if (admission?.state === "admitted") {
    if (!validReview(admission.review) || !text(admission.admittedBy?.id) || !["person", "system"].includes(admission.admittedBy?.kind ?? "") || !record.timestamps.admittedAt) {
      issues.push(issue("missing-required-field", "admission", "Admission requires an approved review, admitting actor and timestamp."));
    }
    if (admission.review && record.timestamps.admittedAt && Date.parse(admission.review.reviewedAt) > Date.parse(record.timestamps.admittedAt)) issues.push(issue("impossible-value", "admission.review", "Review cannot follow admission."));
    if (!record.timestamps.observedAt || !record.timestamps.collectedAt || !record.sources.length || registered.some((source) => !source || !sourceAllowsProductionUse(source, record.scope))) {
      issues.push(issue("missing-required-field", "sources", "Admission requires observation/collection times and approved source use for this scope."));
    }
    if (record.derivation === "derived" && !text(record.methodologyVersion)) issues.push(issue("missing-required-field", "methodologyVersion", "Admitted derived values require a methodology version."));
  }
  if (record.timestamps.admittedAt && !["admitted", "superseded", "needs-review"].includes(admission?.state ?? "")) issues.push(issue("unexpected-schema-value", "admittedAt", "Admission time requires admission history."));
  if (admission?.state === "rejected" && !text(admission.rejectionReason)) issues.push(issue("missing-required-field", "rejectionReason", "Explain rejection."));
  if (admission?.state === "superseded" && (!text(admission.supersededBy) || admission.supersededBy === record.id)) issues.push(issue("orphan-relationship", "supersededBy", "Name a different replacement evidence record."));
  return issues;
}

export function validateRankingAttributionPolicy(policy: RankingAttributionPolicy): DataIssue[] {
  const dimensions: readonly string[] = [...PERSON_ATTRIBUTION_DIMENSIONS, ...TEAM_ATTRIBUTION_DIMENSIONS];
  return text(policy.methodologyVersion) && dimensions.includes(policy.dimension) && text(policy.multiCountryRule) && policy.missingAttribution === "exclude-and-disclose"
    ? [] : [issue("invalid-country-attribution", "methodology", "Declare a version, explicit dimension, multi-country rule and missing-data treatment; never infer a fallback.")];
}

export function validateCountryAttribution(record: CountryAttribution, countryIds: ReadonlySet<string>): DataIssue[] {
  const issues: DataIssue[] = [];
  if (!text(record.subject.id)) issues.push(issue("missing-required-field", "subject.id", "Attribution needs a stable subject ID."));
  const allowed: readonly string[] = record.subject.kind === "player" || record.subject.kind === "member" ? PERSON_ATTRIBUTION_DIMENSIONS : record.subject.kind === "team" ? TEAM_ATTRIBUTION_DIMENSIONS : [];
  if (!allowed.includes(record.dimension)) issues.push(issue("invalid-country-attribution", "dimension", "Dimension is not valid for this entity type."));
  if (record.value.status !== "known") {
    if (!["unknown", "unavailable"].includes(record.value.status) || "value" in record.value || !text(record.value.reason)) issues.push(issue("invalid-country-attribution", "value", "Unknown attribution has no guessed fallback."));
    return issues;
  }
  const { countryIds: ids, region } = record.value.value;
  if (!ids.length && !text(region)) issues.push(issue("missing-required-field", "value", "Known attribution needs an explicit country or region."));
  if (ids.some((id) => !countryIds.has(id)) || new Set(ids).size !== ids.length) issues.push(issue("invalid-country-attribution", "countryIds", "Country IDs must be canonical and distinct."));
  if ((record.dimension === "declared-region" || record.dimension === "league-region") ? (!text(region) || ids.length > 0) : (ids.length === 0 || region !== undefined)) issues.push(issue("invalid-country-attribution", "value", "Country dimensions and region dimensions must remain distinct."));
  if (!record.evidenceIds.length || record.evidenceIds.some((id) => !text(id))) issues.push(issue("missing-required-field", "evidenceIds", "Known attribution needs explicit evidence references."));
  return issues;
}
