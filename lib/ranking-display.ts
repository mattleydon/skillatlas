export function trendLabel(trend: number) {
  if (trend > 0) return `▲ ${trend}`;
  if (trend < 0) return `▼ ${Math.abs(trend)}`;
  return "—";
}

export function trendClass(trend: number) {
  if (trend > 0) return "text-[#19d3cf]";
  if (trend < 0) return "text-[#ff2fa8]";
  return "text-gray-500";
}
