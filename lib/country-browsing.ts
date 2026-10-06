import { sovereignCountries, COUNTRY_ATLAS_REGIONS, type CountryAtlasRegion } from "@/data/countries";
import { matchesSearchQuery } from "@/lib/search";

export type CountrySortMode = "alphabetical" | "overall-ranking" | "skill-score";
export function validCountryId(id: string | null) {
  return sovereignCountries.some((country) => country.id === id) ? id : null;
}
export function toggleCountry(current: string | null, next: string) {
  return current === next ? null : validCountryId(next);
}
export function parseCountryBrowse(params: { get: (key: string) => string | null }) {
  const candidate = params.get("region");
  const region = COUNTRY_ATLAS_REGIONS.includes(candidate as CountryAtlasRegion) ? candidate as CountryAtlasRegion : "All";
  const sort = params.get("sort");
  return {
    country: validCountryId(params.get("country")), search: params.get("q") ?? "", region,
    sort: (sort === "overall-ranking" || sort === "skill-score" ? sort : "alphabetical") as CountrySortMode,
  };
}
export function browseCountries(search: string, region: CountryAtlasRegion, sort: CountrySortMode) {
  return sovereignCountries.filter((country) =>
    (region === "All" || country.region === region) && matchesSearchQuery(search, [country.name, country.region])
  ).sort((a, b) => {
    const order = sort === "overall-ranking" ? a.rank - b.rank : sort === "skill-score" ? b.dominanceScore - a.dominanceScore : 0;
    return order || a.name.localeCompare(b.name);
  });
}
