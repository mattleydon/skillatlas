"use client";

import { type KeyboardEvent, useMemo, useRef, useState } from "react";
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
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const resultRefs = useRef(new Map<string, HTMLButtonElement>());
  const filteredCountries = useMemo(
    () => countries.filter((country) => matchesSearchQuery(query, [country.name, country.region])),
    [countries, query]
  );
  const selectedCountry = countries.find((country) => country.id === selectedId) ?? null;
  const hasQuery = query.trim().length > 0;

  function resultId(countryId: string) {
    return `profile-country-result-${countryId}`;
  }

  function activateResult(countryId: string) {
    setActiveResultId(countryId);
    window.requestAnimationFrame(() => {
      resultRefs.current.get(countryId)?.scrollIntoView({ block: "nearest" });
    });
  }

  function selectCountry(countryId: string) {
    setSelectedId(countryId);
    setQuery("");
    setActiveResultId(null);
    window.requestAnimationFrame(() => {
      document.getElementById("profile-country")?.focus({ preventScroll: true });
    });
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    const firstMatch = countries.find((country) =>
      matchesSearchQuery(nextQuery, [country.name, country.region])
    );
    setActiveResultId(nextQuery.trim() ? (firstMatch?.id ?? null) : null);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && hasQuery) {
      event.preventDefault();
      setQuery("");
      setActiveResultId(null);
      return;
    }

    if (!hasQuery || filteredCountries.length === 0) return;

    const currentIndex = filteredCountries.findIndex(
      (country) => country.id === activeResultId
    );
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown") {
      nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, filteredCountries.length - 1);
    } else if (event.key === "ArrowUp") {
      nextIndex = currentIndex < 0 ? filteredCountries.length - 1 : Math.max(currentIndex - 1, 0);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = filteredCountries.length - 1;
    } else if (event.key === "Enter" && activeResultId) {
      event.preventDefault();
      selectCountry(activeResultId);
      return;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const nextCountry = filteredCountries[nextIndex];
      if (nextCountry) activateResult(nextCountry.id);
    }
  }

  return (
    <div className="space-y-sa-2">
      <label className="block">
        <span className="sr-only">Search country options</span>
        <span className="relative block">
          <input
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-controls={hasQuery ? "profile-country-results" : undefined}
            aria-expanded={hasQuery}
            aria-activedescendant={
              hasQuery && activeResultId ? resultId(activeResultId) : undefined
            }
            placeholder="Search countries..."
            className="h-11 w-full rounded-sa-control border border-sa-border-subtle bg-sa-surface-inset px-sa-3 pr-10 text-sm font-semibold text-sa-text-primary outline-none transition-[border-color,box-shadow] duration-200 ease-sa-standard placeholder:text-sa-text-technical focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15"
          />
          <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-sa-accent" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="m12.4 12.4 4.1 4.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
        </span>
      </label>

      {hasQuery ? (
        <div
          id="profile-country-results"
          role="listbox"
          aria-label="Country search results"
          className="max-h-56 overflow-y-auto rounded-sa-control border border-sa-border-strong bg-sa-surface-2 p-1 shadow-lg"
        >
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => {
              const active = country.id === activeResultId;
              const selected = country.id === selectedId;

              return (
                <button
                  key={country.id}
                  ref={(node) => {
                    if (node) resultRefs.current.set(country.id, node);
                    else resultRefs.current.delete(country.id);
                  }}
                  id={resultId(country.id)}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={-1}
                  onPointerMove={() => setActiveResultId(country.id)}
                  onClick={() => selectCountry(country.id)}
                  className={`flex min-h-11 w-full items-center gap-sa-3 rounded-sa-sm px-sa-3 py-sa-2 text-left text-sm outline-none transition-colors duration-200 ease-sa-standard ${
                    active
                      ? "bg-sa-accent/10 text-sa-text-primary"
                      : "text-sa-text-muted hover:bg-sa-surface-inset hover:text-sa-text-primary"
                  }`}
                >
                  <span aria-hidden="true" className="w-6 text-center text-base">
                    {countryFlag(country.iso2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{country.name}</span>
                    <span className="block truncate text-[11px] text-sa-text-technical">
                      {country.region}
                    </span>
                  </span>
                  {selected ? (
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-sa-accent">
                      Selected
                    </span>
                  ) : null}
                </button>
              );
            })
          ) : (
            <p className="px-sa-3 py-sa-3 text-sm text-sa-text-muted">
              No country matches your search.
            </p>
          )}
        </div>
      ) : null}

      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 w-6 -translate-y-1/2 text-center text-base">
          {selectedCountry ? countryFlag(selectedCountry.iso2) : "—"}
        </span>
        <select
          id="profile-country"
          name="countryId"
          value={selectedId}
          onChange={(event) => selectCountry(event.target.value)}
          aria-labelledby="profile-country-label"
          aria-describedby={error ? "profile-form-message" : undefined}
          aria-invalid={error}
          className="min-h-11 w-full appearance-none rounded-sa-control border border-sa-border-strong bg-sa-surface-inset py-sa-2 pl-11 pr-10 text-sm font-semibold text-sa-text-primary outline-none transition-colors duration-200 ease-sa-standard hover:border-sa-border-active focus-visible:border-sa-border-active focus-visible:ring-4 focus-visible:ring-sa-accent/15"
        >
          <option value="">Prefer not to specify</option>
          {countries.map((country) => (
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
