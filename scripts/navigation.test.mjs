import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

// Exercise the real TS helpers with Node's runner, without a new test dependency.
const root = fileURLToPath(new URL("../", import.meta.url));
const requireDependency = createRequire(import.meta.url);
const modules = new Map();
function load(relativePath) {
  if (modules.has(relativePath)) return modules.get(relativePath);
  const loadedModule = { exports: {} };
  const source = ts.transpileModule(readFileSync(resolve(root, relativePath), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  runInNewContext(source, {
    module: loadedModule, exports: loadedModule.exports,
    require: (specifier) => specifier.startsWith("@/")
      ? load(`${specifier.slice(2)}.ts`)
      : requireDependency(specifier),
  });
  modules.set(relativePath, loadedModule.exports);
  return loadedModule.exports;
}
const { normalisePath, pathIsActive, navigationCurrent, isPlainNavigationClick, preventRedundantNavigation } = load("lib/navigation.ts");
const { ROUTES, EXPLORE_NAV_ITEMS, RANKING_NAV_ITEMS, memberRoute, countryRoute } = load("constants/routes.ts");

function click(overrides = {}) {
  return {
    button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false,
    defaultPrevented: false,
    currentTarget: { target: "", hasAttribute: () => false },
    preventDefault() { this.defaultPrevented = true; },
    ...overrides,
  };
}

test("Atlas and Players keep their existing external-link routes", () => {
  assert.equal(ROUTES.atlas, "/world-map");
  assert.equal(ROUTES.players, "/profiles");
  assert.equal(ROUTES.worldMap, ROUTES.atlas);
});
test("approved directory order is stable", () => {
  assert.equal(EXPLORE_NAV_ITEMS.map((item) => item.label).join("|"), "Countries|Games|Players|Teams|Members");
  assert.equal(RANKING_NAV_ITEMS.map((item) => item.label).join("|"), "Rankings|User Rankings|Live Rankings");
});
test("path normalization preserves root and removes a trailing slash", () => {
  assert.equal(normalisePath("/"), "/");
  assert.equal(normalisePath(""), "/");
  assert.equal(normalisePath("/countries/"), "/countries");
});
test("only the relevant family is active for direct/deep links", () => {
  for (const item of EXPLORE_NAV_ITEMS) {
    assert.equal(pathIsActive(item.href, ROUTES.atlas), false);
    assert.equal(pathIsActive(`${item.href}/example`, item.href), true);
    assert.equal(pathIsActive(`${item.href}-other`, item.href), false);
  }
  assert.equal(pathIsActive("/world-map", ROUTES.countries), false);
  assert.equal(pathIsActive("/countries", ROUTES.rankings), false);
});
test("screen-reader current page differs from ancestor location", () => {
  assert.equal(navigationCurrent("/countries", "/countries"), "page");
  assert.equal(navigationCurrent("/countries/australia", "/countries"), "location");
  assert.equal(navigationCurrent("/members/Member_A", "/members"), "location");
  assert.equal(navigationCurrent("/world-map", "/countries"), undefined);
});
test("same-route activation is suppressed without resetting product context", () => {
  const event = click();
  preventRedundantNavigation(event, "/countries", "/countries");
  assert.equal(event.defaultPrevented, true);
});
test("a different destination remains a genuine navigation", () => {
  const event = click();
  preventRedundantNavigation(event, "/countries", "/world-map");
  assert.equal(event.defaultPrevented, false);
});
for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey"]) {
  test(`${modifier} activation retains native browser behavior`, () => {
    const event = click({ [modifier]: true });
    assert.equal(isPlainNavigationClick(event), false);
    preventRedundantNavigation(event, "/countries", "/countries");
    assert.equal(event.defaultPrevented, false);
  });
}
test("middle click, named targets and download links are not intercepted", () => {
  for (const overrides of [
    { button: 1 },
    { currentTarget: { target: "_blank", hasAttribute: () => false } },
    { currentTarget: { target: "another-window", hasAttribute: () => false } },
    { currentTarget: { target: "", hasAttribute: () => true } },
  ]) {
    const event = click(overrides);
    assert.equal(isPlainNavigationClick(event), false);
    preventRedundantNavigation(event, "/countries", "/countries");
    assert.equal(event.defaultPrevented, false);
  }
});
test("already handled events are left alone", () => {
  assert.equal(isPlainNavigationClick(click({ defaultPrevented: true })), false);
});
test("entity links retain encoded canonical identifiers", () => {
  assert.equal(memberRoute("Member_A"), "/members/Member_A");
  assert.equal(countryRoute("australia"), "/countries/australia");
  assert.equal(memberRoute("a/b"), "/members/a%2Fb");
});
