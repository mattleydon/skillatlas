import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import AuthShell from "@/app/auth/components/auth-shell";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import { ROUTES } from "@/constants/routes";
import { maskEmail } from "@/lib/auth/otp";
import { SupabaseConfigurationError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account | SkillAtlas",
  description: "Authenticated SkillAtlas account state.",
};

export const dynamic = "force-dynamic";

type AccountPageProps = {
  searchParams: Promise<{ authError?: string }>;
};

function AccountUnavailable({ configurationMissing = false }: { configurationMissing?: boolean }) {
  return (
    <AuthShell
      title="Account Unavailable"
      description="Public SkillAtlas pages remain available while account access is unavailable."
    >
      <div
        role="alert"
        className="rounded-sa-control border border-sa-negative/50 bg-sa-negative/8 px-sa-3 py-sa-3 text-sm leading-6 text-sa-text-primary"
      >
        {configurationMissing
          ? "Account access is not configured for this environment yet."
          : "We couldn't confirm your account right now. Please try again later."}
      </div>
    </AuthShell>
  );
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  let userEmail = "";
  let accountState: "available" | "configuration-missing" | "signed-out" | "unavailable" = "available";

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (!data.user) {
      const signedOut = !error || error.name === "AuthSessionMissingError" || error.status === 401;
      accountState = signedOut ? "signed-out" : "unavailable";
    } else {
      userEmail = data.user.email ?? "";
    }
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      accountState = "configuration-missing";
    } else {
      throw error;
    }
  }

  if (accountState === "signed-out") redirect(ROUTES.authSignIn);
  if (accountState === "configuration-missing") return <AccountUnavailable configurationMissing />;
  if (accountState === "unavailable") return <AccountUnavailable />;

  const signOutFailed = (await searchParams).authError === "sign-out";

  return (
    <AuthShell
      title="Your Account"
      description="Your verified email session is active. Community profile setup is deliberately deferred to the next account phase."
      footer="No username, public member page, country identity, avatar, or participation data exists in PR 1."
    >
      <div className="space-y-sa-4">
        <div className="grid gap-sa-3 rounded-sa-control border border-sa-border-subtle bg-sa-surface-inset px-sa-3 py-sa-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <DataLabel as="p" className="text-sa-accent">
              Authenticated
            </DataLabel>
            <p className="mt-sa-1 truncate text-sm font-bold text-sa-text-primary">
              {userEmail ? maskEmail(userEmail) : "Verified email account"}
            </p>
          </div>
          <span className="inline-flex min-h-8 w-fit items-center rounded-sa-sm border border-sa-border-active bg-sa-accent/10 px-sa-2 text-[10px] font-black uppercase tracking-[0.12em] text-sa-accent">
            Session active
          </span>
        </div>

        {signOutFailed ? (
          <p role="alert" className="text-sm leading-5 text-sa-negative">
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
    </AuthShell>
  );
}
