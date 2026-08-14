"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  INITIAL_PROFILE_ACTION_STATE,
  type ProfileActionState,
} from "@/app/account/action-state";
import { createProfileAction, updateProfileAction } from "@/app/account/actions";
import CountryPicker, { type CountryOption } from "@/app/account/components/country-picker";
import SubmitButton from "@/app/auth/components/submit-button";
import { validateUsername } from "@/lib/account/username";

type ProfileFormProps =
  | {
      mode: "onboarding";
      countries: readonly CountryOption[];
    }
  | {
      mode: "edit";
      countries: readonly CountryOption[];
      username: string;
      displayName: string;
      countryId: string | null;
    };

const fieldClassName =
  "mt-sa-2 min-h-11 w-full rounded-sa-control border border-sa-border-strong bg-sa-surface-inset px-sa-3 text-base text-sa-text-primary outline-none transition-colors duration-200 ease-sa-standard placeholder:text-sa-text-technical focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15 sm:text-sm";

export default function ProfileForm(props: ProfileFormProps) {
  const action = props.mode === "onboarding" ? createProfileAction : updateProfileAction;
  const [state, formAction] = useActionState<ProfileActionState, FormData>(
    action,
    INITIAL_PROFILE_ACTION_STATE
  );
  const usernameRef = useRef<HTMLInputElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status !== "error") return;
    if (state.field === "username") usernameRef.current?.focus();
    if (state.field === "displayName") displayNameRef.current?.focus();
    if (state.field === "country") document.getElementById("profile-country")?.focus();
  }, [state]);

  return (
    <form action={formAction} className="space-y-sa-4">
      {props.mode === "onboarding" ? (
        <div>
          <label htmlFor="profile-username" className="text-xs font-bold uppercase tracking-[0.1em] text-sa-text-primary">
            Username
          </label>
          <p id="profile-username-help" className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
            3–24 lowercase letters, numbers, or underscores. Must start and end with a letter or number.
          </p>
          <input
            ref={usernameRef}
            id="profile-username"
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={24}
            pattern="[a-z0-9](?:[a-z0-9_]{1,22}[a-z0-9])"
            onChange={(event) => {
              const result = validateUsername(event.target.value);
              event.target.setCustomValidity(result.valid ? "" : result.message);
            }}
            aria-describedby={`profile-username-help${state.field === "username" ? " profile-form-message" : ""}`}
            aria-invalid={state.field === "username"}
            className={fieldClassName}
            placeholder="member_name"
          />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="profile-username" className="text-xs font-bold uppercase tracking-[0.1em] text-sa-text-primary">
              Username
            </label>
            <p id="profile-username-help" className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
              Your public V0.1 username is immutable.
            </p>
            <input
              id="profile-username"
              value={props.username}
              readOnly
              aria-describedby="profile-username-help"
              className={`${fieldClassName} cursor-not-allowed text-sa-text-muted`}
            />
          </div>
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
              defaultValue={props.displayName}
              aria-describedby={state.field === "displayName" ? "profile-form-message" : undefined}
              aria-invalid={state.field === "displayName"}
              className={fieldClassName}
            />
          </div>
        </>
      )}

      <div>
        <p id="profile-country-label" className="text-xs font-bold uppercase tracking-[0.1em] text-sa-text-primary">
          Country <span className="font-medium text-sa-text-technical">(optional)</span>
        </p>
        <p className="mt-sa-1 mb-sa-2 text-xs leading-5 text-sa-text-technical">
          Your selected country is shown on your public member profile.
        </p>
        <CountryPicker
          countries={props.countries}
          defaultCountryId={props.mode === "edit" ? props.countryId : null}
          error={state.field === "country"}
        />
      </div>

      <div
        id="profile-form-message"
        aria-live="polite"
        className={`min-h-5 text-sm leading-5 ${
          state.status === "error"
            ? "text-sa-negative"
            : state.status === "success"
              ? "text-sa-accent"
              : "text-sa-text-muted"
        }`}
      >
        {state.message}
      </div>

      <SubmitButton pendingLabel={props.mode === "onboarding" ? "Creating profile…" : "Saving profile…"}>
        {props.mode === "onboarding" ? "Create profile" : "Save profile"}
      </SubmitButton>

      {props.mode === "onboarding" ? (
        <p className="text-xs leading-5 text-sa-text-technical">
          Your username will be public and cannot be changed during V0.1.
        </p>
      ) : null}
    </form>
  );
}
