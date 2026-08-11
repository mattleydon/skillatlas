const CONFIGURATION_MESSAGE =
  "SkillAtlas authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";

export const SUPABASE_AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export class SupabaseConfigurationError extends Error {
  constructor() {
    super(CONFIGURATION_MESSAGE);
    this.name = "SupabaseConfigurationError";
  }
}

function normalizeProjectUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
}

export function hasSupabasePublicConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

export function getSupabasePublicConfig() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!rawUrl || !anonKey) {
    throw new SupabaseConfigurationError();
  }

  const url = normalizeProjectUrl(rawUrl);

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new SupabaseConfigurationError();
    }
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) throw error;
    throw new SupabaseConfigurationError();
  }

  return { url, anonKey } as const;
}
