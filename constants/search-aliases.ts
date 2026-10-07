/** Explicit mappings approved by the Global Search V0.1 brief. Keys are existing
 * ISO alpha-2 country identities / GAME_DEFINITIONS IDs, never inferred entities.
 * Alpha-2 codes come directly from the country catalogue; only listed alpha-3
 * abbreviations are supported here. No ambiguous two-letter fuzzy expansion. */
export const COUNTRY_SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  us: ["United States", "United States of America", "USA", "U.S.", "U.S.A."],
  gb: ["UK", "Britain", "Great Britain", "United Kingdom", "GBR"],
  ae: ["UAE", "United Arab Emirates"],
  kr: ["Korea", "South Korea", "KOR"],
  au: ["AUS"],
};

export const GAME_SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  cs2: ["CS", "CS2", "Counter-Strike", "Counter-Strike 2"],
  league: ["LoL", "League", "League of Legends"],
  rocketLeague: ["RL", "Rocket League"],
};

export const METHODOLOGY_SEARCH_ALIASES = [
  "evidence", "confidence", "data state", "fixture", "demo", "fixture/demo",
] as const;
