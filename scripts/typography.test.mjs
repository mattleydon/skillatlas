import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(root + path, "utf8");
function sourceFiles(directory) {
  return readdirSync(root + directory, { withFileTypes: true }).flatMap((entry) => {
    const path = directory + "/" + entry.name;
    return entry.isDirectory() ? sourceFiles(path) : /\.(tsx|css)$/.test(path) ? [path] : [];
  });
}
const files = sourceFiles("app");
const roles = read("app/typography.css");

test("Hybrid Intelligence roles keep reading and instrumentation separate", () => {
  for (const role of ["page-title", "heading", "label", "meta", "data", "control"]) {
    assert.match(roles, new RegExp("@utility sa-type-" + role + " \\{\\s*font-family: var\\(--sa-font-data\\)"));
  }
  for (const role of ["body", "intro", "reading-control"]) {
    assert.match(roles, new RegExp("@utility sa-type-" + role + " \\{\\s*font-family: var\\(--sa-font-ui\\)"));
  }
  assert.match(roles, /--sa-page-title-size: 0\.88rem/);
  assert.match(roles, /--sa-page-title-size: 1\.12rem/);
  assert.match(roles, /font-variant-numeric: tabular-nums/);
});

test("every existing h1 adopts the shared compact title, without competing size utilities", () => {
  let count = 0;
  for (const path of files.filter((path) => path.endsWith(".tsx"))) {
    const source = ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === "h1") {
        count++;
        const attribute = node.attributes.properties.find((item) => ts.isJsxAttribute(item) && item.name.getText(source) === "className");
        const text = attribute?.initializer?.getText(source) ?? "";
        assert.match(text, /sa-type-page-title/, path);
        assert.doesNotMatch(text, /(?:sm:|md:)?text-(?:[2-9]xl|\[\d)/, path);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.ok(count >= 13);
});

test("legacy heavy weights and blanket Mono selectors cannot silently return", () => {
  for (const path of files) {
    assert.doesNotMatch(read(path), /\bfont-(?:bold|black|extrabold|semibold)\b|font-weight:\s*(?:[7-9]\d\d)/, path);
  }
  const globals = read("app/globals.css");
  assert.doesNotMatch(globals, /--font-weight-(?:bold|black|extrabold|semibold):/);
  assert.doesNotMatch(globals, /\.uppercase,\s*\.tabular-nums,\s*button/);
});

test("brand roles stay separate and preserve approved light wordmark and logo treatment", () => {
  const globals = read("app/globals.css");
  assert.match(globals, /\.skillatlas-wordmark > span:first-child \{ font-weight: 300; \}/);
  assert.match(globals, /--sa-brand-gradient: linear-gradient\(100deg, #19d3cf 15%, #ff2fa8 90%\)/);
  assert.match(globals, /brightness\(1\.08\)/);
  assert.match(read("app/components/site-header.tsx"), /GLOBAL GAMING INTELLIGENCE/);
  assert.match(read("app/layout.tsx"), /IBM_Plex_Sans/);
  assert.match(read("app/layout.tsx"), /IBM_Plex_Mono/);
});

test("Auth keeps reading controls and explicit technical eight-digit OTP typography", () => {
  assert.match(read("app/auth/components/submit-button.tsx"), /sa-type-reading-control/);
  assert.match(read("app/auth/components/verify-code-form.tsx"), /sa-type-data/);
  assert.match(read("app/auth/components/verify-code-form.tsx"), /tracking-\[0\.3em\]/);
  assert.match(read("app/auth/components/auth-request-form.tsx"), /sa-type-label/);
  assert.match(read("app/account/components/privacy-toggle.tsx"), /sa-type-body/);
});

test("shared frame uses one tighter responsive inset without duplicate Auth top padding", () => {
  const globals = read("app/globals.css");
  assert.match(globals, /--sa-page-gutter: 12px/);
  assert.match(globals, /@media \(min-width: 1024px\) \{\s*:root \{\s*--sa-page-gutter: 14px/);
  assert.match(globals, /padding-top: calc\(var\(--sa-header-expanded-height\) \+ var\(--sa-page-gutter\)\)/);
  assert.match(globals, /padding-inline: var\(--sa-page-gutter\)/);
  const authFrame = read("app/auth/components/auth-shell.tsx").match(/className="skillatlas-content-frame[^"]*"/)?.[0];
  assert.ok(authFrame);
  assert.doesNotMatch(authFrame, /(?:pt-|py-|padding-top)/);
  assert.match(authFrame, /max-w-\[1440px\]/);
});

test("symbol brightness is theme-specific without changing wordmark gradient or geometry", () => {
  const globals = read("app/globals.css");
  assert.match(globals, /mask: url\("\/skillatlas-logo.png"\) center \/ contain no-repeat/);
  assert.match(globals, /opacity: 0\.85/);
  assert.match(globals, /filter: saturate\(1\.25\) brightness\(1\.1\) contrast\(1\.12\)/);
  assert.match(globals, /html\.skillatlas-dark \.skillatlas-brand-mark::after \{\s*filter: saturate\(1\.04\) brightness\(1\.11\)/);
});

test("technical labels share one source instead of independent tracking/weight recipes", () => {
  assert.match(read("app/components/intelligence-ui/data-label.tsx"), /sa-type-label text-\[10px\]/);
  assert.match(roles, /--sa-tracking-label: 0\.12em/);
  assert.match(roles, /--sa-weight-regular: 400/);
  assert.match(roles, /--sa-weight-medium: 500/);
});
