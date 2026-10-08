export const AVATAR_BUCKET = "member-avatars";
export const AVATAR_INPUT_LIMIT = 2 * 1024 * 1024;
export const AVATAR_OUTPUT_LIMIT = 256 * 1024;
export const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function avatarStoragePath(username: string) {
  return `${username.toLowerCase()}/avatar.webp`;
}

export function avatarUrl(username: string, version: string | null | undefined) {
  if (!version) return null;
  return `/members/${encodeURIComponent(username)}/avatar/${encodeURIComponent(version)}`;
}

export function validateAvatarFile(file: { size: number; type: string }) {
  if (file.size < 1 || file.size > AVATAR_INPUT_LIMIT) return "Choose an image no larger than 2 MiB.";
  if (!(AVATAR_MIME_TYPES as readonly string[]).includes(file.type)) return "Choose a JPEG, PNG or WebP image.";
  return null;
}
