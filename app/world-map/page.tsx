"use client";

import Image from "next/image";
import type { PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type GameKey = "cs2" | "league" | "valorant" | "fortnite" | "rocketLeague" | "chess";
type Tier = "elite" | "high" | "emerging" | "developing";
type LonLat = [number, number];

type GeoGeometry =
  | { type: "Polygon"; coordinates: LonLat[][] }
  | { type: "MultiPolygon"; coordinates: LonLat[][][] };

type GeoFeature = {
  type: "Feature";
  properties: {
    name?: string;
    NAME?: string;
    ADMIN?: string;
    [key: string]: unknown;
  };
  geometry: GeoGeometry | null;
};

type GeoCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

type CountryPerformance = {
  id: string;
  label: string;
  geoNames: string[];
  anchor: { lat: number; lon: number };
  score: number;
  rankMove: number;
  tier: Tier;
  why: string[];
  improve: string[];
};

type ProjectedPoint = {
  x: number;
  y: number;
  z: number;
  visible: boolean;
};

const WORLD_GEOJSON_URL = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

const svgSize = 900;
const center = svgSize / 2;
const globeRadius = 356;

const gameLabels: Record<GameKey, string> = {
  cs2: "CS2",
  league: "League of Legends",
  valorant: "Valorant",
  fortnite: "Fortnite",
  rocketLeague: "Rocket League",
  chess: "Chess",
};

const gameOrder: GameKey[] = ["cs2", "league", "valorant", "fortnite", "rocketLeague", "chess"];

const tierStyles: Record<Tier, { label: string; color: string; soft: string; fillOpacity: number }> = {
  elite: { label: "Elite dominance", color: "#19d3cf", soft: "rgba(25,211,207,0.18)", fillOpacity: 0.82 },
  high: { label: "High strength", color: "#31c9da", soft: "rgba(49,201,218,0.16)", fillOpacity: 0.72 },
  emerging: { label: "Emerging force", color: "#b28af6", soft: "rgba(178,138,246,0.16)", fillOpacity: 0.66 },
  developing: { label: "Developing contender", color: "#ff2fa8", soft: "rgba(255,47,168,0.16)", fillOpacity: 0.66 },
};

const gameData: Record<GameKey, CountryPerformance[]> = {
  cs2: [
    { id: "denmark", label: "Denmark", geoNames: ["Denmark"], anchor: { lat: 56.2, lon: 9.5 }, score: 98, rankMove: 2, tier: "elite", why: ["Elite CS systems", "Tactical culture", "LAN history"], improve: ["Larger talent pool", "More aim depth"] },
    { id: "south-korea", label: "South Korea", geoNames: ["South Korea", "Republic of Korea", "Korea, Republic of"], anchor: { lat: 36.5, lon: 127.8 }, score: 96, rankMove: 1, tier: "elite", why: ["Esports discipline", "Fast practice culture", "Infrastructure"], improve: ["More CS history", "More top-tier teams"] },
    { id: "china", label: "China", geoNames: ["China", "People's Republic of China"], anchor: { lat: 35.8, lon: 104.1 }, score: 94, rankMove: -1, tier: "elite", why: ["Huge player base", "Investment", "Mechanical ceiling"], improve: ["LAN consistency", "Tactical identity"] },
    { id: "sweden", label: "Sweden", geoNames: ["Sweden"], anchor: { lat: 60.1, lon: 18.6 }, score: 91, rankMove: 3, tier: "high", why: ["FPS heritage", "Grassroots scene", "Mechanical skill"], improve: ["Modern team depth", "Youth pipeline"] },
    { id: "usa", label: "USA", geoNames: ["United States of America", "United States", "USA"], anchor: { lat: 39.8, lon: -98.6 }, score: 89, rankMove: -2, tier: "high", why: ["Large talent pool", "Creator scene", "Prize exposure"], improve: ["Team discipline", "Tactical identity"] },
    { id: "france", label: "France", geoNames: ["France"], anchor: { lat: 46.2, lon: 2.2 }, score: 86, rankMove: 1, tier: "emerging", why: ["EU pressure", "Strong clubs", "FPS culture"], improve: ["Consistency", "More elite IGLs"] },
    { id: "brazil", label: "Brazil", geoNames: ["Brazil"], anchor: { lat: -14.2, lon: -51.9 }, score: 84, rankMove: -1, tier: "emerging", why: ["Aggressive style", "Passionate scene", "LAN energy"], improve: ["Structure", "Map pool depth"] },
    { id: "australia", label: "Australia", geoNames: ["Australia"], anchor: { lat: -25.3, lon: 133.8 }, score: 78, rankMove: 1, tier: "developing", why: ["Dedicated scene", "Strong mechanics", "OCE rivalry"], improve: ["International reps", "Ping barrier"] },
  ],
  league: [
    { id: "south-korea", label: "South Korea", geoNames: ["South Korea", "Republic of Korea", "Korea, Republic of"], anchor: { lat: 36.5, lon: 127.8 }, score: 99, rankMove: 1, tier: "elite", why: ["Elite coaching", "Solo queue depth", "Esports culture"], improve: ["Creative drafting", "Meta risk-taking"] },
    { id: "china", label: "China", geoNames: ["China", "People's Republic of China"], anchor: { lat: 35.8, lon: 104.1 }, score: 97, rankMove: -1, tier: "elite", why: ["Massive league", "Investment", "Mechanical talent"], improve: ["International consistency", "Macro discipline"] },
    { id: "denmark", label: "Denmark", geoNames: ["Denmark"], anchor: { lat: 56.2, lon: 9.5 }, score: 89, rankMove: 2, tier: "high", why: ["Mid-lane legacy", "EU systems", "High-level exports"], improve: ["Domestic scale", "Player depth"] },
    { id: "usa", label: "USA", geoNames: ["United States of America", "United States", "USA"], anchor: { lat: 39.8, lon: -98.6 }, score: 82, rankMove: -2, tier: "emerging", why: ["Big market", "Imports", "Content ecosystem"], improve: ["Native talent", "Practice culture"] },
    { id: "france", label: "France", geoNames: ["France"], anchor: { lat: 46.2, lon: 2.2 }, score: 81, rankMove: 1, tier: "emerging", why: ["EU ecosystem", "Young talent", "Strong orgs"], improve: ["International peaks", "Role depth"] },
    { id: "brazil", label: "Brazil", geoNames: ["Brazil"], anchor: { lat: -14.2, lon: -51.9 }, score: 77, rankMove: 1, tier: "developing", why: ["Passion", "Solo queue energy", "Regional fandom"], improve: ["Macro control", "Talent retention"] },
  ],
  valorant: [
    { id: "brazil", label: "Brazil", geoNames: ["Brazil"], anchor: { lat: -14.2, lon: -51.9 }, score: 93, rankMove: 2, tier: "elite", why: ["Aggression", "Aim culture", "LAN confidence"], improve: ["Utility discipline", "Map pool depth"] },
    { id: "south-korea", label: "South Korea", geoNames: ["South Korea", "Republic of Korea", "Korea, Republic of"], anchor: { lat: 36.5, lon: 127.8 }, score: 92, rankMove: 1, tier: "elite", why: ["Structure", "Utility discipline", "Coaching"], improve: ["Creative mid-rounding", "Peak aim volatility"] },
    { id: "usa", label: "USA", geoNames: ["United States of America", "United States", "USA"], anchor: { lat: 39.8, lon: -98.6 }, score: 90, rankMove: -1, tier: "high", why: ["Creator pipeline", "Talent pool", "Org investment"], improve: ["Role stability", "Consistency"] },
    { id: "france", label: "France", geoNames: ["France"], anchor: { lat: 46.2, lon: 2.2 }, score: 86, rankMove: 1, tier: "high", why: ["FPS history", "EU scene", "Tactical depth"], improve: ["Star depth", "International finals"] },
    { id: "china", label: "China", geoNames: ["China", "People's Republic of China"], anchor: { lat: 35.8, lon: 104.1 }, score: 84, rankMove: 3, tier: "emerging", why: ["Rapid investment", "Huge player base", "Rising mechanics"], improve: ["Global reps", "Meta adaptation"] },
    { id: "australia", label: "Australia", geoNames: ["Australia"], anchor: { lat: -25.3, lon: 133.8 }, score: 76, rankMove: -1, tier: "developing", why: ["OCE culture", "Mechanical promise", "Team loyalty"], improve: ["Server distance", "Practice access"] },
  ],
  fortnite: [
    { id: "usa", label: "USA", geoNames: ["United States of America", "United States", "USA"], anchor: { lat: 39.8, lon: -98.6 }, score: 95, rankMove: 1, tier: "elite", why: ["Creator scene", "Prize exposure", "Huge player base"], improve: ["Consistency", "Burnout management"] },
    { id: "canada", label: "Canada", geoNames: ["Canada"], anchor: { lat: 56.1, lon: -106.3 }, score: 91, rankMove: 2, tier: "high", why: ["Mechanical skill", "NA servers", "Tournament depth"], improve: ["Scale", "Team transition"] },
    { id: "france", label: "France", geoNames: ["France"], anchor: { lat: 46.2, lon: 2.2 }, score: 87, rankMove: 1, tier: "high", why: ["EU ecosystem", "Technical skill", "Competitive scene"], improve: ["Creator exposure", "Regional dominance"] },
    { id: "brazil", label: "Brazil", geoNames: ["Brazil"], anchor: { lat: -14.2, lon: -51.9 }, score: 84, rankMove: -2, tier: "emerging", why: ["Aggressive play", "Large player base", "Creative meta"], improve: ["Defensive structure", "Tournament stability"] },
    { id: "australia", label: "Australia", geoNames: ["Australia"], anchor: { lat: -25.3, lon: 133.8 }, score: 81, rankMove: 1, tier: "emerging", why: ["OCE grinders", "Competitive spirit", "Mechanical talent"], improve: ["International reps", "Ping barrier"] },
  ],
  rocketLeague: [
    { id: "france", label: "France", geoNames: ["France"], anchor: { lat: 46.2, lon: 2.2 }, score: 92, rankMove: 1, tier: "elite", why: ["Team play", "Mechanical depth", "EU dominance"], improve: ["Mental reset", "Rotation risk"] },
    { id: "netherlands", label: "Netherlands", geoNames: ["Netherlands"], anchor: { lat: 52.1, lon: 5.3 }, score: 89, rankMove: 3, tier: "high", why: ["Fast rotations", "Young talent", "Club systems"], improve: ["LAN experience", "Depth past top players"] },
    { id: "usa", label: "USA", geoNames: ["United States of America", "United States", "USA"], anchor: { lat: 39.8, lon: -98.6 }, score: 87, rankMove: -1, tier: "high", why: ["NA depth", "Org backing", "Content pipeline"], improve: ["EU pace adaptation", "Defensive structure"] },
    { id: "australia", label: "Australia", geoNames: ["Australia"], anchor: { lat: -25.3, lon: 133.8 }, score: 78, rankMove: -1, tier: "developing", why: ["Regional scene", "Dedicated talent", "Team chemistry"], improve: ["Ping barrier", "International reps"] },
    { id: "denmark", label: "Denmark", geoNames: ["Denmark"], anchor: { lat: 56.2, lon: 9.5 }, score: 76, rankMove: 1, tier: "developing", why: ["EU practice", "Mechanical base", "Small scene efficiency"], improve: ["Depth", "Elite LAN reps"] },
  ],
  chess: [
    { id: "india", label: "India", geoNames: ["India"], anchor: { lat: 20.6, lon: 78.9 }, score: 94, rankMove: 2, tier: "elite", why: ["Youth wave", "Coaching culture", "Online chess boom"], improve: ["World title conversion", "Veteran depth"] },
    { id: "usa", label: "USA", geoNames: ["United States of America", "United States", "USA"], anchor: { lat: 39.8, lon: -98.6 }, score: 91, rankMove: 1, tier: "elite", why: ["University chess", "Online platforms", "Elite tournaments"], improve: ["Grassroots scale", "Junior consistency"] },
    { id: "uzbekistan", label: "Uzbekistan", geoNames: ["Uzbekistan"], anchor: { lat: 41.4, lon: 64.6 }, score: 88, rankMove: 5, tier: "high", why: ["Young grandmasters", "Team success", "Rapid growth"], improve: ["Depth", "Long-term infrastructure"] },
    { id: "china", label: "China", geoNames: ["China", "People's Republic of China"], anchor: { lat: 35.8, lon: 104.1 }, score: 86, rankMove: -2, tier: "high", why: ["Structured training", "Strong federation", "Elite players"], improve: ["Tournament volume", "Visibility"] },
    { id: "france", label: "France", geoNames: ["France"], anchor: { lat: 46.2, lon: 2.2 }, score: 80, rankMove: 1, tier: "emerging", why: ["Club culture", "European events", "Strong juniors"], improve: ["World title pipeline", "Mass participation"] },
  ],
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normaliseName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getFeatureName(feature: GeoFeature) {
  return feature.properties.name ?? feature.properties.NAME ?? feature.properties.ADMIN ?? "Unknown";
}

function geometryToRings(geometry: GeoGeometry): LonLat[][] {
  if (geometry.type === "Polygon") return geometry.coordinates;
  return geometry.coordinates.flat();
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
    x: center + x * globeRadius,
    y: center - y2 * globeRadius,
    z: z2,
    visible: z2 > 0,
  };
}

function ringToPath(ring: LonLat[], rotation: { lat: number; lon: number }) {
  let path = "";
  let drawing = false;
  let visiblePoints = 0;

  for (const [lon, lat] of ring) {
    const point = projectPoint(lon, lat, rotation);

    if (!point.visible) {
      drawing = false;
      continue;
    }

    visiblePoints += 1;

    if (!drawing) {
      path += `M ${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
      drawing = true;
    } else {
      path += `L ${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
    }
  }

  if (visiblePoints > ring.length * 0.82) path += "Z ";
  return path;
}

function geometryToPath(geometry: GeoGeometry | null, rotation: { lat: number; lon: number }) {
  if (!geometry) return "";

  return geometryToRings(geometry)
    .map((ring) => ringToPath(ring, rotation))
    .join(" ");
}

function featureFrontness(feature: GeoFeature, rotation: { lat: number; lon: number }) {
  if (!feature.geometry) return -1;

  const rings = geometryToRings(feature.geometry);
  let total = 0;
  let count = 0;

  for (const ring of rings) {
    const step = Math.max(1, Math.floor(ring.length / 12));

    for (let index = 0; index < ring.length; index += step) {
      const [lon, lat] = ring[index];
      total += projectPoint(lon, lat, rotation).z;
      count += 1;
    }
  }

  return count ? total / count : -1;
}

export default function WorldMapPage() {
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [scrolled, setScrolled] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameKey>("cs2");
  const [selectedCountryId, setSelectedCountryId] = useState(gameData.cs2[0].id);
  const [rotation, setRotation] = useState({ lat: -8, lon: -8 });
  const [isDragging, setIsDragging] = useState(false);

  const rotationRef = useRef(rotation);
  const velocityRef = useRef({ lat: 0, lon: 0.035 });
  const dragRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);

  const activeCountries = gameData[selectedGame];
  const selectedCountry = activeCountries.find((country) => country.id === selectedCountryId) ?? activeCountries[0];

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

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
        if (!cancelled) {
          setFeatures(data.features.filter((feature) => feature.geometry));
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

      if (dragRef.current) return;

      const velocity = velocityRef.current;
      velocity.lon *= 0.955;
      velocity.lat *= 0.955;

      const idleSpin = Math.abs(velocity.lon) < 0.015 && Math.abs(velocity.lat) < 0.015 ? 0.035 : 0;

      const next = {
        lat: clamp(rotationRef.current.lat + velocity.lat, -64, 64),
        lon: rotationRef.current.lon + velocity.lon + idleSpin,
      };

      rotationRef.current = next;
      setRotation(next);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  function focusCountry(country: CountryPerformance) {
    const next = {
      lat: clamp(country.anchor.lat * 0.46, -44, 44),
      lon: -country.anchor.lon,
    };

    velocityRef.current = { lat: 0, lon: 0 };
    rotationRef.current = next;
    setRotation(next);
  }

  function selectCountry(country: CountryPerformance) {
    setSelectedCountryId(country.id);
    focusCountry(country);
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
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

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!dragRef.current) return;

    const drag = dragRef.current;
    const deltaX = event.clientX - drag.lastX;
    const deltaY = event.clientY - drag.lastY;

    if (Math.abs(deltaX) + Math.abs(deltaY) > 2) drag.moved = true;

    const next = {
      lat: clamp(rotationRef.current.lat - deltaY * 0.22, -64, 64),
      lon: rotationRef.current.lon + deltaX * 0.28,
    };

    velocityRef.current = {
      lat: -deltaY * 0.045,
      lon: deltaX * 0.055,
    };

    drag.lastX = event.clientX;
    drag.lastY = event.clientY;

    rotationRef.current = next;
    setRotation(next);
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
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

  const performanceByGeoName = useMemo(() => {
    const map = new Map<string, CountryPerformance>();

    for (const country of activeCountries) {
      for (const name of country.geoNames) {
        map.set(normaliseName(name), country);
      }
    }

    return map;
  }, [activeCountries]);

  const renderedFeatures = useMemo(() => {
    return features
      .map((feature) => {
        const name = getFeatureName(feature);
        const performance = performanceByGeoName.get(normaliseName(name));
        const path = geometryToPath(feature.geometry, rotation);
        const frontness = featureFrontness(feature, rotation);

        return {
          feature,
          name,
          performance,
          path,
          frontness,
          visible: path.length > 0 && frontness > -0.28,
        };
      })
      .filter((feature) => feature.visible)
      .sort((a, b) => a.frontness - b.frontness);
  }, [features, performanceByGeoName, rotation]);

  const selectedAnchor = projectPoint(selectedCountry.anchor.lon, selectedCountry.anchor.lat, rotation);

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
            Real country outlines load onto an interactive globe. Highlighted countries show dominance by game.
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
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#19d3cf]">Heat Map Key</p>
              <div className="space-y-2 text-xs font-semibold text-gray-600">
                {Object.entries(tierStyles).map(([tier, style]) => (
                  <div key={tier} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: style.color }} />
                    {style.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#ff2fa8]/25 bg-[#ff2fa8]/5 p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff2fa8]">Controls</p>
              <p className="text-xs font-semibold leading-relaxed text-gray-600">
                Grab anywhere on the globe and drag. Release to keep a smooth momentum spin.
              </p>
            </div>
          </aside>

          <section className="relative min-h-[720px] overflow-hidden rounded-3xl border border-[#ff2fa8]/40 bg-white/88 shadow-sm backdrop-blur">
            <div className="absolute left-6 top-5 z-20">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#19d3cf]">{gameLabels[selectedGame]}</p>
              <p className="mt-1 text-sm font-semibold text-gray-500">
                {loadState === "ready" ? "True country outlines with dominance highlighting" : "Loading country outlines"}
              </p>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pt-12">
              <svg
                viewBox={`0 0 ${svgSize} ${svgSize}`}
                className={`h-[690px] w-[690px] max-w-[96%] select-none touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <defs>
                  <radialGradient id="globeFill" cx="34%" cy="28%" r="78%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.96)" />
                    <stop offset="33%" stopColor="rgba(25,211,207,0.15)" />
                    <stop offset="60%" stopColor="rgba(255,47,168,0.10)" />
                    <stop offset="100%" stopColor="rgba(15,23,42,0.12)" />
                  </radialGradient>

                  <clipPath id="globeClip">
                    <circle cx={center} cy={center} r={globeRadius} />
                  </clipPath>

                  <filter id="countryGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <circle cx={center} cy={center} r={globeRadius} fill="url(#globeFill)" />
                <circle cx={center} cy={center} r={globeRadius} fill="none" stroke="rgba(148,163,184,0.42)" strokeWidth="1.4" />

                <g clipPath="url(#globeClip)">
                  {[0.82, 0.62, 0.42, 0.22].map((scale) => (
                    <ellipse
                      key={`lat-${scale}`}
                      cx={center}
                      cy={center}
                      rx={globeRadius}
                      ry={globeRadius * scale}
                      fill="none"
                      stroke="rgba(148,163,184,0.18)"
                      strokeWidth="1"
                    />
                  ))}

                  {[0.82, 0.62, 0.42, 0.22].map((scale) => (
                    <ellipse
                      key={`lon-${scale}`}
                      cx={center}
                      cy={center}
                      rx={globeRadius * scale}
                      ry={globeRadius}
                      fill="none"
                      stroke="rgba(148,163,184,0.18)"
                      strokeWidth="1"
                    />
                  ))}

                  {loadState === "ready" &&
                    renderedFeatures.map(({ name, path, performance, frontness }) => {
                      const selected = performance?.id === selectedCountryId;
                      const tier = performance ? tierStyles[performance.tier] : null;
                      const baseOpacity = Math.max(0.16, Math.min(0.48, 0.28 + frontness * 0.2));

                      return (
                        <path
                          key={name}
                          d={path}
                          fill={tier ? tier.color : "rgba(100,116,139,0.18)"}
                          fillOpacity={tier ? (selected ? 0.92 : tier.fillOpacity) : baseOpacity}
                          stroke={selected ? "#ffffff" : tier ? tier.color : "rgba(71,85,105,0.22)"}
                          strokeWidth={selected ? 2.4 : tier ? 1.35 : 0.72}
                          strokeOpacity={selected ? 0.95 : tier ? 0.7 : 0.38}
                          filter={selected ? "url(#countryGlow)" : undefined}
                          className="transition-all duration-200"
                          onClick={(event) => {
                            if (!performance) return;
                            event.stopPropagation();
                            setSelectedCountryId(performance.id);
                          }}
                          style={{
                            pointerEvents: performance ? "auto" : "none",
                          }}
                        />
                      );
                    })}

                  {loadState !== "ready" && (
                    <text x={center} y={center} textAnchor="middle" fontSize="18" fontWeight="900" fill="#19d3cf">
                      {loadState === "loading" ? "Loading country outlines..." : "Country outlines could not load"}
                    </text>
                  )}

                  {selectedAnchor.visible && (
                    <g>
                      <rect
                        x={selectedAnchor.x - 62}
                        y={selectedAnchor.y + 18}
                        width="124"
                        height="32"
                        rx="16"
                        fill="rgba(255,255,255,0.94)"
                        stroke={tierStyles[selectedCountry.tier].color}
                        strokeOpacity="0.36"
                      />
                      <text
                        x={selectedAnchor.x}
                        y={selectedAnchor.y + 39}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="900"
                        fill={tierStyles[selectedCountry.tier].color}
                      >
                        {selectedCountry.label}
                      </text>
                    </g>
                  )}
                </g>

                <circle cx={center} cy={center} r={globeRadius} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2" />
              </svg>
            </div>

            <div className="absolute bottom-5 left-6 right-6 z-20 grid gap-3 md:grid-cols-3">
              <MiniStat label="Top Nation" value={activeCountries[0].label} />
              <MiniStat label="Dominance Score" value={`${activeCountries[0].score}`} />
              <MiniStat label="Biggest Mover" value={`${activeCountries.find((item) => item.rankMove > 0)?.label ?? activeCountries[0].label} ▲`} />
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
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Rank Move</p>
                  <p className={`mt-2 text-xl font-black ${selectedCountry.rankMove >= 0 ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>
                    {selectedCountry.rankMove >= 0 ? "▲" : "▼"} {Math.abs(selectedCountry.rankMove)}
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
