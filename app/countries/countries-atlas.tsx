"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import CompactSelect from "@/app/components/intelligence-ui/compact-select";
import { COUNTRY_ATLAS_REGIONS, sovereignCountries } from "@/data/countries";
import { browseCountries, parseCountryBrowse, toggleCountry } from "@/lib/country-browsing";
import CountryAtlasMap, { type AtlasSelectionRequest } from "./components/country-atlas-map";
import CountryAtlasSidebar from "./components/country-atlas-sidebar";
import CountryDossier from "./components/country-dossier";
import styles from "./countries.module.css";

const SORT_OPTIONS = [
  { value: "alphabetical", label: "Alphabetical" },
  { value: "overall-ranking", label: "Rank · fixture" },
  { value: "skill-score", label: "Score · fixture" },
] as const;
const REGION_OPTIONS = COUNTRY_ATLAS_REGIONS.map((value) => ({ value, label: value }));

export default function CountriesAtlas() {
  const params = useSearchParams();
  const { country: activeId, search, region, sort } = parseCountryBrowse(params);
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [atlasSelectionRequest, setAtlasSelectionRequest] = useState<AtlasSelectionRequest | null>(null);
  const countries = useMemo(() => browseCountries(search, region, sort), [search, region, sort]);
  const active = sovereignCountries.find((country) => country.id === activeId);
  const relevantIds = useMemo(() => new Set(countries.map((country) => country.id)), [countries]);

  function update(values: Record<string, string | null>, replace = false) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(values)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    // Native history integrates with Next without remounting the map or scrolling.
    window.history[replace ? "replaceState" : "pushState"](null, "", url.pathname + url.search + url.hash);
  }
  function select(id: string, source: "index" | "map") {
    const next = toggleCountry(activeId, id);
    update({ country: next, ...(!relevantIds.has(id) ? { q: null, region: null } : {}) });
    if (next && source === "index") {
      setAtlasSelectionRequest((previous) => ({ countryId: next, revision: (previous?.revision ?? 0) + 1 }));
    } else {
      setAtlasSelectionRequest(null);
    }
  }

  return (
    <main className={styles.shell}>
      <div className="skillatlas-page-shell relative mx-auto max-w-[1600px] pb-12">
        <header className="mb-sa-3">
          <p className="sa-type-label text-sa-text-muted">Countries / Intelligence dossiers</p>
          <h1 className="sa-type-page-title text-sa-text-primary">Know the country behind the ranking.</h1>
          <p className="sa-type-body text-sa-text-muted">Explore 195 countries. Geographic identity is established; competitive intelligence remains in calibration.</p>
        </header>
        <div className={styles.dossierGrid}>
          <div className={styles.indexSurface}>
            <div className="border-b border-sa-border-subtle p-sa-3">
              <CompactSelect id="country-region" label="Region" value={region} options={REGION_OPTIONS}
                onChange={(value) => update({ region: value === "All" ? null : value })} />
            </div>
            <CountryAtlasSidebar countries={countries} totalCount={195} search={search} sort={sort}
              sortOptions={SORT_OPTIONS} activeCountryId={activeId} hoveredCountryId={hoveredCountryId}
              onSearchChange={(value) => update({ q: value || null }, true)}
              onSortChange={(value) => update({ sort: value === "alphabetical" ? null : value })}
              onCountryChange={(id) => select(id, "index")} onCountryHover={setHoveredCountryId} />
            <p className="p-sa-3 text-xs text-sa-text-muted" aria-live="polite">{countries.length} of 195 countries{active && !relevantIds.has(active.id) ? ` · ${active.name} selected outside this filter` : ""}</p>
          </div>
          <CountryDossier country={active} visibleCount={countries.length} onClear={() => { update({ country: null }); setAtlasSelectionRequest(null); }} />
          <div className={styles.orientationSurface}>
            <h2 className="sa-type-heading border-b border-sa-border-subtle p-sa-3">Geographic orientation</h2>
            <CountryAtlasMap selectedCountry={active} hoveredCountryId={hoveredCountryId} relevantCountryIds={relevantIds}
              atlasSelectionRequest={atlasSelectionRequest} onCountrySelect={(id) => select(id, "map")} onCountryHover={setHoveredCountryId} />
            <p className="p-sa-3 text-xs text-sa-text-muted">Select again to clear. Slow wheel zooms; fast scrolling moves the page. Camera controls work independently of selection.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
