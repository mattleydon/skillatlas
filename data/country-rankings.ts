import { type Game } from "@/constants/games";
import {
  sovereignCountries,
  type CountryRegion,
} from "@/data/countries";

export type CountryRankingScope = "Overall" | Game;

export type PrototypeCountryRanking = {
  countryId: string;
  country: string;
  countryCode: string;
  region: CountryRegion;
  score: number;
  scoreChange: number;
  scoreChangeUnit: "points" | "percent";
  rankChange: number;
  bestGame?: string;
  history?: readonly number[];
};

type GameRankingFixture = {
  countryId: string;
  score: number;
  scoreChange: number;
  rankChange: number;
};

// These are the explicit prototype fixtures that existed on the legacy Rankings
// page. They are presentation data only and are not provider-backed rankings.
// Taiwan's legacy League row is intentionally omitted because the public atlas
// scope is the reviewed set of 195 sovereign countries.
const GAME_RANKING_FIXTURES: Record<Game, readonly GameRankingFixture[]> = {
  CS2: [
    { countryId: "denmark", score: 98, scoreChange: 4.2, rankChange: 2 },
    { countryId: "south-korea", score: 96, scoreChange: 3.8, rankChange: 1 },
    { countryId: "china", score: 94, scoreChange: -1.1, rankChange: -1 },
    { countryId: "sweden", score: 91, scoreChange: 1.7, rankChange: 3 },
    { countryId: "usa", score: 89, scoreChange: -0.6, rankChange: -2 },
  ],
  "League of Legends": [
    { countryId: "south-korea", score: 99, scoreChange: 2.9, rankChange: 1 },
    { countryId: "china", score: 97, scoreChange: -0.8, rankChange: -1 },
    { countryId: "denmark", score: 89, scoreChange: 1.4, rankChange: 2 },
    { countryId: "usa", score: 80, scoreChange: -1.2, rankChange: -2 },
  ],
  Valorant: [
    { countryId: "brazil", score: 93, scoreChange: 3.1, rankChange: 2 },
    { countryId: "south-korea", score: 92, scoreChange: 2.4, rankChange: 1 },
    { countryId: "usa", score: 90, scoreChange: -0.7, rankChange: -1 },
    { countryId: "turkey", score: 88, scoreChange: 4.8, rankChange: 4 },
    { countryId: "japan", score: 84, scoreChange: -0.9, rankChange: -2 },
  ],
  Fortnite: [
    { countryId: "usa", score: 95, scoreChange: 2.2, rankChange: 1 },
    { countryId: "canada", score: 91, scoreChange: 2.7, rankChange: 2 },
    { countryId: "united-kingdom", score: 88, scoreChange: -0.5, rankChange: -1 },
    { countryId: "france", score: 87, scoreChange: 0.8, rankChange: 1 },
    { countryId: "brazil", score: 84, scoreChange: -1.3, rankChange: -2 },
  ],
  "Rocket League": [
    { countryId: "france", score: 92, scoreChange: 2, rankChange: 1 },
    { countryId: "netherlands", score: 89, scoreChange: 3.5, rankChange: 3 },
    { countryId: "usa", score: 87, scoreChange: -0.9, rankChange: -1 },
    { countryId: "united-kingdom", score: 85, scoreChange: 1, rankChange: 1 },
    { countryId: "australia", score: 78, scoreChange: -0.4, rankChange: -1 },
  ],
  Chess: [
    { countryId: "india", score: 94, scoreChange: 3.9, rankChange: 2 },
    { countryId: "russia", score: 93, scoreChange: -0.6, rankChange: -1 },
    { countryId: "usa", score: 91, scoreChange: 1.3, rankChange: 1 },
    { countryId: "uzbekistan", score: 88, scoreChange: 5.1, rankChange: 5 },
    { countryId: "china", score: 86, scoreChange: -1.4, rankChange: -2 },
  ],
};

const sovereignCountryById = new Map(
  sovereignCountries.map((country) => [country.id, country]),
);

export const overallCountryRankings: readonly PrototypeCountryRanking[] = [
  ...sovereignCountries,
]
  .sort((left, right) => left.rank - right.rank || left.name.localeCompare(right.name))
  .map((country) => {
    const latestScore = country.oneYearScore.at(-1) ?? country.dominanceScore;
    const previousScore = country.oneYearScore.at(-2) ?? latestScore;

    return {
      countryId: country.id,
      country: country.name,
      countryCode: country.flagCode,
      region: country.region,
      score: country.dominanceScore,
      scoreChange: latestScore - previousScore,
      scoreChangeUnit: "points" as const,
      rankChange: country.trend,
      bestGame: country.bestGame,
      history: country.oneYearScore,
    };
  });

function buildGameCountryRankings(game: Game): PrototypeCountryRanking[] {
  return GAME_RANKING_FIXTURES[game].map((fixture) => {
    const country = sovereignCountryById.get(fixture.countryId);

    if (!country) {
      throw new Error(`Unknown sovereign country fixture: ${fixture.countryId}`);
    }

    return {
      countryId: country.id,
      country: country.name,
      countryCode: country.flagCode,
      region: country.region,
      score: fixture.score,
      scoreChange: fixture.scoreChange,
      scoreChangeUnit: "percent",
      rankChange: fixture.rankChange,
    };
  });
}

export const gameCountryRankings: Record<
  Game,
  readonly PrototypeCountryRanking[]
> = {
  CS2: buildGameCountryRankings("CS2"),
  "League of Legends": buildGameCountryRankings("League of Legends"),
  Valorant: buildGameCountryRankings("Valorant"),
  Fortnite: buildGameCountryRankings("Fortnite"),
  "Rocket League": buildGameCountryRankings("Rocket League"),
  Chess: buildGameCountryRankings("Chess"),
};

export function getPrototypeCountryRankings(scope: CountryRankingScope) {
  return scope === "Overall"
    ? overallCountryRankings
    : gameCountryRankings[scope];
}
