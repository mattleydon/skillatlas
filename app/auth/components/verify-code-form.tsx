"use client";

import Link from "next/link";
import { type FormEvent, useActionState, useEffect, useRef } from "react";
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

function ResendButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="sa-type-reading-control min-h-11 rounded-sa-control border border-sa-border-strong bg-sa-surface-2 px-sa-4 text-sm text-sa-text-primary outline-none transition-colors duration-200 ease-sa-standard hover:border-sa-border-active hover:text-sa-accent focus-visible:ring-4 focus-visible:ring-sa-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Requesting…" : "Request a new access code"}
    </button>
  );
}

type VerificationState = AuthActionState & { intent?: "verify" | "resend" };

export default function VerifyCodeForm({ maskedEmail, flow, requested }: VerifyCodeFormProps) {
  const initialState: VerificationState = requested
    ? { status: "success", message: `An access code was requested for ${maskedEmail}.` }
    : INITIAL_AUTH_ACTION_STATE;
  const submitting = useRef(false);
  // Both forms share one result and one pending state. A resend must replace,
  // not coexist with, the previous code's verification result.
  const [result, formAction, pending] = useActionState<VerificationState, FormData>(
    async (previousState, formData) => {
      try {
        const intent = formData.get("intent") === "resend" ? "resend" : "verify";
        const action = intent === "resend" ? resendCodeAction : verifyCodeAction;
        return { ...await action(previousState, formData), intent };
      } finally {
        submitting.current = false;
      }
    },
    initialState
  );
  const state: VerificationState = pending ? INITIAL_AUTH_ACTION_STATE : result;
  const tokenRef = useRef<HTMLInputElement>(null);
  const tokenError = state.status === "error" && state.intent !== "resend";
  const preventDuplicateSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (submitting.current || pending) event.preventDefault();
    else submitting.current = true;
  };

  useEffect(() => {
    if (state.intent === "resend" && state.status === "success" && tokenRef.current) {
      tokenRef.current.value = "";
    }
    if (tokenError || (state.intent === "resend" && state.status === "success")) {
      tokenRef.current?.focus();
    }
  }, [state, tokenError]);

  return (
    <div className="space-y-sa-4">
      <form action={formAction} onSubmit={preventDuplicateSubmit} aria-busy={pending} className="space-y-sa-4">
        <input type="hidden" name="intent" value="verify" />
        <div>
          <label htmlFor="verification-code" className="sa-type-label text-xs text-sa-text-primary">
            Access code
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
            aria-describedby={`verification-code-help${tokenError ? " verification-code-error" : ""}`}
            aria-invalid={tokenError}
            className="sa-type-data mt-sa-2 min-h-12 w-full rounded-sa-control border border-sa-border-strong bg-sa-surface-inset px-sa-3 text-center text-2xl tracking-[0.3em] text-sa-text-primary outline-none transition-colors duration-200 ease-sa-standard placeholder:text-sa-text-technical focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15"
            placeholder={"0".repeat(OTP_LENGTH)}
          />
        </div>

        <div
          id={tokenError ? "verification-code-error" : undefined}
          aria-live="polite"
          className={`min-h-5 text-sm leading-5 ${state.status === "error" ? "text-sa-negative" : "text-sa-text-muted"}`}
        >
          {state.intent !== "resend" ? state.message : ""}
        </div>

        <SubmitButton pendingLabel="Verifying…" disabled={pending}>Verify and continue</SubmitButton>
      </form>

      <form action={formAction} onSubmit={preventDuplicateSubmit} aria-busy={pending} className="border-t border-sa-border-subtle pt-sa-4">
        <input type="hidden" name="intent" value="resend" />
        <ResendButton disabled={pending} />
        <p
          aria-live="polite"
          className={`mt-sa-2 min-h-5 text-sm leading-5 ${state.status === "error" ? "text-sa-negative" : "text-sa-text-muted"}`}
        >
          {state.intent === "resend" ? state.message : ""}
        </p>
      </form>

      <p className="text-sm leading-6 text-sa-text-muted">
        Need to use a different address? {" "}
        <Link
          href={flow === "sign-up" ? ROUTES.authSignUp : ROUTES.authSignIn}
          className="font-medium text-sa-accent outline-none hover:text-sa-text-primary focus-visible:rounded-sa-sm focus-visible:ring-2 focus-visible:ring-sa-accent"
        >
          Start again
        </Link>
      </p>
    </div>
  );
}
