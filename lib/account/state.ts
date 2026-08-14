import "server-only";

import type { User } from "@supabase/supabase-js";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type MemberCountry = {
  id: string;
  iso2: string;
  name: string;
  region: string;
};

export type MemberProfile = {
  id: string;
  username: string;
  displayName: string;
  countryId: string | null;
  country: MemberCountry | null;
  createdAt: string;
  updatedAt: string;
};

type AuthenticatedAccount = {
  userId: string;
};

export type AccountState =
  | { status: "signed_out" }
  | ({ status: "profile_incomplete" } & AuthenticatedAccount)
  | ({ status: "profile_complete"; profile: MemberProfile } & AuthenticatedAccount)
  | { status: "error"; reason: "configuration" | "auth" | "profile" };

function isMissingSession(user: User | null, error: { name?: string; status?: number } | null) {
  return (
    !user &&
    (!error || error.name === "AuthSessionMissingError" || error.status === 401)
  );
}

export async function resolveAccountState(client?: SupabaseServerClient): Promise<AccountState> {
  try {
    const supabase = client ?? (await createClient());
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (isMissingSession(authData.user, authError)) return { status: "signed_out" };
    if (authError || !authData.user) return { status: "error", reason: "auth" };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name, country_id, created_at, updated_at, country:countries(id, iso2, name, region)"
      )
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) return { status: "error", reason: "profile" };
    if (!profile) return { status: "profile_incomplete", userId: authData.user.id };

    return {
      status: "profile_complete",
      userId: authData.user.id,
      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        countryId: profile.country_id,
        country: profile.country,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
    };
  } catch (error) {
    return {
      status: "error",
      reason: error instanceof SupabaseConfigurationError ? "configuration" : "auth",
    };
  }
}
