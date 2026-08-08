"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import { countryRoute } from "@/constants/routes";
import {
  sovereignCountries,
  type CountryAtlasRecord,
} from "@/data/countries";
import { COUNTRY_MAP_MARKER_OVERRIDES } from "@/data/country-map-marker-overrides";
import styles from "../countries.module.css";

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

type PolygonFeature = {
  type: "Feature";
  properties: GeoProperties;
  geometry: GeoGeometry | null;
};

type PointFeature = {
  type: "Feature";
  properties: GeoProperties;
  geometry: { type: "Point"; coordinates: LonLat } | null;
};

type GeoCollection<TFeature> = {
  type: "FeatureCollection";
  features: TFeature[];
};

type MapBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type PreparedPolygon = {
  key: string;
  path: string;
  countryId?: string;
};

type PreparedMarker = {
  countryId: string;
  point: { x: number; y: number };
  source: "natural-earth" | "label-point";
  hitRadius: number;
};

type MapTarget =
  | { kind: "polygon"; countryId: string; bounds: MapBounds }
  | { kind: "marker"; countryId: string; point: { x: number; y: number } };

type PreparedAtlas = {
  polygons: PreparedPolygon[];
  markers: PreparedMarker[];
  targets: Map<string, MapTarget>;
};

type ViewTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

type CountryAtlasMapProps = {
  selectedCountry?: CountryAtlasRecord;
  hoveredCountryId: string | null;
  relevantCountryIds?: ReadonlySet<string>;
  focusRequest: number;
  onCountrySelect: (countryId: string) => void;
  onCountryHover: (countryId: string | null) => void;
};

const POLYGON_GEOJSON_URL = "/data/world-countries-110m.geo.json";
const MARKER_GEOJSON_URL = "/data/world-country-markers-110m.geo.json";
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 520;
const MIN_ZOOM = 1.55;
const MAX_ZOOM = 6.2;
const MARKER_ZOOM = 5.2;
const MARKER_POINTER_RADIUS = 22;
const IDENTITY_TRANSFORM: ViewTransform = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};

const countriesById = new Map(sovereignCountries.map((country) => [country.id, country]));
const countriesByCode = new Map(
  sovereignCountries.map((country) => [country.flagCode.toUpperCase(), country])
);
const countriesByName = new Map(
  sovereignCountries.map((country) => [normaliseName(country.name), country])
);
const orderedCountryIds = [...sovereignCountries]
  .sort((first, second) => first.name.localeCompare(second.name))
  .map((country) => country.id);

function normaliseName(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
}

function projectPoint([longitude, latitude]: LonLat) {
  return {
    x: ((longitude + 180) / 360) * MAP_WIDTH,
    y: ((90 - latitude) / 180) * MAP_HEIGHT,
  };
}

function ringPath(ring: LonLat[]) {
  let path = "";
  let previousLongitude: number | null = null;

  ring.forEach((coordinate) => {
    const [longitude] = coordinate;
    const point = projectPoint(coordinate);
    const crossesDateLine =
      previousLongitude !== null && Math.abs(longitude - previousLongitude) > 180;

    path += `${path && !crossesDateLine ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    previousLongitude = longitude;
  });

  return path ? `${path}Z` : "";
}

function geometryCoordinates(geometry: GeoGeometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((polygon) => polygon.flatMap((ring) => ring));
}

function featurePath(geometry: GeoGeometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((polygon) => polygon.map(ringPath)).join("");
}

function featureBounds(geometry: GeoGeometry): MapBounds {
  const points = geometryCoordinates(geometry).map(projectPoint);
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
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

function prepareAtlas(
  polygonCollection: GeoCollection<PolygonFeature>,
  markerCollection: GeoCollection<PointFeature>
): PreparedAtlas {
  const claimedCountryIds = new Set<string>();
  const targets = new Map<string, MapTarget>();

  const polygons = polygonCollection.features.flatMap((feature, index) => {
    if (!feature.geometry) return [];

    const name =
      feature.properties.NAME ??
      feature.properties.name ??
      feature.properties.ADMIN ??
      "Unknown";
    const path = featurePath(feature.geometry);
    if (!path) return [];

    const bounds = featureBounds(feature.geometry);
    const country = countryForProperties(feature.properties);
    const countryId = country && !claimedCountryIds.has(country.id) ? country.id : undefined;

    if (countryId) {
      claimedCountryIds.add(countryId);
      targets.set(countryId, { kind: "polygon", countryId, bounds });
    }

    return [
      {
        key: `${normaliseName(name)}-${index}`,
        path,
        countryId,
      },
    ];
  });

  const markers: PreparedMarker[] = [];

  markerCollection.features.forEach((feature) => {
    if (!feature.geometry || feature.geometry.type !== "Point") return;
    const country = countryForProperties(feature.properties);
    if (!country || claimedCountryIds.has(country.id)) return;

    const point = projectPoint(feature.geometry.coordinates);
    claimedCountryIds.add(country.id);
    targets.set(country.id, { kind: "marker", countryId: country.id, point });
    markers.push({ countryId: country.id, point, source: "natural-earth", hitRadius: 0 });
  });

  COUNTRY_MAP_MARKER_OVERRIDES.forEach((marker) => {
    const country = countriesByCode.get(marker.countryCode);
    if (!country || claimedCountryIds.has(country.id)) return;

    const point = projectPoint([marker.longitude, marker.latitude]);
    claimedCountryIds.add(country.id);
    targets.set(country.id, { kind: "marker", countryId: country.id, point });
    markers.push({ countryId: country.id, point, source: "label-point", hitRadius: 0 });
  });

  const collisionSafeMarkers = markers.map((marker) => {
    const nearestMarkerDistance = markers.reduce((nearest, candidate) => {
      if (candidate.countryId === marker.countryId) return nearest;
      return Math.min(
        nearest,
        Math.hypot(candidate.point.x - marker.point.x, candidate.point.y - marker.point.y)
      );
    }, Infinity);

    return {
      ...marker,
      hitRadius: clamp(nearestMarkerDistance / 2 - 0.6, 2, 16),
    };
  });

  return { polygons, markers: collisionSafeMarkers, targets };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function targetTransform(target: MapTarget): ViewTransform {
  let centerX: number;
  let centerY: number;
  let scale: number;

  if (target.kind === "marker") {
    centerX = target.point.x;
    centerY = target.point.y;
    scale = MARKER_ZOOM;
  } else {
    const width = Math.max(1, target.bounds.maxX - target.bounds.minX);
    const height = Math.max(1, target.bounds.maxY - target.bounds.minY);
    centerX = (target.bounds.minX + target.bounds.maxX) / 2;
    centerY = (target.bounds.minY + target.bounds.maxY) / 2;
    scale = clamp(
      Math.min((MAP_WIDTH * 0.46) / width, (MAP_HEIGHT * 0.56) / height),
      MIN_ZOOM,
      MAX_ZOOM
    );
  }

  return {
    scale,
    translateX: MAP_WIDTH / 2 - centerX * scale,
    translateY: MAP_HEIGHT / 2 - centerY * scale,
  };
}

export default function CountryAtlasMap({
  selectedCountry,
  hoveredCountryId,
  relevantCountryIds,
  focusRequest,
  onCountrySelect,
  onCountryHover,
}: CountryAtlasMapProps) {
  const router = useRouter();
  const targetRefs = useRef(new Map<string, SVGElement>());
  const [mapState, setMapState] = useState<
    | { status: "loading"; atlas: PreparedAtlas | null }
    | { status: "ready"; atlas: PreparedAtlas }
    | { status: "error"; atlas: PreparedAtlas | null }
  >({ status: "loading", atlas: null });
  const [resetAtRequest, setResetAtRequest] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      try {
        const [polygonResponse, markerResponse] = await Promise.all([
          fetch(POLYGON_GEOJSON_URL),
          fetch(MARKER_GEOJSON_URL),
        ]);

        if (!polygonResponse.ok || !markerResponse.ok) {
          throw new Error("A local atlas data request failed.");
        }

        const [polygonCollection, markerCollection] = (await Promise.all([
          polygonResponse.json(),
          markerResponse.json(),
        ])) as [GeoCollection<PolygonFeature>, GeoCollection<PointFeature>];

        const atlas = prepareAtlas(polygonCollection, markerCollection);
        if (!cancelled) setMapState({ status: "ready", atlas });
      } catch {
        if (!cancelled) setMapState({ status: "error", atlas: null });
      }
    }

    loadMap();

    return () => {
      cancelled = true;
    };
  }, []);

  const coverageCount = mapState.status === "ready" ? mapState.atlas.targets.size : 0;
  const viewTransform = useMemo(() => {
    if (
      focusRequest === 0 ||
      focusRequest === resetAtRequest ||
      mapState.status !== "ready" ||
      !selectedCountry
    ) {
      return IDENTITY_TRANSFORM;
    }

    const target = mapState.atlas.targets.get(selectedCountry.id);
    return target ? targetTransform(target) : IDENTITY_TRANSFORM;
  }, [focusRequest, mapState, resetAtRequest, selectedCountry]);
  const isZoomed = viewTransform.scale > 1.01;
  const viewportTransform = useMemo(
    () =>
      `matrix(${viewTransform.scale}, 0, 0, ${viewTransform.scale}, ${viewTransform.translateX}, ${viewTransform.translateY})`,
    [viewTransform]
  );

  function registerTarget(countryId: string, node: SVGElement | null) {
    if (node) targetRefs.current.set(countryId, node);
    else targetRefs.current.delete(countryId);
  }

  function activateCountry(countryId: string) {
    if (selectedCountry?.id === countryId && isZoomed) {
      router.push(countryRoute(countryId));
      return;
    }

    onCountrySelect(countryId);
  }

  function moveKeyboardSelection(countryId: string, offset: number | "home" | "end") {
    const currentIndex = orderedCountryIds.indexOf(countryId);
    if (currentIndex < 0) return;

    const nextIndex =
      offset === "home"
        ? 0
        : offset === "end"
          ? orderedCountryIds.length - 1
          : clamp(currentIndex + offset, 0, orderedCountryIds.length - 1);
    const nextCountryId = orderedCountryIds[nextIndex];
    if (!nextCountryId) return;

    activateCountry(nextCountryId);
    window.requestAnimationFrame(() => {
      targetRefs.current.get(nextCountryId)?.focus({ preventScroll: true });
    });
  }

  function handleTargetKeyDown(event: KeyboardEvent<SVGElement>, countryId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateCountry(countryId);
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveKeyboardSelection(countryId, 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveKeyboardSelection(countryId, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveKeyboardSelection(countryId, "home");
    } else if (event.key === "End") {
      event.preventDefault();
      moveKeyboardSelection(countryId, "end");
    }
  }

  function resetMap() {
    setResetAtRequest(focusRequest);
  }

  function targetLabel(country: CountryAtlasRecord) {
    const active = selectedCountry?.id === country.id && isZoomed;
    return `${country.name}. ${active ? "Selected. Activate again to open the country page." : "Select and focus this country."}`;
  }

  function nearestMarkerToPointer(
    event: ReactMouseEvent<SVGSVGElement> | ReactPointerEvent<SVGSVGElement>
  ) {
    if (mapState.status !== "ready") return;

    const svg = event.currentTarget;
    const screenMatrix = svg.getScreenCTM();
    if (!screenMatrix) return;

    let nearestMarker: PreparedMarker | undefined;
    let nearestDistance = Infinity;

    mapState.atlas.markers.forEach((marker) => {
      const viewX = marker.point.x * viewTransform.scale + viewTransform.translateX;
      const viewY = marker.point.y * viewTransform.scale + viewTransform.translateY;
      const screenX = screenMatrix.a * viewX + screenMatrix.c * viewY + screenMatrix.e;
      const screenY = screenMatrix.b * viewX + screenMatrix.d * viewY + screenMatrix.f;
      const distance = Math.hypot(
        event.clientX - screenX,
        event.clientY - screenY
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestMarker = marker;
      }
    });

    return nearestDistance <= MARKER_POINTER_RADIUS ? nearestMarker : undefined;
  }

  function handleMapClickCapture(event: ReactMouseEvent<SVGSVGElement>) {
    const marker = nearestMarkerToPointer(event);
    if (!marker) return;

    event.preventDefault();
    event.stopPropagation();
    activateCountry(marker.countryId);
  }

  function handleMapPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const marker = nearestMarkerToPointer(event);
    if (marker) {
      if (hoveredCountryId !== marker.countryId) onCountryHover(marker.countryId);
      return;
    }

    if (
      hoveredCountryId &&
      mapState.status === "ready" &&
      mapState.atlas.markers.some((candidate) => candidate.countryId === hoveredCountryId)
    ) {
      onCountryHover(null);
    }
  }

  return (
    <section className={`${styles.panel} ${styles.mapPanel} rounded-3xl`} aria-labelledby="atlas-map-title">
      <div className="flex flex-col gap-3 border-b border-[#ff2fa8]/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">
            World Overview
          </p>
          <h2 id="atlas-map-title" className="mt-1 text-xl font-black tracking-tight">
            2D Country Atlas
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`${styles.selectedCountryLabel} rounded-full px-4 py-2 text-sm font-black`}
            aria-live="polite"
          >
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#ff2fa8]" aria-hidden="true" />
            {selectedCountry?.name ?? "Select a country"}
          </div>
          {isZoomed && (
            <button type="button" onClick={resetMap} className={styles.resetMapButton}>
              Reset map
            </button>
          )}
        </div>
      </div>

      <div className={styles.mapFrame}>
        {mapState.status === "loading" && (
          <p className={styles.mapStatus}>Loading country outlines&hellip;</p>
        )}

        {mapState.status === "error" && (
          <p className={styles.mapStatus}>Country outlines could not load.</p>
        )}

        {mapState.status === "ready" && (
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className={styles.mapSvg}
            role="group"
            aria-label={`Interactive world atlas with ${coverageCount} country targets${selectedCountry ? `. ${selectedCountry.name} is active` : ""}`}
            aria-describedby="atlas-map-instructions"
            preserveAspectRatio="xMidYMid meet"
            data-country-target-count={coverageCount}
            onClickCapture={handleMapClickCapture}
            onPointerMove={handleMapPointerMove}
            onPointerLeave={() => onCountryHover(null)}
          >
            <defs>
              <pattern id="country-atlas-grid" width="62.5" height="65" patternUnits="userSpaceOnUse">
                <path d="M 62.5 0 L 0 0 0 65" className={styles.mapGridLine} fill="none" />
              </pattern>
              <linearGradient id="country-atlas-ocean" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" className={styles.oceanStart} />
                <stop offset="1" className={styles.oceanEnd} />
              </linearGradient>
              <clipPath id="country-atlas-clip">
                <rect width={MAP_WIDTH} height={MAP_HEIGHT} rx="28" />
              </clipPath>
            </defs>

            <rect width={MAP_WIDTH} height={MAP_HEIGHT} rx="28" fill="url(#country-atlas-ocean)" />
            <rect width={MAP_WIDTH} height={MAP_HEIGHT} rx="28" fill="url(#country-atlas-grid)" />

            <g clipPath="url(#country-atlas-clip)">
              <g className={styles.mapViewport} style={{ transform: viewportTransform }}>
                {mapState.atlas.polygons.map((feature) => {
                  const country = feature.countryId
                    ? countriesById.get(feature.countryId)
                    : undefined;
                  if (!country) {
                    return (
                      <path
                        key={feature.key}
                        d={feature.path}
                        className={`${styles.countryPath} ${styles.countryPathContext}`}
                        vectorEffect="non-scaling-stroke"
                        aria-hidden="true"
                      />
                    );
                  }

                  const active = selectedCountry?.id === country.id;
                  const hovered = hoveredCountryId === country.id;
                  const muted =
                    relevantCountryIds &&
                    !relevantCountryIds.has(country.id) &&
                    !active &&
                    !hovered;

                  return (
                    <path
                      key={feature.key}
                      ref={(node) => registerTarget(country.id, node)}
                      d={feature.path}
                      role="button"
                      tabIndex={selectedCountry?.id === country.id ? 0 : -1}
                      aria-label={targetLabel(country)}
                      aria-pressed={active}
                      data-map-country={country.id}
                      data-target-source="polygon"
                      className={`${styles.countryPath} ${styles.countryPathInteractive} ${hovered ? styles.countryPathHovered : ""} ${muted ? styles.mapTargetMuted : ""} ${active ? styles.countryPathSelected : ""}`}
                      vectorEffect="non-scaling-stroke"
                      onClick={() => activateCountry(country.id)}
                      onPointerEnter={() => onCountryHover(country.id)}
                      onPointerLeave={() => onCountryHover(null)}
                      onFocus={() => {
                        onCountryHover(country.id);
                      }}
                      onBlur={() => onCountryHover(null)}
                      onKeyDown={(event) => handleTargetKeyDown(event, country.id)}
                    >
                      <title>{country.name}</title>
                    </path>
                  );
                })}

                {mapState.atlas.markers.map((marker) => {
                  const country = countriesById.get(marker.countryId);
                  if (!country) return null;

                  const active = selectedCountry?.id === country.id;
                  const hovered = hoveredCountryId === country.id;
                  const muted =
                    relevantCountryIds &&
                    !relevantCountryIds.has(country.id) &&
                    !active &&
                    !hovered;
                  const hitRadius = marker.hitRadius / viewTransform.scale;
                  const dotRadius =
                    Math.min(4.5, marker.hitRadius * 0.58) /
                    Math.sqrt(viewTransform.scale);

                  return (
                    <g
                      key={country.id}
                      ref={(node) => registerTarget(country.id, node)}
                      role="button"
                      tabIndex={selectedCountry?.id === country.id ? 0 : -1}
                      aria-label={targetLabel(country)}
                      aria-pressed={active}
                      data-map-country={country.id}
                      data-target-source={marker.source}
                      className={`${styles.markerTarget} ${muted ? styles.mapTargetMuted : ""}`}
                      transform={`translate(${marker.point.x} ${marker.point.y})`}
                      onFocus={() => {
                        onCountryHover(country.id);
                      }}
                      onBlur={() => onCountryHover(null)}
                      onKeyDown={(event) => handleTargetKeyDown(event, country.id)}
                    >
                      <title>{country.name}</title>
                      <circle r={hitRadius} className={styles.markerHitArea} />
                      <circle r={Math.max(1, hitRadius - 0.7)} className={styles.markerFocusRing} />
                      <circle
                        r={dotRadius}
                        className={`${styles.markerDot} ${hovered ? styles.markerDotHovered : ""} ${active ? styles.markerDotSelected : ""}`}
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#19d3cf]/15 px-5 py-4 text-xs font-bold text-gray-500 sm:px-6">
        <p id="atlas-map-instructions">
          Select once to focus. Select the active country again to open it.
        </p>
        <div className="flex items-center gap-4" aria-label="Map legend">
          <span className="flex items-center gap-2">
            <span className={`${styles.legendSwatch} ${styles.legendDefault}`} aria-hidden="true" />
            Country
          </span>
          <span className="flex items-center gap-2">
            <span className={`${styles.legendSwatch} ${styles.legendSelected}`} aria-hidden="true" />
            Active
          </span>
        </div>
      </div>
    </section>
  );
}
