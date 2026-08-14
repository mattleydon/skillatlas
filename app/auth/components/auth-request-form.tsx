"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import {
  INITIAL_AUTH_ACTION_STATE,
  type AuthActionState,
} from "@/app/auth/action-state";
import {
  requestSignInCodeAction,
  requestSignUpCodeAction,
} from "@/app/auth/actions";
import SubmitButton from "@/app/auth/components/submit-button";
import { ROUTES } from "@/constants/routes";
import { OTP_LENGTH, type AuthFlow } from "@/lib/auth/otp";

type AuthRequestFormProps = {
  flow: AuthFlow;
  configurationAvailable: boolean;
};

export default function AuthRequestForm({ flow, configurationAvailable }: AuthRequestFormProps) {
  const action = flow === "sign-in" ? requestSignInCodeAction : requestSignUpCodeAction;
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    action,
    INITIAL_AUTH_ACTION_STATE
  );
  const emailRef = useRef<HTMLInputElement>(null);
  const isSignIn = flow === "sign-in";

  useEffect(() => {
    if (state.status === "error" && state.field === "email") emailRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="space-y-sa-4">
      {!configurationAvailable ? (
        <div
          className="rounded-sa-control border border-sa-negative/50 bg-sa-negative/8 px-sa-3 py-sa-3 text-sm leading-5 text-sa-text-primary"
          role="status"
        >
          Account access is not configured for this environment. Public SkillAtlas pages are unaffected.
        </div>
      ) : null}

      <div>
        <label htmlFor={`${flow}-email`} className="text-xs font-bold uppercase tracking-[0.1em] text-sa-text-primary">
          Email address
        </label>
        <p id={`${flow}-email-help`} className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
          We&apos;ll send an {OTP_LENGTH}-digit one-time code. No password is required.
        </p>
        <input
          ref={emailRef}
          id={`${flow}-email`}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          disabled={!configurationAvailable}
          aria-describedby={`${flow}-email-help${state.field === "email" ? ` ${flow}-email-error` : ""}`}
          aria-invalid={state.field === "email"}
          className="mt-sa-2 min-h-11 w-full rounded-sa-control border border-sa-border-strong bg-sa-surface-inset px-sa-3 text-base text-sa-text-primary outline-none transition-colors duration-200 ease-sa-standard placeholder:text-sa-text-technical focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          placeholder="you@example.com"
        />
      </div>

      <div
        id={state.field === "email" ? `${flow}-email-error` : undefined}
        aria-live="polite"
        className={`min-h-5 text-sm leading-5 ${state.status === "error" ? "text-sa-negative" : "text-sa-text-muted"}`}
      >
        {state.message}
      </div>

      <SubmitButton pendingLabel="Requesting code…" disabled={!configurationAvailable}>
        {isSignIn ? "Send sign-in code" : "Create account with email"}
      </SubmitButton>

      <p className="text-sm leading-6 text-sa-text-muted">
        {isSignIn ? "New to SkillAtlas?" : "Already have an account?"} {" "}
        <Link
          href={isSignIn ? ROUTES.authSignUp : ROUTES.authSignIn}
          className="font-bold text-sa-accent outline-none hover:text-sa-text-primary focus-visible:rounded-sa-sm focus-visible:ring-2 focus-visible:ring-sa-accent"
        >
          {isSignIn ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
