import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const dependency = createRequire(import.meta.url);
const modules = new Map();
function load(path) {
  if (modules.has(path)) return modules.get(path);
  const loaded = { exports: {} };
  modules.set(path, loaded.exports);
  const code = ts.transpileModule(readFileSync(resolve(root, path), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, { module: loaded, exports: loaded.exports,
    require: (id) => id === "server-only" ? {} : id.startsWith("@/") ? load(`${id.slice(2)}.ts`) : dependency(id),
  });
  return loaded.exports;
}
const f = load("lib/data-foundations.ts");
const v = load("lib/data-validation.ts");
const { SOURCE_REGISTRY: sources } = load("data/source-registry.ts");
const evidence = load("lib/evidence.ts");
const { sovereignCountries, allCountries } = load("data/countries.ts");
const { GAME_DEFINITIONS: games } = load("constants/games.ts");
const { prototypePlayers: players } = load("app/profiles/player-data.ts");
const { PUBLIC_SEARCH_RECORDS: search } = load("lib/search-catalogue.ts");
const countries = new Set(sovereignCountries.map((c) => c.id));
// Synthetic inputs below are test cases, never registry entries or real admissions.
const actor = { kind: "system", id: "test-only-reviewer" };
const review = { status: "approved", actor, reviewedAt: "2026-01-03T00:00:00Z", reason: "Synthetic test approval" };
const source = { ...sources[0], id: "test-source", type: "competitive", rights: "permitted", usageReview: { ...review, scope: "competitive" } };
const admitted = () => ({
  id: "test-evidence", subject: { kind: "player", id: "test-player" }, field: "result",
  value: { status: "known", value: 1 }, origin: "source", scope: "competitive", derivation: "observed", dataState: "canonical",
  sources: [{ sourceId: source.id, itemReference: "test-event/result-1" }],
  timestamps: { observedAt: "2026-01-01T00:00:00Z", collectedAt: "2026-01-02T00:00:00Z", admittedAt: "2026-01-04T00:00:00Z" },
  admission: { state: "admitted", review, admittedBy: actor },
});
const valid = (record) => v.validateEvidenceRecord(record, [source]);

test("existing IDs remain independent from labels, routes and aliases, with no replacement catalogue", () => {
  for (const [kind, records] of [["country", allCountries], ["game", games], ["player", players]]) {
    assert.equal(new Set(records.map((r) => r.id)).size, records.length);
    for (const record of records) {
      const identity = { kind, id: record.id, displayName: "Old", route: "/old", aliases: [] };
      assert.equal(f.entityKey(identity), f.entityKey({ ...identity, displayName: "New", route: "/new", aliases: ["Old"] }));
    }
  }
  assert.equal(allCountries.length, 249);
  assert.equal(countries.size, 195);
  assert.ok(countries.has("usa") && countries.has("c-te-divoire"));
  assert.ok(games.some((g) => g.id === "rocketLeague"));
  assert.notEqual(f.entityKey({ kind: "player", id: "same" }), f.entityKey({ kind: "member", id: "same" }));
});

test("current search IDs, labels and routes remain direct projections of existing entities", () => {
  for (const [type, records, name] of [["countries", sovereignCountries, "name"], ["games", games, "name"], ["players", players, "handle"]]) {
    const indexed = search.filter((r) => r.type === type);
    assert.equal(indexed.length, records.length);
    for (const record of records) {
      const hit = indexed.find((r) => r.id === record.id);
      assert.equal(hit?.label, record[name]);
      assert.ok(hit.href.includes(encodeURIComponent(record.id)));
    }
  }
  assert.equal(search.filter((r) => ["teams", "members"].includes(r.type)).length, 0);
});

test("source registry is valid, unique and honest about missing review metadata", () => {
  assert.equal(v.validateSourceRegistry(sources).length, 0);
  assert.ok(sources.every((s) => s.usageReview === undefined));
  assert.ok(sources.every((s) => !v.sourceAllowsProductionUse(s, "competitive")));
  assert.ok(v.validateSourceRegistry([sources[0], sources[0]]).some((i) => i.type === "duplicate-entity"));
  for (const id of ["", " Bad ID ", "<script>"]) assert.ok(v.validateSourceRegistry([{ ...source, id }]).length);
  for (const [field, value] of [["name", ""], ["cadence", "every-minute"], ["rights", "probably-fine"], ["active", "yes"], ["access", "scrape"], ["type", "ai-authoritative"]]) assert.ok(v.validateSourceRegistry([{ ...source, [field]: value }]).length);
});

test("rights gate is fail-closed, scope-specific and never admits fixtures", () => {
  for (const rights of f.RIGHTS_STATES) assert.equal(v.sourceAllowsProductionUse({ ...source, rights }, "competitive"), ["permitted", "public-open", "licensed"].includes(rights));
  for (const patch of [{ usageReview: undefined }, { active: false }, { type: "fixture" }, { usageReview: { ...review, scope: "reference" } }, { usageReview: { ...review, scope: "competitive", status: "rejected" } }]) assert.equal(v.sourceAllowsProductionUse({ ...source, ...patch }, "competitive"), false);
  assert.equal(v.sourceAllowsProductionUse(source, "reference"), false);
  for (const rights of [undefined, null, "", "unknown", "restricted", "prohibited"]) assert.equal(v.sourceAllowsProductionUse({ ...source, rights }, "competitive"), false);
  for (const rights of ["permitted", "public-open", "licensed"]) {
    assert.equal(v.sourceAllowsProductionUse({ ...source, rights, usageReview: undefined }, "competitive"), false);
    assert.equal(v.sourceAllowsProductionUse({ ...source, rights, usageReview: { ...review, scope: "reference" } }, "competitive"), false);
  }
});

test("public Evidence has an explicit identity allowlist, never the operational registry", () => {
  const publicSources = Object.values(load("data/public-evidence-sources.ts"));
  for (const publicSource of publicSources) {
    assert.deepEqual(Object.keys(publicSource).sort(), ["id", "kind", "label"]);
    const internal = sources.find((s) => s.id === publicSource.id);
    assert.ok(internal);
    assert.equal(publicSource.label, internal.name);
    assert.equal(publicSource.kind, internal.type);
  }
  for (const summary of [evidence.RANKING_EVIDENCE, evidence.DOSSIER_EVIDENCE, evidence.ATLAS_EVIDENCE]) {
    for (const ref of summary.references ?? []) assert.ok(sources.some((s) => s.id === ref.sourceId));
    for (const ref of summary.sources ?? []) assert.ok(sources.some((s) => s.id === ref.id));
    assert.doesNotMatch(JSON.stringify(summary), /rightsNotes|reliabilityNotes|usageReview|reviewedAt|admittedBy/);
  }
  assert.match(readFileSync(resolve(root, "data/source-registry.ts"), "utf8"), /import "server-only"/);
  const reachable = new Set();
  function visit(path) {
    if (reachable.has(path)) return;
    reachable.add(path);
    const js = ts.transpileModule(readFileSync(resolve(root, path), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    for (const match of js.matchAll(/require\("@\/([^"\n]+)"\)/g)) visit(`${match[1]}.ts`);
  }
  visit("lib/evidence.ts");
  visit("lib/data-foundations.ts");
  assert.equal(reachable.has("data/source-registry.ts"), false);
});

test("inactive sources remain referenceable historically but cannot admit new values", () => {
  const inactive = { ...source, active: false };
  const historic = { ...admitted(), dataState: "unavailable", value: { status: "unavailable", reason: "Superseded result" }, admission: { ...admitted().admission, state: "superseded", supersededBy: "replacement-evidence" } };
  assert.equal(v.validateEvidenceRecord(historic, [inactive]).length, 0);
  assert.ok(v.validateEvidenceRecord(admitted(), [inactive]).length);
  const rejected = { ...historic, timestamps: {}, admission: { state: "rejected", rejectionReason: "Conflicting source", review: { ...review, status: "rejected" } } };
  assert.equal(v.validateEvidenceRecord(rejected, [inactive]).length, 0);
  assert.equal(v.canTransitionAdmission("rejected", "needs-review"), true);
  assert.equal(v.canTransitionAdmission("superseded", "needs-review"), false);
});

test("all cadence values are metadata, not freshness assertions or scheduled jobs", () => {
  assert.equal(f.UPDATE_CADENCES.length, 8);
  for (const cadence of f.UPDATE_CADENCES) assert.equal(v.validateSourceRegistry([{ ...source, cadence }]).length, 0);
});

test("admission lifecycle cannot jump from fetched/discovered straight to admitted", () => {
  assert.equal(f.ADMISSION_STATES.length, 7);
  for (const state of ["discovered", "collected", "needs-review", "rejected", "superseded"]) assert.equal(v.canTransitionAdmission(state, "admitted"), false);
  assert.equal(v.canTransitionAdmission("validated", "admitted"), true);
  assert.equal(v.canTransitionAdmission("admitted", "superseded"), true);
  assert.equal(v.canTransitionAdmission("nonsense", "admitted"), false);
  assert.equal(v.canTransitionAdmission("toString", "admitted"), false);
});

test("publication/admission require actual approval, provenance, clocks and actors", () => {
  assert.equal(valid(admitted()).length, 0);
  for (const patch of [{ admission: undefined }, { admission: { state: "collected" } }, { sources: [] }, { timestamps: {} }, { admission: { ...admitted().admission, admittedBy: undefined } }, { admission: { ...admitted().admission, review: undefined } }]) assert.ok(valid({ ...admitted(), ...patch }).length);
  assert.ok(valid({ ...admitted(), origin: "ai", admission: { state: "collected" } }).length);
  assert.ok(valid({ ...admitted(), dataState: "provisional", admission: undefined }).length);
  assert.ok(valid({ ...admitted(), derivation: "derived" }).length);
  assert.equal(valid({ ...admitted(), derivation: "derived", methodologyVersion: "test-only-v1" }).length, 0);
});

test("fixture origin cannot be laundered through canonical/provisional status or AI origin", () => {
  for (const dataState of ["canonical", "provisional"]) {
    assert.ok(valid({ ...admitted(), origin: "fixture", dataState }).length);
    assert.ok(v.validateEvidenceRecord({ ...admitted(), origin: "ai", dataState }, [{ ...source, type: "fixture" }]).length);
  }
  const fixture = { ...admitted(), origin: "fixture", dataState: "fixture", timestamps: {}, admission: undefined };
  assert.equal(valid(fixture).length, 0);
  for (const summary of [evidence.RANKING_EVIDENCE, evidence.DOSSIER_EVIDENCE, evidence.ATLAS_EVIDENCE]) {
    assert.equal(summary.state, "fixture");
    assert.equal(summary.confidence.status, "unknown");
    assert.equal(summary.timestamps, undefined);
    assert.equal(summary.methodologyVersion, undefined);
    for (const ref of summary.references ?? []) assert.equal(sources.find((s) => s.id === ref.sourceId)?.type, "fixture");
  }
});

test("UNKNOWN/unavailable have no substituted value; legitimate known zero stays zero", () => {
  const unknown = { ...admitted(), dataState: "unknown", value: { status: "unknown", reason: "Not established" }, admission: { state: "discovered" }, timestamps: {}, sources: [] };
  assert.equal(valid(unknown).length, 0);
  for (const value of [0, "", "denmark", null]) assert.ok(valid({ ...unknown, value: { ...unknown.value, value } }).length);
  assert.ok(valid({ ...admitted(), value: { status: "unknown", reason: "Not established" } }).length);
  assert.equal(valid({ ...admitted(), value: { status: "known", value: 0 } }).length, 0);
  assert.ok(valid({ ...admitted(), value: { status: "known", value: "" } }).length);
  for (const value of [NaN, Infinity, -Infinity]) assert.ok(valid({ ...admitted(), value: { status: "known", value } }).some((i) => i.type === "impossible-value"));
});

test("timestamps are distinct, optional and strict, with impossible ordering rejected", () => {
  assert.equal(v.validateTimestamps({}).length, 0);
  for (const date of ["2026-01-01T00:00:00Z", "2026-01-01T00:00:00.123Z"]) assert.equal(v.isDataTimestamp(date), true);
  for (const date of ["", "2026-02-30T00:00:00Z", "2026-01-01", "2026-01-01T00:00:00", "yesterday"]) assert.equal(v.isDataTimestamp(date), false);
  assert.ok(v.validateTimestamps({ observedAt: "2026-01-03T00:00:00Z", collectedAt: "2026-01-01T00:00:00Z" }).length);
  assert.ok(v.validateTimestamps({ updatedAt: "2026-01-01T00:00:00Z" }).length);
  assert.ok(valid({ ...admitted(), admission: { ...admitted().admission, review: { ...review, reviewedAt: "2026-01-05T00:00:00Z" } } }).length);
});

test("orphan sources, empty item references and incomplete rejection/supersession are flagged", () => {
  assert.ok(valid({ ...admitted(), sources: [{ sourceId: "missing", itemReference: "item" }] }).some((i) => i.type === "orphan-relationship"));
  assert.ok(valid({ ...admitted(), sources: [{ sourceId: source.id, itemReference: "" }] }).length);
  for (const state of ["rejected", "superseded"]) assert.ok(valid({ ...admitted(), dataState: "unavailable", value: { status: "unavailable", reason: "Under review" }, admission: { state }, timestamps: {} }).length);
});

test("person/team dimensions remain distinct, with exact selection and no guessed fallback", () => {
  const subject = { kind: "player", id: "test-player" };
  const records = [
    { subject, dimension: "birthplace", value: { status: "known", value: { countryIds: ["france"] } }, evidenceIds: ["test-birth"] },
    { subject, dimension: "residence", value: { status: "known", value: { countryIds: ["germany"] } }, evidenceIds: ["test-residence"] },
    { subject, dimension: "competitive-eligibility", value: { status: "known", value: { countryIds: ["france"] } }, evidenceIds: ["test-eligibility"] },
  ];
  for (const record of records) assert.equal(v.validateCountryAttribution(record, countries).length, 0);
  assert.equal(f.selectAttributions(records, subject, "citizenship").length, 0);
  assert.equal(f.selectAttributions(records, subject, "competitive-eligibility")[0].value.value.countryIds[0], "france");
  assert.ok(v.validateCountryAttribution({ ...records[0], dimension: "organisation-hq" }, countries).length);
  assert.ok(v.validateCountryAttribution({ ...records[0], subject: { ...subject, id: "" } }, countries).length);
  for (const ids of [["unknown-land"], ["france", "france"], []]) assert.ok(v.validateCountryAttribution({ ...records[0], value: { status: "known", value: { countryIds: ids } } }, countries).length);
  const region = { subject: { kind: "team", id: "test-team" }, dimension: "league-region", value: { status: "known", value: { countryIds: [], region: "Europe" } }, evidenceIds: ["test-league"] };
  assert.equal(v.validateCountryAttribution(region, countries).length, 0);
  assert.ok(v.validateCountryAttribution({ ...region, value: { status: "known", value: { countryIds: ["denmark"], region: "Europe" } } }, countries).length);
  assert.equal(v.validateCountryAttribution({ ...records[0], value: { status: "unknown", reason: "Not established" }, evidenceIds: [] }, countries).length, 0);
});

test("ranking methodology must choose a dimension and explain multi-country/missing handling", () => {
  const policy = { methodologyVersion: "test-only-v1", dimension: "competitive-eligibility", multiCountryRule: "Test allocation rule", missingAttribution: "exclude-and-disclose" };
  assert.equal(v.validateRankingAttributionPolicy(policy).length, 0);
  for (const patch of [{ dimension: "belongs-to" }, { multiCountryRule: "" }, { methodologyVersion: "" }, { missingAttribution: "guess-from-team" }]) assert.ok(v.validateRankingAttributionPolicy({ ...policy, ...patch }).length);
});

test("correction and QA vocabulary cover current governance requirements without an admin product", () => {
  assert.equal(f.CORRECTION_KINDS.length, 7);
  assert.equal(f.QA_ISSUE_TYPES.length, 8);
  for (const kind of ["attribution", "methodology", "duplicate-entity", "mis-linked-entity"]) assert.ok(f.CORRECTION_KINDS.includes(kind));
  for (const kind of ["conflicting-source", "stale-source", "invalid-country-attribution", "orphan-relationship", "impossible-value"]) assert.ok(f.QA_ISSUE_TYPES.includes(kind));
});
