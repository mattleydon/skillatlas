import { GAME_IDS } from "@/constants/games";
import { PLATFORM_DEFINITIONS } from "@/constants/platforms";

export function parseIdentityIds(raw: FormDataEntryValue | null, allowed: readonly string[]) {
  try {
    const value: unknown = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(value) || value.some((id) => typeof id !== "string" || !allowed.includes(id))
      || new Set(value).size !== value.length) return { valid: false as const };
    return { valid: true as const, value: value as string[] };
  } catch {
    return { valid: false as const };
  }
}

export function validateGamingSince(raw: string, currentYear = new Date().getUTCFullYear()) {
  const value = raw.trim();
  if (!value) return { valid: true as const, value: null };
  if (!/^\d{4}$/.test(value) || Number(value) < 1000 || Number(value) > currentYear) {
    return { valid: false as const, message: "Enter a four-digit year no later than the current year, or leave it empty." };
  }
  return { valid: true as const, value: Number(value) };
}

export function parseGamingIdentity(formData: FormData) {
  const games = parseIdentityIds(formData.get("favouriteGameIds"), GAME_IDS);
  if (!games.valid) return { valid: false as const, field: "favouriteGames" as const, message: "Choose unique games from the SkillAtlas catalogue." };
  const platforms = parseIdentityIds(formData.get("platformIds"), PLATFORM_DEFINITIONS.map((platform) => platform.id));
  if (!platforms.valid) return { valid: false as const, field: "platforms" as const, message: "Choose platforms from the available options." };
  const year = validateGamingSince(String(formData.get("gamingSince") ?? ""));
  if (!year.valid) return { valid: false as const, field: "gamingSince" as const, message: year.message };
  return {
    valid: true as const,
    value: {
      p_game_ids: games.value,
      p_games_is_public: games.value.length > 0 && formData.has("favouriteGamesIsPublic"),
      p_platform_ids: platforms.value,
      p_platforms_is_public: platforms.value.length > 0 && formData.has("platformsIsPublic"),
      p_gaming_since: year.value ?? 0,
      p_gaming_since_is_public: year.value !== null && formData.has("gamingSinceIsPublic"),
    },
  };
}
