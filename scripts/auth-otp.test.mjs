import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const requireDependency = createRequire(import.meta.url);
const idle = { status: "idle", message: "" };
const expired = { status: "error", field: "token", message: "That access code is invalid or has expired. Use the newest code, or request a new one." };
const sent = { status: "success", message: "A new access code has been sent. Check your email." };
const formData = (entries) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

function load(file, resolve) {
  const mod = { exports: {} };
  const code = ts.transpileModule(readFileSync(`${root}${file}`, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, {
    module: mod, exports: mod.exports, URL,
    process: { env: { NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321", NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-public-key" } },
    require: resolve,
  });
  return mod.exports;
}

// Real installed SDK + application server actions, with a local-only HTTP
// fixture. No live emails, tokens, accounts or hosted services are used.
function serverFixture({ verifyError = null, sendError = null } = {}) {
  const cookies = new Map();
  const writes = [];
  const requests = [];
  const cache = new Map();
  const cookieStore = {
    get: (name) => cookies.has(name) ? { value: cookies.get(name) } : undefined,
    getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
    set: (name, value, options) => {
      writes.push({ name, options });
      if (options?.maxAge === 0) cookies.delete(name);
      else cookies.set(name, value);
    },
  };
  function module(file) {
    if (!cache.has(file)) cache.set(file, load(file, (name) => {
      if (name === "next/headers") return { cookies: async () => cookieStore };
      if (name === "next/navigation") return { redirect: (url) => { throw new Error(`redirect:${url}`); } };
      if (name === "@supabase/ssr") return {
        createServerClient: (url, key, options) => requireDependency(name).createServerClient(url, key, {
          ...options,
          global: { fetch: async (input, init) => {
            const url = new URL(String(input));
            assert.equal(url.origin, "http://localhost:54321");
            const body = JSON.parse(init.body);
            requests.push({ path: url.pathname, body });
            assert.ok(["/auth/v1/otp", "/auth/v1/verify"].includes(url.pathname));
            const error = url.pathname.endsWith("/verify") ? verifyError : sendError;
            return new Response(JSON.stringify(error ? { code: error.code, msg: error.message } : {}), {
              status: error?.status ?? 200, headers: { "Content-Type": "application/json", "X-Supabase-Api-Version": "2024-01-01" },
            });
          } },
        }),
      };
      return name.startsWith("@/") ? module(`${name.slice(2)}.ts`) : requireDependency(name);
    }));
    return cache.get(file);
  }
  return { actions: module("app/auth/actions.ts"), cookies, writes, requests };
}

for (const flow of ["sign-in", "sign-up"]) {
  test(`${flow}: one action sends once; resend uses the same email/flow and respects cooldown`, async () => {
    const h = serverFixture();
    const action = flow === "sign-in" ? h.actions.requestSignInCodeAction : h.actions.requestSignUpCodeAction;
    await assert.rejects(action(idle, formData({ email: " Member@Example.invalid " })), /redirect:\/auth\/verify\?requested=1/);
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].body.email, "member@example.invalid");
    assert.equal(h.requests[0].body.create_user, flow === "sign-up");
    assert.equal(h.cookies.get("skillatlas-auth-email"), "member@example.invalid");
    const limited = await h.actions.resendCodeAction(idle, new FormData());
    assert.equal(limited.status, "error");
    assert.equal(h.requests.length, 1, "cooldown does not call Supabase");
    h.cookies.set("skillatlas-auth-resend-after", "0");
    const resent = await h.actions.resendCodeAction(expired, new FormData());
    assert.equal(resent.status, "success");
    assert.equal(h.requests.length, 2, "one accepted resend makes exactly one SDK request");
    assert.equal(h.requests[1].body.email, h.requests[0].body.email);
    assert.equal(h.requests[1].body.create_user, flow === "sign-up");
    assert.ok(h.writes.every(({ options }) => options.httpOnly && options.secure && options.sameSite === "lax"));
  });
}

test("verification preserves all eight digits and uses cookie email with type=email", async () => {
  const h = serverFixture({ verifyError: { status: 403, code: "otp_expired", message: "token has expired or is invalid" } });
  h.cookies.set("skillatlas-auth-email", "member@example.invalid");
  const result = await h.actions.verifyCodeAction(idle, formData({ token: " 0123 4567 ", email: "wrong@example.invalid" }));
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].body.email, "member@example.invalid");
  assert.equal(h.requests[0].body.type, "email");
  assert.equal(h.requests[0].body.token, "01234567");
  assert.equal(result.message, expired.message, "does not claim ambiguous invalid-token error proves expiry");
});

test("malformed codes are rejected without a verification request", async () => {
  const h = serverFixture();
  h.cookies.set("skillatlas-auth-email", "member@example.invalid");
  for (const token of ["123456", "123456789", "abcdefgh"]) {
    assert.equal((await h.actions.verifyCodeAction(idle, formData({ token }))).status, "error");
  }
  assert.equal(h.requests.length, 0);
});

test("provider send rate-limit remains an error rather than successful resend", async () => {
  const h = serverFixture({ sendError: { status: 429, code: "over_email_send_rate_limit", message: "Please wait" } });
  h.cookies.set("skillatlas-auth-email", "member@example.invalid");
  h.cookies.set("skillatlas-auth-flow", "sign-in");
  assert.match((await h.actions.resendCodeAction(idle, new FormData())).message, /Please wait/);
  assert.equal(h.requests.length, 1);
});

// Deterministic React hook lifecycle driver around the real form JSX. The
// server-action boundary is deferred to inspect pending/duplicate events.
function formFixture(file, actions) {
  const refs = [];
  let cursor = 0;
  let state;
  let pending = false;
  let callback;
  let effects = [];
  const component = load(file, (name) => {
    if (name === "react") return {
      useRef: (initial) => refs[cursor++] ?? (refs[cursor - 1] = { current: initial }),
      useEffect: (effect) => effects.push(effect),
      useActionState: (action, initial) => {
        state ??= initial;
        callback = action;
        return [state, async (data) => {
          pending = true;
          try { state = await callback(state, data); } finally { pending = false; }
        }, pending];
      },
    };
    if (name === "react/jsx-runtime") return requireDependency(name);
    if (name === "react-dom") return { useFormStatus: () => ({ pending }) };
    if (name === "@/app/auth/actions") return actions;
    if (name === "@/app/auth/action-state") return { INITIAL_AUTH_ACTION_STATE: idle };
    if (name === "@/lib/auth/otp") return { OTP_LENGTH: 8 };
    if (name === "@/constants/routes") return { ROUTES: {} };
    return { default: "fixture-child" };
  }).default;
  function render() {
    cursor = 0;
    effects = [];
    const tree = component({ maskedEmail: "m•••@example.invalid", flow: "sign-in", requested: true, configurationAvailable: true });
    const nodes = [];
    const visit = (node) => {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node?.props) return;
      nodes.push(node);
      visit(node.props.children);
    };
    visit(tree);
    const input = nodes.find((node) => node.props.id === "verification-code");
    if (input && !input.props.ref.current) input.props.ref.current = { value: "01234567", focus() {} };
    effects.forEach((effect) => effect());
    return { nodes, forms: nodes.filter((node) => node.type === "form"), input,
      messages: nodes.filter((node) => node.props["aria-live"]).map((node) => node.props.children).filter(Boolean),
    };
  }
  function submit(form, data) {
    let prevented = false;
    form.props.onSubmit({ preventDefault: () => { prevented = true; } });
    return prevented ? null : form.props.action(data);
  }
  return { render, submit };
}

test("expired → resend pending → success clears error, aria-invalid and old code; blocks concurrent actions", async () => {
  let sends = 0;
  let resolve;
  const h = formFixture("app/auth/components/verify-code-form.tsx", {
    verifyCodeAction: async () => expired,
    resendCodeAction: () => { sends++; return new Promise((done) => { resolve = done; }); },
  });
  await h.submit(h.render().forms[0], formData({ intent: "verify", token: "01234567" }));
  let view = h.render();
  assert.equal(view.input.props["aria-invalid"], true);
  assert.deepEqual(view.messages, [expired.message]);
  const request = h.submit(view.forms[1], formData({ intent: "resend" }));
  assert.equal(h.submit(view.forms[1], formData({ intent: "resend" })), null, "same-render double click is blocked synchronously");
  assert.equal(h.submit(view.forms[0], formData({ intent: "verify" })), null, "verify cannot race resend");
  view = h.render();
  assert.deepEqual(view.messages, [], "stale error clears while resend is pending");
  assert.equal(view.input.props["aria-invalid"], false);
  assert.ok(view.forms.every((form) => form.props["aria-busy"]));
  assert.ok(view.nodes.filter((node) => node.props.pendingLabel || node.props.disabled !== undefined).every((node) => node.props.disabled));
  resolve(sent);
  await request;
  view = h.render();
  assert.deepEqual(view.messages, [sent.message]);
  assert.equal(view.input.props["aria-invalid"], false);
  assert.equal(view.input.props.ref.current.value, "");
  assert.equal(sends, 1);
  // A new verification result replaces resend success rather than coexisting.
  await h.submit(view.forms[0], formData({ intent: "verify", token: "01234567" }));
  assert.deepEqual(h.render().messages, [expired.message]);
});

test("initial request form blocks double submission before pending rerender", async () => {
  let sends = 0;
  let resolve;
  const h = formFixture("app/auth/components/auth-request-form.tsx", {
    requestSignInCodeAction: () => { sends++; return new Promise((done) => { resolve = done; }); },
  });
  const form = h.render().forms[0];
  const request = h.submit(form, formData({ email: "member@example.invalid" }));
  assert.equal(h.submit(form, formData({ email: "member@example.invalid" })), null);
  assert.equal(sends, 1);
  assert.equal(h.render().forms[0].props["aria-busy"], true);
  resolve({ status: "error", message: "Please wait" });
  await request;
  assert.equal(h.render().forms[0].props["aria-busy"], false);
});
