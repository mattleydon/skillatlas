import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { accountCountryOptions } from "@/app/account/country-options";
import AccountUnavailable from "@/app/account/components/account-unavailable";
import ProfileForm from "@/app/account/components/profile-form";
import { signOutAction } from "@/app/auth/actions";
import AuthShell from "@/app/auth/components/auth-shell";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import { memberRoute, ROUTES } from "@/constants/routes";
import { resolveAccountState } from "@/lib/account/state";

export const metadata: Metadata = {
  title: "Account | SkillAtlas",
  description: "Authenticated SkillAtlas account state.",
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
        title="Your Account"
        description="Your verified account is active. Create a member profile when you're ready to participate in SkillAtlas community features."
        footer="A missing profile is a valid account state. Public SkillAtlas browsing remains available."
      >
        <div className="space-y-sa-4">
          <div className="rounded-sa-control border border-sa-border-active bg-sa-accent/8 px-sa-3 py-sa-3">
            <DataLabel as="p" className="text-sa-accent">Profile incomplete</DataLabel>
            <p className="mt-sa-1 text-sm leading-6 text-sa-text-muted">
              Choose an immutable public username and, optionally, a country.
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

  return (
    <AuthShell
      title="Your Account"
      description="Manage the approved public fields on your SkillAtlas member profile."
      footer={
        <span>
          Public profile: {" "}
          <Link
            href={memberRoute(account.profile.username)}
            className="font-bold text-sa-accent outline-none hover:text-sa-text-primary focus-visible:rounded-sa-sm focus-visible:ring-2 focus-visible:ring-sa-accent"
          >
            /members/{account.profile.username}
          </Link>
        </span>
      }
    >
      <div className="space-y-sa-4">
        <div className="grid gap-sa-3 rounded-sa-control border border-sa-border-subtle bg-sa-surface-inset px-sa-3 py-sa-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <DataLabel as="p" className="text-sa-accent">
              Member profile
            </DataLabel>
            <p className="mt-sa-1 truncate text-sm font-bold text-sa-text-primary">
              @{account.profile.username}
            </p>
          </div>
          <span className="inline-flex min-h-8 w-fit items-center rounded-sa-sm border border-sa-border-active bg-sa-accent/10 px-sa-2 text-[10px] font-black uppercase tracking-[0.12em] text-sa-accent">
            Profile complete
          </span>
        </div>
        <ProfileForm
          mode="edit"
          countries={accountCountryOptions}
          username={account.profile.username}
          displayName={account.profile.displayName}
          countryId={account.profile.countryId}
        />
        <Link
          href={memberRoute(account.profile.username)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-sa-control border border-sa-border-active bg-sa-accent/8 px-sa-4 text-sm font-bold text-sa-accent outline-none transition-colors duration-200 ease-sa-standard hover:bg-sa-accent/14 hover:text-sa-text-primary focus-visible:ring-4 focus-visible:ring-sa-accent/20"
        >
          View public profile
        </Link>
        <SignOutForm failed={signOutFailed} />
      </div>
    </AuthShell>
  );
}

function SignOutForm({ failed }: { failed: boolean }) {
  return (
    <div className="border-t border-sa-border-subtle pt-sa-4">
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
