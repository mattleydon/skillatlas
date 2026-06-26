"use client";

import Image from "next/image";
import type { PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type GameKey = "cs2" | "league" | "valorant" | "fortnite" | "rocketLeague" | "chess";
type HeatMode = "ranking" | "emerging" | "loser";
type LonLat = [number, number];

type GeoGeometry =
  | { type: "Polygon"; coordinates: LonLat[][] }
  | { type: "MultiPolygon"; coordinates: LonLat[][][] };

type GeoFeature = {
  type: "Feature";
  properties: { name?: string; NAME?: string; ADMIN?: string; [key: string]: unknown };
  geometry: GeoGeometry | null;
};

type GeoCollection = { type: "FeatureCollection"; features: GeoFeature[] };

type CountryPerformance = {
  id: string;
  label: string;
  geoNames: string[];
  anchor: { lat: number; lon: number };
  rank: number;
  rankMoveAllTime: number;
  score: number;
  why: string[];
  improve: string[];
};

type PreparedFeature = {
  name: string;
  normalisedName: string;
  rings: LonLat[][];
  centroid: { lat: number; lon: number };
};

type ProjectedPoint = { x: number; y: number; z: number; visible: boolean };

type Metric = {
  mode: HeatMode;
  rank: number;
  value: number;
  color: string;
  alpha: number;
  stroke: string;
  isTopTen: boolean;
};

const WORLD_GEOJSON_URL = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

const CANVAS_SIZE = 900;
const CENTER = CANVAS_SIZE / 2;
const GLOBE_RADIUS = 360;

const gameLabels: Record<GameKey, string> = {
  cs2: "CS2",
  league: "League of Legends",
  valorant: "Valorant",
  fortnite: "Fortnite",
  rocketLeague: "Rocket League",
  chess: "Chess",
};

const heatModes: { id: HeatMode; label: string; description: string }[] = [
  { id: "ranking", label: "Ranking", description: "Overall ranking for countries for each game." },
  { id: "emerging", label: "Biggest Gainer", description: "Ranking for countries that have moved up in overall ranking the most over all-time." },
  { id: "loser", label: "Biggest Loser", description: "Ranking for countries that have moved down in overall ranking the most over all-time." },
];

const gameOrder: GameKey[] = ["cs2", "league", "valorant", "fortnite", "rocketLeague", "chess"];

const gameData: Record<GameKey, CountryPerformance[]> = {
  cs2: [
    { id: "denmark", label: "Denmark", geoNames: ["Denmark"], anchor: { lat: 56.2, lon: 9.5 }, rank: 1, rankMoveAllTime: 21, score: 98, why: ["Elite CS systems", "Tactical culture", "LAN history"], improve: ["Larger talent pool", "More aim depth"] },
    { id: "south-korea", label: "South Korea", geoNames: ["South Korea", "Republic of Korea", "Korea, Republic of"], anchor: { lat: 36.5, lon: 127.8 }, rank: 2, rankMoveAllTime: 17, score: 96, why: ["Esports discipline", "Fast practice culture", "Infrastructure"], improve: ["More CS history", "More top-tier teams"] },
    { id: "china", label: "China", geoNames: ["China", "People's Republic of China"], anchor: { lat: 35.8, lon: 104.1 }, rank: 3, rankMoveAllTime: -12, score: 94, why: ["Huge player base", "Investment", "Mechanical ceiling"], improve: ["LAN consistency", "Tactical identity"] },
    { id: "sweden", label: "Sweden", geoNames: ["Sweden"], anchor: { lat: 60.1, lon: 18.6 }, rank: 4, rankMoveAllTime: 31, score: 91, why: ["FPS heritage", "Grassroots scene", "Mechanical skill"], improve: ["Modern team depth", "Youth pipeline"] },
    { id: "usa", label: "USA", geoNames: ["United States of America", "United States", "USA"], anchor: { lat: 39.8, lon: -98.6 }, rank: 5, rankMoveAllTime: -26, score: 89, why: ["Large talent pool", "Creator scene", "Prize exposure"], improve: ["Team discipline", "Tactical identity"] },
    { id: "france", label: "France", geoNames: ["France"], anchor: { lat: 46.2, lon: 2.2 }, rank: 6, rankMoveAllTime: 10, score: 86, why: ["EU pressure", "Strong clubs", "FPS culture"], improve: ["Consistency", "More elite IGLs"] },
    { id: "brazil", label: "Brazil", geoNames: ["Brazil"], anchor: { lat: -14.2, lon: -51.9 }, rank: 7, rankMoveAllTime: -14, score: 84, why: ["Aggressive style", "Passionate scene", "LAN energy"], improve: ["Structure", "Map pool depth"] },
    { id: "australia", label: "Australia", geoNames: ["Australia"], anchor: { lat: -25.3, lon: 133.8 }, rank: 8, rankMoveAllTime: 8, score: 78, why: ["Dedicated scene", "Strong mechanics", "OCE rivalry"], improve: ["International reps", "Ping barrier"] },
  ],
  league: [
    { id: "south-korea", label: "South Korea", geoNames: ["South Korea", "Republic of Korea", "Korea, Republic of"], anchor: { lat: 36.5, lon: 127.8 }, rank: 1, rankMoveAllTime: 9, score: 99, why: ["Elite coaching", "Solo queue depth", "Esports culture"], improve: ["Creative drafting", "Meta risk-taking"] },
    { id: "china", label: "China", geoNames: ["China", "People's Republic of China"], anchor: { lat: 35.8, lon: 104.1 }, rank: 2, rankMoveAllTime: -4, score: 97, why: ["Massive league", "Investment", "Mechanical talent"], improve: ["International consistency", "Macro discipline"] },
    { id: "denmark", label: "Denmark", geoNames: ["Denmark"], anchor: { lat: 56.2, lon: 9.5 }, rank: 3, rankMoveAllTime: 22, score: 89, why: ["Mid-lane legacy", "EU systems", "High-level exports"], improve: ["Domestic scale", "Player depth"] },
    { id: "usa", label: "USA", geoNames: ["United States of America", "United States", "USA"], anchor: { lat: 39.8, lon: -98.6 }, rank: 4, rankMoveAllTime: -28, score: 82, why: ["Big market", "Imports", "Content ecosystem"], improve: ["Native talent", "Practice culture"] },
    { id: "france", label: "France", geoNames: ["France"], anchor: { lat: 46.2, lon: 2.2 }, rank: 5, rankMoveAllTime: 12, score: 81, why: ["EU ecosystem", "Young talent", "Strong orgs"], improve: ["International peaks", "Role depth"] },
    { id: "brazil", label: "Brazil", geoNames: ["Brazil"], anchor: { lat: -14.2, lon: -51.9 }, rank: 6, rankMoveAllTime: 16, score: 77, why: ["Passion", "Solo queue energy", "Regional fandom"], improve: ["Macro control", "Talent retention"] },
  ],
  valorant: [
    { id: "brazil", label: "Brazil", geoNames: ["Brazil"], anchor: { lat: -14.2, lon: -51.9 }, rank: 1, rankMoveAllTime: 34, score: 93, why: ["Aggression", "Aim culture", "LAN confidence"], improve: ["Utility discipline", "Map pool depth"] },
    { id: "south-korea", label: "South Korea", geoNames: ["South Korea", "Republic of Korea", "Korea, Republic of"], anchor: { lat: 36.5, lon: 127.8 }, rank: 2, rankMoveAllTime: 18, score: 92, why: ["Structure", "Utility discipline", "Coaching"], improve: ["Creative mid-rounding", "Peak aim volatility"] },
    { id: "usa", label: "USA", geoNames: ["United States of America", "United States", "USA"], anchor: { lat: 39.8, lon: -98.6 }, rank: 3, rankMoveAllTime: -11, score: 90, why: ["Creator pipeline", "Talent pool", "Org investment"], improve: ["Role stability", "Consistency"] },
    { id: "france", label: "France", geoNames: ["France"], anchor: { lat: 46.2, lon: 2.2 }, rank: 4, rankMoveAllTime: 10, score: 86, why: ["FPS history", "EU scene", "Tactical depth"], improve: ["Star depth", "International finals"] },
    { id: "china", label: "China", geoNames: ["China", "People's Republic of China"], anchor: { lat: 35.8, lon: 104.1 }, rank: 5, rankMoveAllTime: 38, score: 84, why: ["Rapid investment", "Huge player base", "Rising mechanics"], improve: ["Global reps", "Meta adaptation"] },
    { id: "australia", label: "Australia", geoNames: ["Australia"], anchor: { lat: -25.3, lon: 133.8 }, rank: 6, rankMoveAllTime: -8, score: 76, why: ["OCE culture", "Mechanical promise", "Team loyalty"], improve: ["Server distance", "Practice access"] },
  ],
  fortnite: [
    { id: "usa", label: "USA", geoNames: ["United States of America", "United States", "USA"], anchor: { lat: 39.8, lon: -98.6 }, rank: 1, rankMoveAllTime: 7, score: 95, why: ["Creator scene", "Prize exposure", "Huge player base"], improve: ["Consistency", "Burnout management"] },
    { id: "canada", label: "Canada", geoNames: ["Canada"], anchor: { lat: 56.1, lon: -106.3 }, rank: 2, rankMoveAllTime: 25, score: 91, why: ["Mechanical skill", "NA servers", "Tournament depth"], improve: ["Scale", "Team transition"] },
    { id: "france", label: "France", geoNames: ["France"], anchor: { lat: 46.2, lon: 2.2 }, rank: 3, rankMoveAllTime: 14, score: 87, why: ["EU ecosystem", "Technical skill", "Competitive scene"], improve: ["Creator exposure", "Regional dominance"] },
    { id: "brazil", label: "Brazil", geoNames: ["Brazil"], anchor: { lat: -14.2, lon: -51.9 }, rank: 4, rankMoveAllTime: -20, score: 84, why: ["Aggressive play", "Large player base", "Creative meta"], improve: ["Defensive structure", "Tournament stability"] },
    { id: "australia", label: "Australia", geoNames: ["Australia"], anchor: { lat: -25.3, lon: 133.8 }, rank: 5, rankMoveAllTime: 11, score: 81, why: ["OCE grinders", "Competitive spirit", "Mechanical talent"], improve: ["International reps", "Ping barrier"] },
  ],
  rocketLeague: [
    { id: "france", label: "France", geoNames: ["France"], anchor: { lat: 46.2, lon: 2.2 }, rank: 1, rankMoveAllTime: 29, score: 92, why: ["Team play", "Mechanical depth", "EU dominance"], improve: ["Mental reset", "Rotation risk"] },
    { id: "netherlands", label: "Netherlands", geoNames: ["Netherlands"], anchor: { lat: 52.1, lon: 5.3 }, rank: 2, rankMoveAllTime: 35, score: 89, why: ["Fast rotations", "Young talent", "Club systems"], improve: ["LAN experience", "Depth past top players"] },
    { id: "usa", label: "USA", geoNames: ["United States of America", "United States", "USA"], anchor: { lat: 39.8, lon: -98.6 }, rank: 3, rankMoveAllTime: -15, score: 87, why: ["NA depth", "Org backing", "Content pipeline"], improve: ["EU pace adaptation", "Defensive structure"] },
    { id: "australia", label: "Australia", geoNames: ["Australia"], anchor: { lat: -25.3, lon: 133.8 }, rank: 4, rankMoveAllTime: -6, score: 78, why: ["Regional scene", "Dedicated talent", "Team chemistry"], improve: ["Ping barrier", "International reps"] },
    { id: "denmark", label: "Denmark", geoNames: ["Denmark"], anchor: { lat: 56.2, lon: 9.5 }, rank: 5, rankMoveAllTime: 8, score: 76, why: ["EU practice", "Mechanical base", "Small scene efficiency"], improve: ["Depth", "Elite LAN reps"] },
  ],
  chess: [
    { id: "india", label: "India", geoNames: ["India"], anchor: { lat: 20.6, lon: 78.9 }, rank: 1, rankMoveAllTime: 42, score: 94, why: ["Youth wave", "Coaching culture", "Online chess boom"], improve: ["World title conversion", "Veteran depth"] },
    { id: "usa", label: "USA", geoNames: ["United States of America", "United States", "USA"], anchor: { lat: 39.8, lon: -98.6 }, rank: 2, rankMoveAllTime: 13, score: 91, why: ["University chess", "Online platforms", "Elite tournaments"], improve: ["Grassroots scale", "Junior consistency"] },
    { id: "uzbekistan", label: "Uzbekistan", geoNames: ["Uzbekistan"], anchor: { lat: 41.4, lon: 64.6 }, rank: 3, rankMoveAllTime: 48, score: 88, why: ["Young grandmasters", "Team success", "Rapid growth"], improve: ["Depth", "Long-term infrastructure"] },
    { id: "china", label: "China", geoNames: ["China", "People's Republic of China"], anchor: { lat: 35.8, lon: 104.1 }, rank: 4, rankMoveAllTime: -23, score: 86, why: ["Structured training", "Strong federation", "Elite players"], improve: ["Tournament volume", "Visibility"] },
    { id: "france", label: "France", geoNames: ["France"], anchor: { lat: 46.2, lon: 2.2 }, rank: 5, rankMoveAllTime: 9, score: 80, why: ["Club culture", "European events", "Strong juniors"], improve: ["World title pipeline", "Mass participation"] },
  ],
};

type RankedCountry = {
  name: string;
  normalisedName: string;
  feature: PreparedFeature;
  performance?: CountryPerformance;
  rank: number;
  score: number;
  rankMoveAllTime: number;
  rankingStrength: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normaliseName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hashString(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

function getFeatureName(feature: GeoFeature) {
  return feature.properties.name ?? feature.properties.NAME ?? feature.properties.ADMIN ?? "Unknown";
}

function geometryToRings(geometry: GeoGeometry): LonLat[][] {
  if (geometry.type === "Polygon") return geometry.coordinates;
  return geometry.coordinates.flat();
}

function simplifyRing(ring: LonLat[]) {
  if (ring.length <= 90) return ring;
  const step = Math.ceil(ring.length / 90);
  return ring.filter((_, index) => index % step === 0 || index === ring.length - 1);
}

function prepareFeature(feature: GeoFeature): PreparedFeature | null {
  if (!feature.geometry) return null;

  const rings = geometryToRings(feature.geometry)
    .map((ring) => simplifyRing(ring))
    .filter((ring) => ring.length > 2);

  if (rings.length === 0) return null;

  let latTotal = 0;
  let lonTotal = 0;
  let count = 0;

  for (const ring of rings) {
    const step = Math.max(1, Math.floor(ring.length / 16));

    for (let index = 0; index < ring.length; index += step) {
      const [lon, lat] = ring[index];
      latTotal += lat;
      lonTotal += lon;
      count += 1;
    }
  }

  return {
    name: getFeatureName(feature),
    normalisedName: normaliseName(getFeatureName(feature)),
    rings,
    centroid: {
      lat: count ? latTotal / count : 0,
      lon: count ? lonTotal / count : 0,
    },
  };
}

function projectPoint(lon: number, lat: number, rotation: { lat: number; lon: number }): ProjectedPoint {
  const phi = (lat * Math.PI) / 180;
  const lambda = ((lon + rotation.lon) * Math.PI) / 180;
  const tilt = (rotation.lat * Math.PI) / 180;

  const x = Math.cos(phi) * Math.sin(lambda);
  const y = Math.sin(phi);
  const z = Math.cos(phi) * Math.cos(lambda);

  const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
  const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);

  return {
    x: CENTER + x * GLOBE_RADIUS,
    y: CENTER - y2 * GLOBE_RADIUS,
    z: z2,
    visible: z2 > -0.1,
  };
}

function featureFrontness(feature: PreparedFeature, rotation: { lat: number; lon: number }) {
  return projectPoint(feature.centroid.lon, feature.centroid.lat, rotation).z;
}

function makeCountryPath(ctx: CanvasRenderingContext2D, feature: PreparedFeature, rotation: { lat: number; lon: number }) {
  ctx.beginPath();

  for (const ring of feature.rings) {
    let started = false;

    for (const [lon, lat] of ring) {
      const point = projectPoint(lon, lat, rotation);

      if (!started) {
        ctx.moveTo(point.x, point.y);
        started = true;
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }

    if (started) ctx.closePath();
  }
}

function turquoiseForRank(rank: number) {
  const clamped = clamp(rank, 1, 100);

  if (clamped <= 10) {
    const t = (clamped - 1) / 9;
    const r = Math.round(0 + t * 20);
    const g = Math.round(91 + t * 120);
    const b = Math.round(98 + t * 109);
    return `rgb(${r}, ${g}, ${b})`;
  }

  const t = (clamped - 11) / 89;
  const r = Math.round(20 + t * 185);
  const g = Math.round(211 + t * 37);
  const b = Math.round(207 + t * 43);
  return `rgb(${r}, ${g}, ${b})`;
}

function buildPerformanceMap(activeCountries: CountryPerformance[]) {
  const map = new Map<string, CountryPerformance>();

  for (const country of activeCountries) {
    for (const name of country.geoNames) {
      map.set(normaliseName(name), country);
    }
  }

  return map;
}

function buildRankingRows(features: PreparedFeature[], game: GameKey, performanceByName: Map<string, CountryPerformance>) {
  return features
    .map((feature) => {
      const performance = performanceByName.get(feature.normalisedName);
      const rankingSeed = hashString(`${feature.normalisedName}-${game}-ranking`);
      const generatedStrength = rankingSeed % 10000;
      const generatedMove = (hashString(`${feature.normalisedName}-${game}-move`) % 97) - 48;

      const rankingStrength = performance ? 50000 - performance.rank * 250 : generatedStrength;
      const score = performance ? performance.score : Math.round(42 + (generatedStrength / 10000) * 48);
      const rankMoveAllTime = performance ? performance.rankMoveAllTime : generatedMove;

      return {
        name: performance?.label ?? feature.name,
        normalisedName: feature.normalisedName,
        feature,
        performance,
        rank: 999,
        score,
        rankMoveAllTime,
        rankingStrength,
      };
    })
    .sort((a, b) => b.rankingStrength - a.rankingStrength)
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}

function getHeatBaseColor(mode: HeatMode) {
  if (mode === "emerging") return "#8b5cf6";
  if (mode === "loser") return "#ff2fa8";
  return "#19d3cf";
}

function metricForRow(row: RankedCountry | undefined, heatMode: HeatMode): Metric | null {
  if (!row) return null;

  if (heatMode === "ranking") {
    if (row.rank > 100) return null;

    const isTopTen = row.rank <= 10;
    const alpha = isTopTen ? 0.96 - (row.rank - 1) * 0.033 : 0.56 - ((row.rank - 11) / 89) * 0.36;

    return {
      mode: heatMode,
      rank: row.rank,
      value: row.rank,
      color: turquoiseForRank(row.rank),
      stroke: isTopTen ? "#005e60" : "#19d3cf",
      alpha,
      isTopTen,
    };
  }

  if (heatMode === "emerging") {
    const value = Math.max(0, row.rankMoveAllTime);
    if (value < 14) return null;

    return {
      mode: heatMode,
      rank: row.rank,
      value,
      color: "#8b5cf6",
      stroke: "#6d28d9",
      alpha: clamp(0.22 + value / 64, 0.24, 0.9),
      isTopTen: value >= 42,
    };
  }

  const value = Math.max(0, -row.rankMoveAllTime);
  if (value < 14) return null;

  return {
    mode: heatMode,
    rank: row.rank,
    value,
    color: "#ff2fa8",
    stroke: "#be185d",
    alpha: clamp(0.22 + value / 64, 0.24, 0.9),
    isTopTen: value >= 42,
  };
}

function drawCountryBubbleLabel(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, heatBaseColor: string, darkMode: boolean) {
  let fontSize = 13;
  if (label.length >= 34) fontSize = 10;
  else if (label.length >= 25) fontSize = 11;
  else if (label.length >= 19) fontSize = 12;

  const maxBubbleWidth = 292;
  const minBubbleWidth = 96;
  const horizontalPadding = 18;
  const verticalPadding = 8;
  const maxTextWidth = maxBubbleWidth - horizontalPadding * 2;

  function wrapLabel(size: number) {
    ctx.font = `900 ${size}px Arial`;
    const words = label.split(/\s+/).filter(Boolean);
    const lines: string[] = [];

    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (ctx.measureText(testLine).width <= maxTextWidth || !currentLine) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);

    return lines.length ? lines : [label];
  }

  let lines = wrapLabel(fontSize);
  let widestLine = Math.max(...lines.map((line) => ctx.measureText(line).width));

  while (widestLine > maxTextWidth && fontSize > 8) {
    fontSize -= 1;
    lines = wrapLabel(fontSize);
    widestLine = Math.max(...lines.map((line) => ctx.measureText(line).width));
  }

  const lineHeight = fontSize + 4;
  const bubbleWidth = Math.min(maxBubbleWidth, Math.max(minBubbleWidth, Math.ceil(widestLine + horizontalPadding * 2)));
  const bubbleHeight = Math.max(30, Math.ceil(lines.length * lineHeight + verticalPadding * 2));
  const bubbleX = clamp(x - bubbleWidth / 2, 12, CANVAS_SIZE - bubbleWidth - 12);
  const bubbleY = clamp(y - bubbleHeight / 2, 12, CANVAS_SIZE - bubbleHeight - 12);
  const textX = bubbleX + bubbleWidth / 2;
  const firstLineY = bubbleY + bubbleHeight / 2 - ((lines.length - 1) * lineHeight) / 2;

  ctx.save();
  ctx.fillStyle = darkMode ? "rgba(52,64,78,0.96)" : "rgba(255,255,255,0.95)";
  ctx.strokeStyle = heatBaseColor;
  ctx.lineWidth = darkMode ? 1.2 : 1;
  if (darkMode) {
    ctx.shadowColor = "rgba(0,0,0,0.16)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
  }
  ctx.beginPath();
  ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, Math.min(16, bubbleHeight / 2));
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = heatBaseColor;
  ctx.font = `900 ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  lines.forEach((line, index) => {
    ctx.fillText(line, textX, firstLineY + index * lineHeight);
  });

  ctx.restore();
}

function drawGlobe(
  canvas: HTMLCanvasElement,
  features: PreparedFeature[],
  rowByName: Map<string, RankedCountry>,
  rotation: { lat: number; lon: number },
  heatMode: HeatMode,
  selectedKey: string,
  darkMode: boolean
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const heatBaseColor = getHeatBaseColor(heatMode);

  const glow = ctx.createRadialGradient(CENTER - 140, CENTER - 150, 20, CENTER, CENTER, GLOBE_RADIUS);

  if (darkMode) {
    glow.addColorStop(0, "rgba(62,75,90,1)");
    glow.addColorStop(0.48, "rgba(47,58,70,0.99)");
    glow.addColorStop(0.78, "rgba(39,51,65,0.98)");
    glow.addColorStop(1, "rgba(32,43,55,0.97)");
  } else {
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.52, "rgba(255,255,255,1)");
    glow.addColorStop(0.82, "rgba(255,255,255,0.99)");
    glow.addColorStop(1, "rgba(255,255,255,0.98)");
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, GLOBE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.clip();

  ctx.strokeStyle = heatBaseColor;
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 1;

  for (const scale of [0.82, 0.62, 0.42, 0.22]) {
    ctx.beginPath();
    ctx.ellipse(CENTER, CENTER, GLOBE_RADIUS, GLOBE_RADIUS * scale, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(CENTER, CENTER, GLOBE_RADIUS * scale, GLOBE_RADIUS, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  ctx.globalAlpha = 1;

  const orderedFeatures = features
    .map((feature) => ({
      feature,
      row: rowByName.get(feature.normalisedName),
      frontness: featureFrontness(feature, rotation),
    }))
    .filter((item) => item.frontness > -0.1)
    .sort((a, b) => a.frontness - b.frontness);

  for (const item of orderedFeatures) {
    const frontFade = clamp((item.frontness + 0.1) / 1.1, 0, 1);
    const metric = metricForRow(item.row, heatMode);
    makeCountryPath(ctx, item.feature, rotation);

    if (metric) {
      ctx.fillStyle = metric.color;
      ctx.globalAlpha = metric.alpha * frontFade;
      ctx.fill();

      ctx.strokeStyle = heatBaseColor;
      ctx.globalAlpha = metric.isTopTen ? 0.95 * frontFade : 0.62 * frontFade;
      ctx.lineWidth = metric.isTopTen ? 1.45 : 0.9;
      ctx.stroke();
    } else {
      ctx.fillStyle = darkMode ? "rgba(47,58,70,0.72)" : "rgba(255,255,255,0.44)";
      ctx.globalAlpha = darkMode ? 0.46 * frontFade : 0.30 * frontFade;
      ctx.fill();

      ctx.strokeStyle = heatBaseColor;
      ctx.globalAlpha = 0.62 * frontFade;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
  }

  const selectedFeature = orderedFeatures.find((item) => item.feature.normalisedName === selectedKey);

  if (selectedFeature) {
    const metric = metricForRow(selectedFeature.row, heatMode);
    makeCountryPath(ctx, selectedFeature.feature, rotation);

    ctx.strokeStyle = heatBaseColor;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 12;
    ctx.stroke();

    ctx.strokeStyle = heatBaseColor;
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = 2.6;
    ctx.stroke();
  }

  ctx.restore();

  ctx.globalAlpha = 0.20;
  ctx.strokeStyle = heatBaseColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, GLOBE_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;

  if (selectedFeature?.row) {
    const selectedPoint = projectPoint(selectedFeature.row.feature.centroid.lon, selectedFeature.row.feature.centroid.lat, rotation);
    const metric = metricForRow(selectedFeature.row, heatMode);

    if (selectedPoint.visible) {
      drawCountryBubbleLabel(ctx, selectedFeature.row.name, selectedPoint.x, selectedPoint.y + 34, heatBaseColor, darkMode);
    }
  }
}

function findCountryAtPoint(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  features: PreparedFeature[],
  rowByName: Map<string, RankedCountry>,
  rotation: { lat: number; lon: number }
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const candidates = features
    .map((feature) => ({
      feature,
      row: rowByName.get(feature.normalisedName),
      frontness: featureFrontness(feature, rotation),
    }))
    .filter((item) => item.row && item.frontness > -0.1)
    .sort((a, b) => b.frontness - a.frontness);

  for (const candidate of candidates) {
    makeCountryPath(ctx, candidate.feature, rotation);
    if (ctx.isPointInPath(x, y)) return candidate.row ?? null;
  }

  return null;
}

export default function WorldMapPage() {
  const [features, setFeatures] = useState<PreparedFeature[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [scrolled, setScrolled] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameKey>("cs2");
  const [heatMode, setHeatMode] = useState<HeatMode>("ranking");
  const [selectedCountryKey, setSelectedCountryKey] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef({ lat: -8, lon: -8 });
  const velocityRef = useRef({ lat: 0, lon: 0.028 });
  const dragRef = useRef<{ pointerId: number; lastX: number; lastY: number; moved: boolean } | null>(null);
  const latestRef = useRef({ features, selectedGame, heatMode, selectedCountryKey, darkMode });
  const rowByNameRef = useRef<Map<string, RankedCountry>>(new Map());
  const rankingRowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const activeCountries = gameData[selectedGame];
  const performanceByName = useMemo(() => buildPerformanceMap(activeCountries), [activeCountries]);
  const rankingRows = useMemo(() => buildRankingRows(features, selectedGame, performanceByName), [features, selectedGame, performanceByName]);
  const heatRankedRows = useMemo(() => {
    if (heatMode === "emerging") {
      return [...rankingRows].sort((a, b) => b.rankMoveAllTime - a.rankMoveAllTime || a.rank - b.rank);
    }

    if (heatMode === "loser") {
      return [...rankingRows].sort((a, b) => a.rankMoveAllTime - b.rankMoveAllTime || a.rank - b.rank);
    }

    return rankingRows;
  }, [rankingRows, heatMode]);

  const top100Rows = heatRankedRows.slice(0, 100);
  const heatRankByName = useMemo(
    () => new Map(heatRankedRows.map((row, index) => [row.normalisedName, index + 1])),
    [heatRankedRows]
  );
  const rowByName = useMemo(() => new Map(rankingRows.map((row) => [row.normalisedName, row])), [rankingRows]);
  const selectedRow = rowByName.get(selectedCountryKey) ?? top100Rows[0];
  const selectedHeatRank = selectedRow ? heatRankByName.get(selectedRow.normalisedName) ?? selectedRow.rank : 0;
  const activeHeatMode = heatModes.find((mode) => mode.id === heatMode) ?? heatModes[0];

  useEffect(() => {
    rowByNameRef.current = rowByName;
  }, [rowByName]);

  useEffect(() => {
    const rowElement = rankingRowRefs.current.get(selectedCountryKey);
    rowElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedCountryKey]);

  useEffect(() => {
    latestRef.current = { features, selectedGame, heatMode, selectedCountryKey, darkMode };
  }, [features, selectedGame, heatMode, selectedCountryKey, darkMode]);

  useEffect(() => {
    if (!selectedCountryKey && top100Rows[0]) {
      setSelectedCountryKey(top100Rows[0].normalisedName);
      focusCountry(top100Rows[0]);
    }
  }, [selectedCountryKey, top100Rows]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      setDarkMode(document.documentElement.classList.contains("skillatlas-dark"));
    };

    syncTheme();
    window.addEventListener("skillatlas-theme-change", syncTheme);

    return () => window.removeEventListener("skillatlas-theme-change", syncTheme);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      try {
        const response = await fetch(WORLD_GEOJSON_URL);
        if (!response.ok) throw new Error("World map failed to load");

        const data = (await response.json()) as GeoCollection;
        const prepared = data.features
          .map((feature) => prepareFeature(feature))
          .filter((feature): feature is PreparedFeature => Boolean(feature));

        if (!cancelled) {
          setFeatures(prepared);
          setLoadState("ready");
        }
      } catch {
        if (!cancelled) setLoadState("error");
      }
    }

    loadMap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const firstCountry = gameData[selectedGame][0];
    const firstGeoName = normaliseName(firstCountry.geoNames[0]);
    const targetRow = rankingRows.find((row) => row.normalisedName === firstGeoName) ?? top100Rows[0];

    if (targetRow) {
      setSelectedCountryKey(targetRow.normalisedName);
      focusCountry(targetRow);
    }
  }, [selectedGame]);

  useEffect(() => {
    let frame = 0;

    function animate() {
      frame = requestAnimationFrame(animate);

      if (!dragRef.current) {
        velocityRef.current.lon *= 0.955;
        velocityRef.current.lat *= 0.955;

        const idleSpin = Math.abs(velocityRef.current.lon) < 0.008 && Math.abs(velocityRef.current.lat) < 0.008 ? 0.028 : 0;

        rotationRef.current = {
          lat: clamp(rotationRef.current.lat + velocityRef.current.lat, -64, 64),
          lon: rotationRef.current.lon + velocityRef.current.lon + idleSpin,
        };
      }

      const current = latestRef.current;
      const selected = current.selectedCountryKey || "";

      if (canvasRef.current) {
        drawGlobe(canvasRef.current, current.features, rowByNameRef.current, rotationRef.current, current.heatMode, selected, current.darkMode);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  function focusCountry(row: RankedCountry) {
    rotationRef.current = {
      lat: clamp(row.feature.centroid.lat * 0.45, -44, 44),
      lon: -row.feature.centroid.lon,
    };

    velocityRef.current = { lat: 0, lon: 0 };
  }

  function selectRow(row: RankedCountry) {
    setSelectedCountryKey(row.normalisedName);
    focusCountry(row);
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    velocityRef.current = { lat: 0, lon: 0 };

    dragRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current) return;

    const deltaX = event.clientX - dragRef.current.lastX;
    const deltaY = event.clientY - dragRef.current.lastY;

    if (Math.abs(deltaX) + Math.abs(deltaY) > 3) dragRef.current.moved = true;

    rotationRef.current = {
      lat: clamp(rotationRef.current.lat + deltaY * 0.22, -64, 64),
      lon: rotationRef.current.lon + deltaX * 0.28,
    };

    velocityRef.current = {
      lat: deltaY * 0.045,
      lon: deltaX * 0.055,
    };

    dragRef.current.lastX = event.clientX;
    dragRef.current.lastY = event.clientY;
  }

  function handlePointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;

    if (drag?.pointerId === event.pointerId) {
      if (!drag.moved && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = CANVAS_SIZE / rect.width;
        const scaleY = CANVAS_SIZE / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        const clickedRow = findCountryAtPoint(canvasRef.current, x, y, features, rowByName, rotationRef.current);

        if (clickedRow) setSelectedCountryKey(clickedRow.normalisedName);
      }

      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // no-op
      }

      dragRef.current = null;
      setIsDragging(false);
    }
  }

  const selectedWhy = selectedRow?.performance?.why ?? ["Strong player base", "Competitive scene", "Growing esports culture"];
  const selectedImprove = selectedRow?.performance?.improve ?? ["More international results", "Clearer talent pipeline"];
  const selectedMove = selectedRow?.rankMoveAllTime ?? 0;
  const selectedSevenDayRankDelta = selectedRow ? sevenDayRankDelta(selectedRow) : 0;
  const selectedSevenDayPercentDelta = selectedRow ? sevenDayPercentDelta(selectedRow) : 0;

  return (
    <main className={`world-map-shell relative min-h-screen overflow-hidden transition-colors duration-300 ${darkMode ? "world-map-dark bg-[#2f3a46] text-slate-100" : "bg-[#F8FAFC] text-[#111827]"}`}>
      <WorldMapBackground darkMode={darkMode} />

      <style>{`
        .world-map-dark [class*="bg-white"] {
          background-color: rgba(31, 41, 55, 0.92) !important;
        }

        .world-map-dark [class*="bg-gray-50"] {
          background-color: rgba(15, 23, 42, 0.62) !important;
        }

        .world-map-dark [class*="text-gray-"] {
          color: rgb(203, 213, 225) !important;
        }

        .world-map-dark [class*="text-[#111827]"] {
          color: rgb(248, 250, 252) !important;
        }

        .world-map-dark header {
          background-color: rgba(17, 24, 39, 0.96) !important;
        }

        .world-map-dark canvas {
          filter: drop-shadow(0 0 34px rgba(25, 211, 207, 0.08));
        }
      `}</style>

      <header
        className={`fixed left-0 right-0 top-0 z-50 border-b border-[#ff2fa8]/25 bg-white/95 backdrop-blur transition-all duration-300 ${
          scrolled ? "h-[72px]" : "h-[126px]"
        }`}
      >        <div className="mx-auto flex h-full max-w-7xl items-center px-8">
          <div className="mr-14 flex shrink-0 items-center gap-5">
            <a
              href="/space-invaders"
              className={`relative shrink-0 transition-all duration-300 ${
                scrolled ? "h-11 w-11" : "h-24 w-24"
              }`}
            >
              <Image src="/skillatlas-logo.png" alt="SkillAtlas logo" fill className="object-contain" priority />
            </a>

            <a
              href="/"
              className={`relative shrink-0 transition-all duration-300 ${
                scrolled ? "h-7 w-44" : "h-14 w-80"
              }`}
            >
              <Image src="/skillatlas-title.png" alt="SkillAtlas title" fill className="object-contain object-left" priority />
            </a>
          </div>

          <nav className="hidden flex-1 items-center justify-around md:flex">
            {["Rankings", "World Map", "Countries", "Profiles", "User Rankings", "About"].map((item) => (
              <a
                key={item}
                className={`font-semibold transition-all duration-300 ${
                  item === "World Map" ? "text-[#19d3cf]" : "text-gray-700 hover:text-[#19d3cf]"
                } ${scrolled ? "text-sm" : "text-[1rem]"}`}
                href={item === "Rankings" ? "/" : `/${item.toLowerCase().replace(" ", "-")}`}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-8 pb-10 pt-[150px]">
        <div className="mb-6 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#19d3cf]">World Map</p>
          <h1 className="mb-2 text-xl font-black tracking-tight">Spin the globe. See where each game belongs.</h1>
          <p className="text-sm text-gray-600 md:whitespace-nowrap">
            Click a country or ranking row to bring up its profile. Drag the globe in the direction you want it to move. Double-click to zoom in or out.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.02fr_minmax(0,2.25fr)_1.05fr]">
          <aside className="rounded-3xl border border-[#ff2fa8]/40 bg-white/92 p-5 shadow-sm backdrop-blur">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">Select Game</p>

            <div className="grid gap-3">
              {gameOrder.map((game) => (
                <button
                  key={game}
                  onClick={() => setSelectedGame(game)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition-all duration-300 ${
                    selectedGame === game
                      ? "border-[#19d3cf] bg-[#19d3cf] text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-[#ff2fa8] hover:text-[#ff2fa8]"
                  }`}
                >
                  {gameLabels[game]}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#19d3cf]/25 bg-[#19d3cf]/5 p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#19d3cf]">Heat Settings</p>

              <div className="grid gap-2">
                {heatModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setHeatMode(mode.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${
                      heatMode === mode.id
                        ? "border-[#19d3cf] bg-white text-[#111827] shadow-sm"
                        : "border-transparent bg-white/60 text-gray-600 hover:border-[#ff2fa8]/35"
                    }`}
                  >
                    <p className={`text-sm font-black ${mode.id === "emerging" ? "text-[#8b5cf6]" : mode.id === "loser" ? "text-[#ff2fa8]" : "text-[#19d3cf]"}`}>
                      {mode.label}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold leading-snug text-gray-500">{mode.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#ff2fa8]/25 bg-[#ff2fa8]/5 p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff2fa8]">Controls</p>
              <p className="text-xs font-semibold leading-relaxed text-gray-600">
                Click a country to select it. Drag anywhere on the globe to rotate it from its centre point. Double-click to zoom in or out.
              </p>
            </div>
          </aside>

          <section className="relative min-w-0 min-h-[790px] overflow-hidden rounded-3xl border border-[#ff2fa8]/40 bg-white/88 shadow-sm backdrop-blur">
            <div className="absolute left-6 right-6 top-5 z-20">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#19d3cf]">{gameLabels[selectedGame]}</p>
              <p className="mt-1 max-w-full text-sm font-semibold leading-snug text-gray-500">
                {loadState === "ready" ? activeHeatMode.description : "Loading country outlines"}
              </p>
            </div>

            <div className="absolute inset-x-0 top-[38px] flex justify-center overflow-hidden">
              <div className={`relative aspect-square w-full max-w-[560px] origin-center transition-transform duration-300 ${zoomed ? "scale-[1.45]" : "scale-100"}`}>
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className={`absolute inset-0 h-full w-full select-none touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onDoubleClick={() => setZoomed((current) => !current)}
                />
              </div>

              {loadState !== "ready" && (
                <div className="absolute top-1/2 rounded-2xl border border-[#19d3cf]/25 bg-white/90 px-5 py-4 text-sm font-black text-[#19d3cf] shadow-sm">
                  {loadState === "loading" ? "Loading country outlines..." : "Country outlines could not load"}
                </div>
              )}
            </div>

            <div className="absolute bottom-5 left-6 right-6 top-[610px] z-20 grid grid-rows-2 gap-3 md:grid-cols-3">
              <MiniStat label="Selected" value={selectedRow?.name ?? "Loading"} compact />
              <MiniStat label="Rank" value={selectedRow ? `#${selectedHeatRank}` : "-"} compact />
              <MiniStat label="Score" value={selectedRow ? `${selectedRow.score}` : "-"} compact />
              <MiniChartStat label="7 Days Score" row={selectedRow} />
              <MiniStat
                label="7 Days Rank"
                value={selectedRow ? sevenDayRankChange(selectedRow) : "-"}
                compact
                colorClass={selectedSevenDayRankDelta >= 0 ? "text-[#19d3cf]" : "text-[#ff2fa8]"}
              />
              <MiniStat
                label="7 Days %"
                value={selectedRow ? sevenDayPercentChange(selectedRow) : "-"}
                compact
                colorClass={selectedSevenDayPercentDelta >= 0 ? "text-[#19d3cf]" : "text-[#ff2fa8]"}
              />
            </div>
          </section>

          <aside className="grid min-w-0 gap-4">
            <div className="min-w-0 overflow-hidden rounded-3xl border border-[#ff2fa8]/40 bg-white/92 p-5 shadow-sm backdrop-blur">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#19d3cf]">Top 100 Countries</p>

              <div className="max-h-[360px] min-w-0 space-y-3 overflow-y-auto pr-1">
                {top100Rows.map((row, index) => (
                  <button
                    key={row.normalisedName}
                    ref={(node) => {
                      if (node) rankingRowRefs.current.set(row.normalisedName, node);
                      else rankingRowRefs.current.delete(row.normalisedName);
                    }}
                    onClick={() => selectRow(row)}
                    className={`flex w-full min-w-0 max-w-full items-center justify-between gap-3 overflow-hidden rounded-2xl px-4 py-3 text-left transition-all duration-300 ${
                      selectedCountryKey === row.normalisedName
                        ? "bg-[#19d3cf] text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-[#ff2fa8]/8"
                    }`}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <span className={`shrink-0 font-black ${selectedCountryKey === row.normalisedName ? "text-white" : "text-[#ff2fa8]"}`}>{index + 1}</span>
                      <span
                        className={`min-w-0 flex-1 overflow-hidden whitespace-normal font-black [overflow-wrap:normal] [word-break:normal] ${countryNameTextClass(
                          row.name
                        )}`}
                      >
                        {row.name}
                      </span>
                    </span>
                    <span
                      className={`ml-3 flex min-w-[52px] shrink-0 items-center justify-end whitespace-nowrap text-right text-sm font-black tabular-nums leading-none ${top100DisplayColor(
                        heatMode,
                        selectedCountryKey === row.normalisedName
                      )}`}
                    >
                      {top100DisplayValue(row, heatMode)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-3xl border border-[#ff2fa8]/40 bg-white/92 p-5 shadow-sm backdrop-blur">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#ff2fa8]">Country Detail</p>
              <h2 className="text-2xl font-black">{selectedRow?.name ?? "Loading"}</h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#19d3cf]/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Score</p>
                  <p className="mt-2 text-xl font-black text-[#19d3cf]">{selectedRow?.score ?? "-"}</p>
                </div>

                <div className="rounded-2xl bg-[#ff2fa8]/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">All-Time Move</p>
                  <p className={`mt-2 text-xl font-black ${selectedMove >= 0 ? "text-[#8b5cf6]" : "text-[#ff2fa8]"}`}>
                    {selectedMove >= 0 ? "▲" : "▼"} {Math.abs(selectedMove)}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Why they win</p>
                <div className="flex flex-wrap gap-2">
                  {selectedWhy.map((item) => (
                    <span key={item} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Room for improvement</p>
                <div className="flex flex-wrap gap-2">
                  {selectedImprove.map((item) => (
                    <span key={item} className="rounded-full border border-[#ff2fa8]/25 bg-[#ff2fa8]/5 px-3 py-1 text-xs font-bold text-gray-600">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function top100DisplayValue(row: RankedCountry, heatMode: HeatMode) {
  if (heatMode === "emerging") return `▲ ${Math.max(0, row.rankMoveAllTime)}`;
  if (heatMode === "loser") return `▼ ${Math.max(0, -row.rankMoveAllTime)}`;
  return `${row.score}`;
}

function top100DisplayColor(heatMode: HeatMode, selected: boolean) {
  if (selected) return "text-white";
  if (heatMode === "emerging") return "text-[#8b5cf6]";
  if (heatMode === "loser") return "text-[#ff2fa8]";
  return "text-gray-700";
}

function countryNameTextClass(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  const longestWord = words.reduce((longest, word) => Math.max(longest, word.length), 0);
  const totalLength = name.length;

  if (longestWord >= 15 || totalLength >= 38) return "text-[0.72rem] leading-[1.05]";
  if (longestWord >= 12 || totalLength >= 31) return "text-[0.80rem] leading-[1.08]";
  if (longestWord >= 10 || totalLength >= 25) return "text-[0.88rem] leading-[1.1]";
  if (longestWord >= 8 || totalLength >= 20) return "text-[0.96rem] leading-[1.12]";
  return "text-base leading-tight";
}

function sevenDayRankDelta(row: RankedCountry) {
  if (row.performance) {
    const direction = row.performance.rankMoveAllTime >= 0 ? 1 : -1;
    const size = Math.min(6, Math.max(1, Math.round(Math.abs(row.performance.rankMoveAllTime) / 9)));
    return direction * size;
  }

  return (hashString(`${row.normalisedName}-7d-rank`) % 9) - 4;
}

function sevenDayRankChange(row: RankedCountry) {
  const delta = sevenDayRankDelta(row);
  if (delta === 0) return "0";
  return delta > 0 ? `▲ ${delta}` : `▼ ${Math.abs(delta)}`;
}

function sevenDayPercentDelta(row: RankedCountry) {
  const seed = hashString(`${row.normalisedName}-7d-percent`);
  const raw = ((seed % 91) - 35) / 10;

  if (row.performance?.rankMoveAllTime && row.performance.rankMoveAllTime > 0) return Math.abs(raw) + 0.4;
  if (row.performance?.rankMoveAllTime && row.performance.rankMoveAllTime < 0) return -Math.abs(raw) - 0.2;
  return raw;
}

function sevenDayPercentChange(row: RankedCountry) {
  const delta = sevenDayPercentDelta(row);
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
}

function sevenDaySeries(row: RankedCountry) {
  const seed = hashString(`${row.normalisedName}-7d-series`);
  const trend = sevenDayPercentDelta(row) / 5;
  const base = clamp(row.score - 2.5, 30, 99);

  return Array.from({ length: 7 }, (_, index) => {
    const wave = Math.sin((index + (seed % 5)) * 1.25) * 1.4;
    const drift = trend * index;
    return clamp(base + wave + drift, 20, 100);
  });
}

function sevenDaySparklinePath(row: RankedCountry) {
  const series = sevenDaySeries(row);
  const min = Math.min(...series);
  const max = Math.max(...series);
  const spread = Math.max(1, max - min);

  return series
    .map((value, index) => {
      const x = (index / (series.length - 1)) * 100;
      const y = 30 - ((value - min) / spread) * 24;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function miniStatValueSize(value: string, compact: boolean) {
  if (!compact) return "text-xl";

  if (value.length <= 4) return "text-[1.32rem] md:text-[1.48rem]";
  if (value.length <= 9) return "text-[1.12rem] md:text-[1.26rem]";
  if (value.length <= 14) return "text-[0.98rem] md:text-[1.10rem]";
  return "text-[0.86rem] md:text-[0.96rem]";
}

function MiniChartStat({ label, row }: { label: string; row?: RankedCountry }) {
  return (
    <div className="flex h-full flex-col justify-center rounded-2xl border border-[#ff2fa8]/30 bg-white/90 p-5 shadow-sm backdrop-blur">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <svg viewBox="0 0 100 34" className="mt-3 h-12 w-full overflow-visible">
        {row && <path d={sevenDaySparklinePath(row)} fill="none" stroke="#19d3cf" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </div>
  );
}

function MiniStat({ label, value, compact = false, colorClass = "text-[#19d3cf]" }: { label: string; value: string; compact?: boolean; colorClass?: string }) {
  return (
    <div className={`flex h-full flex-col justify-center rounded-2xl border border-[#ff2fa8]/30 bg-white/90 shadow-sm backdrop-blur ${compact ? "p-4" : "p-5"}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <p
        className={`mt-3 max-w-full whitespace-normal break-words font-black leading-[1.08] ${miniStatValueSize(value, compact)} ${colorClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function WorldMapBackground({ darkMode }: { darkMode: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className={`absolute inset-0 transition-colors duration-300 ${darkMode ? "bg-[#2f3a46]" : "bg-[#f8fafc]"}`} />
      <div
        className={`absolute left-[8%] top-[18%] h-72 w-72 rounded-full blur-3xl transition-all duration-300 ${
          darkMode ? "bg-[#19d3cf]/[0.035]" : "bg-transparent"
        }`}
      />
      <div
        className={`absolute bottom-[10%] right-[8%] h-80 w-80 rounded-full blur-3xl transition-all duration-300 ${
          darkMode ? "bg-[#ff2fa8]/[0.025]" : "bg-transparent"
        }`}
      />
    </div>
  );
}
