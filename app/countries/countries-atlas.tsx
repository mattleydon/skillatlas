"use client";

import { useMemo, useState } from "react";
import { matchesSearchQuery } from "@/lib/search";
import {
  COUNTRY_ATLAS_REGIONS,
  SOVEREIGN_COUNTRY_COUNT,
  sovereignCountries,
  type CountryAtlasRecord,
  type CountryAtlasRegion,
} from "@/data/countries";
import CountryAtlasCard from "./components/country-atlas-card";
import CountryAtlasMap from "./components/country-atlas-map";
import CountryAtlasSidebar from "./components/country-atlas-sidebar";
import styles from "./countries.module.css";

const alphabeticalCountries = [...sovereignCountries].sort((first, second) =>
  first.name.localeCompare(second.name)
);

function filterCountries(search: string, region: CountryAtlasRegion) {
  return alphabeticalCountries
    .filter((country) => region === "All" || country.region === region)
    .filter((country) =>
      matchesSearchQuery(search, [
        country.name,
        country.region,
        country.highestAchievement.game,
      ])
    );
}

const defaultCountryId = filterCountries("", "All")[0]?.id ?? "";

function CountriesBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.backgroundGlow} />
      <div className={styles.backgroundGrid} />
      <div className={styles.backgroundMeridian} />
    </div>
  );
}

export default function CountriesAtlas() {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<CountryAtlasRegion>("All");
  const [activeCountryId, setActiveCountryId] = useState(defaultCountryId);
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [mapFocusRequest, setMapFocusRequest] = useState(0);

  const visibleCountries = useMemo(
    () => filterCountries(search, region),
    [region, search]
  );

  const activeCountry =
    visibleCountries.find((country) => country.id === activeCountryId) ??
    visibleCountries[0] ??
    sovereignCountries.find((country) => country.id === activeCountryId) ??
    sovereignCountries[0];

  const regionCountryIds = useMemo(
    () =>
      region === "All"
        ? undefined
        : new Set(
            sovereignCountries
              .filter((country) => country.region === region)
              .map((country) => country.id)
          ),
    [region]
  );

  function selectCountry(countryId: string) {
    setActiveCountryId(countryId);
    setMapFocusRequest((request) => request + 1);
  }

  function selectCountryFromMap(countryId: string) {
    if (!visibleCountries.some((country) => country.id === countryId)) {
      setSearch("");
      setRegion("All");
    }

    selectCountry(countryId);
  }

  function keepSelectionVisible(nextCountries: readonly CountryAtlasRecord[]) {
    if (
      nextCountries.length > 0 &&
      !nextCountries.some((country) => country.id === activeCountryId)
    ) {
      selectCountry(nextCountries[0].id);
    }
  }

  function updateSearch(nextSearch: string) {
    setSearch(nextSearch);
    keepSelectionVisible(filterCountries(nextSearch, region));
  }

  function updateRegion(nextRegion: CountryAtlasRegion) {
    setRegion(nextRegion);
    keepSelectionVisible(filterCountries(search, nextRegion));
  }

  function resetFilters() {
    setSearch("");
    setRegion("All");
    selectCountry(defaultCountryId);
  }

  return (
    <main className={`${styles.shell} relative min-h-screen overflow-hidden`}>
      <CountriesBackground />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-[108px] sm:px-6 sm:pt-[116px] xl:px-8 xl:pt-[152px]">
        <header className="mb-6 max-w-3xl">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-[#19d3cf]">
            Countries
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Browse the competitive world by country.
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-gray-600 sm:text-base">
            A clear, country-level index of competitive achievement—built for fast atlas browsing.
          </p>
        </header>

        <section className={styles.atlasGrid} aria-label="Country atlas browser">
          <CountryAtlasSidebar
            countries={visibleCountries}
            totalCount={SOVEREIGN_COUNTRY_COUNT}
            search={search}
            activeCountryId={activeCountry?.id ?? ""}
            hoveredCountryId={hoveredCountryId}
            onSearchChange={updateSearch}
            onCountryChange={selectCountry}
            onCountryHover={setHoveredCountryId}
          />

          <CountryAtlasMap
            selectedCountry={activeCountry}
            hoveredCountryId={hoveredCountryId}
            relevantCountryIds={regionCountryIds}
            focusRequest={mapFocusRequest}
            onCountrySelect={selectCountryFromMap}
            onCountryHover={setHoveredCountryId}
          />
        </section>

        <section className={`${styles.panel} mt-6 overflow-hidden rounded-3xl`} aria-labelledby="country-cards-title">
          <div className="flex flex-col gap-4 border-b border-[#ff2fa8]/20 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">
                Country Index
              </p>
              <h2 id="country-cards-title" className="mt-1 text-xl font-black tracking-tight">
                Highest achievements
              </h2>
              <p className="mt-1 text-sm font-semibold text-gray-500">
                {visibleCountries.length} {visibleCountries.length === 1 ? "country" : "countries"} visible
              </p>
            </div>

            <label className="w-full sm:w-64">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                Region
              </span>
              <select
                aria-label="Region"
                value={region}
                onChange={(event) => updateRegion(event.target.value as CountryAtlasRegion)}
                className={styles.selectControl}
              >
                {COUNTRY_ATLAS_REGIONS.map((regionOption) => (
                  <option key={regionOption} value={regionOption}>
                    {regionOption}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="p-4 sm:p-5 lg:p-6">
            {visibleCountries.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleCountries.map((country) => (
                  <CountryAtlasCard key={country.id} country={country} />
                ))}
              </div>
            ) : (
              <div className={`${styles.emptyState} rounded-3xl p-8 text-center sm:p-12`}>
                <p className="text-lg font-black">No countries match this view.</p>
                <p className="mt-2 text-sm font-semibold text-gray-500">
                  Clear the search or return to all regions.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-full bg-[#19d3cf] px-5 py-2.5 text-sm font-black text-white transition-[filter,transform] duration-200 ease-in-out hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#19d3cf]/25"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
