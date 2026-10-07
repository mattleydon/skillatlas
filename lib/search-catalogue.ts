// Imported by the server layout, not the client palette. Only this small identity
// projection is serialized; large historical/competitive fixture fields stay out.
import { sovereignCountries } from "@/data/countries";
import { prototypePlayers } from "@/app/profiles/player-data";
import { GAME_DEFINITIONS } from "@/constants/games";
import { EXPLORE_NAV_ITEMS, RANKING_NAV_ITEMS, ROUTES } from "@/constants/routes";
import { COUNTRY_SEARCH_ALIASES, GAME_SEARCH_ALIASES, METHODOLOGY_SEARCH_ALIASES } from "@/constants/search-aliases";
import type { SearchRecord } from "@/lib/global-search";

const pages = [
  ...RANKING_NAV_ITEMS, ...EXPLORE_NAV_ITEMS,
  { label: "Atlas", href: ROUTES.atlas, description: "Spatial and global discovery" },
  { label: "Explore", href: ROUTES.countries, description: "Explore the country atlas" },
  { label: "Forum", href: ROUTES.forum, description: "Community discussion prototype" },
  { label: "About", href: ROUTES.about, description: "About SkillAtlas" },
  { label: "Methodology", href: ROUTES.methodology, description: "Evidence, confidence and data states" },
  { label: "SkillInvaders", href: ROUTES.spaceInvaders, description: "Play the arcade game" },
];
export const PUBLIC_SEARCH_RECORDS: readonly SearchRecord[] = [
  ...pages.map((page): SearchRecord => ({ id: page.label.toLowerCase().replaceAll(" ", "-"), type: "pages", label: page.label,
    aliases: page.href === ROUTES.methodology ? METHODOLOGY_SEARCH_ALIASES : [], href: page.href, context: page.description, visibility: "public" })),
  ...sovereignCountries.map((country): SearchRecord => ({ id: country.id, type: "countries", label: country.name,
    aliases: [country.flagCode, ...(COUNTRY_SEARCH_ALIASES[country.flagCode.toLowerCase()] ?? [])],
    href: `${ROUTES.countries}?country=${encodeURIComponent(country.id)}`, context: country.region, flagCode: country.flagCode, visibility: "public" })),
  ...GAME_DEFINITIONS.map((game): SearchRecord => ({ id: game.id, type: "games", label: game.name,
    aliases: GAME_SEARCH_ALIASES[game.id] ?? [], href: `${ROUTES.games}#entity-${game.id}`, context: "Game catalogue · Intelligence in development", visibility: "public" })),
  ...prototypePlayers.map((player): SearchRecord => ({ id: player.id, type: "players", label: player.handle, handle: player.handle,
    aliases: [player.realName], href: `${ROUTES.players}?player=${encodeURIComponent(player.id)}#player-${player.id}`,
    context: `${player.realName} · ${player.country} · ${player.game} · FIXTURE / DEMO`, visibility: "public" })),
];
