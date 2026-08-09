"use client";

import { useCallback, useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import CompactSelect, {
  type CompactSelectOption,
} from "@/app/components/intelligence-ui/compact-select";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import SearchBar from "@/app/components/search-bar";
import type { CountryAtlasRecord } from "@/data/countries";
import styles from "../countries.module.css";

export type CountrySortMode = "alphabetical" | "overall-ranking" | "skill-score";

type CountryAtlasSidebarProps = {
  countries: readonly CountryAtlasRecord[];
  totalCount: number;
  search: string;
  sort: CountrySortMode;
  sortOptions: readonly CompactSelectOption<CountrySortMode>[];
  activeCountryId: string | null;
  hoveredCountryId: string | null;
  onSearchChange: (value: string) => void;
  onSortChange: (value: CountrySortMode) => void;
  onCountryChange: (countryId: string) => void;
  onCountryHover: (countryId: string | null) => void;
};

export default function CountryAtlasSidebar({
  countries,
  totalCount,
  search,
  sort,
  sortOptions,
  activeCountryId,
  hoveredCountryId,
  onSearchChange,
  onSortChange,
  onCountryChange,
  onCountryHover,
}: CountryAtlasSidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const countryGroups = useMemo(() => {
    if (sort !== "alphabetical") {
      return [{ initial: null, countries: [...countries] }];
    }

    return countries.reduce<Array<{ initial: string; countries: CountryAtlasRecord[] }>>(
      (groups, country) => {
        const initial = country.name.charAt(0).toLocaleUpperCase();
        const currentGroup = groups.at(-1);
        if (currentGroup?.initial === initial) currentGroup.countries.push(country);
        else groups.push({ initial, countries: [country] });
        return groups;
      },
      []
    );
  }, [countries, sort]);

  const alignRowToTop = useCallback((countryId: string) => {
    const list = listRef.current;
    const row = rowRefs.current.get(countryId);
    if (!list || !row) return;

    const listRect = list.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const letterMarkerHeight =
      row
        .closest<HTMLElement>("[data-country-group]")
        ?.querySelector<HTMLElement>("[data-letter-marker]")?.offsetHeight ?? 0;
    const targetTop =
      list.scrollTop + rowRect.top - listRect.top - letterMarkerHeight;

    list.scrollTo({ top: Math.max(0, targetTop) });
  }, []);

  useEffect(() => {
    if (!activeCountryId) return;
    const frame = window.requestAnimationFrame(() => alignRowToTop(activeCountryId));
    return () => window.cancelAnimationFrame(frame);
  }, [activeCountryId, alignRowToTop, countries]);

  function moveToCountry(countryId: string) {
    onCountryChange(countryId);

    window.requestAnimationFrame(() => {
      const row = rowRefs.current.get(countryId);
      row?.focus({ preventScroll: true });
      alignRowToTop(countryId);
    });
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLButtonElement>, countryId: string) {
    const currentIndex = countries.findIndex((country) => country.id === countryId);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;

    if (event.key === "ArrowDown") nextIndex = Math.min(countries.length - 1, currentIndex + 1);
    else if (event.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - 1);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = countries.length - 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onCountryChange(countryId);
      return;
    } else {
      return;
    }

    event.preventDefault();
    const nextCountry = countries[nextIndex];
    if (nextCountry) moveToCountry(nextCountry.id);
  }

  return (
    <IntelligencePanel
      as="aside"
      className={styles.sidebar}
      bodyClassName="flex min-h-0 flex-1 flex-col"
      aria-labelledby="country-atlas-title"
      header={
        <div className="flex items-baseline justify-between gap-sa-3">
          <h2 id="country-atlas-title" className="text-base font-bold tracking-tight">
            Country Atlas
          </h2>
          <p
            className={`${styles.countEntrance} font-sa-data text-xs font-bold text-sa-accent`}
            aria-label={`${totalCount} countries`}
          >
            {totalCount} Countries
          </p>
        </div>
      }
    >
      <div className="grid gap-sa-3 border-b border-sa-border-subtle p-sa-3">
        <SearchBar
          label="Search countries"
          placeholder="Search countries..."
          value={search}
          onValueChange={onSearchChange}
          variant="intelligence"
        />

        <CompactSelect
          id="country-atlas-sort"
          label="Sort By"
          value={sort}
          options={sortOptions}
          onChange={onSortChange}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-sa-2">
        <DataLabel as="p" className="px-sa-2 pb-sa-1 pt-sa-1">
          Countries
        </DataLabel>
        <div
          ref={listRef}
          className={styles.countryList}
          role="listbox"
          aria-label="Country list"
        >
          {countries.length > 0 ? (
            countryGroups.map((group) => (
              <div
                key={group.initial ?? "sorted-countries"}
                data-country-group
                role={group.initial ? "group" : "presentation"}
                aria-label={group.initial ? `${group.initial} countries` : undefined}
              >
                {group.initial ? (
                  <div
                    className={styles.letterMarker}
                    data-letter-marker
                    aria-hidden="true"
                  >
                    {group.initial}
                  </div>
                ) : null}
                {group.countries.map((country) => {
                  const active = country.id === activeCountryId;
                  const roving = country.id === (activeCountryId ?? countries[0]?.id);
                  const hovered = country.id === hoveredCountryId;

                  return (
                    <button
                      key={country.id}
                      ref={(node) => {
                        if (node) rowRefs.current.set(country.id, node);
                        else rowRefs.current.delete(country.id);
                      }}
                      type="button"
                      role="option"
                      aria-selected={active}
                      tabIndex={roving ? 0 : -1}
                      onClick={() => onCountryChange(country.id)}
                      onKeyDown={(event) => handleListKeyDown(event, country.id)}
                      onPointerEnter={() => onCountryHover(country.id)}
                      onPointerLeave={() => onCountryHover(null)}
                      className={`${styles.countryRow} ${active ? styles.countryRowActive : ""} ${hovered ? styles.countryRowHovered : ""}`}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {country.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="px-3 py-8 text-center">
              <p className="text-sm font-black">No countries found</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">Try a different search.</p>
            </div>
          )}
        </div>
      </div>
    </IntelligencePanel>
  );
}
