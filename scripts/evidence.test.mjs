import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("../", import.meta.url));
const dependency = createRequire(import.meta.url);
const modules = new Map();
function load(path) {
  if (modules.has(path)) return modules.get(path);
  const loaded = { exports: {} };
  const code = ts.transpileModule(readFileSync(resolve(root, path), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { module: loaded, exports: loaded.exports,
    require(id) {
      if (id === "next/link") return { default: ({ children, ...props }) => React.createElement("a", props, children) };
      if (id.endsWith(".css")) return { default: new Proxy({}, { get: (_, key) => key }) };
      if (id.startsWith("@/") || id.startsWith(".")) {
        const file = id.startsWith("@/") ? id.slice(2) : resolve(root, dirname(path), id);
        return load(existsSync(resolve(root, file + ".ts")) ? file + ".ts" : file + ".tsx");
      }
      return dependency(id);
    },
  });
  modules.set(path, loaded.exports);
  return loaded.exports;
}
const model = load("lib/evidence.ts");
const ui = load("app/components/evidence/evidence-ui.tsx");
const render = (component, props = {}) => renderToStaticMarkup(React.createElement(component, props));

test("all five data-state labels are explicit accessible text, not colour-only signals", () => {
  assert.deepEqual(Object.keys(model.DATA_STATES), ["canonical", "provisional", "fixture", "unavailable", "unknown"]);
  for (const [state, { label }] of Object.entries(model.DATA_STATES)) {
    const html = render(ui.DataStateBadge, { state });
    assert.ok(html.includes(label));
    assert.match(html, /Data state:/);
    assert.ok(html.includes(`data-state="${state}"`));
    assert.doesNotMatch(html, /role="alert"|title=/);
  }
});

test("UNKNOWN is a claim boundary, UNAVAILABLE is an information gap; provisional is not demo", () => {
  assert.match(model.DATA_STATES.unknown.meaning, /know enough to make the claim/);
  assert.match(model.DATA_STATES.unavailable.meaning, /information is not currently available/);
  assert.match(model.DATA_STATES.provisional.meaning, /Admitted as usable/);
  assert.match(model.DATA_STATES.provisional.meaning, /Not demonstration/);
});

test("current competitive evidence cannot imply canonical status, confidence or freshness", () => {
  for (const evidence of [model.RANKING_EVIDENCE, model.DOSSIER_EVIDENCE, model.ATLAS_EVIDENCE]) {
    assert.equal(evidence.state, "fixture");
    assert.equal(evidence.confidence.status, "unknown");
    assert.equal(evidence.evidenceStatus, "unavailable");
    assert.equal(evidence.updatedAt, undefined);
    assert.equal(evidence.methodologyVersion, undefined);
    assert.ok((evidence.sources ?? []).every((s) => s.kind === "fixture"));
  }
  const html = render(ui.ConfidenceIndicator);
  assert.match(html, /Confidence:.*UNKNOWN/);
  assert.doesNotMatch(html, /High|Medium|Low|\d+%/);
});

test("Why this result uses native keyboard disclosure with contextual accessible name and a real Methodology link", () => {
  const html = render(ui.WhyThisResult, { evidence: model.RANKING_EVIDENCE, context: "Ranking values" });
  assert.match(html, /<details[^>]*><summary>Why this result\?<span class="sr-only"> Ranking values<\/span><\/summary>/);
  assert.match(html, /FIXTURE \/ DEMO/);
  assert.match(html, /fixture origin, not competitive evidence/);
  assert.match(html, /UNKNOWN — no verified update timestamp/);
  assert.match(html, /UNAVAILABLE — no approved production version/);
  assert.match(html, /href="\/about\/methodology"/);
  assert.doesNotMatch(html, /<time|role="tooltip"|tabindex="-1"/);
});

test("optional real provenance fields render as text; invalid dates are not presented as timestamps", () => {
  const evidence = { ...model.RANKING_EVIDENCE, updatedAt: "2026-01-01T00:00:00Z", methodologyVersion: "test-only-version", explanation: "<script>not executable</script>" };
  const html = render(ui.WhyThisResult, { evidence, context: "Test only" });
  assert.match(html, /<time dateTime="2026-01-01T00:00:00Z"/);
  assert.match(html, /test-only-version/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(render(ui.WhyThisResult, { evidence: { ...evidence, updatedAt: "not a date" }, context: "Test" }), /<time/);
});

test("compact Atlas explanation stays brief while dossiers retain detailed provenance", () => {
  const compact = render(ui.WhyThisResult, { evidence: model.ATLAS_EVIDENCE, compact: true, context: "Atlas layer" });
  assert.match(compact, /UNKNOWN/);
  assert.match(compact, /UNAVAILABLE/);
  assert.match(compact, /Methodology/);
  assert.doesNotMatch(compact, /Value origins|Data last updated/);
  const country = load("data/countries.ts").sovereignCountries.find((c) => c.id === "denmark");
  const dossier = render(load("app/countries/components/country-dossier.tsx").default, { country, visibleCount: 195, onClear() {} });
  assert.match(dossier, /FIXTURE \/ DEMO/);
  assert.match(dossier, /Data state:.*CANONICAL/);
  assert.match(dossier, /Regional rank/);
  assert.match(dossier, /Value origins/);
  assert.match(dossier, /fixture origin, not competitive evidence/);
});

test("Methodology route explains current reality, simple states and richer reasoning without a new primary nav item", () => {
  const html = render(load("app/about/methodology/page.tsx").default);
  for (const text of ["CANONICAL", "PROVISIONAL", "FIXTURE / DEMO", "UNKNOWN", "UNAVAILABLE", "Observed", "Derived", "Interpretation", "Inferred intent", "forecast", "not yet approved", "195"]) assert.ok(html.includes(text), text);
  assert.match(html, /<h1[^>]*class="sa-type-page-title/);
  assert.match(html, /no canonical or admitted provisional competitive values/);
  const routes = load("constants/routes.ts");
  assert.equal(routes.ROUTES.methodology, "/about/methodology");
  assert.equal(routes.PRIMARY_NAV_ITEMS.some((item) => item.href === routes.ROUTES.methodology), false);
});

test("shared trust styles use semantic theme colours, visible focus and comfortable native disclosure targets", () => {
  const css = readFileSync(resolve(root, "app/components/evidence/evidence.module.css"), "utf8");
  assert.match(css, /var\(--sa-text-primary\)/);
  assert.match(css, /var\(--sa-surface-2\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /min-height: 44px/);
  assert.doesNotMatch(css, /#[a-fA-F0-9]{3,8}|animation:|transition:/);
});
