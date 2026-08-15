import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { accountCountryOptions } from "@/app/account/country-options";
import AccountUnavailable from "@/app/account/components/account-unavailable";
import ProfileForm from "@/app/account/components/profile-form";
import AuthShell from "@/app/auth/components/auth-shell";
import { ROUTES } from "@/constants/routes";
import { resolveAccountState } from "@/lib/account/state";

export const metadata: Metadata = {
  title: "Create Member Profile | SkillAtlas",
  description: "Choose the public identity used across SkillAtlas community features.",
};

export const dynamic = "force-dynamic";

export default async function AccountOnboardingPage() {
  const account = await resolveAccountState();

  if (account.status === "signed_out") redirect(ROUTES.authSignIn);
  if (account.status === "profile_complete") redirect(ROUTES.account);
  if (account.status === "error") {
    return <AccountUnavailable configurationMissing={account.reason === "configuration"} />;
  }

  return (
    <AuthShell
      title="Create Your Profile"
      description="Choose the public identity you'll use across SkillAtlas community features."
      footer="A member profile is required only for future community participation. Public browsing remains available without one."
    >
      <ProfileForm countries={accountCountryOptions} />
    </AuthShell>
  );
}
