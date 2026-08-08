export function matchesSearchQuery(query: string, fields: readonly string[]) {
  const normalisedQuery = query.trim().toLowerCase();

  if (!normalisedQuery) return true;

  return fields.join(" ").toLowerCase().includes(normalisedQuery);
}
