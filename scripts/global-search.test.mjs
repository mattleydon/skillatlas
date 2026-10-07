import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const dependency = createRequire(import.meta.url);
const modules = new Map();
const read = (path) => readFileSync(resolve(root, path), "utf8");
function load(path) {
  if (modules.has(path)) return modules.get(path);
  const loadedModule = { exports: {} };
  const source = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(source, { module: loadedModule, exports: loadedModule.exports, require: (id) => id.startsWith("@/") ? load(`${id.slice(2)}.ts`) : dependency(id) });
  modules.set(path, loadedModule.exports);
  return loadedModule.exports;
}
const { PUBLIC_SEARCH_RECORDS: records } = load("lib/search-catalogue.ts");
const { createSearchIndex, searchRecords, memberSearchRecords, groupSearchResults } = load("lib/global-search.ts");
const index = createSearchIndex(records);
const search = (query) => searchRecords(index, query);

test("index uses canonical 195 countries, six games and honest player fixtures; no directory invention", () => {
  assert.equal(records.filter((r) => r.type === "countries").length, 195);
  assert.equal(records.filter((r) => r.type === "games").length, 6);
  assert.ok(records.filter((r) => r.type === "players").every((r) => r.context.includes("FIXTURE / DEMO")));
  assert.equal(records.filter((r) => r.type === "members" || r.type === "teams").length, 0);
  assert.equal(new Set(records.map((r) => `${r.type}:${r.id}`)).size, records.length);
  for (const record of records) {
    assert.equal(record.visibility, "public");
    assert.deepEqual(Object.keys(record).filter((key) => /email|uuid|bio|city|heritage|score|token/i.test(key)), []);
    const path = record.href.split(/[?#]/)[0];
    assert.ok(existsSync(resolve(root, `app${path === "/" ? "" : path}/page.tsx`)), record.href);
  }
});

for (const [query, type, id] of [
  ["Australia", "countries", "australia"], ["aus", "countries", "australia"],
  ["USA", "countries", "usa"], ["United States", "countries", "usa"],
  ["UK", "countries", "united-kingdom"], ["South Korea", "countries", "south-korea"],
  ["Korea", "countries", "south-korea"], ["CS2", "games", "cs2"],
  ["Counter-Strike", "games", "cs2"], ["LoL", "games", "league"],
  ["Rocket League", "games", "rocketLeague"], ["methodology", "pages", "methodology"],
  ["evidence", "pages", "methodology"], ["Atlas", "pages", "atlas"], ["Rankings", "pages", "rankings"],
]) test(`representative query: ${query}`, () => {
  assert.equal(search(query)[0]?.type, type);
  assert.equal(search(query)[0]?.id, id);
});

test("normalization, conservative typo matching and no-result cases", () => {
  assert.equal(search("  aUsTrAlIa ")[0].id, "australia");
  assert.equal(search("Counter.Strike")[0].id, "cs2");
  assert.equal(search("U.S.A.")[0].id, "usa");
  assert.equal(search("cote d'ivoire")[0].label, "Côte d’Ivoire");
  assert.equal(search("austrlia")[0].id, "australia");
  assert.equal(search("Austr")[0].type, "countries");
  for (const query of ["", "  ", "!!!", "zzzzzz", "FIFA"]) assert.equal(search(query).length, 0);
  assert.ok(search("cs").every((result) => result.rank < 5));
});

test("exact canonical > alias > handle > prefix > word-prefix > fuzzy; duplicate labels survive grouping", () => {
  const make = (id, label, aliases = [], handle = "", type = "pages") => ({ id, label, aliases, handle, type, href: "/", context: "", visibility: "public" });
  const fixture = createSearchIndex([
    make("fuzzy", "Frnce"), make("word", "Visit France"), make("prefix", "France overview"),
    make("handle", "French player", [], "France", "players"), make("alias", "FR", ["France"], "", "countries"),
    make("exact", "France"), make("exact-country", "France", [], "", "countries"),
  ]);
  const results = searchRecords(fixture, "France");
  assert.equal(results.map((r) => r.rank).join(), "0,0,1,2,3,4,5");
  const groups = groupSearchResults(results);
  assert.equal(groups.flatMap((g) => g.results).length, 7);
  assert.equal(new Set(groups.map((g) => g.type)).size, groups.length);
});

test("auth-aware records fail closed; own member is searchable by name / username, with current snapshot", () => {
  for (const status of ["checking", "unavailable"]) assert.equal(memberSearchRecords({ status }).length, 0);
  const out = memberSearchRecords({ status: "signed_out" });
  assert.ok(out.every((r) => r.href.startsWith("/auth/")));
  const incomplete = memberSearchRecords({ status: "profile_incomplete" });
  assert.ok(incomplete.some((r) => r.href === "/account/onboarding"));
  let member = { status: "profile_complete", username: "Leydos", displayName: "Matt Leydon" };
  let ownIndex = createSearchIndex(memberSearchRecords(member));
  for (const query of ["Leydos", "@leydos", "Matt Leydon"]) assert.equal(searchRecords(ownIndex, query)[0].href, "/members/Leydos");
  member = { ...member, username: "LEYDOS", displayName: "New Name" };
  ownIndex = createSearchIndex(memberSearchRecords(member));
  assert.equal(searchRecords(ownIndex, "New Name")[0].href, "/members/LEYDOS");
  assert.equal(searchRecords(ownIndex, "Matt Leydon").length, 0);
});

test("deep links resolve canonical IDs and no auth data/storage is introduced by palette", () => {
  for (const record of records.filter((r) => r.type === "countries")) assert.equal(new URL(record.href, "http://localhost").searchParams.get("country"), record.id);
  for (const record of records.filter((r) => r.type === "players")) assert.equal(new URL(record.href, "http://localhost").searchParams.get("player"), record.id);
  assert.match(read("app/components/entity-development-page.tsx"), /id=\{`entity-\$\{item.id\}`\}/);
  const palette = read("app/components/global-search.tsx");
  assert.match(palette, /showModal\(\)/);
  assert.match(palette, /aria-activedescendant/);
  assert.match(palette, /preventScroll: true/);
  assert.match(palette, /isPlainNavigationClick/);
  assert.match(palette, /visualViewport/);
  assert.match(palette, /event.key === "Escape"/);
  assert.match(palette, /event.key === "Tab"/);
  assert.doesNotMatch(palette, /localStorage|sessionStorage|supabase|fetch\(/);
});
