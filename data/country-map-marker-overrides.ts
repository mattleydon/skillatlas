export type CountryMapMarker = {
  countryCode: string;
  longitude: number;
  latitude: number;
};

/**
 * Natural Earth 1:10m Admin 0 country LABEL_X/LABEL_Y positions for sovereign
 * countries omitted from both the checked-in 1:110m polygon layer and its
 * tiny-country point layer. See data/README.md for the source revision.
 */
export const COUNTRY_MAP_MARKER_OVERRIDES: readonly CountryMapMarker[] = [
  { countryCode: "AD", longitude: 1.539409, latitude: 42.547643 },
  { countryCode: "AG", longitude: -61.790612, latitude: 17.352249 },
  { countryCode: "CV", longitude: -23.639434, latitude: 15.074761 },
  { countryCode: "DM", longitude: -61.344958, latitude: 15.458829 },
  { countryCode: "GD", longitude: -61.680461, latitude: 12.113156 },
  { countryCode: "KN", longitude: -62.757975, latitude: 17.336558 },
  { countryCode: "LC", longitude: -60.980094, latitude: 13.892371 },
  { countryCode: "LI", longitude: 9.559439, latitude: 47.111405 },
  { countryCode: "MC", longitude: 7.398291, latitude: 43.739652 },
  { countryCode: "SC", longitude: 55.480175, latitude: -4.676659 },
  { countryCode: "SM", longitude: 12.441206, latitude: 43.933916 },
  { countryCode: "VA", longitude: 12.453418, latitude: 41.903323 },
  { countryCode: "VC", longitude: -61.3359, latitude: 13.0879 },
] as const;
