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
  const loadedModule = { exports: {} };
  const source = ts.transpileModule(readFileSync(resolve(root, path), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, { module: loadedModule, exports: loadedModule.exports,
    require: (id) => id.startsWith("@/") ? load(`${id.slice(2)}.ts`) : dependency(id) });
  modules.set(path, loadedModule.exports);
  return loadedModule.exports;
}
const { toggleCountry, parseCountryBrowse, browseCountries } = load("lib/country-browsing.ts");
const { createMapWheelIntent } = load("lib/map-wheel-intent.ts");
const event = (deltaY, timeStamp, rest = {}) => ({ deltaY, deltaX: 0, timeStamp, deltaMode: 0, ctrlKey: false, ...rest });

test("country selection toggles to neutral and rejects unknown IDs", () => {
  assert.equal(toggleCountry(null, "denmark"), "denmark");
  assert.equal(toggleCountry("denmark", "denmark"), null);
  assert.equal(toggleCountry("denmark", "france"), "france");
  assert.equal(toggleCountry(null, "not-a-country"), null);
});
test("URL selection and filters round-trip; invalid URL values fall back safely", () => {
  const state = parseCountryBrowse(new URLSearchParams("country=denmark&region=Europe&q=den&sort=skill-score"));
  assert.equal(state.country, "denmark");
  assert.equal(state.region, "Europe");
  assert.equal(state.search, "den");
  assert.equal(state.sort, "skill-score");
  const invalid = parseCountryBrowse(new URLSearchParams("country=bogus&region=bogus&sort=bogus"));
  assert.equal(invalid.country, null);
  assert.equal(invalid.region, "All");
  assert.equal(invalid.sort, "alphabetical");
});
test("195-country scope, normalized search, regional filtering and deterministic sorting", () => {
  assert.equal(browseCountries("", "All", "alphabetical").length, 195);
  assert.equal(browseCountries("  DENMARK  ", "All", "alphabetical")[0].id, "denmark");
  assert.equal(browseCountries("denmark", "Africa", "alphabetical").length, 0);
  const rows = browseCountries("", "All", "skill-score");
  assert.ok(rows.every((row, i) => !i || rows[i - 1].dominanceScore >= row.dominanceScore));
});
test("slow/coarse spaced wheel zooms, fast magnitude scrolls, line/page modes normalize", () => {
  const intent = createMapWheelIntent();
  assert.equal(intent(event(-30, 1000)).zoom, true);
  assert.equal(intent(event(-100, 1500)).zoom, true);
  assert.equal(intent(event(240, 2000)).zoom, false);
  assert.equal(intent(event(3, 3000, { deltaMode: 1 })).delta, 48);
  assert.equal(intent(event(1, 3500, { deltaMode: 2 })).zoom, false);
});
test("rapid bursts and their momentum remain page scroll; explicit pinch is zoom", () => {
  const intent = createMapWheelIntent();
  intent(event(50, 1000)); intent(event(50, 1016));
  assert.equal(intent(event(50, 1032)).zoom, false);
  assert.equal(intent(event(3, 1120)).zoom, false);
  assert.equal(intent(event(-10, 1136, { ctrlKey: true })).zoom, true);
  assert.equal(intent(event(-20, 1600)).zoom, true);
});
test("dossier discloses fixture metrics and missing evidence without legacy personality UI", () => {
  const dossier = readFileSync(resolve(root, "app/countries/components/country-dossier.tsx"), "utf8");
  assert.match(dossier, /FIXTURE \/ DEMO/);
  assert.match(dossier, /UNAVAILABLE/);
  assert.match(dossier, /UNKNOWN/);
  assert.doesNotMatch(dossier, /country\.(identity|aura|strengths|weakness|description)/);
});

test("initial theme respects saved/device preference with a light fallback", () => {
  const layout = readFileSync(resolve(root, "app/layout.tsx"), "utf8");
  const script = layout.match(/const initialThemeScript = `([\s\S]*?)`;/)[1];
  for (const [saved, deviceDark, expected] of [[null, false, "light"], [null, true, "dark"], ["light", true, "light"], ["dark", false, "dark"]]) {
    const root = { classList: { toggle() {}, remove() {} }, style: {} };
    runInNewContext(script, { document: { documentElement: root }, window: {
      localStorage: { getItem: () => saved }, matchMedia: () => ({ matches: deviceDark }),
    } });
    assert.equal(root.style.colorScheme, expected);
  }
});
