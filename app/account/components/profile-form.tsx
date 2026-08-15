"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  INITIAL_PROFILE_ACTION_STATE,
  type ProfileActionState,
} from "@/app/account/action-state";
import { createProfileAction } from "@/app/account/actions";
import CountryPicker, { type CountryOption } from "@/app/account/components/country-picker";
import SubmitButton from "@/app/auth/components/submit-button";
import { USERNAME_HTML_PATTERN, validateUsername } from "@/lib/account/username";

type ProfileFormProps = {
  countries: readonly CountryOption[];
};

const fieldClassName =
  "mt-sa-2 min-h-11 w-full rounded-sa-control border border-sa-border-strong bg-sa-surface-inset px-sa-3 text-base text-sa-text-primary outline-none transition-colors duration-200 ease-sa-standard placeholder:text-sa-text-technical focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15 sm:text-sm";

export default function ProfileForm({ countries }: ProfileFormProps) {
  const [state, formAction] = useActionState<ProfileActionState, FormData>(
    createProfileAction,
    INITIAL_PROFILE_ACTION_STATE
  );
  const [representingCountryId, setRepresentingCountryId] = useState("");
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status !== "error") return;
    if (state.field === "username") usernameRef.current?.focus();
    if (state.field === "representingCountry") {
      document.getElementById("onboarding-representing-country-search")?.focus();
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-sa-5">
      <div>
        <label htmlFor="profile-username" className="text-xs font-bold uppercase tracking-[0.1em] text-sa-text-primary">
          Username
        </label>
        <p id="profile-username-help" className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
          3–24 letters, numbers, or underscores. Capitalization is preserved; start and end with a letter or number.
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
          pattern={USERNAME_HTML_PATTERN}
          onChange={(event) => {
            const result = validateUsername(event.target.value);
            event.target.setCustomValidity(result.valid ? "" : result.message);
          }}
          aria-describedby={`profile-username-help${state.field === "username" ? " profile-form-message" : ""}`}
          aria-invalid={state.field === "username"}
          className={fieldClassName}
          placeholder="Member_Name"
        />
      </div>

      <CountryPicker
        id="onboarding-representing-country"
        name="representingCountryId"
        label="Representing"
        description="Optional and public. Choose the country you represent on SkillAtlas."
        countries={countries}
        value={representingCountryId}
        onChange={setRepresentingCountryId}
        error={state.field === "representingCountry"}
        errorMessageId="profile-form-message"
      />

      <div
        id="profile-form-message"
        aria-live="polite"
        className={`min-h-5 text-sm leading-5 ${
          state.status === "error" ? "text-sa-negative" : "text-sa-text-muted"
        }`}
      >
        {state.message}
      </div>

      <SubmitButton pendingLabel="Creating profile…">Create profile</SubmitButton>

      <p className="text-xs leading-5 text-sa-text-technical">
        Your username is public and remains permanent after profile creation.
      </p>
    </form>
  );
}
