import { sovereignCountries } from "@/data/countries";

// Profile expression only. Never feed this catalogue into competitive geography,
// ranking attribution, country routes, or Global Search country entities.
export type IdentityPlace = {
  id: string;
  name: string;
  kind: "sovereign_country" | "constituent_country";
  parentCountryId: string | null;
  flagCode: string | null;
  region: string;
};

export const CONSTITUENT_IDENTITY_PLACES: readonly IdentityPlace[] = [
  { id: "scotland", name: "Scotland", kind: "constituent_country", parentCountryId: "united-kingdom", flagCode: "gb-sct", region: "Europe" },
  { id: "england", name: "England", kind: "constituent_country", parentCountryId: "united-kingdom", flagCode: "gb-eng", region: "Europe" },
  { id: "wales", name: "Wales", kind: "constituent_country", parentCountryId: "united-kingdom", flagCode: "gb-wls", region: "Europe" },
  // No dedicated flag is asserted for Northern Ireland. Use the neutral fallback.
  { id: "northern-ireland", name: "Northern Ireland", kind: "constituent_country", parentCountryId: "united-kingdom", flagCode: null, region: "Europe" },
];

export const IDENTITY_PLACES: readonly IdentityPlace[] = [
  ...sovereignCountries.map((country): IdentityPlace => ({
    id: country.id, name: country.name, kind: "sovereign_country",
    parentCountryId: null, flagCode: country.flagCode, region: country.region,
  })),
  ...CONSTITUENT_IDENTITY_PLACES,
].sort((left, right) => left.name.localeCompare(right.name));
