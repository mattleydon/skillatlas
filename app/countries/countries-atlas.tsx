"use client";

import { useMemo, useState } from "react";
import CompactSelect, {
  type CompactSelectOption,
} from "@/app/components/intelligence-ui/compact-select";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import SectionToolbar from "@/app/components/intelligence-ui/section-toolbar";
import { matchesSearchQuery } from "@/lib/search";
import {
  COUNTRY_ATLAS_REGIONS,
  SOVEREIGN_COUNTRY_COUNT,
  sovereignCountries,
  type CountryAtlasRecord,
  type CountryAtlasRegion,
} from "@/data/countries";
import CountryAtlasCard from "./components/country-atlas-card";
import CountryAtlasMap, {
  type AtlasSelectionRequest,
} from "./components/country-atlas-map";
import CountryAtlasSidebar, {
  type CountrySortMode,
} from "./components/country-atlas-sidebar";
import styles from "./countries.module.css";

const alphabeticalCountries = [...sovereignCountries].sort((first, second) =>
  first.name.localeCompare(second.name)
);

const SORT_OPTIONS = [
  { value: "alphabetical", label: "Alphabetical" },
  { value: "overall-ranking", label: "Overall Ranking" },
  { value: "skill-score", label: "Skill Score" },
] as const satisfies readonly CompactSelectOption<CountrySortMode>[];

const REGION_OPTIONS = COUNTRY_ATLAS_REGIONS.map((region) => ({
  value: region,
  label: region,
})) satisfies readonly CompactSelectOption<CountryAtlasRegion>[];

function sortCountries(
  countries: readonly CountryAtlasRecord[],
  sort: CountrySortMode
) {
  return [...countries].sort((first, second) => {
    if (sort === "overall-ranking") return first.rank - second.rank;
    if (sort === "skill-score") {
      return second.dominanceScore - first.dominanceScore || first.name.localeCompare(second.name);
    }
    return first.name.localeCompare(second.name);
  });
}

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
  const [atlasSort, setAtlasSort] = useState<CountrySortMode>("alphabetical");
  const [indexSort, setIndexSort] = useState<CountrySortMode>("overall-ranking");
  const [activeCountryId, setActiveCountryId] = useState<string | null>(null);
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [atlasSelectionRequest, setAtlasSelectionRequest] =
    useState<AtlasSelectionRequest | null>(null);

  const visibleCountries = useMemo(
    () => filterCountries(search, region),
    [region, search]
  );
  const sidebarCountries = useMemo(
    () => sortCountries(visibleCountries, atlasSort),
    [atlasSort, visibleCountries]
  );
  const recordCountries = useMemo(
    () => sortCountries(visibleCountries, indexSort),
    [indexSort, visibleCountries]
  );

  const activeCountry = activeCountryId
    ? sovereignCountries.find((country) => country.id === activeCountryId)
    : undefined;

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
  }

  function selectCountryFromAtlas(countryId: string) {
    selectCountry(countryId);
    setAtlasSelectionRequest((currentRequest) => ({
      countryId,
      revision: (currentRequest?.revision ?? 0) + 1,
    }));
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
      activeCountryId &&
      !nextCountries.some((country) => country.id === activeCountryId)
    ) {
      setActiveCountryId(null);
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
    setActiveCountryId(null);
  }

  return (
    <main className={`${styles.shell} relative min-h-screen overflow-hidden`}>
      <CountriesBackground />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-[88px] sm:px-6 sm:pt-[92px] xl:px-8 xl:pt-[132px]">
        <div className="mb-sa-2 max-w-4xl">
          <p className="mb-sa-1 text-[11px] font-bold uppercase tracking-[0.2em] text-sa-accent">
            Countries
          </p>
          <h1 className="text-[1.625rem] font-bold tracking-tight text-sa-text-primary sm:text-[1.75rem]">
            Browse the competitive world by country.
          </h1>
        </div>

        <section className={styles.atlasGrid} aria-label="Country atlas browser">
          <CountryAtlasSidebar
            countries={sidebarCountries}
            totalCount={SOVEREIGN_COUNTRY_COUNT}
            search={search}
            sort={atlasSort}
            sortOptions={SORT_OPTIONS}
            activeCountryId={activeCountry?.id ?? null}
            hoveredCountryId={hoveredCountryId}
            onSearchChange={updateSearch}
            onSortChange={setAtlasSort}
            onCountryChange={selectCountryFromAtlas}
            onCountryHover={setHoveredCountryId}
          />

          <CountryAtlasMap
            selectedCountry={activeCountry}
            hoveredCountryId={hoveredCountryId}
            relevantCountryIds={regionCountryIds}
            atlasSelectionRequest={atlasSelectionRequest}
            onCountrySelect={selectCountryFromMap}
            onCountryHover={setHoveredCountryId}
          />
        </section>

        <IntelligencePanel
          as="section"
          className="mt-sa-4"
          aria-labelledby="country-cards-title"
          header={
            <SectionToolbar
              title="Country Index"
              titleId="country-cards-title"
              eyebrow="Country intelligence"
              metadata={`${recordCountries.length} ${recordCountries.length === 1 ? "record" : "records"}`}
              controls={
                <>
                  <CompactSelect
                    id="country-index-sort"
                    label="Sort By"
                    value={indexSort}
                    options={SORT_OPTIONS}
                    onChange={setIndexSort}
                  />
                  <CompactSelect
                    id="country-index-region"
                    label="Region"
                    value={region}
                    options={REGION_OPTIONS}
                    onChange={updateRegion}
                  />
                </>
              }
            />
          }
        >
          <div className="p-sa-3 sm:p-sa-4">
            {visibleCountries.length > 0 ? (
              <div className="grid gap-sa-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {recordCountries.map((country) => (
                  <CountryAtlasCard
                    key={country.id}
                    country={country}
                    selected={country.id === activeCountry?.id}
                  />
                ))}
              </div>
            ) : (
              <div className={`${styles.emptyState} rounded-sa-panel p-8 text-center sm:p-12`}>
                <p className="text-lg font-bold">No countries match this view.</p>
                <p className="mt-2 text-sm font-semibold text-sa-text-muted">
                  Clear the search or return to all regions.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 min-h-11 rounded-sa-control bg-sa-accent px-5 py-2.5 text-sm font-bold text-slate-950 transition-[filter,transform] duration-200 ease-sa-standard hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sa-accent/25"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </IntelligencePanel>
      </div>
    </main>
  );
}
