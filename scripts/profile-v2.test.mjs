import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const requireDependency = createRequire(import.meta.url);
const cache = new Map();
function load(path) {
  if (cache.has(path)) return cache.get(path);
  const loadedModule = { exports: {} };
  const source = ts.transpileModule(readFileSync(root + path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  runInNewContext(source, {
    module: loadedModule, exports: loadedModule.exports, Buffer, Date,
    require: (id) => id === "server-only" ? {} : id.startsWith("@/") ? load(id.slice(2) + ".ts") : requireDependency(id),
  });
  cache.set(path, loadedModule.exports);
  return loadedModule.exports;
}
const gaming = load("lib/account/gaming-identity.ts");
const avatar = load("lib/account/avatar.ts");
const processing = load("lib/account/avatar-processing.ts");
const games = load("constants/games.ts").GAME_IDS;
const platforms = load("constants/platforms.ts").PLATFORM_DEFINITIONS;
const migration = readFileSync(root + "supabase/migrations/20261007054039_profile_extended_identity_v2.sql", "utf8");

test("gaming editor prevents action resets from clearing saved checkbox and privacy controls", () => {
  const loadedModule = { exports: {} };
  const source = ts.transpileModule(readFileSync(root + "app/account/components/gaming-identity-form.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const jsx = (type, props) => ({ type, props });
  runInNewContext(source, {
    module: loadedModule, exports: loadedModule.exports,
    require: (id) => {
      if (id === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (id === "react") return {
        useActionState: () => [{ status: "success", message: "Gaming identity updated." }, () => {}, false],
        useState: (value) => [value, () => {}], useRef: () => ({ current: null }), useEffect: () => {},
      };
      if (id.startsWith("@/constants/")) return load(id.slice(2) + ".ts");
      return {};
    },
  });
  const form = loadedModule.exports.default({
    favouriteGameIds: ["cs2"], platformIds: ["pc"], gamingSince: 2012,
    favouriteGamesIsPublic: true, platformsIsPublic: true, gamingSinceIsPublic: true,
  });
  assert.equal(form.type, "form");
  let prevented = false;
  form.props.onReset({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true, "keep native inputs consistent with the saved React state");
  assert.match(JSON.stringify(form), /Gaming identity updated/);
  assert.match(JSON.stringify(form), /"checked":true/);
});

test("favourites use every canonical Game ID, preserve order, and reject unknown/duplicate values", () => {
  const result = gaming.parseIdentityIds(JSON.stringify([...games].reverse()), games);
  assert.equal(result.valid, true);
  assert.deepEqual(Array.from(result.value), [...games].reverse());
  for (const value of ['["made-up"]', '["cs2","cs2"]', '["CS2"]', '[null]', '{}', 'not json']) {
    assert.equal(gaming.parseIdentityIds(value, games).valid, false, value);
  }
  assert.equal(gaming.parseIdentityIds("[]", games).value.length, 0);
  for (const id of games) assert.ok(migration.includes("('" + id + "')"), id + " has a DB foreign-key reference");
  const seed = migration.match(/insert into public.profile_game_catalogue[^;]+;/)[0];
  assert.equal((seed.match(/\('[^']+'\)/g) ?? []).length, games.length);
});

test("platform taxonomy is explicit and add/remove validation is bounded", () => {
  const allowed = platforms.map((item) => item.id);
  assert.equal(gaming.parseIdentityIds(JSON.stringify(allowed), allowed).valid, true);
  assert.equal(gaming.parseIdentityIds('["invented-device"]', allowed).valid, false);
  assert.equal(gaming.parseIdentityIds('["pc","pc"]', allowed).valid, false);
  assert.equal(gaming.parseIdentityIds("[]", allowed).value.length, 0);
  for (const id of allowed) assert.ok(migration.includes("'" + id + "'"));
});

test("Gaming Since supports clear and valid year, rejects future/non-year values", () => {
  for (const value of ["", "  "]) assert.equal(gaming.validateGamingSince(value, 2026).value, null);
  for (const value of ["2012", "2026"]) assert.equal(gaming.validateGamingSince(value, 2026).value, Number(value));
  for (const value of ["2027", "-100", "12", "2012-01-01", "2012.0", "1e3", "abcd"]) {
    assert.equal(gaming.validateGamingSince(value, 2026).valid, false, value);
  }
});

test("optional fields default private; clearing values clears public flags", () => {
  const form = new FormData();
  form.set("favouriteGameIds", '["cs2"]');
  form.set("platformIds", '["pc"]');
  form.set("gamingSince", "2012");
  const privateValues = gaming.parseGamingIdentity(form).value;
  assert.equal(privateValues.p_games_is_public, false);
  assert.equal(privateValues.p_platforms_is_public, false);
  assert.equal(privateValues.p_gaming_since_is_public, false);
  for (const field of ["favouriteGamesIsPublic", "platformsIsPublic", "gamingSinceIsPublic"]) form.set(field, "on");
  assert.equal(gaming.parseGamingIdentity(form).value.p_games_is_public, true);
  form.set("favouriteGameIds", "[]"); form.set("platformIds", "[]"); form.set("gamingSince", "");
  const cleared = gaming.parseGamingIdentity(form).value;
  assert.equal(cleared.p_games_is_public, false);
  assert.equal(cleared.p_platforms_is_public, false);
  assert.equal(cleared.p_gaming_since_is_public, false);
  assert.equal(cleared.p_gaming_since, 0, "transport sentinel maps to SQL null, not a stored year");
});

test("avatar validation rejects oversized, empty, SVG and unsupported uploads", () => {
  assert.equal(avatar.validateAvatarFile({ type: "image/png", size: 1 }), null);
  for (const file of [
    { type: "image/svg+xml", size: 30 }, { type: "text/html", size: 30 },
    { type: "image/png", size: 0 }, { type: "image/png", size: avatar.AVATAR_INPUT_LIMIT + 1 },
  ]) assert.equal(typeof avatar.validateAvatarFile(file), "string");
});

test("avatar processor decodes, square-fits and strips originals/metadata", async () => {
  for (const format of ["png", "jpeg", "webp"]) {
    const original = await sharp({ create: { width: 120, height: 80, channels: 3, background: "#19d3cf" } })[format]().toBuffer();
    const file = new File([original], "test." + format, { type: "image/" + format });
    const output = await processing.processAvatar(file);
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.width, 512);
    assert.equal(metadata.height, 512);
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.exif, undefined);
    assert.ok(output.length < avatar.AVATAR_OUTPUT_LIMIT);
  }
});

test("avatar processor rejects disguised or malformed bytes and huge dimensions", async () => {
  await assert.rejects(processing.processAvatar(new File(["not an image"], "image.png", { type: "image/png" })));
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "red" } }).png().toBuffer();
  await assert.rejects(processing.processAvatar(new File([png], "image.jpg", { type: "image/jpeg" })));
  const huge = await sharp({ create: { width: 4100, height: 4100, channels: 3, background: "red" } }).png().toBuffer();
  await assert.rejects(processing.processAvatar(new File([huge], "huge.png", { type: "image/png" })));
});

test("avatar paths are case-stable, contain no Auth ID, and version URLs change", () => {
  assert.equal(avatar.avatarStoragePath("Member_A"), "member_a/avatar.webp");
  assert.equal(avatar.avatarStoragePath("MEMBER_A"), "member_a/avatar.webp");
  assert.equal(avatar.avatarUrl("Member_A", null), null);
  assert.notEqual(avatar.avatarUrl("Member_A", "version-a"), avatar.avatarUrl("Member_A", "version-b"));
  const component = readFileSync(root + "app/components/member-avatar.tsx", "utf8");
  assert.match(component, /if \(!src \|\| src === failedSrc\) return <>\{initials\}<\/>/);
  assert.match(component, /onError=/);
});

test("public UI omits empty gaming sections and retains canonical game links", () => {
  const component = readFileSync(root + "app/members/[username]/page.tsx", "utf8");
  assert.match(component, /hasGamingIdentity \?/);
  assert.match(component, /favouriteGames.length > 0 \?/);
  assert.match(component, /platforms.length > 0 \?/);
  assert.match(component, /profile.gamingSince !== null \?/);
  assert.match(component, /\/games#entity-/);
  assert.doesNotMatch(component, /completion percentage|profile_activity|activity_events/);
});

test("storage writes stay owner-scoped and administrative deletion requires API cleanup", () => {
  assert.match(migration, /262144, array\['image\/webp'\]/);
  for (const operation of ["select", "insert", "update", "delete"]) {
    assert.match(migration, new RegExp("on storage.objects for " + operation + " to authenticated"));
  }
  assert.match(migration, /where id = \(select auth.uid\(\)\)/);
  assert.match(migration, /Remove the avatar through Storage API before deleting/);
  assert.doesNotMatch(migration, /delete from storage.objects|service_role/);
  assert.match(migration, /case when profile.favourite_games_is_public/);
  assert.match(migration, /case when profile.platforms_is_public/);
  assert.match(migration, /case when profile.gaming_since_is_public/);
});
