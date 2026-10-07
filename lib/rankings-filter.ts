import { GAME_DEFINITIONS } from "@/constants/games";
import { COUNTRY_SEARCH_ALIASES, GAME_SEARCH_ALIASES } from "@/constants/search-aliases";
import type { CountryRankingScope, PrototypeCountryRanking } from "@/data/country-rankings";
import { normalizeSearchText } from "@/lib/search";

const gameFields = GAME_DEFINITIONS.map((game) => ({
  id: game.id,
  label: game.name === "CS2" ? "Counter-Strike 2" : game.name,
  names: [game.name, ...(GAME_SEARCH_ALIASES[game.id] ?? [])].map(normalizeSearchText),
}));

export type RankingFilterGroup = "Countries" | "Regions" | "Games";
export type RankingFilterValue = {
  id: string;
  group: RankingFilterGroup;
  label: string;
  fields: readonly string[];
};

/** Values come only from rows in the current scope, not the global search index. */
export function rankingFilterValues(rows: readonly PrototypeCountryRanking[], scope: CountryRankingScope): RankingFilterValue[] {
  const values = new Map<string, RankingFilterValue>();
  for (const row of rows) {
    values.set(`country:${row.countryId}`, { id: `country:${row.countryId}`, group: "Countries", label: row.country,
      fields: [row.country, row.countryCode, ...(COUNTRY_SEARCH_ALIASES[row.countryCode.toLowerCase()] ?? [])].map(normalizeSearchText) });
    values.set(`region:${row.region}`, { id: `region:${row.region}`, group: "Regions", label: row.region, fields: [normalizeSearchText(row.region)] });
    const gameLabel = scope === "Overall" ? row.bestGame ?? "" : scope;
    if (!gameLabel) continue;
    const game = gameFields.find((candidate) => candidate.names.includes(normalizeSearchText(gameLabel)));
    const id = `game:${game?.id ?? normalizeSearchText(gameLabel)}`;
    values.set(id, { id, group: "Games", label: game?.label ?? gameLabel, fields: game?.names ?? [normalizeSearchText(gameLabel)] });
  }
  return [...values.values()];
}

export function suggestRankingFilters(values: readonly RankingFilterValue[], query: string): RankingFilterValue[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  const matches = values.flatMap((value) => {
    const rank = value.fields.some((field) => field === normalized) ? 0
      : value.fields.some((field) => field.startsWith(normalized)) ? 1
        : value.fields.some((field) => field.split(" ").some((word) => word.startsWith(normalized))) ? 2
          : value.fields.some((field) => field.includes(normalized)) ? 3 : null;
    return rank === null ? [] : [{ value, rank }];
  });
  // Limit each group independently so a common country prefix cannot hide games.
  return (["Countries", "Regions", "Games"] as const).flatMap((group) => matches
    .filter((match) => match.value.group === group)
    .sort((a, b) => a.rank - b.rank || a.value.label.localeCompare(b.value.label, "en"))
    .slice(0, 5).map((match) => match.value));
}

/** Narrow only the supplied scope's rows. Never rank global results or navigate. */
export function filterRankings(
  rows: readonly PrototypeCountryRanking[],
  scope: CountryRankingScope,
  query: string,
): PrototypeCountryRanking[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [...rows];
  const exactGame = gameFields.find((game) => game.names.includes(normalized));

  return rows.filter((row) => {
    // Overall exposes best game; a game-specific row belongs to that scope.
    const gameLabel = scope === "Overall" ? row.bestGame ?? "" : scope;
    const normalizedGame = normalizeSearchText(gameLabel);
    const game = gameFields.find((candidate) => candidate.names.includes(normalizedGame));
    const fields = [
      row.country, row.region, row.countryCode,
      ...(COUNTRY_SEARCH_ALIASES[row.countryCode.toLowerCase()] ?? []),
    ];
    // An explicit alias such as League means LoL, not Rocket League.
    const gameMatches = exactGame ? game?.id === exactGame.id
      : [normalizedGame, ...(game?.names ?? [])].some((field) => field.includes(normalized));
    return gameMatches || fields.some((field) => normalizeSearchText(field).includes(normalized));
  });
}
