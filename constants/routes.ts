export const ROUTES = {
  rankings: "/",
  userRankings: "/user-rankings",
  liveRankings: "/live-rankings",
  worldMap: "/world-map",
  countries: "/countries",
  players: "/profiles",
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

export const PRIMARY_NAV_ITEMS = [
  { label: "World Map", href: ROUTES.worldMap },
  { label: "Countries", href: ROUTES.countries },
  { label: "Players", href: ROUTES.players },
  { label: "Forum", href: ROUTES.forum },
  { label: "About", href: ROUTES.about },
] as const;

export function countryRoute(countryId: string) {
  return `${ROUTES.countries}/${encodeURIComponent(countryId)}`;
}

export function memberRoute(username: string) {
  return `/members/${encodeURIComponent(username)}`;
}
