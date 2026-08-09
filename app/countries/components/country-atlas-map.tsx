"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import { countryRoute } from "@/constants/routes";
import {
  sovereignCountries,
  type CountryAtlasRecord,
} from "@/data/countries";
import styles from "../countries.module.css";

type LonLat = [number, number];

type GeoGeometry =
  | { type: "Polygon"; coordinates: LonLat[][] }
  | { type: "MultiPolygon"; coordinates: LonLat[][][] };

type LineGeometry =
  | { type: "LineString"; coordinates: LonLat[] }
  | { type: "MultiLineString"; coordinates: LonLat[][] };

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

type LineFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: LineGeometry | null;
};

type GeoCollection<TFeature> = {
  type: "FeatureCollection";
  features: TFeature[];
};

type MapPoint = {
  x: number;
  y: number;
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
  detailed: boolean;
  hitStrokeWidth: number;
};

type MapTarget = {
  countryId: string;
  bounds: MapBounds;
};

type PreparedAtlas = {
  polygons: PreparedPolygon[];
  coastlines: string[];
  targets: Map<string, MapTarget>;
};

type Camera = {
  scale: number;
  translateX: number;
  translateY: number;
};

type CameraMotion = "direct" | "zoom" | "travel";

type PointerGesture = {
  startCamera: Camera;
  startClient: MapPoint;
  pressedCountryId?: string;
  moved: boolean;
  hadMultiplePointers: boolean;
  pinchDistance?: number;
  pinchWorldAnchor?: MapPoint;
};

export type AtlasSelectionRequest = {
  countryId: string;
  revision: number;
};

type CountryAtlasMapProps = {
  selectedCountry?: CountryAtlasRecord;
  hoveredCountryId: string | null;
  relevantCountryIds?: ReadonlySet<string>;
  atlasSelectionRequest: AtlasSelectionRequest | null;
  onCountrySelect: (countryId: string) => void;
  onCountryHover: (countryId: string | null) => void;
};

const BASE_GEOJSON_URL = "/data/world-countries-110m.geo.json";
const MICROSTATE_GEOJSON_URL = "/data/world-microstates-10m.geo.json";
const COASTLINE_GEOJSON_URL = "/data/world-coastline-110m.geo.json";
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 520;
const MAP_PADDING = 25;
const MIN_CAMERA_SCALE = 1;
const MAX_CAMERA_SCALE = 18;
const CAMERA_ZOOM_STEP = 1.5;
const DOUBLE_CLICK_EXPLORATION_SCALE = 2.4;
const PAN_EDGE_FREEDOM = 44;
const DRAG_THRESHOLD_PX = 5;
const NATURAL_EARTH_X_MAX = Math.PI * 0.8707;

function naturalEarthRaw(longitudeRadians: number, latitudeRadians: number) {
  const latitudeSquared = latitudeRadians * latitudeRadians;
  const latitudeFourth = latitudeSquared * latitudeSquared;

  return {
    x:
      longitudeRadians *
      (0.8707 -
        0.131979 * latitudeSquared +
        latitudeFourth *
          (-0.013791 +
            latitudeFourth * (0.003971 * latitudeSquared - 0.001529 * latitudeFourth))),
    y:
      latitudeRadians *
      (1.007226 +
        latitudeSquared *
          (0.015085 +
            latitudeFourth *
              (-0.044475 + 0.028874 * latitudeSquared - 0.005916 * latitudeFourth))),
  };
}

const NATURAL_EARTH_Y_MAX = naturalEarthRaw(0, Math.PI / 2).y;
const NATURAL_EARTH_SCALE = Math.min(
  (MAP_WIDTH - MAP_PADDING * 2) / (NATURAL_EARTH_X_MAX * 2),
  (MAP_HEIGHT - MAP_PADDING * 2) / (NATURAL_EARTH_Y_MAX * 2)
);
const WORLD_BOUNDS: MapBounds = {
  minX: MAP_WIDTH / 2 - NATURAL_EARTH_X_MAX * NATURAL_EARTH_SCALE,
  minY: MAP_HEIGHT / 2 - NATURAL_EARTH_Y_MAX * NATURAL_EARTH_SCALE,
  maxX: MAP_WIDTH / 2 + NATURAL_EARTH_X_MAX * NATURAL_EARTH_SCALE,
  maxY: MAP_HEIGHT / 2 + NATURAL_EARTH_Y_MAX * NATURAL_EARTH_SCALE,
};
const WORLD_CAMERA: Camera = {
  scale: MIN_CAMERA_SCALE,
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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function projectPoint([longitude, latitude]: LonLat): MapPoint {
  const longitudeRadians = (longitude * Math.PI) / 180;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const projected = naturalEarthRaw(longitudeRadians, latitudeRadians);

  return {
    x: MAP_WIDTH / 2 + projected.x * NATURAL_EARTH_SCALE,
    y: MAP_HEIGHT / 2 - projected.y * NATURAL_EARTH_SCALE,
  };
}

function unprojectPoint(point: MapPoint): LonLat | null {
  const projectedX = (point.x - MAP_WIDTH / 2) / NATURAL_EARTH_SCALE;
  const projectedY = (MAP_HEIGHT / 2 - point.y) / NATURAL_EARTH_SCALE;
  let latitudeRadians = projectedY;

  for (let iteration = 0; iteration < 25; iteration += 1) {
    const latitudeSquared = latitudeRadians * latitudeRadians;
    const latitudeFourth = latitudeSquared * latitudeSquared;
    const value =
      latitudeRadians *
        (1.007226 +
          latitudeSquared *
            (0.015085 +
              latitudeFourth *
                (-0.044475 + 0.028874 * latitudeSquared - 0.005916 * latitudeFourth))) -
      projectedY;
    const derivative =
      1.007226 +
      latitudeSquared *
        (0.015085 * 3 +
          latitudeFourth *
            (-0.044475 * 7 +
              0.028874 * 9 * latitudeSquared -
              0.005916 * 11 * latitudeFourth));
    const delta = value / derivative;
    latitudeRadians -= delta;
    if (Math.abs(delta) <= 1e-8) break;
  }

  const latitudeSquared = latitudeRadians * latitudeRadians;
  const longitudeRadians =
    projectedX /
    (0.8707 +
      latitudeSquared *
        (-0.131979 +
          latitudeSquared *
            (-0.013791 +
              latitudeSquared *
                latitudeSquared *
                latitudeSquared *
                (0.003971 - 0.001529 * latitudeSquared))));
  const longitude = (longitudeRadians * 180) / Math.PI;
  const latitude = (latitudeRadians * 180) / Math.PI;

  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180 || Math.abs(latitude) > 90) {
    return null;
  }

  return [longitude, latitude];
}

function coordinatesPath(coordinates: LonLat[], closePath = false) {
  let path = "";
  let previousLongitude: number | null = null;

  coordinates.forEach((coordinate) => {
    const [longitude] = coordinate;
    const point = projectPoint(coordinate);
    const crossesDateLine =
      previousLongitude !== null && Math.abs(longitude - previousLongitude) > 180;

    path += `${path && !crossesDateLine ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    previousLongitude = longitude;
  });

  return path && closePath ? `${path}Z` : path;
}

function geometryCoordinates(geometry: GeoGeometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((polygon) => polygon.flatMap((ring) => ring));
}

function featurePath(geometry: GeoGeometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.flatMap((polygon) => polygon.map((ring) => coordinatesPath(ring, true))).join("");
}

function lineGeometryPath(geometry: LineGeometry) {
  const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
  return lines.map((line) => coordinatesPath(line)).join("");
}

function featureBounds(geometry: GeoGeometry): MapBounds {
  return geometryCoordinates(geometry)
    .map(projectPoint)
    .reduce(
      (bounds, point) => ({
        minX: Math.min(bounds.minX, point.x),
        minY: Math.min(bounds.minY, point.y),
        maxX: Math.max(bounds.maxX, point.x),
        maxY: Math.max(bounds.maxY, point.y),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );
}

function boundsCenter(bounds: MapBounds): MapPoint {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
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
  baseCollection: GeoCollection<PolygonFeature>,
  microstateCollection: GeoCollection<PolygonFeature>,
  coastlineCollection: GeoCollection<LineFeature>
): PreparedAtlas {
  const claimedCountryIds = new Set<string>();
  const targets = new Map<string, MapTarget>();
  const prepared: PreparedPolygon[] = [];

  function addFeatures(collection: GeoCollection<PolygonFeature>, detailed: boolean) {
    collection.features.forEach((feature, index) => {
      if (!feature.geometry) return;

      const name =
        feature.properties.NAME ??
        feature.properties.name ??
        feature.properties.ADMIN ??
        "Unknown";
      const path = featurePath(feature.geometry);
      if (!path) return;

      const country = countryForProperties(feature.properties);
      const countryId = country && !claimedCountryIds.has(country.id) ? country.id : undefined;
      const bounds = featureBounds(feature.geometry);

      if (countryId) {
        claimedCountryIds.add(countryId);
        targets.set(countryId, { countryId, bounds });
      }

      prepared.push({
        key: `${detailed ? "detail" : "base"}-${normaliseName(name)}-${index}`,
        path,
        countryId,
        detailed,
        hitStrokeWidth: 0,
      });
    });
  }

  addFeatures(baseCollection, false);
  addFeatures(microstateCollection, true);

  const detailedTargets = prepared
    .filter((feature) => feature.detailed && feature.countryId)
    .map((feature) => {
      const target = targets.get(feature.countryId!);
      return target ? { countryId: feature.countryId!, center: boundsCenter(target.bounds) } : null;
    })
    .filter((target): target is { countryId: string; center: MapPoint } => Boolean(target));

  const polygons = prepared.map((feature) => {
    if (!feature.detailed || !feature.countryId) return feature;
    const center = detailedTargets.find((target) => target.countryId === feature.countryId)?.center;
    if (!center) return feature;

    const nearestDistance = detailedTargets.reduce((nearest, candidate) => {
      if (candidate.countryId === feature.countryId) return nearest;
      return Math.min(nearest, Math.hypot(candidate.center.x - center.x, candidate.center.y - center.y));
    }, Infinity);

    return {
      ...feature,
      hitStrokeWidth: clamp(nearestDistance * 0.7, 4, 14),
    };
  });

  const coastlines = coastlineCollection.features
    .map((feature) => (feature.geometry ? lineGeometryPath(feature.geometry) : ""))
    .filter(Boolean);

  return { polygons, coastlines, targets };
}

function createGraticulePaths() {
  const paths: string[] = [];

  for (let longitude = -150; longitude <= 180; longitude += 30) {
    const coordinates: LonLat[] = [];
    for (let latitude = -84; latitude <= 84; latitude += 3) {
      coordinates.push([longitude, latitude]);
    }
    paths.push(coordinatesPath(coordinates));
  }

  for (let latitude = -75; latitude <= 75; latitude += 15) {
    const coordinates: LonLat[] = [];
    for (let longitude = -180; longitude <= 180; longitude += 3) {
      coordinates.push([longitude, latitude]);
    }
    paths.push(coordinatesPath(coordinates));
  }

  return paths;
}

const GRATICULE_PATHS = createGraticulePaths();

function clampCamera(camera: Camera): Camera {
  const scale = clamp(camera.scale, MIN_CAMERA_SCALE, MAX_CAMERA_SCALE);
  if (scale <= MIN_CAMERA_SCALE + 0.001) return WORLD_CAMERA;

  const minimumX = MAP_WIDTH - WORLD_BOUNDS.maxX * scale - PAN_EDGE_FREEDOM;
  const maximumX = -WORLD_BOUNDS.minX * scale + PAN_EDGE_FREEDOM;
  const minimumY = MAP_HEIGHT - WORLD_BOUNDS.maxY * scale - PAN_EDGE_FREEDOM;
  const maximumY = -WORLD_BOUNDS.minY * scale + PAN_EDGE_FREEDOM;

  return {
    scale,
    translateX: clamp(camera.translateX, minimumX, maximumX),
    translateY: clamp(camera.translateY, minimumY, maximumY),
  };
}

function cameraAroundPoint(camera: Camera, requestedScale: number, point: MapPoint) {
  const scale = clamp(requestedScale, MIN_CAMERA_SCALE, MAX_CAMERA_SCALE);
  if (scale <= MIN_CAMERA_SCALE + 0.001) return WORLD_CAMERA;

  const worldPoint = {
    x: (point.x - camera.translateX) / camera.scale,
    y: (point.y - camera.translateY) / camera.scale,
  };

  return clampCamera({
    scale,
    translateX: point.x - worldPoint.x * scale,
    translateY: point.y - worldPoint.y * scale,
  });
}

function cameraCenteredOnTarget(target: MapTarget, scale: number) {
  const center = boundsCenter(target.bounds);
  return clampCamera({
    scale,
    translateX: MAP_WIDTH / 2 - center.x * scale,
    translateY: MAP_HEIGHT / 2 - center.y * scale,
  });
}

function formatCoordinates([longitude, latitude]: LonLat) {
  const latitudeDirection = latitude < -0.005 ? "S" : "N";
  const longitudeDirection = longitude < -0.005 ? "W" : "E";
  return `${Math.abs(latitude).toFixed(2)}°${latitudeDirection} ${Math.abs(longitude).toFixed(2)}°${longitudeDirection}`;
}

export default function CountryAtlasMap({
  selectedCountry,
  hoveredCountryId,
  relevantCountryIds,
  atlasSelectionRequest,
  onCountrySelect,
  onCountryHover,
}: CountryAtlasMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const viewportRef = useRef<SVGGElement>(null);
  const telemetryCoordinatesRef = useRef<HTMLSpanElement>(null);
  const targetRefs = useRef(new Map<string, SVGPathElement>());
  const cameraRef = useRef<Camera>(WORLD_CAMERA);
  const cameraFrameRef = useRef<number | null>(null);
  const pendingCameraRef = useRef<{ camera: Camera; motion: CameraMotion } | null>(null);
  const pointersRef = useRef(new Map<number, MapPoint>());
  const gestureRef = useRef<PointerGesture | null>(null);
  const suppressClickRef = useRef(false);
  const [camera, setCamera] = useState<Camera>(WORLD_CAMERA);
  const [cameraMotion, setCameraMotion] = useState<CameraMotion>("direct");
  const [mapState, setMapState] = useState<
    | { status: "loading"; atlas: PreparedAtlas | null }
    | { status: "ready"; atlas: PreparedAtlas }
    | { status: "error"; atlas: PreparedAtlas | null }
  >({ status: "loading", atlas: null });

  const commitCamera = useCallback((nextCamera: Camera, motion: CameraMotion) => {
    const constrainedCamera = clampCamera(nextCamera);
    cameraRef.current = constrainedCamera;
    pendingCameraRef.current = { camera: constrainedCamera, motion };

    if (cameraFrameRef.current !== null) return;
    cameraFrameRef.current = window.requestAnimationFrame(() => {
      const pending = pendingCameraRef.current;
      cameraFrameRef.current = null;
      pendingCameraRef.current = null;
      if (!pending) return;
      setCameraMotion(pending.motion);
      setCamera(pending.camera);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      try {
        const [baseResponse, microstateResponse, coastlineResponse] = await Promise.all([
          fetch(BASE_GEOJSON_URL),
          fetch(MICROSTATE_GEOJSON_URL),
          fetch(COASTLINE_GEOJSON_URL),
        ]);

        if (!baseResponse.ok || !microstateResponse.ok || !coastlineResponse.ok) {
          throw new Error("A local atlas data request failed.");
        }

        const [baseCollection, microstateCollection, coastlineCollection] = (await Promise.all([
          baseResponse.json(),
          microstateResponse.json(),
          coastlineResponse.json(),
        ])) as [
          GeoCollection<PolygonFeature>,
          GeoCollection<PolygonFeature>,
          GeoCollection<LineFeature>,
        ];

        const atlas = prepareAtlas(baseCollection, microstateCollection, coastlineCollection);
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

  useEffect(() => {
    return () => {
      if (cameraFrameRef.current !== null) {
        window.cancelAnimationFrame(cameraFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!atlasSelectionRequest || mapState.status !== "ready") return;

    const frame = window.requestAnimationFrame(() => {
      const currentCamera = cameraRef.current;
      if (currentCamera.scale <= MIN_CAMERA_SCALE + 0.01) return;
      const target = mapState.atlas.targets.get(atlasSelectionRequest.countryId);
      if (target) {
        commitCamera(cameraCenteredOnTarget(target, currentCamera.scale), "travel");
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [atlasSelectionRequest, commitCamera, mapState]);

  useEffect(() => {
    if (mapState.status !== "ready") return;
    const svg = svgRef.current;
    if (!svg) return;
    const mapElement: SVGSVGElement = svg;

    function handleMapWheel(event: WheelEvent) {
      event.preventDefault();
      const point = clientPointToMap(mapElement, {
        x: event.clientX,
        y: event.clientY,
      });
      if (!point) return;

      const currentCamera = cameraRef.current;
      const factor = Math.exp(-event.deltaY * 0.0016);
      commitCamera(
        cameraAroundPoint(currentCamera, currentCamera.scale * factor, point),
        "direct"
      );
    }

    mapElement.addEventListener("wheel", handleMapWheel, { passive: false });
    return () => mapElement.removeEventListener("wheel", handleMapWheel);
  }, [commitCamera, mapState.status]);

  const coverageCount = mapState.status === "ready" ? mapState.atlas.targets.size : 0;
  const isWorldView = camera.scale <= MIN_CAMERA_SCALE + 0.01;
  const viewportTransform = useMemo(
    () =>
      `matrix(${camera.scale}, 0, 0, ${camera.scale}, ${camera.translateX}, ${camera.translateY})`,
    [camera]
  );

  function registerTarget(countryId: string, node: SVGPathElement | null) {
    if (node) targetRefs.current.set(countryId, node);
    else targetRefs.current.delete(countryId);
  }

  function clientPointToMap(svg: SVGSVGElement, clientPoint: MapPoint): MapPoint | null {
    const screenMatrix = svg.getScreenCTM();
    if (!screenMatrix) return null;
    const point = new DOMPoint(clientPoint.x, clientPoint.y).matrixTransform(screenMatrix.inverse());
    return { x: point.x, y: point.y };
  }

  function clientDeltaToMap(svg: SVGSVGElement, start: MapPoint, end: MapPoint) {
    const startPoint = clientPointToMap(svg, start);
    const endPoint = clientPointToMap(svg, end);
    if (!startPoint || !endPoint) return { x: 0, y: 0 };
    return { x: endPoint.x - startPoint.x, y: endPoint.y - startPoint.y };
  }

  function countryIdFromElement(target: EventTarget | null) {
    if (!(target instanceof Element)) return undefined;
    return target.closest<SVGElement>("[data-map-country]")?.dataset.mapCountry;
  }

  function selectCountry(countryId: string) {
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

    selectCountry(nextCountryId);
    window.requestAnimationFrame(() => {
      targetRefs.current.get(nextCountryId)?.focus({ preventScroll: true });
    });
  }

  function handleTargetKeyDown(event: KeyboardEvent<SVGPathElement>, countryId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectCountry(countryId);
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

  function targetLabel(country: CountryAtlasRecord) {
    const selected = selectedCountry?.id === country.id;
    return `${country.name}.${selected ? " Selected." : ""} Press Enter or Space to select. Use the map camera controls to explore geography.`;
  }

  function zoomAtPoint(point: MapPoint, factor: number, motion: CameraMotion) {
    const currentCamera = cameraRef.current;
    commitCamera(cameraAroundPoint(currentCamera, currentCamera.scale * factor, point), motion);
  }

  function zoomFromCenter(factor: number) {
    zoomAtPoint({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 }, factor, "zoom");
  }

  function showWorldView() {
    commitCamera(WORLD_CAMERA, "travel");
  }

  function handleDoubleClick(event: ReactMouseEvent<SVGSVGElement>) {
    event.preventDefault();
    const point = clientPointToMap(event.currentTarget, {
      x: event.clientX,
      y: event.clientY,
    });
    if (!point) return;

    if (cameraRef.current.scale > MIN_CAMERA_SCALE + 0.01) {
      commitCamera(WORLD_CAMERA, "travel");
      return;
    }

    commitCamera(
      cameraAroundPoint(WORLD_CAMERA, DOUBLE_CLICK_EXPLORATION_SCALE, point),
      "zoom"
    );
  }

  function handleClickCapture(event: ReactMouseEvent<SVGSVGElement>) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const countryId = countryIdFromElement(event.target);
    if (countryId) selectCountry(countryId);
  }

  function beginPinchGesture() {
    const points = [...pointersRef.current.values()];
    if (points.length < 2) return;

    const first = points[0];
    const second = points[1];
    const midpoint = {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    };
    const midpointOnMap = svgRef.current ? clientPointToMap(svgRef.current, midpoint) : null;
    if (!midpointOnMap) return;

    const currentCamera = cameraRef.current;
    gestureRef.current = {
      startCamera: currentCamera,
      startClient: midpoint,
      moved: true,
      hadMultiplePointers: true,
      pinchDistance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
      pinchWorldAnchor: {
        x: (midpointOnMap.x - currentCamera.translateX) / currentCamera.scale,
        y: (midpointOnMap.y - currentCamera.translateY) / currentCamera.scale,
      },
    };
    suppressClickRef.current = true;
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    if (event.pointerType === "touch" && telemetryCoordinatesRef.current) {
      telemetryCoordinatesRef.current.textContent = "";
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.classList.add(styles.mapSvgDragging);

    if (pointersRef.current.size === 1) {
      suppressClickRef.current = false;
      gestureRef.current = {
        startCamera: cameraRef.current,
        startClient: { x: event.clientX, y: event.clientY },
        pressedCountryId: countryIdFromElement(event.target),
        moved: false,
        hadMultiplePointers: false,
      };
    } else {
      beginPinchGesture();
    }
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (event.pointerType !== "touch") {
      const countryId = countryIdFromElement(event.target) ?? null;
      if (countryId !== hoveredCountryId) onCountryHover(countryId);

      const mapPoint = clientPointToMap(event.currentTarget, {
        x: event.clientX,
        y: event.clientY,
      });
      const worldPoint = mapPoint
        ? {
            x: (mapPoint.x - cameraRef.current.translateX) / cameraRef.current.scale,
            y: (mapPoint.y - cameraRef.current.translateY) / cameraRef.current.scale,
          }
        : null;
      const coordinates = worldPoint ? unprojectPoint(worldPoint) : null;
      if (telemetryCoordinatesRef.current) {
        telemetryCoordinatesRef.current.textContent = coordinates
          ? formatCoordinates(coordinates)
          : "";
      }
    }

    if (!pointersRef.current.has(event.pointerId)) return;
    event.preventDefault();
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const gesture = gestureRef.current;
    if (!gesture) return;

    if (pointersRef.current.size >= 2) {
      const points = [...pointersRef.current.values()];
      const first = points[0];
      const second = points[1];
      const midpoint = {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      };
      const midpointOnMap = clientPointToMap(event.currentTarget, midpoint);
      if (!midpointOnMap || !gesture.pinchDistance || !gesture.pinchWorldAnchor) return;

      const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
      const scale = clamp(
        gesture.startCamera.scale * (distance / gesture.pinchDistance),
        MIN_CAMERA_SCALE,
        MAX_CAMERA_SCALE
      );
      commitCamera(
        {
          scale,
          translateX: midpointOnMap.x - gesture.pinchWorldAnchor.x * scale,
          translateY: midpointOnMap.y - gesture.pinchWorldAnchor.y * scale,
        },
        "direct"
      );
      return;
    }

    const currentPoint = { x: event.clientX, y: event.clientY };
    const clientDistance = Math.hypot(
      currentPoint.x - gesture.startClient.x,
      currentPoint.y - gesture.startClient.y
    );
    if (!gesture.moved && clientDistance < DRAG_THRESHOLD_PX) return;
    gesture.moved = true;
    suppressClickRef.current = true;

    const delta = clientDeltaToMap(event.currentTarget, gesture.startClient, currentPoint);
    commitCamera(
      {
        ...gesture.startCamera,
        translateX: gesture.startCamera.translateX + delta.x,
        translateY: gesture.startCamera.translateY + delta.y,
      },
      "direct"
    );
  }

  function finishPointer(event: ReactPointerEvent<SVGSVGElement>, allowSelection: boolean) {
    const gesture = gestureRef.current;
    pointersRef.current.delete(event.pointerId);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (pointersRef.current.size === 1 && gesture?.hadMultiplePointers) {
      const remainingPoint = [...pointersRef.current.values()][0];
      gestureRef.current = {
        startCamera: cameraRef.current,
        startClient: remainingPoint,
        moved: true,
        hadMultiplePointers: true,
      };
      return;
    }

    if (pointersRef.current.size > 0) return;

    event.currentTarget.classList.remove(styles.mapSvgDragging);
    gestureRef.current = null;
    if (gesture?.moved || gesture?.hadMultiplePointers) {
      suppressClickRef.current = true;
    }
    if (
      allowSelection &&
      gesture &&
      !gesture.moved &&
      !gesture.hadMultiplePointers &&
      gesture.pressedCountryId
    ) {
      selectCountry(gesture.pressedCountryId);
    }
  }

  function handleMapKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.defaultPrevented) return;

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomFromCenter(CAMERA_ZOOM_STEP);
    } else if (event.key === "-") {
      event.preventDefault();
      zoomFromCenter(1 / CAMERA_ZOOM_STEP);
    } else if (event.key === "0") {
      event.preventDefault();
      showWorldView();
    }
  }

  const viewportMotionClass =
    cameraMotion === "travel"
      ? styles.mapViewportTravel
      : cameraMotion === "zoom"
        ? styles.mapViewportZoom
        : styles.mapViewportDirect;

  return (
    <IntelligencePanel
      as="section"
      className={styles.mapPanel}
      bodyClassName="flex min-h-0 flex-1 flex-col"
      aria-labelledby="atlas-map-title"
      header={
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-sa-3 gap-y-sa-1">
          <div className={styles.mapContextLine} aria-live="polite">
            {selectedCountry ? (
              <>
                <DataLabel as="span">{selectedCountry.name}</DataLabel>
                <span className={styles.mapContextSeparator} aria-hidden="true">
                  /
                </span>
                <Link href={countryRoute(selectedCountry.id)} className={styles.mapContextAction}>
                  View Country <span aria-hidden="true">→</span>
                </Link>
              </>
            ) : null}
          </div>
          <div className={styles.mapHeaderActions}>
            <button
              type="button"
              aria-label="Zoom in"
              title="Zoom in (+)"
              onClick={() => zoomFromCenter(CAMERA_ZOOM_STEP)}
              disabled={camera.scale >= MAX_CAMERA_SCALE - 0.01}
              className={styles.mapCameraButton}
            >
              <span aria-hidden="true">+</span>
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              title="Zoom out (-)"
              onClick={() => zoomFromCenter(1 / CAMERA_ZOOM_STEP)}
              disabled={isWorldView}
              className={styles.mapCameraButton}
            >
              <span aria-hidden="true">−</span>
            </button>
            <button
              type="button"
              aria-label="Show world view"
              title="World view (0)"
              onClick={showWorldView}
              disabled={isWorldView}
              className={styles.mapWorldButton}
            >
              <span aria-hidden="true">◎</span>
            </button>
          </div>
        </div>
      }
    >
      <h2 id="atlas-map-title" className="sr-only">
        Interactive country atlas
      </h2>
      <p id="atlas-map-instructions" className="sr-only">
        Click or tap a country to select it. Drag to pan, use the mouse wheel or pinch to zoom,
        and double-click to toggle between the world and exploration views. While a map country
        is focused, use plus and minus to zoom or zero for the world view. The compact camera
        controls provide the same actions for keyboard and assistive technology users.
      </p>

      <div className={styles.mapFrame}>
        {mapState.status === "loading" && (
          <p className={styles.mapStatus}>Loading country outlines&hellip;</p>
        )}

        {mapState.status === "error" && (
          <p className={styles.mapStatus}>Country outlines could not load.</p>
        )}

        {mapState.status === "ready" && (
          <>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              className={styles.mapSvg}
              role="group"
              aria-label={`Interactive world atlas with ${coverageCount} country targets${selectedCountry ? `. ${selectedCountry.name} is active` : ""}`}
              aria-describedby="atlas-map-instructions"
              preserveAspectRatio="xMidYMid meet"
              data-country-target-count={coverageCount}
              data-camera-scale={camera.scale.toFixed(4)}
              onClickCapture={handleClickCapture}
              onDoubleClick={handleDoubleClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={(event) => finishPointer(event, true)}
              onPointerCancel={(event) => finishPointer(event, false)}
              onPointerLeave={() => {
                if (pointersRef.current.size === 0) onCountryHover(null);
                if (telemetryCoordinatesRef.current) {
                  telemetryCoordinatesRef.current.textContent = "";
                }
              }}
              onKeyDown={handleMapKeyDown}
            >
              <defs>
                <clipPath id="country-atlas-clip">
                  <rect width={MAP_WIDTH} height={MAP_HEIGHT} />
                </clipPath>
              </defs>

              <rect width={MAP_WIDTH} height={MAP_HEIGHT} className={styles.mapSurface} />

              <g clipPath="url(#country-atlas-clip)">
                <g
                  ref={viewportRef}
                  className={`${styles.mapViewport} ${viewportMotionClass}`}
                  style={{ transform: viewportTransform }}
                >
                  <g className={styles.graticule} aria-hidden="true">
                    {GRATICULE_PATHS.map((path, index) => (
                      <path key={index} d={path} vectorEffect="non-scaling-stroke" />
                    ))}
                  </g>

                  <g className={styles.coastlineLayer} aria-hidden="true">
                    {mapState.atlas.coastlines.map((path, index) => (
                      <path key={index} d={path} vectorEffect="non-scaling-stroke" />
                    ))}
                  </g>

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
                        tabIndex={(selectedCountry?.id ?? orderedCountryIds[0]) === country.id ? 0 : -1}
                        aria-label={targetLabel(country)}
                        aria-pressed={active}
                        data-map-country={country.id}
                        data-target-source={feature.detailed ? "natural-earth-10m" : "natural-earth-110m"}
                        className={`${styles.countryPath} ${styles.countryPathInteractive} ${hovered ? styles.countryPathHovered : ""} ${muted ? styles.mapTargetMuted : ""} ${active ? styles.countryPathSelected : ""}`}
                        vectorEffect="non-scaling-stroke"
                        onFocus={() => onCountryHover(country.id)}
                        onBlur={() => onCountryHover(null)}
                        onKeyDown={(event) => handleTargetKeyDown(event, country.id)}
                      >
                        <title>{country.name}</title>
                      </path>
                    );
                  })}

                  {mapState.atlas.polygons.map((feature) => {
                    if (!feature.detailed || !feature.countryId || feature.hitStrokeWidth <= 0) {
                      return null;
                    }

                    return (
                      <path
                        key={`${feature.key}-hit-area`}
                        d={feature.path}
                        data-map-country={feature.countryId}
                        className={styles.microstateHitArea}
                        style={{ strokeWidth: feature.hitStrokeWidth }}
                        vectorEffect="non-scaling-stroke"
                        aria-hidden="true"
                      />
                    );
                  })}
                </g>
              </g>
            </svg>

            <div className={styles.mapTelemetry} aria-hidden="true">
              <span>WORLD // NATURAL EARTH 1</span>
              <span>Z {camera.scale.toFixed(2)}×</span>
              <span ref={telemetryCoordinatesRef} className={styles.telemetryCoordinates} />
            </div>
          </>
        )}
      </div>
    </IntelligencePanel>
  );
}
