"use client";

import CountryPicker, { type CountryOption } from "@/app/account/components/country-picker";
import CountryFlag from "@/app/components/country-flag";
import { HERITAGE_MAX_COUNTRIES } from "@/lib/account/profile";

type HeritagePickerProps = {
  countries: readonly CountryOption[];
  value: readonly string[];
  onChange: (countryIds: string[]) => void;
  error?: boolean;
  errorMessageId?: string;
};

export default function HeritagePicker({
  countries,
  value,
  onChange,
  error = false,
  errorMessageId,
}: HeritagePickerProps) {
  const countryById = new Map(countries.map((country) => [country.id, country]));

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= value.length) return;

    const next = [...value];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  }

  function remove(countryId: string) {
    onChange(value.filter((id) => id !== countryId));
  }

  return (
    <div className="space-y-sa-3">
      <input type="hidden" name="heritageCountryIds" value={JSON.stringify(value)} />

      {value.length > 0 ? (
        <ol className="space-y-sa-2" aria-label="Ordered Heritage countries">
          {value.map((countryId, index) => {
            const country = countryById.get(countryId);
            if (!country) return null;

            return (
              <li
                key={country.id}
                className="grid min-h-12 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-sa-3 rounded-sa-control border border-sa-border-subtle bg-sa-surface-inset px-sa-3 py-sa-2"
              >
                <span className="font-sa-data text-xs font-black text-sa-accent" aria-label={`Position ${index + 1}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex min-w-0 items-center gap-sa-2">
                  <CountryFlag country={{ name: country.name, flagCode: country.iso2 }} size="sm" variant="atlas" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-sa-text-primary">{country.name}</span>
                    <span className="block truncate text-[10px] uppercase tracking-[0.1em] text-sa-text-technical">{country.region}</span>
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${country.name} up`}
                    className="grid h-11 w-11 place-items-center rounded-sa-sm border border-sa-border-subtle text-sa-text-muted outline-none hover:border-sa-border-active hover:text-sa-accent focus-visible:ring-2 focus-visible:ring-sa-accent/25 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === value.length - 1}
                    aria-label={`Move ${country.name} down`}
                    className="grid h-11 w-11 place-items-center rounded-sa-sm border border-sa-border-subtle text-sa-text-muted outline-none hover:border-sa-border-active hover:text-sa-accent focus-visible:ring-2 focus-visible:ring-sa-accent/25 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(country.id)}
                    aria-label={`Remove ${country.name} from Heritage`}
                    className="grid h-11 w-11 place-items-center rounded-sa-sm border border-sa-border-subtle text-sa-text-muted outline-none hover:border-sa-negative hover:text-sa-negative focus-visible:ring-2 focus-visible:ring-sa-negative/25"
                  >
                    ×
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-sa-control border border-dashed border-sa-border-subtle px-sa-3 py-sa-3 text-sm text-sa-text-technical">
          No Heritage countries selected.
        </p>
      )}

      {value.length < HERITAGE_MAX_COUNTRIES ? (
        <CountryPicker
          id="profile-heritage-add"
          label="Add Heritage country"
          description={`Choose up to ${HERITAGE_MAX_COUNTRIES} countries. Order is shown publicly only when Heritage is public.`}
          countries={countries}
          value=""
          excludedCountryIds={value}
          emptyLabel="Choose a country to add"
          onChange={(countryId) => {
            if (countryId && !value.includes(countryId)) onChange([...value, countryId]);
          }}
          error={error}
          errorMessageId={errorMessageId}
        />
      ) : (
        <p className="text-xs leading-5 text-sa-text-technical">Heritage limit reached.</p>
      )}
    </div>
  );
}
