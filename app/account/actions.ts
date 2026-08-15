"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  ProfileActionField,
  ProfileActionState,
} from "@/app/account/action-state";
import { memberRoute, ROUTES } from "@/constants/routes";
import {
  parseHeritageCountryIds,
  validateBio,
  validateCityTown,
} from "@/lib/account/profile";
import { resolveAccountState, type AccountState } from "@/lib/account/state";
import {
  isCapitalizationOnlyCorrection,
  validateDisplayName,
  validateUsername,
} from "@/lib/account/username";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const ACCOUNT_UNAVAILABLE: ProfileActionState = {
  status: "error",
  message: "Profile access is temporarily unavailable. Please try again.",
};

function fieldError(field: ProfileActionField, message: string): ProfileActionState {
  return { status: "error", field, message };
}

async function validateCountries(
  countryIds: readonly string[],
  supabase: SupabaseServerClient,
  field: ProfileActionField
): Promise<ProfileActionState | null> {
  const uniqueCountryIds = [...new Set(countryIds.filter(Boolean))];
  if (uniqueCountryIds.length === 0) return null;

  const { data, error } = await supabase
    .from("countries")
    .select("id")
    .in("id", uniqueCountryIds);

  if (error) return ACCOUNT_UNAVAILABLE;
  if ((data ?? []).length !== uniqueCountryIds.length) {
    return fieldError(field, "Choose countries from the SkillAtlas country catalogue.");
  }

  return null;
}

function databaseProfileError(
  error: { code?: string },
  fallbackField?: ProfileActionField
): ProfileActionState {
  if (error.code === "23505") {
    return fieldError("username", "That username is already in use. Choose another.");
  }

  if (error.code === "23503") {
    return fieldError(
      fallbackField ?? "representingCountry",
      "Choose countries from the SkillAtlas country catalogue."
    );
  }

  if (error.code === "22023") {
    return fieldError(
      "username",
      "Only one capitalization-only username correction is available."
    );
  }

  return ACCOUNT_UNAVAILABLE;
}

type CompleteAccountState = Extract<AccountState, { status: "profile_complete" }>;

async function getProfileAccount(): Promise<
  | { ok: false; state: ProfileActionState }
  | { ok: true; account: CompleteAccountState; supabase: SupabaseServerClient }
> {
  let supabase: SupabaseServerClient;

  try {
    supabase = await createClient();
  } catch {
    return { ok: false, state: ACCOUNT_UNAVAILABLE };
  }

  const account = await resolveAccountState(supabase);
  if (account.status === "signed_out") redirect(ROUTES.authSignIn);
  if (account.status !== "profile_complete") {
    return { ok: false, state: ACCOUNT_UNAVAILABLE };
  }

  return { ok: true, account, supabase };
}

export async function createProfileAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const usernameResult = validateUsername(String(formData.get("username") ?? ""));
  if (!usernameResult.valid) return fieldError("username", usernameResult.message);

  const representingCountryId = String(formData.get("representingCountryId") ?? "");
  let supabase: SupabaseServerClient;

  try {
    supabase = await createClient();
  } catch {
    return ACCOUNT_UNAVAILABLE;
  }

  const account = await resolveAccountState(supabase);
  if (account.status === "signed_out") redirect(ROUTES.authSignIn);
  if (account.status === "profile_complete") {
    return { status: "error", message: "Your member profile already exists." };
  }
  if (account.status !== "profile_incomplete") return ACCOUNT_UNAVAILABLE;

  try {
    const countryError = await validateCountries(
      [representingCountryId],
      supabase,
      "representingCountry"
    );
    if (countryError) return countryError;

    const { error } = await supabase.from("profiles").insert({
      id: account.userId,
      username: usernameResult.value,
      display_name: usernameResult.value,
      representing_country_id: representingCountryId || null,
    });

    if (error) return databaseProfileError(error, "representingCountry");
  } catch {
    return ACCOUNT_UNAVAILABLE;
  }

  const publicProfileRoute = memberRoute(usernameResult.value);
  revalidatePath(ROUTES.account);
  revalidatePath(publicProfileRoute);
  redirect(publicProfileRoute);
}

export async function updateProfileIdentityAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const displayNameResult = validateDisplayName(String(formData.get("displayName") ?? ""));
  if (!displayNameResult.valid) {
    return fieldError("displayName", displayNameResult.message);
  }

  const bioResult = validateBio(String(formData.get("bio") ?? ""));
  if (!bioResult.valid) return fieldError("bio", bioResult.message);

  const result = await getProfileAccount();
  if (!result.ok) return result.state;

  try {
    const { error } = await result.supabase
      .from("profiles")
      .update({ display_name: displayNameResult.value, bio: bioResult.value })
      .eq("id", result.account.userId);

    if (error) return databaseProfileError(error);

    revalidatePath(ROUTES.account);
    revalidatePath(memberRoute(result.account.profile.username));
    return { status: "success", message: "Profile identity updated." };
  } catch {
    return ACCOUNT_UNAVAILABLE;
  }
}

export async function correctUsernameCapitalizationAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const usernameResult = validateUsername(String(formData.get("username") ?? ""));
  if (!usernameResult.valid) return fieldError("username", usernameResult.message);

  const result = await getProfileAccount();
  if (!result.ok) return result.state;

  const currentUsername = result.account.profile.username;
  if (!result.account.profile.usernameCaseCorrectionAvailable) {
    return fieldError("username", "Your one-time capitalization correction is no longer available.");
  }
  if (!isCapitalizationOnlyCorrection(currentUsername, usernameResult.value)) {
    return fieldError(
      "username",
      `Only capitalization may change. Keep the same letters, numbers, and underscores as @${currentUsername}.`
    );
  }

  try {
    const { error } = await result.supabase
      .from("profiles")
      .update({ username: usernameResult.value })
      .eq("id", result.account.userId);

    if (error) return databaseProfileError(error);

    revalidatePath(ROUTES.account);
    revalidatePath(memberRoute(currentUsername));
    revalidatePath(memberRoute(usernameResult.value));
    return { status: "success", message: "Username capitalization corrected." };
  } catch {
    return ACCOUNT_UNAVAILABLE;
  }
}

export async function updateCountryIdentityAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const representingCountryId = String(formData.get("representingCountryId") ?? "");
  const birthCountryId = String(formData.get("birthCountryId") ?? "");
  const residenceCountryId = String(formData.get("residenceCountryId") ?? "");
  const cityTownResult = validateCityTown(String(formData.get("cityTown") ?? ""));
  if (!cityTownResult.valid) return fieldError("cityTown", cityTownResult.message);

  const heritageResult = parseHeritageCountryIds(formData.get("heritageCountryIds"));
  if (!heritageResult.valid) return fieldError("heritage", heritageResult.message);

  const result = await getProfileAccount();
  if (!result.ok) return result.state;

  try {
    const countryError = await validateCountries(
      [
        representingCountryId,
        birthCountryId,
        residenceCountryId,
        ...heritageResult.value,
      ],
      result.supabase,
      "heritage"
    );
    if (countryError) return countryError;

    const { error } = await result.supabase.rpc("update_profile_country_identity", {
      p_representing_country_id: representingCountryId,
      p_birth_country_id: birthCountryId,
      p_residence_country_id: residenceCountryId,
      p_city_town: cityTownResult.value ?? "",
      p_birth_country_is_public: Boolean(birthCountryId && formData.has("birthCountryIsPublic")),
      p_residence_country_is_public: Boolean(
        residenceCountryId && formData.has("residenceCountryIsPublic")
      ),
      p_city_town_is_public: Boolean(cityTownResult.value && formData.has("cityTownIsPublic")),
      p_heritage_is_public: Boolean(
        heritageResult.value.length > 0 && formData.has("heritageIsPublic")
      ),
      p_heritage_country_ids: heritageResult.value,
    });

    if (error) return databaseProfileError(error, "heritage");

    revalidatePath(ROUTES.account);
    revalidatePath(memberRoute(result.account.profile.username));
    return { status: "success", message: "Country identity updated." };
  } catch {
    return ACCOUNT_UNAVAILABLE;
  }
}
