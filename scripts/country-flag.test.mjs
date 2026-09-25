import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("shared flags use native light colours and gentle dark-theme attenuation", () => {
  assert.match(css, /\.skillatlas-country-flag-image \{\s*object-fit: contain;\s*filter: none;\s*\}/);
  assert.match(css, /html\.skillatlas-dark \.skillatlas-country-flag-image \{\s*filter: saturate\(0\.9\) brightness\(0\.92\);\s*\}/);
});

test("flag alignment slots remain transparent, borderless and unrounded", () => {
  const slot = css.match(/\.skillatlas-country-flag \{([^}]+)\}/)?.[1];
  assert.ok(slot);
  assert.match(slot, /place-items: center;/);
  assert.match(slot, /border: 0;/);
  assert.match(slot, /border-radius: 0;/);
  assert.match(slot, /background: transparent;/);
});
