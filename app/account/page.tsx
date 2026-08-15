import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { accountCountryOptions } from "@/app/account/country-options";
import AccountUnavailable from "@/app/account/components/account-unavailable";
import CountryIdentityForm from "@/app/account/components/country-identity-form";
import ProfileIdentityForm from "@/app/account/components/profile-identity-form";
import { signOutAction } from "@/app/auth/actions";
import AuthShell from "@/app/auth/components/auth-shell";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import { memberRoute, ROUTES } from "@/constants/routes";
import { resolveAccountState } from "@/lib/account/state";

export const metadata: Metadata = {
  title: "Profile | SkillAtlas",
  description: "Manage your private SkillAtlas profile settings and public identity.",
};

export const dynamic = "force-dynamic";

type AccountPageProps = { searchParams: Promise<{ authError?: string }> };

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const account = await resolveAccountState();

  if (account.status === "signed_out") redirect(ROUTES.authSignIn);
  if (account.status === "error") {
    return <AccountUnavailable configurationMissing={account.reason === "configuration"} />;
  }

  const signOutFailed = (await searchParams).authError === "sign-out";

  if (account.status === "profile_incomplete") {
    return (
      <AuthShell
        title="Profile"
        description="Your verified account is active. Create a public member identity when you're ready to participate in SkillAtlas community features."
        footer="A missing profile is a valid account state. Public SkillAtlas browsing remains available."
      >
        <div className="space-y-sa-4">
          <div className="rounded-sa-control border border-sa-border-active bg-sa-accent/8 px-sa-3 py-sa-3">
            <DataLabel as="p" className="text-sa-accent">Profile incomplete</DataLabel>
            <p className="mt-sa-1 text-sm leading-6 text-sa-text-muted">
              Choose an immutable public username and, optionally, the country you represent.
            </p>
          </div>
          <Link
            href={ROUTES.accountOnboarding}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-sa-control border border-sa-border-active bg-sa-accent px-sa-4 text-sm font-black text-slate-950 outline-none transition-colors duration-200 ease-sa-standard hover:bg-[#35e1dd] focus-visible:ring-4 focus-visible:ring-sa-accent/25"
          >
            Create member profile
          </Link>
          <SignOutForm failed={signOutFailed} />
        </div>
      </AuthShell>
    );
  }

  const profile = account.profile;

  return (
    <AuthShell
      title="Profile"
      description="Manage your public identity, country identity, and privacy controls. Private fields remain owner-only unless you explicitly make them public."
      contentClassName="max-w-[980px]"
      bare
      footer={
        <span>
          Public identity: {" "}
          <Link
            href={memberRoute(profile.username)}
            className="font-bold text-sa-accent outline-none hover:text-sa-text-primary focus-visible:rounded-sa-sm focus-visible:ring-2 focus-visible:ring-sa-accent"
          >
            /members/{profile.username}
          </Link>
        </span>
      }
    >
      <div className="space-y-sa-4">
        <IntelligencePanel
          as="section"
          header={
            <div>
              <DataLabel as="h2" className="text-sa-accent">Profile / Identity</DataLabel>
              <p className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
                Public name, case-preserved username, and short member bio.
              </p>
            </div>
          }
          bodyClassName="px-sa-4 py-sa-4 sm:px-sa-5"
        >
          <ProfileIdentityForm
            username={profile.username}
            displayName={profile.displayName}
            bio={profile.bio}
            capitalizationCorrectionAvailable={profile.usernameCaseCorrectionAvailable}
          />
        </IntelligencePanel>

        <IntelligencePanel
          as="section"
          header={
            <div>
              <DataLabel as="h2" className="text-sa-accent">Country Identity</DataLabel>
              <p className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
                Representing is public. Born, Lives In, City / Town, and Heritage are private by default.
              </p>
            </div>
          }
          bodyClassName="px-sa-4 py-sa-4 sm:px-sa-5"
        >
          <CountryIdentityForm
            key={profile.updatedAt}
            countries={accountCountryOptions}
            representingCountryId={profile.representingCountryId}
            birthCountryId={profile.birthCountryId}
            birthCountryIsPublic={profile.birthCountryIsPublic}
            residenceCountryId={profile.residenceCountryId}
            residenceCountryIsPublic={profile.residenceCountryIsPublic}
            cityTown={profile.cityTown}
            cityTownIsPublic={profile.cityTownIsPublic}
            heritageCountryIds={profile.heritageCountries.map((country) => country.id)}
            heritageIsPublic={profile.heritageIsPublic}
          />
        </IntelligencePanel>

        <IntelligencePanel
          as="section"
          header={<DataLabel as="h2" className="text-sa-accent">Account / Privacy</DataLabel>}
          bodyClassName="px-sa-4 py-sa-4 sm:px-sa-5"
        >
          <div className="grid gap-sa-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="text-sm font-bold text-sa-text-primary">Verified account active</p>
              <p className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
                Private country fields are available only to you. Public member views use an explicit privacy-filtered projection.
              </p>
            </div>
            <span className="inline-flex min-h-8 w-fit items-center rounded-sa-sm border border-sa-border-active bg-sa-accent/10 px-sa-2 text-[10px] font-black uppercase tracking-[0.12em] text-sa-accent">
              Profile complete
            </span>
          </div>
          <SignOutForm failed={signOutFailed} />
        </IntelligencePanel>
      </div>
    </AuthShell>
  );
}

function SignOutForm({ failed }: { failed: boolean }) {
  return (
    <div className="mt-sa-4 border-t border-sa-border-subtle pt-sa-4">
      {failed ? (
        <p role="alert" className="mb-sa-2 text-sm leading-5 text-sa-negative">
          We couldn&apos;t sign you out. Please try again.
        </p>
      ) : null}
      <form action={signOutAction}>
        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-sa-control border border-sa-border-strong bg-sa-surface-2 px-sa-4 text-sm font-bold text-sa-text-primary outline-none transition-colors duration-200 ease-sa-standard hover:border-sa-border-active hover:text-sa-accent focus-visible:ring-4 focus-visible:ring-sa-accent/20"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
