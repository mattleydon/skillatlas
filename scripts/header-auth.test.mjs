import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { setImmediate as settle } from "node:timers/promises";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const requireDependency = createRequire(import.meta.url);
const { createServerClient } = requireDependency("@supabase/ssr");
const cookieName = "sb-localhost-auth-token";
const user = { id: "header-fixture-user", email: "private@example.invalid", user_metadata: { secret: "private" } };
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const session = (expiresAt) => ({
  access_token: `${encode({ alg: "HS256" })}.${encode({ sub: user.id, exp: expiresAt })}.fixture`,
  refresh_token: "fixture-refresh-secret", token_type: "bearer",
  expires_at: expiresAt, expires_in: 3600, user,
});

// Render the real control's JSX with a controlled open menu. These presentation
// fixtures do not claim to establish a browser-authenticated session.
function renderMemberControl(memberState, compact = false) {
  const h = harness();
  const loadedModule = { exports: {} };
  const source = ts.transpileModule(readFileSync(`${root}app/components/header-member-control.tsx`, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(source, {
    module: loadedModule, exports: loadedModule.exports,
    require: (specifier) => {
      if (specifier === "react") return {
        useState: () => [true, () => {}], useEffect() {}, useRef: () => ({ current: null }),
      };
      if (specifier === "react/jsx-runtime") return requireDependency(specifier);
      if (specifier === "next/link") return { default: "a" };
      if (specifier === "@/constants/routes" || specifier === "@/lib/navigation" || specifier === "@/lib/account/avatar") return h.load(`${specifier.slice(2)}.ts`);
      return {};
    },
  });
  const tree = loadedModule.exports.default({ memberState, pathname: "/", compact });
  const nodes = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node?.props) return;
    nodes.push(node);
    visit(node.props.children);
  }
  visit(tree);
  const trigger = nodes.find((node) => node.props["aria-haspopup"] === "menu");
  const menu = nodes.find((node) => node.props.role === "menu");
  const profileLink = nodes.find((node) => node.props.href?.startsWith("/members/"));
  const identityCopy = nodes.find((node) => node.props.className === "skillatlas-member-identity-copy");
  return {
    trigger, menu, profileLink, nodes, identityCopy,
    label: nodes.find((node) => node.type === "strong").props.children,
    initials: nodes.find((node) => node.props.className === "skillatlas-member-glyph").props.children,
  };
}

for (const compact of [false, true]) {
  test(`${compact ? "mobile" : "desktop"} member control shows Display Name and retains menu username`, () => {
    const rendered = renderMemberControl({ status: "profile_complete", displayName: "Human Identity", username: "Member_A" }, compact);
    assert.equal(rendered.label, "Human Identity");
    assert.equal(rendered.initials, "HI");
    assert.equal(rendered.trigger.props["aria-expanded"], true);
    assert.equal(rendered.menu.props["aria-hidden"], false);
    assert.equal(rendered.identityCopy.props.children[0].props.children, "Human Identity");
    assert.equal(rendered.identityCopy.props.children[1].props.children.join(""), "@Member_A");
    assert.equal(rendered.trigger.props.children[1].props.children.type, "strong", "no Profile micro-label in the signed-in control");
    const items = rendered.nodes.filter((node) => node.props.role === "menuitem");
    assert.deepEqual(items.map((node) => node.props.href ?? node.type), ["/members/Member_A", "/account", "button"]);
    assert.deepEqual(Array.from(items[1].props.children, (node) => node.props.children), ["Profile", "Identity and privacy controls"]);
    assert.deepEqual(Array.from(items[2].props.children, (node) => node.props.children), ["Sign out", "End this SkillAtlas session"]);
    assert.equal(rendered.nodes.filter((node) => node.props.className === "skillatlas-member-glyph").length, 2, "avatar/initials appear in trigger and identity header");
    assert.equal(rendered.profileLink.props.href, "/members/Member_A");
    assert.equal(rendered.profileLink.props["aria-label"], "View public profile: Human Identity (@Member_A)");
  });
  test(`${compact ? "mobile" : "desktop"} member control falls back to the handle for empty Display Name`, () => {
    for (const displayName of ["", "   "]) {
      const rendered = renderMemberControl({ status: "profile_complete", displayName, username: "Member_A" }, compact);
      assert.equal(rendered.label, "@Member_A");
      assert.equal(rendered.initials, "ME");
      assert.equal(rendered.identityCopy.props.children[0].props.children, "@Member_A");
      assert.equal(rendered.identityCopy.props.children[1].props.children.join(""), "@Member_A");
      assert.equal(rendered.profileLink.props["aria-label"], "View public profile: @Member_A");
    }
  });
}

test("signed-out control retains its Profile label and sign-in destination", () => {
  const rendered = renderMemberControl({ status: "signed_out" });
  assert.equal(rendered.label, "Sign in");
  assert.equal(rendered.nodes[0].props.href, "/auth/sign-in");
  assert.equal(rendered.nodes.find((node) => node.type === "small").props.children, "Profile");
});

test("avatar identity uses the same version and initials fallback in trigger and menu", () => {
  const rendered = renderMemberControl({ status: "profile_complete", displayName: "Member A", username: "Member_A", avatarVersion: "avatar-current" });
  const avatars = rendered.nodes.filter((node) => node.props.src?.includes("/avatar/"));
  assert.equal(avatars.length, 2);
  for (const node of avatars) {
    assert.equal(node.props.src, "/members/Member_A/avatar/avatar-current");
    assert.equal(node.props.initials, "MA");
  }
});

// Real installed SSR/Auth client + real server/account/action modules. Only the
// Next request-cookie store and Supabase HTTP boundary are fixtures; no network.
function harness({ signedIn = false, expired = false, profile = true, authFailure = false, profileFailure = false, avatarVersion = null } = {}) {
  const jar = new Map();
  const writes = [];
  const requests = [];
  const cache = new Map();
  const storedProfile = { id: user.id, username: "Member_A", display_name: "Member A", avatar_version: avatarVersion, city_town: "Private town", birth_country_is_public: false, username_case_correction_available: true };
  if (signedIn) jar.set(cookieName, `base64-${encode(session(Math.floor(Date.now() / 1000) + (expired ? -60 : 3600)))}`);
  const cookieStore = {
    getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
    get: (name) => jar.has(name) ? { value: jar.get(name) } : undefined,
    set: (name, value, options) => {
      writes.push({ name, options });
      if (options?.maxAge === 0) jar.delete(name);
      else jar.set(name, value);
    },
  };
  const fakeFetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "http://localhost:54321");
    requests.push(url.pathname);
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    if (url.pathname === "/auth/v1/token") return json(session(Math.floor(Date.now() / 1000) + 3600));
    if (url.pathname === "/auth/v1/user") {
      assert.match(new Headers(init?.headers).get("authorization"), /^Bearer /);
      return authFailure ? json({ message: "Invalid session" }, 401) : json(user);
    }
    if (url.pathname === "/auth/v1/logout") return new Response(null, { status: 204 });
    if (url.pathname === "/storage/v1/object/member-avatars/member_a/avatar.webp" && init?.method === "POST") {
      assert.equal(new Headers(init.headers).get("content-type"), "image/webp");
      assert.equal(new Headers(init.headers).get("x-upsert"), "true");
      const metadata = await requireDependency("sharp")(init.body).metadata();
      assert.equal(metadata.width, 512);
      assert.equal(metadata.height, 512);
      assert.equal(metadata.format, "webp");
      return json({ Key: "member-avatars/member_a/avatar.webp" });
    }
    if (url.pathname === "/storage/v1/object/member-avatars" && init?.method === "DELETE") {
      assert.deepEqual(JSON.parse(init.body).prefixes, ["member_a/avatar.webp"]);
      return json([]);
    }
    if (url.pathname === "/rest/v1/profiles") {
      assert.equal(url.searchParams.get("id"), `eq.${user.id}`);
      if (profileFailure) return json({ message: "Unavailable" }, 503);
      if (init?.method === "PATCH") {
        Object.assign(storedProfile, JSON.parse(init.body));
        return new Response(null, { status: 204 });
      }
      return json(profile ? [storedProfile] : []);
    }
    if (url.pathname === "/rest/v1/profile_heritage_countries" || url.pathname === "/rest/v1/profile_favourite_games") {
      assert.equal(url.searchParams.get("profile_id"), `eq.${user.id}`);
      return json([]);
    }
    throw new Error(`Unexpected fixture request: ${url.pathname}`);
  };
  function load(relativePath) {
    if (cache.has(relativePath)) return cache.get(relativePath);
    const loadedModule = { exports: {} };
    const source = ts.transpileModule(readFileSync(`${root}${relativePath}`, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText;
    runInNewContext(source, {
      module: loadedModule, exports: loadedModule.exports,
      process: { env: { NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-public-key" } },
      URL, File, Buffer,
      require: (specifier) => {
        if (specifier === "server-only") return {};
        if (specifier === "next/headers") return { cookies: async () => cookieStore };
        if (specifier === "next/cache") return { revalidatePath() {} };
        if (specifier === "next/navigation") return { redirect: (href) => { throw new Error(`redirect:${href}`); } };
        if (specifier === "@supabase/ssr") return {
          createServerClient: (url, key, options) => createServerClient(url, key, { ...options, global: { fetch: fakeFetch } }),
        };
        return specifier.startsWith("@/") ? load(`${specifier.slice(2)}.ts`) : requireDependency(specifier);
      },
    });
    cache.set(relativePath, loadedModule.exports);
    return loadedModule.exports;
  }
  return { load, jar, writes, requests, read: () => load("app/auth/header-state.ts").getHeaderMemberState() };
}

test("no session returns signed-out without reading profiles", async () => {
  const h = harness();
  assert.equal((await h.read()).status, "signed_out");
  assert.deepEqual(h.requests, []);
});
test("HttpOnly server cookie resolves member and returns only minimal header identity", async () => {
  const h = harness({ signedIn: true });
  const result = JSON.parse(JSON.stringify(await h.read()));
  assert.deepEqual(result, { status: "profile_complete", username: "Member_A", displayName: "Member A", avatarVersion: null });
  assert.ok(h.requests.includes("/auth/v1/user"));
  assert.equal((await h.read()).status, "profile_complete", "refresh reads the same cookie-backed session");
});
test("authenticated account without a profile remains incomplete", async () => {
  assert.equal((await harness({ signedIn: true, profile: false }).read()).status, "profile_incomplete");
});
test("invalid authenticated cookie cannot expose profile identity", async () => {
  const h = harness({ signedIn: true, authFailure: true });
  assert.equal((await h.read()).status, "signed_out");
  assert.equal(h.requests.some((path) => path.startsWith("/rest/")), false);
});
test("profile lookup failure is unavailable, not a fabricated signed-out state", async () => {
  assert.equal((await harness({ signedIn: true, profileFailure: true }).read()).status, "unavailable");
});
test("expired access token refresh keeps HttpOnly Secure SameSite cookies", async () => {
  const h = harness({ signedIn: true, expired: true });
  assert.equal((await h.read()).status, "profile_complete");
  assert.ok(h.requests.includes("/auth/v1/token"));
  assert.ok(h.writes.length > 0);
  for (const write of h.writes) {
    assert.equal(write.options.httpOnly, true);
    assert.equal(write.options.secure, true);
    assert.equal(write.options.sameSite, "lax");
  }
});
test("existing server sign-out clears session and header returns signed-out", async () => {
  const h = harness({ signedIn: true });
  await assert.rejects(h.load("app/auth/actions.ts").signOutAction(), /redirect:\/auth\/sign-in/);
  assert.ok(h.requests.includes("/auth/v1/logout"));
  assert.equal((await h.read()).status, "signed_out");
  assert.equal(h.jar.has(cookieName), false);
  assert.ok(h.writes.every((write) => write.options.httpOnly));
});

test("avatar upload and replacement process bytes, reuse the owner path and rotate public versions", async () => {
  const h = harness({ signedIn: true });
  const actions = h.load("app/account/actions.ts");
  const original = await requireDependency("sharp")({ create: { width: 80, height: 60, channels: 3, background: "#19d3cf" } }).png().toBuffer();
  const form = new FormData();
  form.set("avatar", new File([original], "avatar.png", { type: "image/png" }));
  assert.equal((await actions.updateAvatarAction({ status: "idle" }, form)).status, "success");
  const first = (await h.read()).avatarVersion;
  assert.match(first, /^[0-9a-f-]{36}$/);
  assert.equal((await actions.updateAvatarAction({ status: "idle" }, form)).status, "success");
  assert.notEqual((await h.read()).avatarVersion, first);
  assert.equal(h.requests.filter((path) => path.startsWith("/storage/")).length, 2);
});

test("avatar upload rejects invalid bytes and signed-out writes before Storage", async () => {
  const invalid = new FormData();
  invalid.set("avatar", new File(["invalid bytes"], "image.png", { type: "image/png" }));
  const owner = harness({ signedIn: true });
  assert.equal((await owner.load("app/account/actions.ts").updateAvatarAction({ status: "idle" }, invalid)).status, "error");
  assert.equal(owner.requests.some((path) => path.startsWith("/storage/")), false);
  const anonymous = harness();
  await assert.rejects(anonymous.load("app/account/actions.ts").updateAvatarAction({ status: "idle" }, invalid), /redirect:\/auth\/sign-in/);
  assert.deepEqual(anonymous.requests, []);
});

test("header effect ignores superseded and unmounted server responses", async () => {
  const requests = [];
  const states = [];
  let effect;
  const testWindow = new EventTarget();
  const testDocument = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const loadedModule = { exports: {} };
  const source = ts.transpileModule(readFileSync(`${root}app/components/header-member-control.tsx`, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  // Exercise the hook's actual effect lifecycle; no component render or Auth SDK
  // is mocked as proof of authentication (the server-path tests above cover it).
  runInNewContext(source, {
    module: loadedModule, exports: loadedModule.exports, window: testWindow, document: testDocument,
    require: (specifier) => {
      if (specifier === "react") return {
        useState: (initial) => [initial, (state) => states.push(state)],
        useEffect: (callback) => { effect = callback; },
      };
      if (specifier === "@/app/auth/header-state") return {
        getHeaderMemberState: () => new Promise((resolve) => requests.push(resolve)),
      };
      return {};
    },
  });
  loadedModule.exports.useHeaderMemberState("public");
  const cleanup = effect();
  testWindow.dispatchEvent(new Event("focus"));
  requests[1]({ status: "signed_out" });
  await settle();
  requests[0]({ status: "profile_complete", username: "OldMember", displayName: "Old member" });
  await settle();
  assert.deepEqual(states, [{ status: "signed_out" }]);
  testDocument.dispatchEvent(new Event("visibilitychange"));
  cleanup();
  requests[2]({ status: "profile_complete", username: "OldMember", displayName: "Old member" });
  await settle();
  testWindow.dispatchEvent(new Event("focus"));
  assert.equal(requests.length, 3, "cleanup removed refresh listeners");
  assert.equal(states.length, 1, "unmounted response was discarded");
});

for (const kind of ["display name", "username capitalization", "avatar removal"]) {
  test(`successful ${kind} save refreshes the header from canonical server data`, async () => {
    const h = harness({ signedIn: true, avatarVersion: kind === "avatar removal" ? "avatar-before" : null });
    const testWindow = new EventTarget();
    const testDocument = Object.assign(new EventTarget(), { visibilityState: "visible" });
    const states = [];
    const effects = [];
    let actionStates = [];
    let reads = 0;
    const modules = new Map();
    function loadClient(file) {
      if (modules.has(file)) return modules.get(file);
      const loadedModule = { exports: {} };
      const source = ts.transpileModule(readFileSync(`${root}${file}`, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
      }).outputText;
      runInNewContext(source, {
        module: loadedModule, exports: loadedModule.exports, window: testWindow, document: testDocument, Event,
        require: (specifier) => {
          if (specifier === "react") return {
            useState: (initial) => [initial, (state) => states.push(state)],
            useEffect: (callback) => effects.push(callback),
            useRef: () => ({ current: null }),
            useActionState: () => [actionStates.shift(), () => {}],
          };
          if (specifier === "react/jsx-runtime") return requireDependency(specifier);
          if (specifier === "@/app/auth/header-state") return { getHeaderMemberState: () => { reads++; return h.read(); } };
          if (specifier === "@/lib/account/profile-events") return loadClient("lib/account/profile-events.ts");
          if (specifier === "@/constants/routes" || specifier === "@/lib/account/avatar") return h.load(`${specifier.slice(2)}.ts`);
          return {};
        },
      });
      modules.set(file, loadedModule.exports);
      return loadedModule.exports;
    }
    const header = loadClient("app/components/header-member-control.tsx");
    header.useHeaderMemberState("/account");
    const cleanup = effects.shift()();
    await settle();
    assert.equal(states.at(-1)?.username, "Member_A");
    assert.equal(states.at(-1)?.displayName, "Member A");
    assert.equal(renderMemberControl(states.at(-1)).label, "Member A");

    const formData = new FormData();
    const actions = h.load("app/account/actions.ts");
    let saved;
    if (kind === "display name") {
      formData.set("displayName", "Updated Identity");
      formData.set("bio", "");
      saved = await actions.updateProfileIdentityAction({ status: "idle" }, formData);
    } else if (kind === "username capitalization") {
      formData.set("username", "MEMBER_A");
      saved = await actions.correctUsernameCapitalizationAction({ status: "idle" }, formData);
    } else {
      assert.equal(states.at(-1).avatarVersion, "avatar-before");
      formData.set("operation", "remove");
      saved = await actions.updateAvatarAction({ status: "idle" }, formData);
    }
    assert.equal(saved.status, "success");
    assert.equal(reads, 1, "server save alone has not refreshed the client snapshot");
    const form = loadClient(kind === "avatar removal" ? "app/account/components/avatar-form.tsx" : "app/account/components/profile-identity-form.tsx").default;
    // Run the actual form's success effects, not a test-generated refresh signal.
    actionStates = kind === "username capitalization" ? [{ status: "idle" }, saved] : [saved, { status: "idle" }];
    form({ username: "Member_A", displayName: "Member A", bio: null, capitalizationCorrectionAvailable: true });
    effects.splice(0).forEach((effect) => effect());
    await settle();
    assert.equal(reads, 2);
    assert.equal(states.at(-1).username, kind === "username capitalization" ? "MEMBER_A" : "Member_A");
    if (kind === "avatar removal") assert.equal(states.at(-1).avatarVersion, null, "successful avatar change refreshes canonical header snapshot");
    assert.equal(states.at(-1).displayName, kind === "display name" ? "Updated Identity" : "Member A");
    const rendered = renderMemberControl(states.at(-1));
    assert.equal(rendered.label, kind === "display name" ? "Updated Identity" : "Member A");
    assert.equal(rendered.initials, kind === "display name" ? "UI" : "MA");
    assert.equal(rendered.identityCopy.props.children[1].props.children.join(""), kind === "username capitalization" ? "@MEMBER_A" : "@Member_A");
    actionStates = [{ status: "error" }, { status: "idle" }];
    form({ username: "Member_A", displayName: "Member A", bio: null, capitalizationCorrectionAvailable: true });
    effects.splice(0).forEach((effect) => effect());
    await settle();
    assert.equal(reads, 2, "failed saves must not announce a successful identity update");
    cleanup();
  });
}
