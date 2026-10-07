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
const { createMapWheelIntent, mapWheelZoomFactor } = load("lib/map-wheel-intent.ts");
const event = (deltaY, timeStamp, rest = {}) => ({ deltaY, deltaX: 0, timeStamp, deltaMode: 0, ctrlKey: false, ...rest });

test("shipped wheel input is silent and uses the approved production defaults", () => {
  const helper = readFileSync(resolve(root, "lib/map-wheel-intent.ts"), "utf8");
  assert.doesNotMatch(helper, /console\./);
  assert.match(helper, /provisionalCapture = true/);
  for (const path of ["app/countries/components/country-atlas-map.tsx", "app/world-map/page.tsx"]) {
    assert.doesNotMatch(readFileSync(resolve(root, path), "utf8"), /NODE_ENV|COUNTRIES_WHEEL_DIAGNOSTIC/);
  }
});

test("shared wheel magnitude is gentle, reversible and independent of intent", () => {
  assert.equal(mapWheelZoomFactor(0), 1);
  assert.ok(Math.abs(mapWheelZoomFactor(-2) - Math.exp(0.011495)) < 0.000001);
  assert.ok(Math.abs(mapWheelZoomFactor(-20) - Math.exp(0.11495)) < 0.000001);
  assert.equal(mapWheelZoomFactor(-120), Math.exp(0.16));
  assert.equal(mapWheelZoomFactor(-10000), Math.exp(0.16));
  assert.ok(Math.abs(mapWheelZoomFactor(120) * mapWheelZoomFactor(-120) - 1) < 1e-12);
  for (const path of ["app/countries/components/country-atlas-map.tsx", "app/world-map/page.tsx"]) {
    assert.match(readFileSync(resolve(root, path), "utf8"), /mapWheelZoomFactor\(delta\)/);
  }
});

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
  assert.equal(intent(event(-30, 1000)).zoom, false);
  assert.equal(intent(event(-30, 1060)).zoom, true);
  assert.equal(intent(event(-100, 1500)).zoom, false);
  assert.equal(intent(event(240, 2000)).zoom, false);
  assert.equal(intent(event(3, 3000, { deltaMode: 1 })).delta, 48);
  assert.equal(intent(event(1, 3500, { deltaMode: 2 })).zoom, false);
});
test("rapid bursts and their momentum remain page scroll; explicit pinch is zoom", () => {
  const intent = createMapWheelIntent();
  intent(event(90, 1000)); intent(event(90, 1016));
  assert.equal(intent(event(90, 1032)).zoom, false);
  assert.equal(intent(event(3, 1120)).zoom, false);
  assert.equal(intent(event(-10, 1136, { ctrlKey: true })).zoom, true);
  assert.equal(intent(event(-20, 1600)).zoom, false);
  assert.equal(intent(event(-20, 1660)).zoom, true);
});
test("moderate deliberate cadence zooms without sacrificing fast-scroll escape", () => {
  for (const [delta, interval] of [[20, 30], [30, 60], [40, 100]]) {
    const intent = createMapWheelIntent();
    for (let i = 0; i < 12; i++) assert.equal(intent(event(delta, 1000 + i * interval)).zoom, i > 0);
    assert.equal(intent(event(300, 3000)).zoom, false);
    assert.equal(intent(event(20, 3100)).zoom, false);
    assert.equal(intent(event(20, 3500)).zoom, false);
    assert.equal(intent(event(20, 3550)).zoom, true);
    assert.equal(intent(event(20, 3600, { deltaX: 80 })).zoom, false);
  }
});
test("browser-captured small, deliberate and strong single wheel deltas retain their intent", () => {
  const intent = createMapWheelIntent();
  assert.equal(intent(event(-149.9999955, 152137.2)).zoom, false);
  assert.equal(intent(event(-44.9999987, 160436.7)).zoom, false);
  assert.equal(intent(event(-299.9999911, 160701.5)).zoom, false);
});
test("ambiguous medium vertical sequences yield to page scroll, then recover after pause", () => {
  const intent = createMapWheelIntent();
  assert.equal(intent(event(10, 900)).zoom, false);
  intent(event(50, 1000)); intent(event(50, 1016));
  intent(event(50, 1032));
  assert.equal(intent(event(50, 1048)).zoom, false);
  assert.equal(intent(event(8, 1100)).zoom, false);
  assert.equal(intent(event(8, 1400)).zoom, false);
  assert.equal(intent(event(8, 1450)).zoom, true);
  assert.equal(intent(event(140, 1600)).zoom, false);
  assert.equal(intent(event(-150, 1616, { ctrlKey: true })).zoom, true);
});
test("outside-map scroll and long fading momentum never become zoom until quiet", () => {
  const intent = createMapWheelIntent();
  assert.equal(intent(event(20, 1000), true).zoom, false);
  for (let i = 1; i < 100; i++) assert.equal(intent(event(2, 1000 + i * 16)).zoom, false);
  assert.equal(intent(event(-10, 3000)).zoom, false);
  assert.equal(intent(event(-10, 3050)).zoom, true);
  assert.equal(intent(event(100, 3060)).zoom, false);
  assert.equal(intent(event(-10, 3080, { metaKey: true })).zoom, true);
});
test("soft-arm accepts high-frequency low-speed trackpad streams without a 24ms inter-event gap", () => {
  for (const cadence of [8, 16]) {
    const intent = createMapWheelIntent();
    for (let i = 0; i < 30; i++) {
      assert.equal(intent(event(-2, 1000 + i * cadence)).zoom, i * cadence >= 24);
    }
    assert.equal(intent(event(-90, 1600)).zoom, false);
    assert.equal(intent(event(-90, 1616)).zoom, false);
    for (let i = 0; i < 50; i++) assert.equal(intent(event(-2, 1632 + i * 16)).zoom, false);
    assert.equal(intent(event(-2, 2800)).zoom, false);
    assert.equal(intent(event(-2, 2832)).zoom, true);
  }
});
test("consistent deliberate notches soft-arm; fast notches and horizontal input escape", () => {
  const intent = createMapWheelIntent();
  assert.equal(intent(event(-120, 1000)).zoom, false);
  assert.equal(intent(event(-120, 1100)).zoom, true);
  assert.equal(intent(event(-120, 1200)).zoom, true);
  assert.equal(intent(event(-120, 1216)).zoom, false);
  assert.equal(intent(event(-1, 1232, { ctrlKey: true })).zoom, true);
  assert.equal(intent(event(-1, 1248, { metaKey: true })).zoom, true);
  assert.equal(intent(event(5, 1600, { deltaX: 20 })).zoom, false);
});
test("wheel binding batches 100 events into one frame and cancels pending zoom on scroll", () => {
  const frames = new Map();
  const listeners = new Map();
  let id = 0;
  const fakeWindow = { requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: key => frames.delete(key), addEventListener() {}, removeEventListener() {} };
  const element = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  const mod = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(resolve(root, "lib/map-wheel-intent.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { module: mod, exports: mod.exports, window: fakeWindow });
  const updates = [];
  let prevented = 0;
  const cleanup = mod.exports.bindMapWheel(element, () => true, (...args) => updates.push(args));
  const send = (delta, time, ctrl = true) => listeners.get("wheel")({ ...event(delta, time), ctrlKey: ctrl,
    cancelable: true, clientX: 100, clientY: 200, preventDefault: () => prevented++ });
  for (let i = 0; i < 100; i++) send(-1, i);
  assert.equal(frames.size, 1);
  const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn());
  assert.deepEqual(updates, [[-100, 100, 200]]);
  assert.equal(prevented, 100);
  send(-1, 110);
  send(100, 120, false);
  assert.equal(frames.size, 0);
  assert.equal(prevented, 101);
  cleanup();
  assert.equal(listeners.size, 0);

  // Opt-in experiment: capture only a tiny start, without moving the camera.
  const stopExperiment = mod.exports.bindMapWheel(element, () => true, (...args) => updates.push(args));
  prevented = 0;
  send(-1, 1000, false);
  assert.equal(prevented, 1);
  assert.equal(frames.size, 0);
  send(-2, 1016, false);
  assert.equal(prevented, 2);
  assert.equal(frames.size, 0);
  send(-3, 1033, false);
  assert.equal(prevented, 3);
  assert.equal(frames.size, 1);
  send(0, 1035, false);
  assert.equal(frames.size, 1); // zero-motion does not cancel armed zoom
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); };
  flush();
  assert.deepEqual(updates.at(-1), [-6, 100, 200]); // includes both held deltas
  send(-2, 1040, false);
  flush();
  assert.deepEqual(updates.at(-1), [-2, 100, 200]); // never replay twice
  send(-52, 1049, false);
  assert.equal(prevented, 4);
  assert.equal(frames.size, 0);
  send(-19, 2000, false); // larger initial events stay native
  assert.equal(prevented, 4);
  send(-1, 3000, false);
  assert.equal(prevented, 5);
  send(-30, 3016, false); // growing provisional input releases immediately
  assert.equal(prevented, 5);
  assert.equal(frames.size, 0);
  send(-1, 4000, false);
  send(-1, 4070, false); // already positive slow sequence can zoom
  assert.equal(frames.size, 1);
  flush();
  assert.deepEqual(updates.at(-1), [-2, 100, 200]); // released input was discarded
  const beforeDwell = prevented;
  send(-6, 5000, false);
  assert.equal(prevented, beforeDwell);
  listeners.get("pointerenter")({ timeStamp: 5500 });
  send(-6, 5750, false);
  assert.equal(prevented, beforeDwell + 1);
  assert.equal(frames.size, 0);
  send(-30, 5766, false);
  assert.equal(prevented, beforeDwell + 1);
  send(-19, 6100, false);
  assert.equal(prevented, beforeDwell + 1);
  send(-1, 6500, false);
  listeners.get("pointerleave")();
  send(-1, 7000, false);
  send(-1, 7032, false);
  flush();
  assert.deepEqual(updates.at(-1), [-2, 100, 200]);
  stopExperiment();
  assert.equal(frames.size, 0);
});
test("zero-motion events preserve armed intent and do not create a scroll lock", () => {
  const intent = createMapWheelIntent();
  intent(event(-1, 1000));
  assert.equal(intent(event(-2, 1032)).zoom, true);
  assert.equal(intent(event(0, 1040)).reason, "zero-motion");
  assert.equal(intent(event(-2, 1048)).zoom, true);
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
