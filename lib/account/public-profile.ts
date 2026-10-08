import "server-only";

import type { Json } from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import type { IdentityPlace } from "@/lib/account/identity-geography";

export type PublicMemberCountry = IdentityPlace;

export type PublicMemberHeritageCountry = PublicMemberCountry & {
  position: number;
};

export type PublicMemberProfile = {
  username: string;
  displayName: string;
  bio: string | null;
  avatarVersion: string | null;
  favouriteGameIds: string[] | null;
  platformIds: string[] | null;
  gamingSince: number | null;
  createdAt: string;
  representingCountry: PublicMemberCountry | null;
  birthCountry: PublicMemberCountry | null;
  residenceCountry: PublicMemberCountry | null;
  cityTown: string | null;
  heritageCountries: PublicMemberHeritageCountry[] | null;
};

export type PublicMemberResult =
  | { status: "found"; profile: PublicMemberProfile }
  | { status: "not_found" }
  | { status: "error" };

function isJsonObject(value: Json): value is { [key: string]: Json | undefined } {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseCountry(value: Json): PublicMemberCountry | null {
  if (!isJsonObject(value)) return null;
  const { id, name, region, flag_code: flagCode, place_type: kind, parent_country_id: parentCountryId } = value;

  if (
    typeof id !== "string" ||
    (flagCode !== null && typeof flagCode !== "string") ||
    (kind !== "sovereign_country" && kind !== "constituent_country") ||
    (parentCountryId !== null && typeof parentCountryId !== "string") ||
    typeof name !== "string" ||
    typeof region !== "string"
  ) {
    return null;
  }

  return { id, name, region, flagCode, kind, parentCountryId };
}

function parseHeritage(value: Json): PublicMemberHeritageCountry[] | null {
  if (value === null) return null;
  if (!Array.isArray(value)) return null;

  return value.flatMap((item) => {
    const country = parseCountry(item);
    if (!country || !isJsonObject(item) || typeof item.position !== "number") return [];
    return [{ ...country, position: item.position }];
  });
}

export async function getPublicMemberProfile(username: string): Promise<PublicMemberResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .rpc("get_public_member_profile", { p_username: username })
      .maybeSingle();

    if (error) return { status: "error" };
    if (!data) return { status: "not_found" };

    return {
      status: "found",
      profile: {
        username: data.username,
        displayName: data.display_name,
        bio: data.bio,
        avatarVersion: data.avatar_version,
        favouriteGameIds: data.favourite_game_ids,
        platformIds: data.platform_ids,
        gamingSince: data.gaming_since,
        createdAt: data.created_at,
        representingCountry: parseCountry(data.representing_country),
        birthCountry: parseCountry(data.birth_country),
        residenceCountry: parseCountry(data.residence_country),
        cityTown: data.city_town,
        heritageCountries: parseHeritage(data.heritage),
      },
    };
  } catch {
    return { status: "error" };
  }
}
