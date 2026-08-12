"use client";

import { useMemo, useState } from "react";
import { matchesSearchQuery } from "@/lib/search";

export type CountryOption = {
  id: string;
  iso2: string;
  name: string;
  region: string;
};

type CountryPickerProps = {
  countries: readonly CountryOption[];
  defaultCountryId?: string | null;
  error?: boolean;
};

function countryFlag(iso2: string) {
  return String.fromCodePoint(
    ...iso2.toUpperCase().split("").map((character) => 127397 + character.charCodeAt(0))
  );
}

export default function CountryPicker({
  countries,
  defaultCountryId = null,
  error = false,
}: CountryPickerProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(defaultCountryId ?? "");
  const filteredCountries = useMemo(
    () => countries.filter((country) => matchesSearchQuery(query, [country.name, country.region])),
    [countries, query]
  );
  const selectedCountry = countries.find((country) => country.id === selectedId) ?? null;
  const visibleCountries =
    selectedCountry && !filteredCountries.some((country) => country.id === selectedCountry.id)
      ? [selectedCountry, ...filteredCountries]
      : filteredCountries;

  return (
    <div className="space-y-sa-2">
      <label className="block">
        <span className="sr-only">Search country options</span>
        <span className="relative block">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search countries..."
            className="h-11 w-full rounded-sa-control border border-sa-border-subtle bg-sa-surface-inset px-sa-3 pr-10 text-sm font-semibold text-sa-text-primary outline-none transition-[border-color,box-shadow] duration-200 ease-sa-standard placeholder:text-sa-text-technical focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15"
          />
          <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-sa-accent" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="m12.4 12.4 4.1 4.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
        </span>
      </label>

      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 w-6 -translate-y-1/2 text-center text-base">
          {selectedCountry ? countryFlag(selectedCountry.iso2) : "—"}
        </span>
        <select
          id="profile-country"
          name="countryId"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          aria-labelledby="profile-country-label"
          aria-describedby={error ? "profile-form-message" : undefined}
          aria-invalid={error}
          className="min-h-11 w-full appearance-none rounded-sa-control border border-sa-border-strong bg-sa-surface-inset py-sa-2 pl-11 pr-10 text-sm font-semibold text-sa-text-primary outline-none transition-colors duration-200 ease-sa-standard hover:border-sa-border-active focus-visible:border-sa-border-active focus-visible:ring-4 focus-visible:ring-sa-accent/15"
        >
          <option value="">Prefer not to specify</option>
          {visibleCountries.map((country) => (
            <option key={country.id} value={country.id}>
              {countryFlag(country.iso2)} {country.name} — {country.region}
            </option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sa-accent" viewBox="0 0 16 16" aria-hidden="true">
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      </div>

      <p className="min-h-4 text-[11px] leading-4 text-sa-text-technical" aria-live="polite">
        {query
          ? `${filteredCountries.length} ${filteredCountries.length === 1 ? "country" : "countries"} match your search.`
          : `${countries.length} countries available.`}
      </p>
    </div>
  );
}
