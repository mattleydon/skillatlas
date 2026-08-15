"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  INITIAL_PROFILE_ACTION_STATE,
  type ProfileActionState,
} from "@/app/account/action-state";
import { updateCountryIdentityAction } from "@/app/account/actions";
import CountryPicker, { type CountryOption } from "@/app/account/components/country-picker";
import HeritagePicker from "@/app/account/components/heritage-picker";
import PrivacyToggle from "@/app/account/components/privacy-toggle";
import SubmitButton from "@/app/auth/components/submit-button";
import { CITY_TOWN_MAX_LENGTH } from "@/lib/account/profile";

type CountryIdentityFormProps = {
  countries: readonly CountryOption[];
  representingCountryId: string | null;
  birthCountryId: string | null;
  birthCountryIsPublic: boolean;
  residenceCountryId: string | null;
  residenceCountryIsPublic: boolean;
  cityTown: string | null;
  cityTownIsPublic: boolean;
  heritageCountryIds: readonly string[];
  heritageIsPublic: boolean;
};

export default function CountryIdentityForm({
  countries,
  representingCountryId: initialRepresentingCountryId,
  birthCountryId: initialBirthCountryId,
  birthCountryIsPublic,
  residenceCountryId: initialResidenceCountryId,
  residenceCountryIsPublic,
  cityTown,
  cityTownIsPublic,
  heritageCountryIds: initialHeritageCountryIds,
  heritageIsPublic,
}: CountryIdentityFormProps) {
  const [state, formAction] = useActionState<ProfileActionState, FormData>(
    updateCountryIdentityAction,
    INITIAL_PROFILE_ACTION_STATE
  );
  const [representingCountryId, setRepresentingCountryId] = useState(
    initialRepresentingCountryId ?? ""
  );
  const [birthCountryId, setBirthCountryId] = useState(initialBirthCountryId ?? "");
  const [residenceCountryId, setResidenceCountryId] = useState(
    initialResidenceCountryId ?? ""
  );
  const [heritageCountryIds, setHeritageCountryIds] = useState([
    ...initialHeritageCountryIds,
  ]);
  const [cityTownValue, setCityTownValue] = useState(cityTown ?? "");
  const cityTownRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status !== "error") return;
    const focusTargets: Partial<Record<NonNullable<ProfileActionState["field"]>, string>> = {
      representingCountry: "profile-representing-country-search",
      birthCountry: "profile-birth-country-search",
      residenceCountry: "profile-residence-country-search",
      heritage: "profile-heritage-add-search",
    };
    if (state.field === "cityTown") cityTownRef.current?.focus();
    else if (state.field) document.getElementById(focusTargets[state.field] ?? "")?.focus();
  }, [state]);

  return (
    <form action={formAction} className="space-y-sa-5">
      <CountryPicker
        id="profile-representing-country"
        name="representingCountryId"
        label="Representing"
        description="Public when selected. This is the country you represent on SkillAtlas."
        countries={countries}
        value={representingCountryId}
        onChange={setRepresentingCountryId}
        error={state.field === "representingCountry"}
        errorMessageId="country-identity-message"
      />

      <div className="grid gap-sa-3 lg:grid-cols-2">
        <div className="space-y-sa-2">
          <CountryPicker
            id="profile-birth-country"
            name="birthCountryId"
            label="Born"
            description="Optional. Private unless you choose to show it."
            countries={countries}
            value={birthCountryId}
            onChange={setBirthCountryId}
            error={state.field === "birthCountry"}
            errorMessageId="country-identity-message"
          />
          <PrivacyToggle
            id="profile-birth-public"
            name="birthCountryIsPublic"
            label="Show Born publicly"
            description={birthCountryId ? "Visible on your public member profile." : "Choose a country first."}
            defaultChecked={birthCountryIsPublic}
            disabled={!birthCountryId}
          />
        </div>

        <div className="space-y-sa-2">
          <CountryPicker
            id="profile-residence-country"
            name="residenceCountryId"
            label="Lives In"
            description="Optional. Private unless you choose to show it."
            countries={countries}
            value={residenceCountryId}
            onChange={setResidenceCountryId}
            error={state.field === "residenceCountry"}
            errorMessageId="country-identity-message"
          />
          <PrivacyToggle
            id="profile-residence-public"
            name="residenceCountryIsPublic"
            label="Show Lives In publicly"
            description={residenceCountryId ? "Visible on your public member profile." : "Choose a country first."}
            defaultChecked={residenceCountryIsPublic}
            disabled={!residenceCountryId}
          />
        </div>
      </div>

      <div className="space-y-sa-2">
        <div>
          <label htmlFor="profile-city-town" className="text-xs font-bold uppercase tracking-[0.1em] text-sa-text-primary">
            City / Town <span className="font-medium text-sa-text-technical">(optional)</span>
          </label>
          <p id="profile-city-town-help" className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
            Attached to Lives In. Plain text only; no postcode, street, or inferred location.
          </p>
          <input
            ref={cityTownRef}
            id="profile-city-town"
            name="cityTown"
            type="text"
            maxLength={CITY_TOWN_MAX_LENGTH}
            value={cityTownValue}
            onChange={(event) => setCityTownValue(event.target.value)}
            aria-describedby={`profile-city-town-help${state.field === "cityTown" ? " country-identity-message" : ""}`}
            aria-invalid={state.field === "cityTown"}
            className="mt-sa-2 min-h-11 w-full rounded-sa-control border border-sa-border-strong bg-sa-surface-inset px-sa-3 text-base text-sa-text-primary outline-none focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15 sm:text-sm"
          />
        </div>
        <PrivacyToggle
          id="profile-city-town-public"
          name="cityTownIsPublic"
          label="Show City / Town publicly"
          description={cityTownValue.trim() ? "Visible on your public member profile." : "Enter a City / Town first."}
          defaultChecked={cityTownIsPublic}
          disabled={!cityTownValue.trim()}
        />
      </div>

      <div className="space-y-sa-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-sa-text-primary">Heritage</p>
          <p className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
            Optional, ordered, and private unless you choose to show the group.
          </p>
        </div>
        <HeritagePicker
          countries={countries}
          value={heritageCountryIds}
          onChange={setHeritageCountryIds}
          error={state.field === "heritage"}
          errorMessageId="country-identity-message"
        />
        <PrivacyToggle
          id="profile-heritage-public"
          name="heritageIsPublic"
          label="Show Heritage publicly"
          description={heritageCountryIds.length > 0 ? "Visible in the order shown above." : "Add at least one country first."}
          defaultChecked={heritageIsPublic}
          disabled={heritageCountryIds.length === 0}
        />
      </div>

      <p
        id="country-identity-message"
        aria-live="polite"
        className={`min-h-5 text-sm ${state.status === "error" ? "text-sa-negative" : "text-sa-accent"}`}
      >
        {state.message}
      </p>
      <SubmitButton pendingLabel="Saving country identity…">Save country identity</SubmitButton>
    </form>
  );
}
