import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// Opt-in real local Storage/Auth test. Never reads hosted application credentials.
const localUrl = process.env.SKILLATLAS_LOCAL_TEST_URL;
const localAnon = process.env.SKILLATLAS_LOCAL_TEST_ANON_KEY;
const localService = process.env.SKILLATLAS_LOCAL_TEST_SERVICE_KEY;
test("local Storage API: owner upload/replace/remove, public bytes, cross-owner denial and account cleanup", {
  skip: !localUrl || !localAnon || !localService,
}, async () => {
  assert.equal(localUrl, "http://127.0.0.1:54321", "refuse any non-local test destination");
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(localUrl, localService, options);
  const anonymous = createClient(localUrl, localAnon, options);
  const accounts = [];
  const bucket = "member-avatars";
  try {
    for (let index = 0; index < 2; index++) {
      const username = `v2_${randomUUID().replaceAll("-", "").slice(0, 15)}`;
      const email = `${username}@example.test`;
      const password = randomUUID() + randomUUID();
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      assert.equal(error, null, "create local disposable account");
      const client = createClient(localUrl, localAnon, options);
      const account = { id: data.user.id, username, client, path: `${username}/avatar.webp` };
      accounts.push(account);
      assert.equal((await client.auth.signInWithPassword({ email, password })).error, null);
      assert.equal((await client.from("profiles").insert({ id: account.id, username, display_name: "Local Storage Test" })).error, null);
    }
    const [owner, other] = accounts;
    const image = await sharp({ create: { width: 512, height: 512, channels: 3, background: "#19d3cf" } }).webp().toBuffer();
    const uploadOptions = { contentType: "image/webp", cacheControl: "0", upsert: true };
    const ownerStorage = owner.client.storage.from(bucket);
    const otherStorage = other.client.storage.from(bucket);
    assert.equal((await ownerStorage.upload(owner.path, image, uploadOptions)).error, null, "owner upload");
    assert.equal((await ownerStorage.upload(owner.path, image, uploadOptions)).error, null, "owner replacement");
    assert.ok((await otherStorage.upload(owner.path, image, uploadOptions)).error, "other member replacement denied");
    assert.ok((await ownerStorage.upload(`${owner.username}/extra.webp`, image, uploadOptions)).error, "arbitrary extra path denied");
    assert.ok((await ownerStorage.upload(owner.path, Buffer.alloc(262145), uploadOptions)).error, "bucket size cap enforced");
    assert.ok((await ownerStorage.upload(owner.path, image, { ...uploadOptions, contentType: "image/png" })).error, "bucket MIME cap enforced");
    const publicUrl = ownerStorage.getPublicUrl(owner.path).data.publicUrl;
    const publicResponse = await fetch(publicUrl);
    assert.equal(publicResponse.status, 200, "anonymous image read");
    assert.equal((await sharp(Buffer.from(await publicResponse.arrayBuffer())).metadata()).format, "webp");
    assert.deepEqual((await anonymous.storage.from(bucket).list(owner.username)).data ?? [], [], "anonymous metadata listing hidden");
    const deniedRemoval = await otherStorage.remove([owner.path]);
    assert.ok(deniedRemoval.error || deniedRemoval.data.length === 0, "other member removes no objects");
    assert.equal((await ownerStorage.download(owner.path)).error, null, "other delete leaves object intact");
    assert.ok((await admin.auth.admin.deleteUser(owner.id)).error, "account deletion cannot orphan avatar");
    assert.equal((await ownerStorage.remove([owner.path])).error, null, "owner Storage API removal");
    assert.ok((await ownerStorage.download(owner.path)).error, "removed image no longer exists");
    assert.equal((await admin.auth.admin.deleteUser(owner.id)).error, null, "account deletion after cleanup");
    owner.deleted = true;
    assert.equal((await anonymous.rpc("get_public_member_profile", { p_username: owner.username })).data.length, 0);
  } finally {
    for (const account of accounts) {
      if (account.deleted) continue;
      const cleanup = await admin.storage.from(bucket).remove([account.path]);
      assert.equal(cleanup.error, null, "clean only this run's disposable avatar");
      assert.equal((await admin.auth.admin.deleteUser(account.id)).error, null, "clean only this run's disposable account");
    }
  }
});
