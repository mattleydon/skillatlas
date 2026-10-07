import type { HeaderMemberSnapshot } from "@/app/auth/header-state";
import { memberRoute, ROUTES } from "@/constants/routes";
import { normalizeSearchText } from "@/lib/search";

export type SearchType = "countries" | "games" | "players" | "teams" | "members" | "pages";
export type SearchRecord = {
  id: string;
  type: SearchType;
  label: string;
  aliases: readonly string[];
  handle?: string;
  href: string;
  context: string;
  flagCode?: string;
  visibility: "public" | "signed-in";
};
export const SEARCH_GROUP_LABELS: Record<SearchType, string> = {
  countries: "Countries", games: "Games", players: "Players", teams: "Teams", members: "Members", pages: "Pages",
};
type IndexedRecord = { record: SearchRecord; label: string; aliases: string[]; handle: string };
export function createSearchIndex(records: readonly SearchRecord[]): IndexedRecord[] {
  return records.map((record) => ({ record, label: normalizeSearchText(record.label),
    aliases: record.aliases.map(normalizeSearchText), handle: normalizeSearchText(record.handle ?? "") }));
}

/** Identity is the existing server-verified, allowlisted header snapshot only.
 * Never enumerate profiles or infer signed-in state from browser cookies. */
export function memberSearchRecords(member: HeaderMemberSnapshot | { status: "checking" }): SearchRecord[] {
  if (member.status === "signed_out") return [
    { id: "sign-in", type: "pages", label: "Sign in", aliases: ["login"], href: ROUTES.authSignIn, context: "Access your account", visibility: "public" },
    { id: "sign-up", type: "pages", label: "Create account", aliases: ["sign up", "register", "create profile"], href: ROUTES.authSignUp, context: "Verify your email to get started", visibility: "public" },
  ];
  if (member.status !== "profile_complete" && member.status !== "profile_incomplete") return [];
  const records: SearchRecord[] = [
    { id: "account", type: "pages", label: "Account", aliases: ["settings", "privacy", "edit profile"], href: ROUTES.account, context: "Your identity and privacy controls", visibility: "signed-in" },
  ];
  if (member.status === "profile_incomplete") records.push({ id: "onboarding", type: "pages", label: "Create member profile", aliases: ["profile", "onboarding"], href: ROUTES.accountOnboarding, context: "Choose your public identity", visibility: "signed-in" });
  else records.push({ id: member.username.toLowerCase(), type: "members", label: member.displayName.trim() || `@${member.username}`,
    handle: member.username, aliases: ["my profile", "profile"], href: memberRoute(member.username), context: `@${member.username} · Your public profile`, visibility: "signed-in" });
  return records;
}

// Conservative edit distance: one insertion/deletion/substitution or adjacent
// transposition, full names only, >=5 characters, identical initial character.
function oneEditAway(query: string, value: string) {
  if (Math.abs(query.length - value.length) > 1 || query[0] !== value[0]) return false;
  let i = 0;
  while (i < Math.min(query.length, value.length) && query[i] === value[i]) i++;
  if (query.length === value.length) return query.slice(i + 1) === value.slice(i + 1) ||
    (query[i] === value[i + 1] && query[i + 1] === value[i] && query.slice(i + 2) === value.slice(i + 2));
  return query.length > value.length ? query.slice(i + 1) === value.slice(i) : query.slice(i) === value.slice(i + 1);
}
function matchRank(item: IndexedRecord, query: string) {
  if (item.label === query) return 0;
  if (item.aliases.includes(query)) return 1;
  if (item.handle && item.handle === query) return 2;
  if (query.length < 2) return null;
  const fields = [item.label, item.handle, ...item.aliases].filter(Boolean);
  if (fields.some((field) => field.startsWith(query))) return 3;
  if (fields.some((field) => field.split(" ").some((_, index, words) => words.slice(index).join(" ").startsWith(query)))) return 4;
  if (query.length >= 5 && [item.label, item.handle].filter(Boolean).some((field) => oneEditAway(query, field))) return 5;
  return null;
}
export function searchRecords(index: readonly IndexedRecord[], query: string, limit = 20) {
  const normalized = normalizeSearchText(query.slice(0, 120));
  if (!normalized) return [];
  return index.flatMap((item) => {
    const rank = matchRank(item, normalized);
    return rank === null ? [] : [{ ...item.record, rank }];
  }).sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label, "en") || a.type.localeCompare(b.type, "en") || a.id.localeCompare(b.id, "en")).slice(0, limit);
}

/** Groups are ordered by their strongest match so an exact match's group comes
 * before fuzzy groups. Keyboard order is identical to visual group order. */
export function groupSearchResults(records: readonly SearchRecord[]) {
  const groups = new Map<SearchType, SearchRecord[]>();
  for (const record of records) {
    const group = groups.get(record.type) ?? [];
    group.push(record);
    groups.set(record.type, group);
  }
  return Array.from(groups, ([type, results]) => ({ type, results }));
}
