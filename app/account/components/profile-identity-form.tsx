"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import {
  INITIAL_PROFILE_ACTION_STATE,
  type ProfileActionState,
} from "@/app/account/action-state";
import {
  correctUsernameCapitalizationAction,
  updateProfileIdentityAction,
} from "@/app/account/actions";
import SubmitButton from "@/app/auth/components/submit-button";
import { memberRoute } from "@/constants/routes";
import { BIO_MAX_LENGTH } from "@/lib/account/profile";
import { USERNAME_HTML_PATTERN, validateUsername } from "@/lib/account/username";

type ProfileIdentityFormProps = {
  username: string;
  displayName: string;
  bio: string | null;
  capitalizationCorrectionAvailable: boolean;
};

const fieldClassName =
  "mt-sa-2 min-h-11 w-full rounded-sa-control border border-sa-border-strong bg-sa-surface-inset px-sa-3 text-base text-sa-text-primary outline-none transition-colors duration-200 ease-sa-standard placeholder:text-sa-text-technical focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15 sm:text-sm";

export default function ProfileIdentityForm({
  username,
  displayName,
  bio,
  capitalizationCorrectionAvailable,
}: ProfileIdentityFormProps) {
  const [identityState, identityAction] = useActionState<ProfileActionState, FormData>(
    updateProfileIdentityAction,
    INITIAL_PROFILE_ACTION_STATE
  );
  const [usernameState, usernameAction] = useActionState<ProfileActionState, FormData>(
    correctUsernameCapitalizationAction,
    INITIAL_PROFILE_ACTION_STATE
  );
  const displayNameRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (identityState.field === "displayName") displayNameRef.current?.focus();
    if (identityState.field === "bio") bioRef.current?.focus();
  }, [identityState]);

  useEffect(() => {
    if (usernameState.field === "username") usernameRef.current?.focus();
  }, [usernameState]);

  return (
    <div className="space-y-sa-5">
      <div className="grid gap-sa-3 rounded-sa-control border border-sa-border-subtle bg-sa-surface-inset px-sa-3 py-sa-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sa-accent">Public identity</p>
          <p className="mt-sa-1 truncate text-sm font-bold text-sa-text-primary">@{username}</p>
        </div>
        <Link
          href={memberRoute(username)}
          className="inline-flex min-h-11 items-center justify-center rounded-sa-control border border-sa-border-active bg-sa-accent/8 px-sa-3 text-xs font-bold text-sa-accent outline-none hover:bg-sa-accent/14 hover:text-sa-text-primary focus-visible:ring-4 focus-visible:ring-sa-accent/20"
        >
          View public profile
        </Link>
      </div>

      {capitalizationCorrectionAvailable ? (
        <form action={usernameAction} className="rounded-sa-control border border-sa-border-subtle px-sa-3 py-sa-3">
          <label htmlFor="profile-username-correction" className="text-xs font-bold uppercase tracking-[0.1em] text-sa-text-primary">
            One-time capitalization correction
          </label>
          <p id="profile-username-correction-help" className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
            You may change only the capitalization of @{username}. This can be used once.
          </p>
          <div className="mt-sa-2 grid gap-sa-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              ref={usernameRef}
              id="profile-username-correction"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={24}
              pattern={USERNAME_HTML_PATTERN}
              defaultValue={username}
              onChange={(event) => {
                const result = validateUsername(event.target.value);
                event.target.setCustomValidity(result.valid ? "" : result.message);
              }}
              aria-describedby={`profile-username-correction-help${usernameState.field === "username" ? " profile-username-message" : ""}`}
              aria-invalid={usernameState.field === "username"}
              className="min-h-11 w-full rounded-sa-control border border-sa-border-strong bg-sa-surface-inset px-sa-3 text-sm text-sa-text-primary outline-none focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15"
            />
            <SubmitButton pendingLabel="Correcting…">Correct capitalization</SubmitButton>
          </div>
          <p
            id="profile-username-message"
            aria-live="polite"
            className={`mt-sa-2 min-h-5 text-sm ${usernameState.status === "error" ? "text-sa-negative" : "text-sa-accent"}`}
          >
            {usernameState.message}
          </p>
        </form>
      ) : (
        <p className="text-xs leading-5 text-sa-text-technical">
          Username is immutable. The one-time capitalization correction is not available.
        </p>
      )}

      <form action={identityAction} className="space-y-sa-4">
        <div>
          <label htmlFor="profile-display-name" className="text-xs font-bold uppercase tracking-[0.1em] text-sa-text-primary">
            Display name
          </label>
          <input
            ref={displayNameRef}
            id="profile-display-name"
            name="displayName"
            type="text"
            required
            maxLength={50}
            defaultValue={displayName}
            aria-describedby={identityState.field === "displayName" ? "profile-identity-message" : undefined}
            aria-invalid={identityState.field === "displayName"}
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="profile-bio" className="text-xs font-bold uppercase tracking-[0.1em] text-sa-text-primary">
            Bio <span className="font-medium text-sa-text-technical">(optional)</span>
          </label>
          <p id="profile-bio-help" className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
            Plain text, up to {BIO_MAX_LENGTH} characters and three lines.
          </p>
          <textarea
            ref={bioRef}
            id="profile-bio"
            name="bio"
            rows={3}
            maxLength={BIO_MAX_LENGTH}
            defaultValue={bio ?? ""}
            aria-describedby={`profile-bio-help${identityState.field === "bio" ? " profile-identity-message" : ""}`}
            aria-invalid={identityState.field === "bio"}
            className={`${fieldClassName} resize-y py-sa-3 leading-6`}
          />
        </div>

        <p
          id="profile-identity-message"
          aria-live="polite"
          className={`min-h-5 text-sm ${identityState.status === "error" ? "text-sa-negative" : "text-sa-accent"}`}
        >
          {identityState.message}
        </p>
        <SubmitButton pendingLabel="Saving identity…">Save identity</SubmitButton>
      </form>
    </div>
  );
}
