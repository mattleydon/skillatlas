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

export type MemberHeritageCountry = MemberCountry & {
  position: number;
};

export type MemberProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  representingCountryId: string | null;
  representingCountry: MemberCountry | null;
  birthCountryId: string | null;
  birthCountry: MemberCountry | null;
  birthCountryIsPublic: boolean;
  residenceCountryId: string | null;
  residenceCountry: MemberCountry | null;
  residenceCountryIsPublic: boolean;
  cityTown: string | null;
  cityTownIsPublic: boolean;
  heritageIsPublic: boolean;
  heritageCountries: MemberHeritageCountry[];
  usernameCaseCorrectionAvailable: boolean;
  usernameCaseCorrectedAt: string | null;
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

    const [profileResult, heritageResult] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, username, display_name, bio, representing_country_id, birth_country_id, residence_country_id, city_town, birth_country_is_public, residence_country_is_public, city_town_is_public, heritage_is_public, username_case_correction_available, username_case_corrected_at, created_at, updated_at, representing_country:countries!profiles_representing_country_id_fkey(id, iso2, name, region), birth_country:countries!profiles_birth_country_id_fkey(id, iso2, name, region), residence_country:countries!profiles_residence_country_id_fkey(id, iso2, name, region)"
        )
        .eq("id", authData.user.id)
        .maybeSingle(),
      supabase
        .from("profile_heritage_countries")
        .select(
          "position, country:countries!profile_heritage_countries_country_id_fkey(id, iso2, name, region)"
        )
        .eq("profile_id", authData.user.id)
        .order("position", { ascending: true }),
    ]);

    const { data: profile, error: profileError } = profileResult;
    const { data: heritageRows, error: heritageError } = heritageResult;

    if (profileError || heritageError) return { status: "error", reason: "profile" };
    if (!profile) return { status: "profile_incomplete", userId: authData.user.id };

    return {
      status: "profile_complete",
      userId: authData.user.id,
      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        bio: profile.bio,
        representingCountryId: profile.representing_country_id,
        representingCountry: profile.representing_country,
        birthCountryId: profile.birth_country_id,
        birthCountry: profile.birth_country,
        birthCountryIsPublic: profile.birth_country_is_public,
        residenceCountryId: profile.residence_country_id,
        residenceCountry: profile.residence_country,
        residenceCountryIsPublic: profile.residence_country_is_public,
        cityTown: profile.city_town,
        cityTownIsPublic: profile.city_town_is_public,
        heritageIsPublic: profile.heritage_is_public,
        heritageCountries: (heritageRows ?? []).map((row) => ({
          ...row.country,
          position: row.position,
        })),
        usernameCaseCorrectionAvailable: profile.username_case_correction_available,
        usernameCaseCorrectedAt: profile.username_case_corrected_at,
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
