"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProfileActionState } from "@/app/account/action-state";
import { memberRoute, ROUTES } from "@/constants/routes";
import { resolveAccountState } from "@/lib/account/state";
import { validateDisplayName, validateUsername } from "@/lib/account/username";
import { createClient } from "@/lib/supabase/server";

const ACCOUNT_UNAVAILABLE: ProfileActionState = {
  status: "error",
  message: "Account access is temporarily unavailable. Please try again.",
};

async function validateCountry(
  countryId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<ProfileActionState | null> {
  if (!countryId) return null;

  const { data, error } = await supabase
    .from("countries")
    .select("id")
    .eq("id", countryId)
    .maybeSingle();

  if (error) return ACCOUNT_UNAVAILABLE;
  if (!data) {
    return {
      status: "error",
      field: "country",
      message: "Choose a country from the SkillAtlas country catalogue.",
    };
  }

  return null;
}

function databaseProfileError(error: { code?: string }): ProfileActionState {
  if (error.code === "23505") {
    return {
      status: "error",
      field: "username",
      message: "That username is already in use. Choose another.",
    };
  }

  if (error.code === "23503") {
    return {
      status: "error",
      field: "country",
      message: "Choose a country from the SkillAtlas country catalogue.",
    };
  }

  return ACCOUNT_UNAVAILABLE;
}

export async function createProfileAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const usernameResult = validateUsername(String(formData.get("username") ?? ""));
  if (!usernameResult.valid) {
    return { status: "error", field: "username", message: usernameResult.message };
  }

  const countryId = String(formData.get("countryId") ?? "");
  let supabase: Awaited<ReturnType<typeof createClient>>;

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
    const countryError = await validateCountry(countryId, supabase);
    if (countryError) return countryError;

    const { error } = await supabase.from("profiles").insert({
      id: account.userId,
      username: usernameResult.value,
      display_name: usernameResult.value,
      country_id: countryId || null,
    });

    if (error) return databaseProfileError(error);
  } catch {
    return ACCOUNT_UNAVAILABLE;
  }

  revalidatePath(ROUTES.account);
  redirect(ROUTES.account);
}

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const displayNameResult = validateDisplayName(String(formData.get("displayName") ?? ""));
  if (!displayNameResult.valid) {
    return { status: "error", field: "displayName", message: displayNameResult.message };
  }

  const countryId = String(formData.get("countryId") ?? "");
  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch {
    return ACCOUNT_UNAVAILABLE;
  }

  const account = await resolveAccountState(supabase);
  if (account.status === "signed_out") redirect(ROUTES.authSignIn);
  if (account.status !== "profile_complete") return ACCOUNT_UNAVAILABLE;

  try {
    const countryError = await validateCountry(countryId, supabase);
    if (countryError) return countryError;

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayNameResult.value, country_id: countryId || null })
      .eq("id", account.userId);

    if (error) return databaseProfileError(error);

    revalidatePath(ROUTES.account);
    revalidatePath(memberRoute(account.profile.username));

    return { status: "success", message: "Member profile updated." };
  } catch {
    return ACCOUNT_UNAVAILABLE;
  }
}
