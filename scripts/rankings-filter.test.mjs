import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const dependency = createRequire(import.meta.url);
const cache = new Map();
const read = (path) => readFileSync(`${root}${path}`, "utf8");
function load(path) {
  if (cache.has(path)) return cache.get(path);
  const loaded = { exports: {} };
  const source = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(source, { module: loaded, exports: loaded.exports, require: (id) => id.startsWith("@/") ? load(`${id.slice(2)}.ts`) : dependency(id) });
  cache.set(path, loaded.exports);
  return loaded.exports;
}
const { filterRankings, rankingFilterValues, suggestRankingFilters } = load("lib/rankings-filter.ts");
const { getPrototypeCountryRankings } = load("data/country-rankings.ts");
const rows = getPrototypeCountryRankings("Overall");
const ids = (results) => Array.from(results, (row) => row.countryId);
const filter = (query, scope = "Overall") => filterRankings(getPrototypeCountryRankings(scope), scope, query);

test("empty/whitespace filter restores all 195 rows without mutating fixtures", () => {
  const before = JSON.stringify(rows);
  for (const query of ["", "   ", "\t\n"]) assert.deepEqual(ids(filter(query)), ids(rows));
  filter("CS2");
  assert.equal(JSON.stringify(rows), before);
});
test("country name and shared country aliases filter current rows", () => {
  assert.ok(ids(filter("den")).includes("denmark"));
  assert.deepEqual(ids(filter("Denmark")), ["denmark"]);
  for (const query of ["USA", "United States", "U.S.A."]) assert.deepEqual(ids(filter(query)), ["usa"]);
  assert.deepEqual(ids(filter("Britain")), ["united-kingdom"]);
});
test("region matching is deterministic and case/whitespace normalized", () => {
  assert.deepEqual(ids(filter("  eUrOpE  ")), ids(rows.filter((row) => row.region === "Europe")));
  assert.deepEqual(ids(filter("north    america")), ids(rows.filter((row) => row.region === "North America")));
});
test("best-game and canonical game aliases share the same rows", () => {
  for (const query of ["CS2", "Counter-Strike", "Counter-Strike 2", "counter   strike  2"]) {
    assert.deepEqual(ids(filter(query)), ids(rows.filter((row) => row.bestGame === "CS2")));
  }
  for (const query of ["League", "LoL", "League of Legends"]) {
    assert.deepEqual(ids(filter(query)), ids(rows.filter((row) => row.bestGame === "League of Legends")));
  }
});
test("scope AND text filter; game scope never introduces unrelated rows", () => {
  assert.deepEqual(ids(filter("Europe", "CS2")), ["denmark", "sweden"]);
  assert.equal(filter("CS2", "CS2").length, 5);
  assert.equal(filter("LoL", "League of Legends").length, 4);
  assert.equal(filter("CS2", "League of Legends").length, 0);
  assert.equal(filter("methodology").length, 0);
  assert.equal(filter("zzzzzz").length, 0);
});

// Exercise actual page handlers and derived JSX without network or hosted auth.
function pageHarness() {
  const state = [];
  let cursor = 0;
  const loaded = { exports: {} };
  const source = ts.transpileModule(read("app/page.tsx"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(source, {
    module: loaded, exports: loaded.exports,
    require: (id) => {
      if (id === "react") return { useState: (initial) => {
        const slot = cursor++;
        if (!(slot in state)) state[slot] = initial;
        return [state[slot], (next) => { state[slot] = typeof next === "function" ? next(state[slot]) : next; }];
      }, useMemo: (fn) => fn() };
      if (id === "react/jsx-runtime") return dependency(id);
      if (id === "next/link") return { default: "a" };
      if (id.startsWith("@/app/components/")) return new Proxy({}, { get: (_, name) => `${id}:${String(name)}` });
      if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`);
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });
  return () => {
    cursor = 0;
    const nodes = [];
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node?.props) return;
      nodes.push(node);
      visit(node.props.children);
      visit(node.props.header);
    }
    visit(loaded.exports.default());
    return {
      input: nodes.find((node) => node.props.label === "Filter rankings by country, game, or region"),
      scope: nodes.find((node) => node.props.id === "country-ranking-scope"),
      status: nodes.find((node) => node.props.role === "status").props.children.join(""),
      clear: nodes.find((node) => node.type === "button" && node.props.children === "Clear filter"),
      empty: nodes.some((node) => node.props.children === "No rankings match this filter."),
    };
  };
}
test("real page typing, count, scope composition, no-results and clear preserve scope", () => {
  const render = pageHarness();
  let page = render();
  assert.equal(page.status, "195 of 195 records");
  page.input.props.onValueChange("Europe");
  page = render();
  assert.equal(page.status, `${filter("Europe").length} of 195 records`);
  page.scope.props.onChange("CS2");
  page = render();
  assert.equal(page.input.props.value, "Europe");
  assert.equal(page.status, "2 of 5 records");
  page.input.props.onValueChange("zzzzzz");
  page = render();
  assert.equal(page.empty, true);
  assert.equal(page.status, "0 of 5 records");
  page.clear.props.onClick();
  page = render();
  assert.equal(page.input.props.value, "");
  assert.equal(page.scope.props.value, "CS2");
  assert.equal(page.status, "5 of 5 records");
  assert.equal(page.clear, undefined);
});
test("local filter has no routing/shortcut side effects", () => {
  assert.doesNotMatch(read("lib/rankings-filter.ts"), /router|window|location|fetch|global-search/);
  assert.doesNotMatch(read("app/page.tsx"), /router\.(push|replace)|window\.location|onKeyDown/);
  assert.match(read("app/page.tsx"), /aria-live="polite"/);
});

test("incremental local suggestions prefer prefixes and reuse canonical aliases", () => {
  const values = rankingFilterValues(rows, "Overall");
  for (const [query, group, label] of [
    ["den", "Countries", "Denmark"], ["euro", "Regions", "Europe"],
    ["cs", "Games", "Counter-Strike 2"], ["cs2", "Games", "Counter-Strike 2"],
    ["lea", "Games", "League of Legends"], ["usa", "Countries", "USA"],
  ]) {
    const suggestions = suggestRankingFilters(values, query);
    assert.equal(suggestions.find((item) => item.group === group)?.label, label);
    assert.ok(filter(query).length > 0, `${query} must filter immediately`);
    assert.ok(filter(label).length > 0, `${label} suggestion must apply to rows`);
  }
  assert.deepEqual(ids(filter("euro")), ids(filter("Europe")));
  assert.deepEqual(ids(filter("cs")), ids(filter("CS2")));
  assert.ok(filter("den").length < rows.length);
  assert.ok(filter("lea").length < rows.length);
});

test("suggestions are unique, scope-local, bounded and contain no global entities", () => {
  const values = rankingFilterValues(getPrototypeCountryRankings("CS2"), "CS2");
  assert.equal(values.filter((item) => item.group === "Countries").length, 5);
  assert.equal(values.filter((item) => item.group === "Games").length, 1);
  assert.equal(new Set(values.map((item) => item.id)).size, values.length);
  assert.ok(values.every((item) => ["Countries", "Regions", "Games"].includes(item.group)));
  for (const query of ["", "   ", "zzz", "methodology", "profile", "League", "Australia"]) {
    assert.equal(suggestRankingFilters(values, query).length, 0);
  }
  const suggestions = suggestRankingFilters(rankingFilterValues(rows, "Overall"), "a");
  for (const group of ["Countries", "Regions", "Games"]) assert.ok(suggestions.filter((item) => item.group === group).length <= 5);
});

function suggestionHarness(initialValue) {
  let value = initialValue;
  let cursor = 0;
  const state = [];
  const loaded = { exports: {} };
  const compiled = ts.transpileModule(read("app/components/rankings-filter.tsx"), { reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } });
  assert.equal(compiled.diagnostics?.filter((item) => item.category === ts.DiagnosticCategory.Error).length, 0);
  const source = compiled.outputText;
  runInNewContext(source, { module: loaded, exports: loaded.exports, require: (id) => {
    if (id === "react") return { useId: () => "filter-test", useRef: () => ({ current: null }), useEffect() {}, useMemo: (fn) => fn(),
      useState: (initial) => { const slot = cursor++; if (!(slot in state)) state[slot] = initial; return [state[slot], (next) => { state[slot] = next; }]; } };
    if (id === "react/jsx-runtime") return dependency(id);
    if (id === "@/lib/rankings-filter") return load("lib/rankings-filter.ts");
    throw new Error(`Unexpected dependency: ${id}`);
  } });
  return () => {
    cursor = 0;
    const nodes = [];
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node?.props) return;
      nodes.push(node); visit(node.props.children);
    }
    visit(loaded.exports.default({ label: "Filter rankings", placeholder: "Country, game, or region", value, onValueChange: (next) => { value = next; }, rows, scope: "Overall" }));
    return { input: nodes.find((node) => node.type === "input"), options: nodes.filter((node) => node.props.role === "option") };
  };
}
const key = (key) => ({ key, nativeEvent: { isComposing: false }, preventDefault() {}, stopPropagation() {} });

test("real suggestion control supports arrows, Enter, Escape without clearing, and click selection", () => {
  const render = suggestionHarness("den");
  render().input.props.onFocus();
  let ui = render();
  assert.equal(ui.input.props["aria-expanded"], true);
  ui.input.props.onKeyDown(key("ArrowDown"));
  ui = render();
  assert.equal(ui.options[0].props["aria-selected"], true);
  ui.input.props.onKeyDown(key("Enter"));
  ui = render();
  assert.equal(ui.input.props.value, "Denmark");
  assert.equal(ui.input.props["aria-expanded"], false);
  ui.input.props.onChange({ target: { value: "euro" } });
  ui = render();
  ui.input.props.onKeyDown(key("Escape"));
  ui = render();
  assert.equal(ui.input.props.value, "euro");
  assert.equal(ui.input.props["aria-expanded"], false);
  ui.input.props.onFocus();
  render().options[0].props.onClick();
  ui = render();
  assert.equal(ui.input.props.value, "Europe");
  assert.equal(ui.input.props["aria-expanded"], false);
  ui.input.props.onChange({ target: { value: "" } });
  assert.equal(render().input.props["aria-expanded"], false);
});
