import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const cache = new Map();
const read = (path) => readFileSync(root + path, "utf8");
function load(path) {
  if (cache.has(path)) return cache.get(path);
  const loadedModule = { exports: {} };
  runInNewContext(ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, {
    module: loadedModule, exports: loadedModule.exports,
    require: (id) => id.startsWith("@/") ? load(id.slice(2) + ".ts") : require(id),
  });
  cache.set(path, loadedModule.exports);
  return loadedModule.exports;
}
const { IDENTITY_PLACES, CONSTITUENT_IDENTITY_PLACES } = load("lib/account/identity-geography.ts");
const { sovereignCountries } = load("data/countries.ts");

test("Profile catalogue adds exactly four typed UK identities without mutating 195 sovereigns", () => {
  assert.equal(sovereignCountries.length, 195);
  assert.equal(IDENTITY_PLACES.length, 199);
  assert.equal(new Set(IDENTITY_PLACES.map(p => p.id)).size, 199);
  for (const id of ["scotland", "england", "wales", "northern-ireland"]) {
    const place = IDENTITY_PLACES.find(p => p.id === id);
    assert.equal(place.kind, "constituent_country");
    assert.equal(place.parentCountryId, "united-kingdom");
    assert.ok(!sovereignCountries.some(p => p.id === id));
  }
  for (const country of sovereignCountries) {
    const place = IDENTITY_PLACES.find(p => p.id === country.id);
    assert.equal(place.name, country.name);
    assert.equal(place.flagCode, country.flagCode);
    assert.equal(place.kind, "sovereign_country");
    assert.equal(place.parentCountryId, null);
  }
});

test("Profile selector source includes UK and constituents with safe flag references", () => {
  const { accountCountryOptions } = load("app/account/country-options.ts");
  assert.ok(accountCountryOptions.some(p => p.id === "united-kingdom"));
  assert.equal(accountCountryOptions, IDENTITY_PLACES);
  assert.deepEqual(Array.from(CONSTITUENT_IDENTITY_PLACES, p => p.flagCode), ["gb-sct", "gb-eng", "gb-wls", null]);
  assert.match(read("app/account/actions.ts"), /\.from\("identity_places"\)/);
  assert.doesNotMatch(read("app/account/actions.ts"), /\.from\("countries"\)/);
  const picker = read("app/account/components/country-picker.tsx");
  assert.match(picker, /w-8 shrink-0/, "search results reserve the full 32px flag width");
  assert.match(picker, /pl-14 pr-10/, "selected text leaves a gap after the 32px image flag");
});

test("competitive consumers never import the Profile identity catalogue", () => {
  for (const path of ["data/countries.ts", "data/country-rankings.ts", "lib/search-catalogue.ts", "app/world-map/page.tsx", "app/countries/countries-atlas.tsx", "app/countries/[countryId]/page.tsx"]) {
    assert.doesNotMatch(read(path), /identity-geography|IDENTITY_PLACES|identity_places/, path);
  }
  assert.match(read("app/account/components/country-identity-form.tsx"), /does not assign competitive results or ranking attribution/);
});

test("existing sovereign IDs and ordered Heritage inputs remain valid", () => {
  const { parseHeritageCountryIds } = load("lib/account/profile.ts");
  const input = ["scotland", "australia", "wales", "ireland", "united-kingdom"];
  assert.deepEqual(Array.from(parseHeritageCountryIds(JSON.stringify(input)).value), input);
  assert.equal(parseHeritageCountryIds('["scotland","scotland"]').valid, false);
});
