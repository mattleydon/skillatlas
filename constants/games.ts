export const GAME_DEFINITIONS = [
  { id: "cs2", name: "CS2" },
  { id: "league", name: "League of Legends" },
  { id: "valorant", name: "Valorant" },
  { id: "fortnite", name: "Fortnite" },
  { id: "rocketLeague", name: "Rocket League" },
  { id: "chess", name: "Chess" },
] as const;

export type GameId = (typeof GAME_DEFINITIONS)[number]["id"];
export type Game = (typeof GAME_DEFINITIONS)[number]["name"];

export const GAME_IDS: readonly GameId[] = GAME_DEFINITIONS.map((game) => game.id);
export const GAMES: readonly Game[] = GAME_DEFINITIONS.map((game) => game.name);
export const GAME_LABELS = Object.fromEntries(
  GAME_DEFINITIONS.map((game) => [game.id, game.name])
) as Record<GameId, Game>;
