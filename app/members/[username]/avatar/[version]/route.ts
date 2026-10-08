import { getPublicMemberProfile } from "@/lib/account/public-profile";
import { AVATAR_BUCKET, avatarStoragePath } from "@/lib/account/avatar";
import { processAvatar } from "@/lib/account/avatar-processing";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(_request: Request, context: { params: Promise<{ username: string; version: string }> }) {
  const { username, version } = await context.params;
  try {
    const result = await getPublicMemberProfile(username);
    if (result.status !== "found" || result.profile.avatarVersion !== version) {
      return new Response(null, { status: 404, headers });
    }
    const supabase = await createClient();
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarStoragePath(result.profile.username));
    const response = await fetch(`${data.publicUrl}?v=${encodeURIComponent(version)}`, { cache: "no-store" });
    if (!response.ok) return new Response(null, { status: 404, headers });
    // Also validate direct owner Storage API writes; never serve arbitrary bytes.
    const image = await processAvatar(await response.blob());
    return new Response(new Uint8Array(image), { headers: { ...headers, "Content-Type": "image/webp" } });
  } catch { return new Response(null, { status: 404, headers }); }
}
