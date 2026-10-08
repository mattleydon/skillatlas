// Broad, declared gaming identity only; not devices, telemetry or preferences.
export const PLATFORM_DEFINITIONS = [
  { id: "pc", name: "PC" },
  { id: "playstation", name: "PlayStation" },
  { id: "xbox", name: "Xbox" },
  { id: "nintendo", name: "Nintendo" },
  { id: "mobile", name: "Mobile" },
] as const;
export type PlatformId = (typeof PLATFORM_DEFINITIONS)[number]["id"];
