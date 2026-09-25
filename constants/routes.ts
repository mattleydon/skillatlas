export const ROUTES = {
  rankings: "/",
  userRankings: "/user-rankings",
  liveRankings: "/live-rankings",
  atlas: "/world-map",
  worldMap: "/world-map",
  countries: "/countries",
  games: "/games",
  players: "/profiles",
  teams: "/teams",
  members: "/members",
  forum: "/forum",
  about: "/about",
  authSignIn: "/auth/sign-in",
  authSignUp: "/auth/sign-up",
  authVerify: "/auth/verify",
  account: "/account",
  accountOnboarding: "/account/onboarding",
  spaceInvaders: "/space-invaders",
} as const;

export const RANKING_NAV_ITEMS = [
  { label: "Rankings", href: ROUTES.rankings, description: "General country rankings" },
  { label: "User Rankings", href: ROUTES.userRankings, description: "Community country votes" },
  { label: "Live Rankings", href: ROUTES.liveRankings, description: "Rank countries in real time" },
] as const;

export const EXPLORE_NAV_ITEMS = [
  { label: "Countries", href: ROUTES.countries, description: "Sovereign-country atlas" },
  { label: "Games", href: ROUTES.games, description: "Competitive game directory" },
  { label: "Players", href: ROUTES.players, description: "Professional player intelligence" },
  { label: "Teams", href: ROUTES.teams, description: "Team and organisation directory" },
  { label: "Members", href: ROUTES.members, description: "SkillAtlas member discovery" },
] as const;

export const PRIMARY_NAV_ITEMS = [
  { label: "Rankings", href: ROUTES.rankings, family: "rankings" },
  { label: "Atlas", href: ROUTES.atlas, family: "atlas" },
  { label: "Explore", href: ROUTES.countries, family: "explore" },
  { label: "Forum", href: ROUTES.forum },
  { label: "About", href: ROUTES.about },
] as const;

export function countryRoute(countryId: string) {
  return `${ROUTES.countries}/${encodeURIComponent(countryId)}`;
}

export function memberRoute(username: string) {
  return `${ROUTES.members}/${encodeURIComponent(username)}`;
}
