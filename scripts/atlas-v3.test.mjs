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
let query = "";
const modules = new Map();
function load(path) {
  if (modules.has(path)) return modules.get(path);
  const loaded = { exports: {} };
  const code = ts.transpileModule(readFileSync(resolve(root, path), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { module: loaded, exports: loaded.exports, URLSearchParams,
    require(id) {
      if (id === "next/navigation") return { useSearchParams: () => new URLSearchParams(query) };
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
const Page = load("app/world-map/page.tsx").default;
function render(country = "") {
  query = country ? "country=" + country : "";
  return renderToStaticMarkup(React.createElement(Page));
}

test("neutral Atlas renders useful world rails with explicit fixture and unknown states", () => {
  const html = render();
  assert.match(html, /World at a glance/);
  assert.match(html, /Explore fixture leaders/);
  assert.match(html, /FIXTURE \/ DEMO/);
  assert.match(html, /UNKNOWN/);
  assert.match(html, /UNAVAILABLE/);
  assert.match(html, /No country is selected/);
  assert.doesNotMatch(html, /View Country Intelligence/);
});

test("URL selection populates both Atlas rails and the correct country dossier link", () => {
  const html = render("denmark");
  assert.match(html, /Denmark in context/);
  assert.match(html, /Denmark is selected/);
  assert.match(html, /Fixture global rank/);
  assert.match(html, /Fixture rank movement/);
  assert.match(html, /href="\/countries\?country=denmark"/);
  assert.match(html, /Clear selection/);
});

test("invalid selection returns neutral discovery without manufacturing an identity", () => {
  const html = render("not-a-country");
  assert.match(html, /World at a glance/);
  assert.doesNotMatch(html, /not-a-country/);
});

test("Atlas keeps local geography and shared approved wheel and zoom bounds", () => {
  const source = readFileSync(resolve(root, "app/world-map/page.tsx"), "utf8");
  assert.match(source, /MIN_VIEW_SCALE = 0\.8/);
  assert.match(source, /MAX_VIEW_SCALE = 5/);
  assert.match(source, /bindMapWheel\(surface/);
  assert.match(source, /ref=\{wheelSurfaceRef\} className=\{styles.mapStage\}/);
  assert.match(source, /canvas\.offsetWidth/);
  assert.match(source, /mapWheelZoomFactor\(delta\)/);
  assert.match(source, /\/data\/world-countries-110m\.geo\.json/);
  assert.match(source, /\/data\/world-microstates-10m\.geo\.json/);
  assert.doesNotMatch(source, /console\.|scrollIntoView/);
  assert.match(source, /event\.target instanceof HTMLInputElement/);
});

test("responsive workspace prioritises map on mobile and majority geography on desktop", () => {
  const css = readFileSync(resolve(root, "app/world-map/world-map.module.css"), "utf8");
  assert.match(css, /grid-template-areas: "map" "identity" "context"/);
  assert.match(css, /minmax\(0, 20fr\) minmax\(0, 60fr\) minmax\(0, 20fr\)/);
  assert.match(css, /align-items: stretch/);
  assert.match(css, /contain: size/);
  assert.match(css, /prefers-reduced-motion/);
});

test("real Atlas selection toggles URL without refocusing the camera on deselect", () => {
  const source = readFileSync(resolve(root, "app/world-map/page.tsx"), "utf8");
  const handler = source.slice(source.indexOf("  function selectCountry("), source.indexOf("  function selectSearchCountry("));
  const history = [];
  const focus = [];
  const window = { location: { href: "http://localhost/world-map?layer=fixture" }, history: {
    pushState: (_, __, path) => { window.location.href = "http://localhost" + path; history.push(path); },
  } };
  const executable = ts.transpileModule(handler + "\nselectCountry;", {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const api = runInNewContext(executable, {
    URL, window, keyboardCountryIdRef: { current: null },
    ...load("lib/country-browsing.ts"), focusCountry: (id) => focus.push(id),
  });
  api("denmark", true);
  assert.match(window.location.href, /country=denmark/);
  api("denmark", true);
  assert.equal(window.location.href, "http://localhost/world-map?layer=fixture");
  assert.deepEqual(focus, ["denmark"]);
  api("france", true);
  api("france", true, false); // Arrow/Home/End navigation must not toggle at a boundary.
  assert.match(window.location.href, /country=france/);
  assert.equal(history.length, 4);
});

test("Atlas camera constraints use rendered canvas size and retain the zoom anchor", () => {
  const source = readFileSync(resolve(root, "app/world-map/page.tsx"), "utf8");
  const handler = source.slice(source.indexOf("function clampMapView("), source.indexOf("function movementLabel("));
  const code = ts.transpileModule(handler + "\nmodule.exports = clampMapView;", {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const result = { exports: null };
  runInNewContext(code, { module: result, MIN_VIEW_SCALE: 0.8, MAX_VIEW_SCALE: 5,
    WORLD_VIEW: { scale: 1, translateX: 0, translateY: 0 },
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
  });
  const frame = { clientWidth: 886, clientHeight: 680,
    querySelector: () => ({ offsetWidth: 640, offsetHeight: 640 }) };
  const camera = { scale: 1.01, translateX: -4.43, translateY: -3.4 };
  const next = result.exports(camera, frame);
  assert.equal(next.translateX, camera.translateX);
  assert.equal(next.translateY, camera.translateY);
  assert.equal(result.exports({ ...camera, scale: 99 }, frame).scale, 5);
  assert.equal(result.exports({ ...camera, scale: 0.1 }, frame).scale, 0.8);
});
