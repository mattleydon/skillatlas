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
  id: string;
  label: string;
  countries: readonly CountryOption[];
  value: string;
  onChange: (countryId: string) => void;
  name?: string;
  description?: string;
  emptyLabel?: string;
  excludedCountryIds?: readonly string[];
  error?: boolean;
  errorMessageId?: string;
};

function countryFlag(iso2: string) {
  return String.fromCodePoint(
    ...iso2.toUpperCase().split("").map((character) => 127397 + character.charCodeAt(0))
  );
}

export default function CountryPicker({
  id,
  label,
  countries,
  value,
  onChange,
  name,
  description,
  emptyLabel = "Prefer not to specify",
  excludedCountryIds = [],
  error = false,
  errorMessageId,
}: CountryPickerProps) {
  const [query, setQuery] = useState("");
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const resultRefs = useRef(new Map<string, HTMLButtonElement>());
  const excludedIds = useMemo(() => new Set(excludedCountryIds), [excludedCountryIds]);
  const availableCountries = useMemo(
    () => countries.filter((country) => !excludedIds.has(country.id) || country.id === value),
    [countries, excludedIds, value]
  );
  const filteredCountries = useMemo(
    () =>
      availableCountries.filter((country) =>
        matchesSearchQuery(query, [country.name, country.region])
      ),
    [availableCountries, query]
  );
  const selectedCountry = countries.find((country) => country.id === value) ?? null;
  const hasQuery = query.trim().length > 0;
  const searchId = `${id}-search`;
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  const resultsId = `${id}-results`;

  function resultId(countryId: string) {
    return `${id}-result-${countryId}`;
  }

  function activateResult(countryId: string) {
    setActiveResultId(countryId);
    window.requestAnimationFrame(() => {
      resultRefs.current.get(countryId)?.scrollIntoView({ block: "nearest" });
    });
  }

  function selectCountry(countryId: string) {
    onChange(countryId);
    setQuery("");
    setActiveResultId(null);
    window.requestAnimationFrame(() => {
      document.getElementById(searchId)?.focus({ preventScroll: true });
    });
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    const firstMatch = availableCountries.find((country) =>
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
    <div className="min-w-0 space-y-sa-2">
      <div>
        <label id={labelId} htmlFor={searchId} className="text-xs font-bold uppercase tracking-[0.1em] text-sa-text-primary">
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
            {description}
          </p>
        ) : null}
      </div>

      <div className="relative">
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-labelledby={labelId}
          aria-describedby={[descriptionId, error ? errorMessageId : undefined].filter(Boolean).join(" ") || undefined}
          aria-controls={hasQuery ? resultsId : undefined}
          aria-expanded={hasQuery}
          aria-activedescendant={hasQuery && activeResultId ? resultId(activeResultId) : undefined}
          aria-invalid={error}
          placeholder="Search countries..."
          className="h-11 w-full rounded-sa-control border border-sa-border-subtle bg-sa-surface-inset px-sa-3 pr-10 text-sm font-semibold text-sa-text-primary outline-none transition-[border-color,box-shadow] duration-200 ease-sa-standard placeholder:text-sa-text-technical focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15"
        />
        <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-sa-accent" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="m12.4 12.4 4.1 4.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      </div>

      {hasQuery ? (
        <div
          id={resultsId}
          role="listbox"
          aria-label={`${label} country search results`}
          className="max-h-56 overflow-y-auto rounded-sa-control border border-sa-border-strong bg-sa-surface-2 p-1 shadow-lg"
        >
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => {
              const active = country.id === activeResultId;
              const selected = country.id === value;

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
                  onMouseDown={(event) => event.preventDefault()}
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
          id={id}
          name={name}
          value={value}
          onChange={(event) => selectCountry(event.target.value)}
          aria-labelledby={labelId}
          aria-describedby={[descriptionId, error ? errorMessageId : undefined].filter(Boolean).join(" ") || undefined}
          aria-invalid={error}
          className="min-h-11 w-full appearance-none rounded-sa-control border border-sa-border-strong bg-sa-surface-inset py-sa-2 pl-11 pr-10 text-sm font-semibold text-sa-text-primary outline-none transition-colors duration-200 ease-sa-standard hover:border-sa-border-active focus-visible:border-sa-border-active focus-visible:ring-4 focus-visible:ring-sa-accent/15"
        >
          <option value="">{emptyLabel}</option>
          {availableCountries.map((country) => (
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
          : selectedCountry
            ? `${selectedCountry.name} selected.`
            : `${availableCountries.length} countries available.`}
      </p>
    </div>
  );
}
