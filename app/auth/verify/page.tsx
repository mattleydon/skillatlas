import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import AuthShell from "@/app/auth/components/auth-shell";
import VerifyCodeForm from "@/app/auth/components/verify-code-form";
import { ROUTES } from "@/constants/routes";
import {
  AUTH_EMAIL_COOKIE,
  AUTH_FLOW_COOKIE,
  isAuthFlow,
  isValidEmail,
  maskEmail,
} from "@/lib/auth/otp";

export const metadata: Metadata = {
  title: "Verify Email | SkillAtlas",
  description: "Verify a SkillAtlas email one-time code.",
};

type VerifyPageProps = {
  searchParams: Promise<{ requested?: string }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const cookieStore = await cookies();
  const email = cookieStore.get(AUTH_EMAIL_COOKIE)?.value ?? "";
  const flowValue = cookieStore.get(AUTH_FLOW_COOKIE)?.value;
  const requested = (await searchParams).requested === "1";
  const hasPendingRequest = isValidEmail(email) && isAuthFlow(flowValue);

  return (
    <AuthShell
      title="Verify Your Email"
      description="Enter the one-time code from your email to establish a secure SkillAtlas session."
      footer="Codes are time-limited. Use the newest code from your email, and request another if it expires. SkillAtlas never asks you to put a code in a URL."
    >
      {hasPendingRequest ? (
        <VerifyCodeForm
          maskedEmail={maskEmail(email)}
          flow={flowValue}
          requested={requested}
        />
      ) : (
        <div role="status" className="space-y-sa-4">
          <p className="text-sm leading-6 text-sa-text-muted">
            There is no active verification request in this browser. Request a new code to continue.
          </p>
          <div className="grid gap-sa-2 sm:grid-cols-2">
            <Link
              href={ROUTES.authSignIn}
              className="inline-flex min-h-11 items-center justify-center rounded-sa-control border border-sa-border-active bg-sa-accent px-sa-4 text-sm font-black text-slate-950 outline-none hover:bg-[#35e1dd] focus-visible:ring-4 focus-visible:ring-sa-accent/25"
            >
              Sign in
            </Link>
            <Link
              href={ROUTES.authSignUp}
              className="inline-flex min-h-11 items-center justify-center rounded-sa-control border border-sa-border-strong bg-sa-surface-2 px-sa-4 text-sm font-bold text-sa-text-primary outline-none hover:border-sa-border-active hover:text-sa-accent focus-visible:ring-4 focus-visible:ring-sa-accent/20"
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
