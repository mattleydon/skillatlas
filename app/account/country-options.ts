import { sovereignCountries } from "@/data/countries";

export const accountCountryOptions = sovereignCountries
  .map((country) => ({
    id: country.id,
    iso2: country.flagCode.toUpperCase(),
    name: country.name,
    region: country.region,
  }))
  .sort((left, right) => left.name.localeCompare(right.name));
