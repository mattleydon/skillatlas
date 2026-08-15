export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;

export const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "api",
  "auth",
  "account",
  "accounts",
  "member",
  "members",
  "profile",
  "profiles",
  "rankings",
  "user-rankings",
  "live-rankings",
  "world-map",
  "countries",
  "players",
  "forum",
  "about",
  "settings",
  "support",
  "help",
  "system",
  "skillatlas",
] as const;

export const USERNAME_HTML_PATTERN = "[A-Za-z0-9](?:[A-Za-z0-9_]{1,22}[A-Za-z0-9])";

const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9_]{1,22}[A-Za-z0-9])$/;
const RESERVED_USERNAME_SET = new Set<string>(RESERVED_USERNAMES);

export type UsernameValidation =
  | { valid: true; value: string }
  | { valid: false; message: string };

export function validateUsername(value: string): UsernameValidation {
  if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) {
    return { valid: false, message: "Use 3 to 24 characters." };
  }

  if (!USERNAME_PATTERN.test(value)) {
    return {
      valid: false,
      message: "Use letters, numbers, and underscores, starting and ending with a letter or number.",
    };
  }

  if (RESERVED_USERNAME_SET.has(value.toLowerCase())) {
    return { valid: false, message: "That username is reserved by SkillAtlas." };
  }

  return { valid: true, value };
}

export function isCapitalizationOnlyCorrection(currentUsername: string, nextUsername: string) {
  return (
    currentUsername !== nextUsername &&
    currentUsername.toLowerCase() === nextUsername.toLowerCase()
  );
}

export function validateDisplayName(value: string) {
  const displayName = value.trim();

  if (!displayName || displayName.length > 50 || /[\u0000-\u001f\u007f]/.test(displayName)) {
    return {
      valid: false as const,
      message: "Use a display name between 1 and 50 characters.",
    };
  }

  return { valid: true as const, value: displayName };
}
