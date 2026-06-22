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
  { id: "ranking", label: "Ranking", description: "Turquoise heat by rank. 1st is darkest, 100th is lightest." },
  { id: "emerging", label: "Emerging Force", description: "Purple heat for countries moving up most over all-time." },
  { id: "loser", label: "Biggest Loser", description: "Pink heat for countries falling down rankings most over all-time." },
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
  if (ring.length <= 140) return ring;
  const step = Math.ceil(ring.length / 140);
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
    const step = Math.max(1, Math.floor(ring.length / 20));
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
    visible: z2 > -0.08,
  };
}

function featureFrontness(feature: PreparedFeature, rotation: { lat: number; lon: number }) {
  const projected = projectPoint(feature.centroid.lon, feature.centroid.lat, rotation);
  return projected.z;
}

function makeCountryPath(ctx: CanvasRenderingContext2D, feature: PreparedFeature, rotation: { lat: number; lon: number }) {
  ctx.beginPath();

  for (const ring of feature.rings) {
    let started = false;

    for (const [lon, lat] of ring) {
      const point = projectPoint(lon, lat, rotation);

      if (!point.visible) {
        started = false;
        continue;
      }

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
    const r = Math.round(0 + t * 19);
    const g = Math.round(104 + t * 107);
    const b = Math.round(110 + t * 97);
    return `rgb(${r}, ${g}, ${b})`;
  }

  const t = (clamped - 11) / 89;
  const r = Math.round(19 + t * 183);
  const g = Math.round(211 + t * 37);
  const b = Math.round(207 + t * 43);
  return `rgb(${r}, ${g}, ${b})`;
}

function buildMetric(feature: PreparedFeature, game: GameKey, heatMode: HeatMode, performance: CountryPerformance | undefined): Metric | null {
  const seed = `${feature.normalisedName}-${game}`;

  const generatedRank = (hashString(`${seed}-rank`) % 100) + 1;
  const generatedUp = (hashString(`${seed}-up`) % 64) + 1;
  const generatedDown = (hashString(`${seed}-down`) % 64) + 1;

  const rank = performance?.rank ?? generatedRank;
  const allTimeMove = performance?.rankMoveAllTime ?? (generatedUp - generatedDown);

  if (heatMode === "ranking") {
    if (rank > 100) return null;

    const isTopTen = rank <= 10;
    const alpha = isTopTen ? 0.94 - (rank - 1) * 0.035 : 0.52 - ((rank - 11) / 89) * 0.34;

    return {
      mode: heatMode,
      rank,
      value: rank,
      color: turquoiseForRank(rank),
      stroke: isTopTen ? "#005e60" : "#19d3cf",
      alpha,
      isTopTen,
    };
  }

  if (heatMode === "emerging") {
    const upValue = Math.max(0, allTimeMove);
    if (upValue < 14) return null;

    const alpha = clamp(0.24 + upValue / 62, 0.24, 0.9);

    return {
      mode: heatMode,
      rank,
      value: upValue,
      color: "#8b5cf6",
      stroke: "#6d28d9",
      alpha,
      isTopTen: upValue >= 46,
    };
  }

  const downValue = Math.max(0, -allTimeMove);
  if (downValue < 14) return null;

  const alpha = clamp(0.24 + downValue / 62, 0.24, 0.9);

  return {
    mode: heatMode,
    rank,
    value: downValue,
    color: "#ff2fa8",
    stroke: "#be185d",
    alpha,
    isTopTen: downValue >= 46,
  };
}

function drawGlobe(
  canvas: HTMLCanvasElement,
  features: PreparedFeature[],
  performanceByName: Map<string, CountryPerformance>,
  rotation: { lat: number; lon: number },
  game: GameKey,
  heatMode: HeatMode,
  selectedCountry: CountryPerformance
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const glow = ctx.createRadialGradient(CENTER - 135, CENTER - 150, 20, CENTER, CENTER, GLOBE_RADIUS);
  glow.addColorStop(0, "rgba(255,255,255,0.96)");
  glow.addColorStop(0.34, "rgba(25,211,207,0.18)");
  glow.addColorStop(0.62, "rgba(255,47,168,0.10)");
  glow.addColorStop(1, "rgba(15,23,42,0.13)");

  ctx.save();
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, GLOBE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.clip();

  ctx.strokeStyle = "rgba(100,116,139,0.18)";
  ctx.lineWidth = 1;

  for (const scale of [0.82, 0.62, 0.42, 0.22]) {
    ctx.beginPath();
    ctx.ellipse(CENTER, CENTER, GLOBE_RADIUS, GLOBE_RADIUS * scale, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(CENTER, CENTER, GLOBE_RADIUS * scale, GLOBE_RADIUS, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const orderedFeatures = features
    .map((feature) => ({
      feature,
      frontness: featureFrontness(feature, rotation),
      performance: performanceByName.get(feature.normalisedName),
    }))
    .filter((item) => item.frontness > -0.15)
    .sort((a, b) => a.frontness - b.frontness);

  for (const item of orderedFeatures) {
    const metric = buildMetric(item.feature, game, heatMode, item.performance);
    const frontFade = clamp((item.frontness + 0.15) / 1.15, 0, 1);

    makeCountryPath(ctx, item.feature, rotation);

    if (metric) {
      ctx.fillStyle = metric.color;
      ctx.globalAlpha = metric.alpha * frontFade;
      ctx.fill();

      ctx.globalAlpha = metric.isTopTen ? 0.92 * frontFade : 0.55 * frontFade;
      ctx.strokeStyle = metric.stroke;
      ctx.lineWidth = metric.isTopTen ? 1.35 : 0.85;
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(100,116,139,0.22)";
      ctx.globalAlpha = 0.18 * frontFade;
      ctx.fill();

      ctx.globalAlpha = 0.22 * frontFade;
      ctx.strokeStyle = "rgba(71,85,105,0.32)";
      ctx.lineWidth = 0.55;
      ctx.stroke();
    }
  }

  const selectedFeature = orderedFeatures.find((item) => item.performance?.id === selectedCountry.id);

  if (selectedFeature) {
    const metric = buildMetric(selectedFeature.feature, game, heatMode, selectedCountry);
    makeCountryPath(ctx, selectedFeature.feature, rotation);

    ctx.globalAlpha = 0.23;
    ctx.strokeStyle = metric?.color ?? "#19d3cf";
    ctx.lineWidth = 12;
    ctx.stroke();

    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }

  ctx.restore();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.74)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, GLOBE_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  const selectedPoint = projectPoint(selectedCountry.anchor.lon, selectedCountry.anchor.lat, rotation);
  if (selectedPoint.visible) {
    const metric = buildMetric(
      { name: selectedCountry.label, normalisedName: normaliseName(selectedCountry.label), rings: [], centroid: selectedCountry.anchor },
      game,
      heatMode,
      selectedCountry
    );

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.strokeStyle = metric?.color ?? "#19d3cf";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(selectedPoint.x - 64, selectedPoint.y + 18, 128, 32, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = metric?.color ?? "#19d3cf";
    ctx.font = "900 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(selectedCountry.label, selectedPoint.x, selectedPoint.y + 34);
    ctx.restore();
  }
}

export default function WorldMapPage() {
  const [features, setFeatures] = useState<PreparedFeature[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [scrolled, setScrolled] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameKey>("cs2");
  const [heatMode, setHeatMode] = useState<HeatMode>("ranking");
  const [selectedCountryId, setSelectedCountryId] = useState(gameData.cs2[0].id);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef({ lat: -8, lon: -8 });
  const velocityRef = useRef({ lat: 0, lon: 0.028 });
  const dragRef = useRef<{ pointerId: number; lastX: number; lastY: number } | null>(null);
  const latestRef = useRef({ features, selectedGame, heatMode, selectedCountryId });

  const activeCountries = gameData[selectedGame];
  const selectedCountry = activeCountries.find((country) => country.id === selectedCountryId) ?? activeCountries[0];
  const activeHeatMode = heatModes.find((mode) => mode.id === heatMode) ?? heatModes[0];

  const performanceByName = useMemo(() => {
    const map = new Map<string, CountryPerformance>();

    for (const country of activeCountries) {
      for (const name of country.geoNames) {
        map.set(normaliseName(name), country);
      }
    }

    return map;
  }, [activeCountries]);

  useEffect(() => {
    latestRef.current = { features, selectedGame, heatMode, selectedCountryId };
  }, [features, selectedGame, heatMode, selectedCountryId]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
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
    setSelectedCountryId(firstCountry.id);
    focusCountry(firstCountry);
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
      const active = gameData[current.selectedGame];
      const selected = active.find((country) => country.id === current.selectedCountryId) ?? active[0];

      const perf = new Map<string, CountryPerformance>();
      for (const country of active) {
        for (const name of country.geoNames) {
          perf.set(normaliseName(name), country);
        }
      }

      if (canvasRef.current) {
        drawGlobe(canvasRef.current, current.features, perf, rotationRef.current, current.selectedGame, current.heatMode, selected);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  function focusCountry(country: CountryPerformance) {
    rotationRef.current = {
      lat: clamp(country.anchor.lat * 0.46, -44, 44),
      lon: -country.anchor.lon,
    };

    velocityRef.current = { lat: 0, lon: 0 };
  }

  function selectCountry(country: CountryPerformance) {
    setSelectedCountryId(country.id);
    focusCountry(country);
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    velocityRef.current = { lat: 0, lon: 0 };

    dragRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current) return;

    const deltaX = event.clientX - dragRef.current.lastX;
    const deltaY = event.clientY - dragRef.current.lastY;

    rotationRef.current = {
      lat: clamp(rotationRef.current.lat - deltaY * 0.22, -64, 64),
      lon: rotationRef.current.lon + deltaX * 0.28,
    };

    velocityRef.current = {
      lat: -deltaY * 0.045,
      lon: deltaX * 0.055,
    };

    dragRef.current.lastX = event.clientX;
    dragRef.current.lastY = event.clientY;
  }

  function handlePointerUp(event: PointerEvent<HTMLCanvasElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // no-op
      }

      dragRef.current = null;
      setIsDragging(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#111827]">
      <WorldMapBackground />

      <header
        className={`fixed left-0 right-0 top-0 z-50 border-b border-[#ff2fa8]/25 bg-white/95 backdrop-blur transition-all duration-300 ${
          scrolled ? "h-[72px]" : "h-[126px]"
        }`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center px-8">
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
            Country outlines stay locked to the globe while heat settings change how dominance is visualised.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.02fr_2.25fr_1.05fr]">
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
                Grab anywhere on the globe and drag. Canvas rendering keeps the country shapes locked in position while spinning.
              </p>
            </div>
          </aside>

          <section className="relative min-h-[720px] overflow-hidden rounded-3xl border border-[#ff2fa8]/40 bg-white/88 shadow-sm backdrop-blur">
            <div className="absolute left-6 top-5 z-20">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#19d3cf]">{gameLabels[selectedGame]}</p>
              <p className="mt-1 text-sm font-semibold text-gray-500">
                {loadState === "ready" ? activeHeatMode.description : "Loading country outlines"}
              </p>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pt-12">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className={`h-[690px] w-[690px] max-w-[96%] select-none touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />

              {loadState !== "ready" && (
                <div className="absolute rounded-2xl border border-[#19d3cf]/25 bg-white/90 px-5 py-4 text-sm font-black text-[#19d3cf] shadow-sm">
                  {loadState === "loading" ? "Loading country outlines..." : "Country outlines could not load"}
                </div>
              )}
            </div>

            <div className="absolute bottom-5 left-6 right-6 z-20 grid gap-3 md:grid-cols-3">
              <MiniStat label="Top Nation" value={activeCountries[0].label} />
              <MiniStat label="Dominance Score" value={`${activeCountries[0].score}`} />
              <MiniStat label={heatMode === "ranking" ? "Darkest Heat" : heatMode === "emerging" ? "Emerging Force" : "Biggest Loser"} value={heatMode === "ranking" ? "#1 Rank" : `${activeCountries.find((item) => (heatMode === "emerging" ? item.rankMoveAllTime > 0 : item.rankMoveAllTime < 0))?.label ?? activeCountries[0].label} ▲`} />
            </div>
          </section>

          <aside className="grid gap-4">
            <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/92 p-5 shadow-sm backdrop-blur">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#19d3cf]">Top Countries</p>

              <div className="space-y-3">
                {activeCountries.slice(0, 7).map((country, index) => (
                  <button
                    key={country.id}
                    onClick={() => selectCountry(country)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all duration-300 ${
                      selectedCountryId === country.id
                        ? "bg-[#19d3cf] text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-[#ff2fa8]/8"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={selectedCountryId === country.id ? "font-black text-white" : "font-black text-[#ff2fa8]"}>{index + 1}</span>
                      <span className="font-black">{country.label}</span>
                    </span>
                    <span className="text-xs font-black">{country.score}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/92 p-5 shadow-sm backdrop-blur">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#ff2fa8]">Country Detail</p>
              <h2 className="text-2xl font-black">{selectedCountry.label}</h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#19d3cf]/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Score</p>
                  <p className="mt-2 text-xl font-black text-[#19d3cf]">{selectedCountry.score}</p>
                </div>

                <div className="rounded-2xl bg-[#ff2fa8]/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">All-Time Move</p>
                  <p className={`mt-2 text-xl font-black ${selectedCountry.rankMoveAllTime >= 0 ? "text-[#8b5cf6]" : "text-[#ff2fa8]"}`}>
                    {selectedCountry.rankMoveAllTime >= 0 ? "▲" : "▼"} {Math.abs(selectedCountry.rankMoveAllTime)}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Why they win</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCountry.why.map((item) => (
                    <span key={item} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Room for improvement</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCountry.improve.map((item) => (
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#ff2fa8]/30 bg-white/90 p-4 shadow-sm backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-black text-[#19d3cf]">{value}</p>
    </div>
  );
}

function WorldMapBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]" />
      <div className="absolute left-1/2 top-[42%] h-[880px] w-[880px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(25,211,207,0.10)_0%,rgba(255,47,168,0.055)_42%,transparent_72%)] blur-2xl" />
      <div className="absolute left-[8%] top-[22%] h-80 w-80 rounded-full bg-[#19d3cf]/[0.07] blur-3xl" />
      <div className="absolute bottom-[14%] right-[8%] h-80 w-80 rounded-full bg-[#ff2fa8]/[0.07] blur-3xl" />
    </div>
  );
}
