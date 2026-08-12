"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  INITIAL_AUTH_ACTION_STATE,
  type AuthActionState,
} from "@/app/auth/action-state";
import { resendCodeAction, verifyCodeAction } from "@/app/auth/actions";
import SubmitButton from "@/app/auth/components/submit-button";
import { ROUTES } from "@/constants/routes";
import { OTP_LENGTH, type AuthFlow } from "@/lib/auth/otp";

type VerifyCodeFormProps = {
  maskedEmail: string;
  flow: AuthFlow;
  requested: boolean;
};

function ResendButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-sa-control border border-sa-border-strong bg-sa-surface-2 px-sa-4 text-sm font-bold text-sa-text-primary outline-none transition-colors duration-200 ease-sa-standard hover:border-sa-border-active hover:text-sa-accent focus-visible:ring-4 focus-visible:ring-sa-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Requesting…" : "Request a new code"}
    </button>
  );
}

function ResendCode() {
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    resendCodeAction,
    INITIAL_AUTH_ACTION_STATE
  );

  return (
    <form action={formAction} className="border-t border-sa-border-subtle pt-sa-4">
      <ResendButton />
      <p
        aria-live="polite"
        className={`mt-sa-2 min-h-5 text-sm leading-5 ${state.status === "error" ? "text-sa-negative" : "text-sa-text-muted"}`}
      >
        {state.message}
      </p>
    </form>
  );
}

export default function VerifyCodeForm({ maskedEmail, flow, requested }: VerifyCodeFormProps) {
  const initialState: AuthActionState = requested
    ? { status: "success", message: `A code was requested for ${maskedEmail}.` }
    : INITIAL_AUTH_ACTION_STATE;
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    verifyCodeAction,
    initialState
  );
  const tokenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "error") tokenRef.current?.focus();
  }, [state]);

  return (
    <div className="space-y-sa-4">
      <form action={formAction} className="space-y-sa-4">
        <div>
          <label htmlFor="verification-code" className="text-xs font-bold uppercase tracking-[0.1em] text-sa-text-primary">
            One-time code
          </label>
          <p id="verification-code-help" className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
            Enter the {OTP_LENGTH}-digit code sent to {maskedEmail}.
          </p>
          <input
            ref={tokenRef}
            id="verification-code"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="done"
            required
            minLength={OTP_LENGTH}
            maxLength={OTP_LENGTH}
            pattern={`[0-9]{${OTP_LENGTH}}`}
            aria-describedby={`verification-code-help${state.status === "error" ? " verification-code-error" : ""}`}
            aria-invalid={state.status === "error"}
            className="mt-sa-2 min-h-12 w-full rounded-sa-control border border-sa-border-strong bg-sa-surface-inset px-sa-3 text-center font-sa-data text-2xl font-black tracking-[0.3em] text-sa-text-primary outline-none transition-colors duration-200 ease-sa-standard placeholder:text-sa-text-technical focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15"
            placeholder="000000"
          />
        </div>

        <div
          id={state.status === "error" ? "verification-code-error" : undefined}
          aria-live="polite"
          className={`min-h-5 text-sm leading-5 ${state.status === "error" ? "text-sa-negative" : "text-sa-text-muted"}`}
        >
          {state.message}
        </div>

        <SubmitButton pendingLabel="Verifying…">Verify and continue</SubmitButton>
      </form>

      <ResendCode />

      <p className="text-sm leading-6 text-sa-text-muted">
        Need to use a different address? {" "}
        <Link
          href={flow === "sign-up" ? ROUTES.authSignUp : ROUTES.authSignIn}
          className="font-bold text-sa-accent outline-none hover:text-sa-text-primary focus-visible:rounded-sa-sm focus-visible:ring-2 focus-visible:ring-sa-accent"
        >
          Start again
        </Link>
      </p>
    </div>
  );
}
