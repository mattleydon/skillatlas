"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import CountryFlag from "@/app/components/country-flag";
import CompactSelect, {
  type CompactSelectOption,
} from "@/app/components/intelligence-ui/compact-select";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import SearchBar from "@/app/components/search-bar";
import { GAMES, type Game } from "@/constants/games";
import { countryRoute } from "@/constants/routes";
import {
  sovereignCountries,
  type CountryAtlasRecord,
} from "@/data/countries";
import {
  getPrototypeCountryRankings,
  type CountryRankingScope,
  type PrototypeCountryRanking,
} from "@/data/country-rankings";
import { clamp } from "@/lib/math";
import { matchesSearchQuery } from "@/lib/search";
import styles from "./world-map.module.css";

type LonLat = [number, number];

type GeoGeometry =
  | { type: "Polygon"; coordinates: LonLat[][] }
  | { type: "MultiPolygon"; coordinates: LonLat[][][] };

type GeoProperties = {
  ISO_A2?: string;
  POSTAL?: string;
  name?: string;
  NAME?: string;
  NAME_LONG?: string;
  ADMIN?: string;
  SOVEREIGNT?: string;
};

type GeoFeature = {
  type: "Feature";
  properties: GeoProperties;
  geometry: GeoGeometry | null;
};

type GeoCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

type PreparedFeature = {
  key: string;
  name: string;
  normalisedName: string;
  rings: LonLat[][];
  centroid: { lat: number; lon: number };
  countryId?: string;
};

type ProjectedPoint = {
  x: number;
  y: number;
  z: number;
  visible: boolean;
};

type MapView = {
  scale: number;
  translateX: number;
  translateY: number;
};

type ViewMotion = "direct" | "smooth";

type ScopedCountryRanking = PrototypeCountryRanking & {
  rank: number;
};

type DragState = {
  pointerId: number;
  lastX: number;
  lastY: number;
  moved: boolean;
  hadMultiplePointers: boolean;
};

type PinchState = {
  startDistance: number;
  startScale: number;
  anchorX: number;
  anchorY: number;
};

const BASE_GEOJSON_URL = "/data/world-countries-110m.geo.json";
const MICROSTATE_GEOJSON_URL = "/data/world-microstates-10m.geo.json";
const CANVAS_SIZE = 900;
const CENTER = CANVAS_SIZE / 2;
const GLOBE_RADIUS = 360;
const MIN_VIEW_SCALE = 1;
const MAX_VIEW_SCALE = 2.8;
const VIEW_ZOOM_STEP = 1.28;
const INITIAL_ROTATION = { lat: -8, lon: -8 };
const WORLD_VIEW: MapView = { scale: 1, translateX: 0, translateY: 0 };

const countriesById = new Map(
  sovereignCountries.map((country) => [country.id, country])
);
const countriesByCode = new Map(
  sovereignCountries.map((country) => [country.flagCode.toUpperCase(), country])
);
const countriesByName = new Map(
  sovereignCountries.map((country) => [normaliseName(country.name), country])
);
const alphabeticalCountries = [...sovereignCountries].sort((left, right) =>
  left.name.localeCompare(right.name)
);

const GAME_SCOPE_OPTIONS: readonly CompactSelectOption<CountryRankingScope>[] = [
  { value: "Overall", label: "Overall" },
  ...GAMES.map((game) => ({
    value: game,
    label: gameDisplayName(game),
  })),
];

function gameDisplayName(game: Game | string) {
  return game === "CS2" ? "Counter-Strike 2" : game;
}

function scopeDisplayName(scope: CountryRankingScope) {
  return scope === "Overall" ? "Overall" : gameDisplayName(scope);
}

function normaliseName(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
}

function countryForProperties(properties: GeoProperties) {
  for (const code of [properties.ISO_A2, properties.POSTAL]) {
    if (!code || code === "-99") continue;
    const country = countriesByCode.get(code.toUpperCase());
    if (country) return country;
  }

  for (const name of [
    properties.ADMIN,
    properties.NAME_LONG,
    properties.NAME,
    properties.name,
    properties.SOVEREIGNT,
  ]) {
    if (!name) continue;
    const country = countriesByName.get(normaliseName(name));
    if (country) return country;
  }
}

function featureName(feature: GeoFeature) {
  return (
    feature.properties.NAME ??
    feature.properties.name ??
    feature.properties.ADMIN ??
    "Unknown"
  );
}

function geometryToRings(geometry: GeoGeometry): LonLat[][] {
  if (geometry.type === "Polygon") return geometry.coordinates;
  return geometry.coordinates.flat();
}

function simplifyRing(ring: LonLat[]) {
  if (ring.length <= 120) return ring;
  const step = Math.ceil(ring.length / 120);
  return ring.filter(
    (_, index) => index % step === 0 || index === ring.length - 1
  );
}

function prepareFeature(
  feature: GeoFeature,
  key: string,
  countryId?: string
): PreparedFeature | null {
  if (!feature.geometry) return null;

  const rings = geometryToRings(feature.geometry)
    .map(simplifyRing)
    .filter((ring) => ring.length > 2);
  if (rings.length === 0) return null;

  let latitudeTotal = 0;
  let longitudeTotal = 0;
  let pointCount = 0;

  for (const ring of rings) {
    const step = Math.max(1, Math.floor(ring.length / 20));
    for (let index = 0; index < ring.length; index += step) {
      const [longitude, latitude] = ring[index];
      latitudeTotal += latitude;
      longitudeTotal += longitude;
      pointCount += 1;
    }
  }

  const name = featureName(feature);

  return {
    key,
    name,
    normalisedName: normaliseName(name),
    rings,
    centroid: {
      lat: pointCount ? latitudeTotal / pointCount : 0,
      lon: pointCount ? longitudeTotal / pointCount : 0,
    },
    countryId,
  };
}

function prepareFeatures(
  baseCollection: GeoCollection,
  microstateCollection: GeoCollection
) {
  const claimedCountryIds = new Set<string>();
  const prepared: PreparedFeature[] = [];

  function addCollection(collection: GeoCollection, detailed: boolean) {
    collection.features.forEach((feature, index) => {
      const country = countryForProperties(feature.properties);
      const countryId =
        country && !claimedCountryIds.has(country.id) ? country.id : undefined;
      const item = prepareFeature(
        feature,
        (detailed ? "detail-" : "base-") + normaliseName(featureName(feature)) + "-" + index,
        countryId
      );

      if (!item) return;
      if (countryId) claimedCountryIds.add(countryId);
      prepared.push(item);
    });
  }

  addCollection(baseCollection, false);
  addCollection(microstateCollection, true);
  return prepared;
}

function projectPoint(
  longitude: number,
  latitude: number,
  rotation: { lat: number; lon: number }
): ProjectedPoint {
  const phi = (latitude * Math.PI) / 180;
  const lambda = ((longitude + rotation.lon) * Math.PI) / 180;
  const tilt = (rotation.lat * Math.PI) / 180;
  const x = Math.cos(phi) * Math.sin(lambda);
  const y = Math.sin(phi);
  const z = Math.cos(phi) * Math.cos(lambda);
  const rotatedY = y * Math.cos(tilt) - z * Math.sin(tilt);
  const rotatedZ = y * Math.sin(tilt) + z * Math.cos(tilt);

  return {
    x: CENTER + x * GLOBE_RADIUS,
    y: CENTER - rotatedY * GLOBE_RADIUS,
    z: rotatedZ,
    visible: rotatedZ > -0.1,
  };
}

function featureFrontness(
  feature: PreparedFeature,
  rotation: { lat: number; lon: number }
) {
  return projectPoint(feature.centroid.lon, feature.centroid.lat, rotation).z;
}

function makeCountryPath(
  context: CanvasRenderingContext2D,
  feature: PreparedFeature,
  rotation: { lat: number; lon: number }
) {
  context.beginPath();

  for (const ring of feature.rings) {
    let started = false;

    for (const [longitude, latitude] of ring) {
      const point = projectPoint(longitude, latitude, rotation);
      if (!started) {
        context.moveTo(point.x, point.y);
        started = true;
      } else {
        context.lineTo(point.x, point.y);
      }
    }

    if (started) context.closePath();
  }
}

function coverageAlpha(rank: number, coverageCount: number) {
  if (coverageCount <= 1) return 0.9;
  const position = clamp((rank - 1) / (coverageCount - 1), 0, 1);
  return clamp(0.88 - position * 0.66, 0.2, 0.88);
}

function drawCountryLabel(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  darkMode: boolean
) {
  const fontSize = label.length > 24 ? 11 : label.length > 16 ? 12 : 13;
  context.save();
  context.font = "800 " + fontSize + "px Arial";
  const width = clamp(context.measureText(label).width + 28, 92, 260);
  const height = 32;
  const left = clamp(x - width / 2, 12, CANVAS_SIZE - width - 12);
  const top = clamp(y - height / 2, 12, CANVAS_SIZE - height - 12);

  context.fillStyle = darkMode
    ? "rgba(39,51,65,0.96)"
    : "rgba(255,255,255,0.96)";
  context.strokeStyle = "#19d3cf";
  context.lineWidth = 1.4;
  context.beginPath();
  context.roundRect(left, top, width, height, 8);
  context.fill();
  context.stroke();
  context.fillStyle = darkMode ? "#e8eef7" : "#111827";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, left + width / 2, top + height / 2 + 0.5);
  context.restore();
}

function drawGlobe(
  canvas: HTMLCanvasElement,
  features: PreparedFeature[],
  rankingsByCountryId: ReadonlyMap<string, ScopedCountryRanking>,
  rotation: { lat: number; lon: number },
  selectedCountryId: string | null,
  hoveredCountryId: string | null,
  darkMode: boolean
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const globeGradient = context.createRadialGradient(
    CENTER - 145,
    CENTER - 155,
    20,
    CENTER,
    CENTER,
    GLOBE_RADIUS
  );

  if (darkMode) {
    globeGradient.addColorStop(0, "#354250");
    globeGradient.addColorStop(0.58, "#273341");
    globeGradient.addColorStop(1, "#202b37");
  } else {
    globeGradient.addColorStop(0, "#ffffff");
    globeGradient.addColorStop(0.62, "#f1f5f9");
    globeGradient.addColorStop(1, "#e2e8f0");
  }

  context.save();
  context.beginPath();
  context.arc(CENTER, CENTER, GLOBE_RADIUS, 0, Math.PI * 2);
  context.fillStyle = globeGradient;
  context.fill();
  context.clip();

  context.strokeStyle = darkMode
    ? "rgba(148,163,184,0.16)"
    : "rgba(71,85,105,0.14)";
  context.lineWidth = 1;
  for (const scale of [0.82, 0.62, 0.42, 0.22]) {
    context.beginPath();
    context.ellipse(
      CENTER,
      CENTER,
      GLOBE_RADIUS,
      GLOBE_RADIUS * scale,
      0,
      0,
      Math.PI * 2
    );
    context.stroke();
    context.beginPath();
    context.ellipse(
      CENTER,
      CENTER,
      GLOBE_RADIUS * scale,
      GLOBE_RADIUS,
      0,
      0,
      Math.PI * 2
    );
    context.stroke();
  }

  const coverageCount = rankingsByCountryId.size;
  const orderedFeatures = features
    .map((feature) => ({
      feature,
      frontness: featureFrontness(feature, rotation),
    }))
    .filter((item) => item.frontness > -0.1)
    .sort((left, right) => left.frontness - right.frontness);

  for (const item of orderedFeatures) {
    const frontFade = clamp((item.frontness + 0.1) / 1.1, 0, 1);
    const ranking = item.feature.countryId
      ? rankingsByCountryId.get(item.feature.countryId)
      : undefined;
    makeCountryPath(context, item.feature, rotation);

    if (ranking) {
      context.fillStyle = "#19d3cf";
      context.globalAlpha =
        coverageAlpha(ranking.rank, coverageCount) * frontFade;
      context.fill();
      context.strokeStyle = ranking.rank <= 5 ? "#0f9694" : "#19d3cf";
      context.globalAlpha = (ranking.rank <= 5 ? 0.9 : 0.52) * frontFade;
      context.lineWidth = ranking.rank <= 5 ? 1.45 : 0.8;
      context.stroke();
    } else {
      context.fillStyle = darkMode ? "#354250" : "#cbd5e1";
      context.globalAlpha = (darkMode ? 0.72 : 0.54) * frontFade;
      context.fill();
      context.strokeStyle = darkMode ? "#64748b" : "#94a3b8";
      context.globalAlpha = 0.52 * frontFade;
      context.lineWidth = 0.75;
      context.stroke();
    }
  }

  const hoveredFeature = orderedFeatures.find(
    (item) => item.feature.countryId === hoveredCountryId
  );
  const selectedFeature = orderedFeatures.find(
    (item) => item.feature.countryId === selectedCountryId
  );

  if (hoveredFeature && hoveredCountryId !== selectedCountryId) {
    makeCountryPath(context, hoveredFeature.feature, rotation);
    context.fillStyle = "#19d3cf";
    context.globalAlpha = 0.2;
    context.fill();
    context.strokeStyle = "#19d3cf";
    context.globalAlpha = 0.95;
    context.lineWidth = 2;
    context.stroke();
  }

  if (selectedFeature) {
    makeCountryPath(context, selectedFeature.feature, rotation);
    context.strokeStyle = "#19d3cf";
    context.globalAlpha = 0.2;
    context.lineWidth = 12;
    context.stroke();
    context.strokeStyle = "#19d3cf";
    context.globalAlpha = 1;
    context.lineWidth = 2.8;
    context.stroke();
  }

  context.restore();
  context.globalAlpha = 0.28;
  context.strokeStyle = "#19d3cf";
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(CENTER, CENTER, GLOBE_RADIUS, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 1;

  const labelledFeature = selectedFeature ?? hoveredFeature;
  if (labelledFeature?.feature.countryId) {
    const country = countriesById.get(labelledFeature.feature.countryId);
    const point = projectPoint(
      labelledFeature.feature.centroid.lon,
      labelledFeature.feature.centroid.lat,
      rotation
    );
    if (country && point.visible) {
      drawCountryLabel(
        context,
        country.name,
        point.x,
        point.y + 34,
        darkMode
      );
    }
  }
}

function findCountryAtPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  features: PreparedFeature[],
  rotation: { lat: number; lon: number }
) {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (CANVAS_SIZE / rect.width);
  const y = (clientY - rect.top) * (CANVAS_SIZE / rect.height);
  const candidates = features
    .filter((feature) => feature.countryId)
    .map((feature) => ({
      feature,
      frontness: featureFrontness(feature, rotation),
    }))
    .filter((item) => item.frontness > -0.1)
    .sort((left, right) => right.frontness - left.frontness);

  for (const candidate of candidates) {
    makeCountryPath(context, candidate.feature, rotation);
    if (context.isPointInPath(x, y)) {
      return candidate.feature.countryId ?? null;
    }
  }

  return null;
}

function clampMapView(view: MapView, frame: HTMLDivElement | null) {
  const scale = clamp(view.scale, MIN_VIEW_SCALE, MAX_VIEW_SCALE);
  if (scale <= MIN_VIEW_SCALE + 0.001 || !frame) return WORLD_VIEW;
  const width = frame.clientWidth;
  const height = frame.clientHeight;

  // Desktop uses the whole rectangular map stage as the camera viewport while
  // keeping the rendered globe square and centred inside it. Constrain the
  // transformed globe against that outer viewport rather than the old 640px
  // square so useful panel width remains available during zoom.
  if (width > height + 40) {
    const globeSize = Math.max(
      1,
      Math.min(CANVAS_SIZE, width - 32)
    );
    const globeLeft = (width - globeSize) / 2;
    const globeTop = (height - globeSize) / 2;
    const horizontalLimits = [
      -globeLeft * scale,
      width - (globeLeft + globeSize) * scale,
    ];
    const verticalLimits = [
      -globeTop * scale,
      height - (globeTop + globeSize) * scale,
    ];

    return {
      scale,
      translateX: clamp(
        view.translateX,
        Math.min(...horizontalLimits),
        Math.max(...horizontalLimits)
      ),
      translateY: clamp(
        view.translateY,
        Math.min(...verticalLimits),
        Math.max(...verticalLimits)
      ),
    };
  }

  return {
    scale,
    translateX: clamp(view.translateX, width - width * scale, 0),
    translateY: clamp(view.translateY, height - height * scale, 0),
  };
}

function movementLabel(value: number) {
  if (value > 0) return "▲ +" + value;
  if (value < 0) return "▼ " + Math.abs(value);
  return "—";
}

function scoreMovementLabel(row: ScopedCountryRanking | undefined) {
  if (!row || row.scoreChange === 0) return "—";
  const amount =
    row.scoreChangeUnit === "percent"
      ? Math.abs(row.scoreChange).toFixed(1) + "%"
      : Math.abs(row.scoreChange).toFixed(1) + " pts";
  return (row.scoreChange > 0 ? "▲ +" : "▼ ") + amount;
}

function movementClass(value: number | undefined) {
  if (value && value > 0) return "text-sa-positive";
  if (value && value < 0) return "text-sa-negative";
  return "text-sa-text-technical";
}

function MapControlButton({
  label,
  children,
  onClick,
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={styles.mapControlButton}
    >
      {children}
    </button>
  );
}

function MetricCell({
  label,
  value,
  valueClassName = "",
  detail,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  detail?: string;
}) {
  return (
    <div className={styles.metricCell}>
      <dt className="text-[10px] font-bold uppercase leading-4 tracking-[0.16em] text-sa-text-technical">
        {label}
      </dt>
      <dd className={"mt-sa-1 font-sa-data text-sm font-black " + valueClassName}>
        {value}
      </dd>
      {detail ? (
        <p className="mt-0.5 text-[10px] leading-4 text-sa-text-technical">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function WorldMapBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.backgroundGrid} />
      <div className={styles.backgroundGlow} />
    </div>
  );
}

export default function WorldMapPage() {
  const [features, setFeatures] = useState<PreparedFeature[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [scope, setScope] = useState<CountryRankingScope>("Overall");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(
    null
  );
  const [hoveredCountryId, setHoveredCountryId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = useState<MapView>(WORLD_VIEW);
  const [viewMotion, setViewMotion] = useState<ViewMotion>("direct");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef({ ...INITIAL_ROTATION });
  const velocityRef = useRef({ lat: 0, lon: 0.022 });
  const dragRef = useRef<DragState | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<PinchState | null>(null);
  const viewRef = useRef<MapView>(WORLD_VIEW);
  const hoveredCountryIdRef = useRef<string | null>(null);

  const scopedRankings = useMemo(
    () =>
      getPrototypeCountryRankings(scope).map((ranking, index) => ({
        ...ranking,
        rank: index + 1,
      })),
    [scope]
  );
  const rankingsByCountryId = useMemo(
    () =>
      new Map(
        scopedRankings.map((ranking) => [ranking.countryId, ranking])
      ),
    [scopedRankings]
  );
  const featureByCountryId = useMemo(
    () =>
      new Map(
        features.flatMap((feature) =>
          feature.countryId ? [[feature.countryId, feature] as const] : []
        )
      ),
    [features]
  );
  const selectedCountry = selectedCountryId
    ? countriesById.get(selectedCountryId)
    : undefined;
  const selectedRanking = selectedCountryId
    ? rankingsByCountryId.get(selectedCountryId)
    : undefined;
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return alphabeticalCountries
      .filter((country) =>
        matchesSearchQuery(search, [
          country.name,
          country.region,
          country.bestGame,
        ])
      )
      .slice(0, 8);
  }, [search]);
  const mappedCountryCount = featureByCountryId.size;

  const latestRef = useRef({
    features,
    rankingsByCountryId,
    selectedCountryId,
    hoveredCountryId,
    darkMode,
    reducedMotion,
  });

  const commitView = useCallback((nextView: MapView, motion: ViewMotion) => {
    const constrained = clampMapView(nextView, frameRef.current);
    viewRef.current = constrained;
    setViewMotion(motion);
    setView(constrained);
  }, []);

  const zoomAtClientPoint = useCallback(
    (
      clientX: number,
      clientY: number,
      factor: number,
      motion: ViewMotion
    ) => {
      const frame = frameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      const pointX = clientX - rect.left;
      const pointY = clientY - rect.top;
      const current = viewRef.current;
      const nextScale = clamp(
        current.scale * factor,
        MIN_VIEW_SCALE,
        MAX_VIEW_SCALE
      );
      const worldX = (pointX - current.translateX) / current.scale;
      const worldY = (pointY - current.translateY) / current.scale;

      commitView(
        {
          scale: nextScale,
          translateX: pointX - worldX * nextScale,
          translateY: pointY - worldY * nextScale,
        },
        motion
      );
    },
    [commitView]
  );

  const zoomFromCenter = useCallback(
    (factor: number) => {
      const frame = frameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      zoomAtClientPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        factor,
        reducedMotion ? "direct" : "smooth"
      );
    },
    [reducedMotion, zoomAtClientPoint]
  );

  function focusCountry(countryId: string) {
    const feature = featureByCountryId.get(countryId);
    if (!feature) return;
    rotationRef.current = {
      lat: clamp(feature.centroid.lat * 0.45, -44, 44),
      lon: -feature.centroid.lon,
    };
    velocityRef.current = { lat: 0, lon: 0 };
  }

  function selectCountry(countryId: string, focus = false) {
    setSelectedCountryId(countryId);
    if (focus) focusCountry(countryId);
  }

  function selectSearchCountry(country: CountryAtlasRecord) {
    setSearch(country.name);
    setSearchOpen(false);
    selectCountry(country.id, true);
  }

  function resetWorldView() {
    rotationRef.current = { ...INITIAL_ROTATION };
    velocityRef.current = {
      lat: 0,
      lon: reducedMotion ? 0 : 0.022,
    };
    commitView(WORLD_VIEW, reducedMotion ? "direct" : "smooth");
  }

  useEffect(() => {
    latestRef.current = {
      features,
      rankingsByCountryId,
      selectedCountryId,
      hoveredCountryId,
      darkMode,
      reducedMotion,
    };
  }, [
    darkMode,
    features,
    hoveredCountryId,
    rankingsByCountryId,
    reducedMotion,
    selectedCountryId,
  ]);

  useEffect(() => {
    hoveredCountryIdRef.current = hoveredCountryId;
  }, [hoveredCountryId]);

  useEffect(() => {
    const syncTheme = () => {
      setDarkMode(
        document.documentElement.classList.contains("skillatlas-dark")
      );
    };
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);

    syncTheme();
    syncMotion();
    window.addEventListener("skillatlas-theme-change", syncTheme);
    media.addEventListener("change", syncMotion);
    return () => {
      window.removeEventListener("skillatlas-theme-change", syncTheme);
      media.removeEventListener("change", syncMotion);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      try {
        const [baseResponse, microstateResponse] = await Promise.all([
          fetch(BASE_GEOJSON_URL),
          fetch(MICROSTATE_GEOJSON_URL),
        ]);
        if (!baseResponse.ok || !microstateResponse.ok) {
          throw new Error("A local map data request failed.");
        }

        const [baseCollection, microstateCollection] = (await Promise.all([
          baseResponse.json(),
          microstateResponse.json(),
        ])) as [GeoCollection, GeoCollection];
        const prepared = prepareFeatures(
          baseCollection,
          microstateCollection
        );
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
    const frame = frameRef.current;
    if (!frame) return;

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const factor = clamp(Math.exp(-event.deltaY * 0.0012), 0.82, 1.22);
      zoomAtClientPoint(event.clientX, event.clientY, factor, "direct");
    }

    frame.addEventListener("wheel", handleWheel, { passive: false });
    return () => frame.removeEventListener("wheel", handleWheel);
  }, [zoomAtClientPoint]);

  useEffect(() => {
    let frame = 0;

    function animate() {
      frame = window.requestAnimationFrame(animate);
      const current = latestRef.current;

      if (!dragRef.current && !pinchRef.current) {
        velocityRef.current.lon *= 0.955;
        velocityRef.current.lat *= 0.955;
        const idleSpin =
          !current.reducedMotion &&
          Math.abs(velocityRef.current.lon) < 0.008 &&
          Math.abs(velocityRef.current.lat) < 0.008
            ? 0.022
            : 0;
        rotationRef.current = {
          lat: clamp(
            rotationRef.current.lat + velocityRef.current.lat,
            -64,
            64
          ),
          lon:
            rotationRef.current.lon +
            velocityRef.current.lon +
            idleSpin,
        };
      }

      if (canvasRef.current) {
        drawGlobe(
          canvasRef.current,
          current.features,
          current.rankingsByCountryId,
          rotationRef.current,
          current.selectedCountryId,
          current.hoveredCountryId,
          current.darkMode
        );
      }
    }

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function updateHover(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const countryId = findCountryAtPoint(
      canvas,
      clientX,
      clientY,
      features,
      rotationRef.current
    );
    if (countryId !== hoveredCountryIdRef.current) {
      hoveredCountryIdRef.current = countryId;
      setHoveredCountryId(countryId);
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    velocityRef.current = { lat: 0, lon: 0 };
    setIsDragging(true);

    if (pointersRef.current.size === 1) {
      dragRef.current = {
        pointerId: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false,
        hadMultiplePointers: false,
      };
      pinchRef.current = null;
      return;
    }

    const points = [...pointersRef.current.values()];
    const first = points[0];
    const second = points[1];
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const midpointX = (first.x + second.x) / 2 - rect.left;
    const midpointY = (first.y + second.y) / 2 - rect.top;
    const current = viewRef.current;
    pinchRef.current = {
      startDistance: Math.max(
        1,
        Math.hypot(second.x - first.x, second.y - first.y)
      ),
      startScale: current.scale,
      anchorX: (midpointX - current.translateX) / current.scale,
      anchorY: (midpointY - current.translateY) / current.scale,
    };
    if (dragRef.current) {
      dragRef.current.hadMultiplePointers = true;
      dragRef.current.moved = true;
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!pointersRef.current.has(event.pointerId)) {
      if (event.pointerType !== "touch") {
        updateHover(event.clientX, event.clientY);
      }
      return;
    }

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const points = [...pointersRef.current.values()];
      const first = points[0];
      const second = points[1];
      const frame = frameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      const midpointX = (first.x + second.x) / 2 - rect.left;
      const midpointY = (first.y + second.y) / 2 - rect.top;
      const distance = Math.max(
        1,
        Math.hypot(second.x - first.x, second.y - first.y)
      );
      const scale = clamp(
        pinchRef.current.startScale *
          (distance / pinchRef.current.startDistance),
        MIN_VIEW_SCALE,
        MAX_VIEW_SCALE
      );

      commitView(
        {
          scale,
          translateX: midpointX - pinchRef.current.anchorX * scale,
          translateY: midpointY - pinchRef.current.anchorY * scale,
        },
        "direct"
      );
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.lastX;
    const deltaY = event.clientY - drag.lastY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 3) drag.moved = true;

    rotationRef.current = {
      lat: clamp(rotationRef.current.lat + deltaY * 0.22, -64, 64),
      lon: rotationRef.current.lon + deltaX * 0.28,
    };
    velocityRef.current = {
      lat: deltaY * 0.045,
      lon: deltaX * 0.055,
    };
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    const hadMultiplePointers =
      Boolean(drag?.hadMultiplePointers) || pointersRef.current.size > 1;
    pointersRef.current.delete(event.pointerId);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (pointersRef.current.size === 1 && hadMultiplePointers) {
      const [remainingId, remainingPoint] = [
        ...pointersRef.current.entries(),
      ][0];
      dragRef.current = {
        pointerId: remainingId,
        lastX: remainingPoint.x,
        lastY: remainingPoint.y,
        moved: true,
        hadMultiplePointers: true,
      };
      pinchRef.current = null;
      return;
    }

    if (pointersRef.current.size > 0) return;
    if (drag && !drag.moved && !hadMultiplePointers && canvasRef.current) {
      const countryId = findCountryAtPoint(
        canvasRef.current,
        event.clientX,
        event.clientY,
        features,
        rotationRef.current
      );
      if (countryId) selectCountry(countryId);
    }

    dragRef.current = null;
    pinchRef.current = null;
    setIsDragging(false);
  }

  function handleMapKeyDown(
    event: ReactKeyboardEvent<HTMLCanvasElement>
  ) {
    const currentIndex = selectedCountryId
      ? alphabeticalCountries.findIndex(
          (country) => country.id === selectedCountryId
        )
      : -1;
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = Math.min(
        alphabeticalCountries.length - 1,
        currentIndex < 0 ? 0 : currentIndex + 1
      );
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = Math.max(
        0,
        currentIndex < 0 ? alphabeticalCountries.length - 1 : currentIndex - 1
      );
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = alphabeticalCountries.length - 1;
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomFromCenter(VIEW_ZOOM_STEP);
      return;
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomFromCenter(1 / VIEW_ZOOM_STEP);
      return;
    } else if (event.key === "0") {
      event.preventDefault();
      resetWorldView();
      return;
    } else {
      return;
    }

    event.preventDefault();
    const country = alphabeticalCountries[nextIndex];
    if (country) selectCountry(country.id, true);
  }

  function handleDoubleClick(event: ReactMouseEvent<HTMLCanvasElement>) {
    if (viewRef.current.scale > MIN_VIEW_SCALE + 0.05) {
      commitView(WORLD_VIEW, reducedMotion ? "direct" : "smooth");
    } else {
      zoomAtClientPoint(
        event.clientX,
        event.clientY,
        1.9,
        reducedMotion ? "direct" : "smooth"
      );
    }
  }

  const scopeName = scopeDisplayName(scope);
  const selectedHasScopeCoverage = Boolean(selectedRanking);

  return (
    <main className="relative min-h-screen overflow-x-clip bg-sa-canvas text-sa-text-primary">
      <WorldMapBackground />

      <div className="skillatlas-page-shell relative z-10 mx-auto w-full max-w-[1600px] px-4 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <IntelligencePanel
          as="section"
          aria-labelledby="global-competitive-map-title"
          className="mb-sa-3"
          bodyClassName="px-sa-3 py-sa-3 sm:px-sa-4"
        >
          <div className="flex flex-col gap-sa-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <DataLabel as="p" className="mb-sa-1 text-sa-accent">
                SkillAtlas / World Map
              </DataLabel>
              <h1
                id="global-competitive-map-title"
                className="text-[1.625rem] font-black leading-tight tracking-[-0.045em] sm:text-4xl"
              >
                Global Competitive Map
              </h1>
              <p className="mt-sa-1 max-w-2xl text-sm leading-6 text-sa-text-muted sm:text-[15px]">
                Explore competitive gaming strength across the world.
              </p>
            </div>

            <div className="flex items-center gap-sa-2 self-start rounded-sa-control border border-sa-border-strong bg-sa-surface-1 px-sa-3 py-sa-2 lg:self-auto">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sa-accent opacity-35 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sa-accent" />
              </span>
              <span className="leading-tight">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-sa-text-technical">
                  Calibration preview
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold text-sa-text-muted">
                  Prototype map data
                </span>
              </span>
            </div>
          </div>
        </IntelligencePanel>

        <IntelligencePanel
          as="section"
          aria-label="World Map controls"
          className="mb-sa-3"
          bodyClassName="p-sa-3"
        >
          <div className="grid gap-sa-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.3fr)] md:items-end">
            <div
              className="relative"
              onFocusCapture={() => {
                if (search.trim()) setSearchOpen(true);
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setSearchOpen(false);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && searchResults[0]) {
                  event.preventDefault();
                  selectSearchCountry(searchResults[0]);
                } else if (event.key === "Escape" && search) {
                  event.preventDefault();
                  setSearch("");
                  setSearchOpen(false);
                }
              }}
            >
              <DataLabel as="span" className="mb-sa-1 block">
                Search country
              </DataLabel>
              <SearchBar
                label="Search sovereign countries by name, region, or prototype best game"
                placeholder="Search 195 sovereign countries"
                value={search}
                onValueChange={(value) => {
                  setSearch(value);
                  setSearchOpen(true);
                }}
                variant="intelligence"
              />

              {search.trim() && searchOpen ? (
                <div className={styles.searchResults} role="listbox" aria-label="Country search results">
                  {searchResults.length > 0 ? (
                    searchResults.map((country) => (
                      <button
                        key={country.id}
                        type="button"
                        role="option"
                        aria-selected={country.id === selectedCountryId}
                        onClick={() => selectSearchCountry(country)}
                        className={styles.searchResult}
                      >
                        <span className="font-bold text-sa-text-primary">
                          {country.name}
                        </span>
                        <span className="text-xs text-sa-text-technical">
                          {country.region}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-sa-3 py-sa-3 text-sm text-sa-text-muted">
                      No sovereign country matches this search.
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <CompactSelect
              id="world-map-game-scope"
              label="Game scope"
              value={scope}
              options={GAME_SCOPE_OPTIONS}
              onChange={setScope}
            />
          </div>
        </IntelligencePanel>

        <IntelligencePanel
          as="section"
          aria-labelledby="competitive-globe-title"
          className="mb-sa-3"
          bodyClassName="overflow-hidden"
          header={
            <div className="flex flex-col gap-sa-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <DataLabel as="p">Global field</DataLabel>
                <div className="mt-sa-1 flex flex-wrap items-baseline gap-x-sa-3 gap-y-sa-1">
                  <h2 id="competitive-globe-title" className="text-base font-black">
                    Competitive globe
                  </h2>
                  <span className="font-sa-data text-xs text-sa-text-technical">
                    {scopedRankings.length} of 195 prototype records in {scopeName}
                  </span>
                </div>
              </div>

              <div className={styles.mapControls} aria-label="Map camera controls">
                <MapControlButton
                  label="Zoom in"
                  onClick={() => zoomFromCenter(VIEW_ZOOM_STEP)}
                  disabled={view.scale >= MAX_VIEW_SCALE - 0.01}
                >
                  <span aria-hidden="true">+</span>
                </MapControlButton>
                <MapControlButton
                  label="Zoom out"
                  onClick={() => zoomFromCenter(1 / VIEW_ZOOM_STEP)}
                  disabled={view.scale <= MIN_VIEW_SCALE + 0.01}
                >
                  <span aria-hidden="true">−</span>
                </MapControlButton>
                <MapControlButton label="Reset to world view" onClick={resetWorldView}>
                  <span aria-hidden="true">◎</span>
                </MapControlButton>
              </div>
            </div>
          }
        >
          <div className={styles.mapStage}>
            <div className={styles.mapTelemetry} aria-hidden="true">
              <span>WORLD // CUSTOM GLOBE</span>
              <span>{mappedCountryCount} TARGETS</span>
              <span>Z {view.scale.toFixed(2)}×</span>
            </div>

            <div
              ref={frameRef}
              className={styles.globeFrame}
            >
              <div
                className={
                  styles.globeViewport +
                  (viewMotion === "smooth" ? " " + styles.globeMotion : "")
                }
                style={{
                  transform:
                    "translate3d(" +
                    view.translateX +
                    "px, " +
                    view.translateY +
                    "px, 0) scale(" +
                    view.scale +
                    ")",
                }}
                onTransitionEnd={() => setViewMotion("direct")}
              >
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  tabIndex={0}
                  role="application"
                  aria-label={
                    "Interactive competitive globe. " +
                    (selectedCountry
                      ? selectedCountry.name + " is selected."
                      : "No country is selected.")
                  }
                  aria-describedby="world-map-instructions"
                  className={
                    styles.globeCanvas +
                    " " +
                    (isDragging ? styles.grabbing : styles.grab)
                  }
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onPointerLeave={() => {
                    if (pointersRef.current.size === 0) {
                      hoveredCountryIdRef.current = null;
                      setHoveredCountryId(null);
                    }
                  }}
                  onDoubleClick={handleDoubleClick}
                  onKeyDown={handleMapKeyDown}
                />
              </div>
            </div>

            <p id="world-map-instructions" className="sr-only">
              Drag to rotate the globe. Use the mouse wheel or pinch to zoom.
              Double-click toggles exploration zoom. Arrow keys select countries,
              plus and minus zoom, and zero resets the world view.
            </p>

            <div className={styles.mapLegend} aria-label="Map legend">
              <span className={styles.legendItem}>
                <span className={styles.legendCovered} aria-hidden="true" />
                Scoped prototype record
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendUncovered} aria-hidden="true" />
                No scoped record
              </span>
            </div>

            {loadState !== "ready" ? (
              <div className={styles.mapStatus} role="status">
                {loadState === "loading"
                  ? "Loading local country geometry…"
                  : "Local country geometry could not load."}
              </div>
            ) : null}
          </div>
        </IntelligencePanel>

        <IntelligencePanel
          as="section"
          aria-labelledby="selected-country-intelligence-title"
          bodyClassName=""
          header={
            <div className="flex flex-wrap items-baseline justify-between gap-sa-2">
              <div>
                <DataLabel as="p">Geographic context</DataLabel>
                <h2
                  id="selected-country-intelligence-title"
                  className="mt-sa-1 text-base font-black"
                >
                  Selected Country Intelligence
                </h2>
              </div>
              <span className="font-sa-data text-xs text-sa-text-technical">
                {scopeName} scope
              </span>
            </div>
          }
        >
          <div aria-live="polite">
            {!selectedCountry ? (
              <div className="px-sa-4 py-sa-6 sm:py-sa-8">
                <p className="text-sm font-semibold text-sa-text-muted">
                  Select a country to inspect its competitive profile.
                </p>
                <p className="mt-sa-1 text-xs leading-5 text-sa-text-technical">
                  Use country search, click or tap the globe, or focus the map and
                  use the arrow keys.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-sa-4 px-sa-4 py-sa-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-sa-3">
                    <CountryFlag country={selectedCountry} size="md" />
                    <div className="min-w-0">
                      <DataLabel as="p">{selectedCountry.region}</DataLabel>
                      <h3 className="mt-sa-1 truncate text-xl font-black tracking-tight">
                        {selectedCountry.name}
                      </h3>
                      {!selectedHasScopeCoverage ? (
                        <p className="mt-1 text-xs text-sa-text-technical">
                          No explicit {scopeName} prototype fixture is available.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <Link
                    href={countryRoute(selectedCountry.id)}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-sa-control border border-sa-border-active bg-sa-accent/10 px-sa-4 text-sm font-black text-sa-text-primary outline-none transition-[background-color,color] duration-200 ease-sa-standard hover:bg-sa-accent hover:text-slate-950 focus-visible:ring-4 focus-visible:ring-sa-accent/25"
                  >
                    View Country Intelligence
                    <span className="ml-2" aria-hidden="true">→</span>
                  </Link>
                </div>

                <dl className={styles.metricGrid}>
                  <MetricCell label="Region" value={selectedCountry.region} />
                  <MetricCell
                    label={scope === "Overall" ? "Prototype global rank" : "Prototype scope rank"}
                    value={selectedRanking ? "#" + selectedRanking.rank : "—"}
                    detail={selectedRanking ? undefined : "Not covered in this scope"}
                  />
                  <MetricCell
                    label="Prototype skill score"
                    value={selectedRanking ? selectedRanking.score.toFixed(1) : "—"}
                    valueClassName={selectedRanking ? "text-sa-accent" : "text-sa-text-technical"}
                    detail={selectedRanking ? undefined : "Not covered in this scope"}
                  />
                  <MetricCell
                    label="Best game"
                    value={gameDisplayName(selectedCountry.bestGame)}
                  />
                  <MetricCell
                    label="Existing score movement"
                    value={scoreMovementLabel(selectedRanking)}
                    valueClassName={movementClass(selectedRanking?.scoreChange)}
                  />
                  <MetricCell
                    label="Existing rank movement"
                    value={selectedRanking ? movementLabel(selectedRanking.rankChange) : "—"}
                    valueClassName={movementClass(selectedRanking?.rankChange)}
                  />
                </dl>
              </>
            )}
          </div>
        </IntelligencePanel>
      </div>
    </main>
  );
}
