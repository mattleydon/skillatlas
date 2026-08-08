"use client";

import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import CountryFlag from "@/app/components/country-flag";
import SearchBar from "@/app/components/search-bar";
import type { CountryAtlasRecord } from "@/data/countries";
import styles from "../countries.module.css";

type CountryAtlasSidebarProps = {
  countries: readonly CountryAtlasRecord[];
  totalCount: number;
  search: string;
  activeCountryId: string;
  hoveredCountryId: string | null;
  onSearchChange: (value: string) => void;
  onCountryChange: (countryId: string) => void;
  onCountryHover: (countryId: string | null) => void;
};

export default function CountryAtlasSidebar({
  countries,
  totalCount,
  search,
  activeCountryId,
  hoveredCountryId,
  onSearchChange,
  onCountryChange,
  onCountryHover,
}: CountryAtlasSidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  const keepRowVisible = useCallback((countryId: string) => {
    const list = listRef.current;
    const row = rowRefs.current.get(countryId);
    if (!list || !row) return;

    const listRect = list.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();

    if (rowRect.top < listRect.top) {
      list.scrollTo({ top: list.scrollTop - (listRect.top - rowRect.top) });
    } else if (rowRect.bottom > listRect.bottom) {
      list.scrollTo({ top: list.scrollTop + (rowRect.bottom - listRect.bottom) });
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => keepRowVisible(activeCountryId));
    return () => window.cancelAnimationFrame(frame);
  }, [activeCountryId, countries, keepRowVisible]);

  function moveToCountry(countryId: string) {
    onCountryChange(countryId);

    window.requestAnimationFrame(() => {
      const row = rowRefs.current.get(countryId);
      row?.focus({ preventScroll: true });
      keepRowVisible(countryId);
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
    <aside className={`${styles.panel} ${styles.sidebar} rounded-3xl`} aria-labelledby="country-atlas-title">
      <div className="border-b border-[#ff2fa8]/20 p-5">
        <p id="country-atlas-title" className="text-lg font-black tracking-tight">
          Country Atlas
        </p>
        <div className={`${styles.countRows} mt-2`} aria-label={`${totalCount} countries`}>
          <p className={`${styles.countEntrance} text-sm font-black text-[#19d3cf]`}>
            <span className="text-xl">{totalCount}</span> Countries
          </p>
        </div>
      </div>

      <div className="grid gap-4 border-b border-[#ff2fa8]/15 p-4">
        <SearchBar
          label="Search countries"
          placeholder="Search countries..."
          value={search}
          onValueChange={onSearchChange}
        />

        <label>
          <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            Sort By
          </span>
          <select aria-label="Sort countries" defaultValue="alphabetical" className={styles.selectControl}>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </label>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="flex items-center justify-between gap-3 px-2 pb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            Countries
          </p>
          <p className="text-xs font-black text-[#ff2fa8]">{countries.length} visible</p>
        </div>

        <div
          ref={listRef}
          className={styles.countryList}
          role="listbox"
          aria-label="Alphabetical country list"
        >
          {countries.length > 0 ? (
            countries.map((country) => {
              const active = country.id === activeCountryId;
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
                  tabIndex={active ? 0 : -1}
                  onClick={() => onCountryChange(country.id)}
                  onKeyDown={(event) => handleListKeyDown(event, country.id)}
                  onPointerEnter={() => onCountryHover(country.id)}
                  onPointerLeave={() => onCountryHover(null)}
                  className={`${styles.countryRow} ${active ? styles.countryRowActive : ""} ${hovered ? styles.countryRowHovered : ""}`}
                >
                  <CountryFlag country={country} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-black">{country.name}</span>
                  <span className={styles.activeMarker} aria-hidden="true" />
                </button>
              );
            })
          ) : (
            <div className="px-3 py-8 text-center">
              <p className="text-sm font-black">No countries found</p>
              <p className="mt-1 text-xs font-semibold text-gray-500">Try a different search.</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
