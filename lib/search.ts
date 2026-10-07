/** Shared normalization for identity lookup; existing substring filters retain their semantics. */
export function normalizeSearchText(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function matchesSearchQuery(query: string, fields: readonly string[]) {
  const normalisedQuery = query.trim().toLowerCase();

  if (!normalisedQuery) return true;

  return fields.join(" ").toLowerCase().includes(normalisedQuery);
}
