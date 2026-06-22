"use client";

import Image from "next/image";
import type { PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type GameKey = "cs2" | "league" | "valorant" | "fortnite" | "rocketLeague" | "chess";
type Tier = "elite" | "high" | "emerging" | "developing";
type LatLon = [number, number];

type CountryShape = {
  name: string;
  anchor: LatLon;
  shape: LatLon[];
};

type CountryPerformance = {
  country: keyof typeof countryShapes;
  score: number;
  rankMove: number;
  tier: Tier;
  why: string[];
  improve: string[];
};

const gameLabels: Record<GameKey, string> = {
  cs2: "CS2",
  league: "League of Legends",
  valorant: "Valorant",
  fortnite: "Fortnite",
  rocketLeague: "Rocket League",
  chess: "Chess",
};

const gameOrder: GameKey[] = ["cs2", "league", "valorant", "fortnite", "rocketLeague", "chess"];

const tierStyles: Record<Tier, { label: string; color: string; soft: string }> = {
  elite: { label: "Elite dominance", color: "#19d3cf", soft: "rgba(25,211,207,0.18)" },
  high: { label: "High strength", color: "#31c9da", soft: "rgba(49,201,218,0.16)" },
  emerging: { label: "Emerging force", color: "#b28af6", soft: "rgba(178,138,246,0.16)" },
  developing: { label: "Developing contender", color: "#ff2fa8", soft: "rgba(255,47,168,0.16)" },
};

const countryShapes = {
  Denmark: { name: "Denmark", anchor: [56.2, 9.5], shape: [[57.8, 8.0], [57.4, 10.7], [56.9, 11.8], [55.9, 11.5], [54.9, 10.6], [54.7, 8.7], [55.5, 8.1], [56.4, 8.3]] },
  Sweden: { name: "Sweden", anchor: [60.1, 18.6], shape: [[69.0, 20.0], [67.0, 23.5], [63.0, 21.5], [59.0, 18.8], [56.0, 16.2], [55.0, 13.2], [57.5, 11.8], [61.0, 13.8], [65.0, 16.5]] },
  "South Korea": { name: "South Korea", anchor: [36.5, 127.8], shape: [[38.6, 126.2], [38.0, 128.6], [36.9, 129.7], [35.1, 129.1], [34.4, 126.6], [35.5, 125.8], [37.0, 126.4]] },
  China: { name: "China", anchor: [35.8, 104.1], shape: [[49.2, 87.5], [48.0, 116.0], [42.5, 131.0], [30.5, 122.0], [21.5, 109.5], [23.8, 98.5], [29.0, 86.0], [39.0, 75.0]] },
  USA: { name: "USA", anchor: [39.8, -98.6], shape: [[49.0, -124.0], [49.0, -74.5], [44.0, -67.0], [32.0, -80.0], [25.0, -97.0], [32.0, -117.0], [42.0, -124.5]] },
  France: { name: "France", anchor: [46.2, 2.2], shape: [[51.0, 2.0], [49.0, 7.5], [45.0, 7.8], [42.8, 4.8], [43.0, -1.5], [47.5, -4.8], [50.0, -1.8]] },
  Brazil: { name: "Brazil", anchor: [-14.2, -51.9], shape: [[5.2, -60.0], [1.0, -43.0], [-8.0, -35.0], [-23.0, -42.0], [-33.0, -52.0], [-18.0, -65.0], [-7.0, -72.0]] },
  Australia: { name: "Australia", anchor: [-25.3, 133.8], shape: [[-12.0, 130.0], [-16.0, 146.0], [-27.0, 153.0], [-38.0, 146.0], [-35.0, 117.0], [-23.0, 113.0], [-14.0, 121.0]] },
  India: { name: "India", anchor: [20.6, 78.9], shape: [[34.0, 74.0], [29.0, 88.0], [22.0, 92.0], [8.0, 77.0], [15.0, 72.0], [24.0, 68.0], [31.0, 72.0]] },
  Canada: { name: "Canada", anchor: [56.1, -106.3], shape: [[69.0, -140.0], [70.0, -80.0], [56.0, -58.0], [49.0, -68.0], [49.0, -124.0], [58.0, -136.0]] },
  Netherlands: { name: "Netherlands", anchor: [52.1, 5.3], shape: [[53.6, 3.3], [53.5, 7.1], [51.5, 6.4], [50.8, 4.0], [52.0, 3.1]] },
  Uzbekistan: { name: "Uzbekistan", anchor: [41.4, 64.6], shape: [[45.0, 56.0], [44.0, 69.5], [41.5, 73.0], [37.2, 67.0], [38.0, 58.0], [41.0, 55.5]] },
} satisfies Record<string, CountryShape>;

type CountryName = keyof typeof countryShapes;

const continentShapes: LatLon[][] = [
  [[72, -168], [70, -130], [58, -95], [50, -70], [30, -82], [20, -103], [30, -124], [48, -135]],
  [[12, -80], [5, -55], [-18, -40], [-55, -68], [-22, -78]],
  [[72, -10], [62, 40], [35, 45], [34, 10], [48, -10]],
  [[70, 35], [68, 125], [45, 150], [10, 112], [8, 72], [30, 45]],
  [[34, -18], [31, 35], [-35, 32], [-35, 12], [5, -15]],
  [[-12, 112], [-15, 154], [-39, 146], [-35, 114]],
];

const gameData: Record<GameKey, CountryPerformance[]> = {
  cs2: [
    { country: "Denmark", score: 98, rankMove: 2, tier: "elite", why: ["Elite CS systems", "Tactical culture", "LAN history"], improve: ["Larger talent pool", "More aim depth"] },
    { country: "South Korea", score: 96, rankMove: 1, tier: "elite", why: ["Esports discipline", "Fast practice culture", "Infrastructure"], improve: ["More CS history", "More top-tier teams"] },
    { country: "China", score: 94, rankMove: -1, tier: "elite", why: ["Huge player base", "Investment", "Mechanical ceiling"], improve: ["LAN consistency", "Tactical identity"] },
    { country: "Sweden", score: 91, rankMove: 3, tier: "high", why: ["FPS heritage", "Grassroots scene", "Mechanical skill"], improve: ["Modern team depth", "Youth pipeline"] },
    { country: "USA", score: 89, rankMove: -2, tier: "high", why: ["Large talent pool", "Creator scene", "Prize exposure"], improve: ["Team discipline", "Tactical identity"] },
    { country: "France", score: 86, rankMove: 1, tier: "emerging", why: ["EU pressure", "Strong clubs", "FPS culture"], improve: ["Consistency", "More elite IGLs"] },
    { country: "Brazil", score: 84, rankMove: -1, tier: "emerging", why: ["Aggressive style", "Passionate scene", "LAN energy"], improve: ["Structure", "Map pool depth"] },
    { country: "Australia", score: 78, rankMove: 1, tier: "developing", why: ["Dedicated scene", "Strong mechanics", "OCE rivalry"], improve: ["International reps", "Ping barrier"] },
  ],
  league: [
    { country: "South Korea", score: 99, rankMove: 1, tier: "elite", why: ["Elite coaching", "Solo queue depth", "Esports culture"], improve: ["Creative drafting", "Meta risk-taking"] },
    { country: "China", score: 97, rankMove: -1, tier: "elite", why: ["Massive league", "Investment", "Mechanical talent"], improve: ["International consistency", "Macro discipline"] },
    { country: "Denmark", score: 89, rankMove: 2, tier: "high", why: ["Mid-lane legacy", "EU systems", "High-level exports"], improve: ["Domestic scale", "Player depth"] },
    { country: "USA", score: 82, rankMove: -2, tier: "emerging", why: ["Big market", "Imports", "Content ecosystem"], improve: ["Native talent", "Practice culture"] },
    { country: "France", score: 81, rankMove: 1, tier: "emerging", why: ["EU ecosystem", "Young talent", "Strong orgs"], improve: ["International peaks", "Role depth"] },
    { country: "Brazil", score: 77, rankMove: 1, tier: "developing", why: ["Passion", "Solo queue energy", "Regional fandom"], improve: ["Macro control", "Talent retention"] },
  ],
  valorant: [
    { country: "Brazil", score: 93, rankMove: 2, tier: "elite", why: ["Aggression", "Aim culture", "LAN confidence"], improve: ["Utility discipline", "Map pool depth"] },
    { country: "South Korea", score: 92, rankMove: 1, tier: "elite", why: ["Structure", "Utility discipline", "Coaching"], improve: ["Creative mid-rounding", "Peak aim volatility"] },
    { country: "USA", score: 90, rankMove: -1, tier: "high", why: ["Creator pipeline", "Talent pool", "Org investment"], improve: ["Role stability", "Consistency"] },
    { country: "France", score: 86, rankMove: 1, tier: "high", why: ["FPS history", "EU scene", "Tactical depth"], improve: ["Star depth", "International finals"] },
    { country: "China", score: 84, rankMove: 3, tier: "emerging", why: ["Rapid investment", "Huge player base", "Rising mechanics"], improve: ["Global reps", "Meta adaptation"] },
    { country: "Australia", score: 76, rankMove: -1, tier: "developing", why: ["OCE culture", "Mechanical promise", "Team loyalty"], improve: ["Server distance", "Practice access"] },
  ],
  fortnite: [
    { country: "USA", score: 95, rankMove: 1, tier: "elite", why: ["Creator scene", "Prize exposure", "Huge player base"], improve: ["Consistency", "Burnout management"] },
    { country: "Canada", score: 91, rankMove: 2, tier: "high", why: ["Mechanical skill", "NA servers", "Tournament depth"], improve: ["Scale", "Team transition"] },
    { country: "France", score: 87, rankMove: 1, tier: "high", why: ["EU ecosystem", "Technical skill", "Competitive scene"], improve: ["Creator exposure", "Regional dominance"] },
    { country: "Brazil", score: 84, rankMove: -2, tier: "emerging", why: ["Aggressive play", "Large player base", "Creative meta"], improve: ["Defensive structure", "Tournament stability"] },
    { country: "Australia", score: 81, rankMove: 1, tier: "emerging", why: ["OCE grinders", "Competitive spirit", "Mechanical talent"], improve: ["International reps", "Ping barrier"] },
  ],
  rocketLeague: [
    { country: "France", score: 92, rankMove: 1, tier: "elite", why: ["Team play", "Mechanical depth", "EU dominance"], improve: ["Mental reset", "Rotation risk"] },
    { country: "Netherlands", score: 89, rankMove: 3, tier: "high", why: ["Fast rotations", "Young talent", "Club systems"], improve: ["LAN experience", "Depth past top players"] },
    { country: "USA", score: 87, rankMove: -1, tier: "high", why: ["NA depth", "Org backing", "Content pipeline"], improve: ["EU pace adaptation", "Defensive structure"] },
    { country: "Australia", score: 78, rankMove: -1, tier: "developing", why: ["Regional scene", "Dedicated talent", "Team chemistry"], improve: ["Ping barrier", "International reps"] },
    { country: "Denmark", score: 76, rankMove: 1, tier: "developing", why: ["EU practice", "Mechanical base", "Small scene efficiency"], improve: ["Depth", "Elite LAN reps"] },
  ],
  chess: [
    { country: "India", score: 94, rankMove: 2, tier: "elite", why: ["Youth wave", "Coaching culture", "Online chess boom"], improve: ["World title conversion", "Veteran depth"] },
    { country: "Uzbekistan", score: 88, rankMove: 5, tier: "high", why: ["Young grandmasters", "Team success", "Rapid growth"], improve: ["Depth", "Long-term infrastructure"] },
    { country: "China", score: 86, rankMove: -2, tier: "high", why: ["Structured training", "Strong federation", "Elite players"], improve: ["Tournament volume", "Visibility"] },
    { country: "USA", score: 91, rankMove: 1, tier: "elite", why: ["University chess", "Online platforms", "Elite tournaments"], improve: ["Grassroots scale", "Junior consistency"] },
    { country: "France", score: 80, rankMove: 1, tier: "emerging", why: ["Club culture", "European events", "Strong juniors"], improve: ["World title pipeline", "Mass participation"] },
  ],
};

const svgSize = 820;
const center = svgSize / 2;
const radius = 316;

type ProjectedPoint = { x: number; y: number; z: number };
type ProjectedShape = { points: string; center: ProjectedPoint; frontness: number; visible: boolean };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function projectPoint(lat: number, lon: number, rotLat: number, rotLon: number): ProjectedPoint {
  const phi = (lat * Math.PI) / 180;
  const lambda = ((lon + rotLon) * Math.PI) / 180;
  const tilt = (rotLat * Math.PI) / 180;
  const x = Math.cos(phi) * Math.sin(lambda);
  const y = Math.sin(phi);
  const z = Math.cos(phi) * Math.cos(lambda);
  const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
  const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
  return { x: center + x * radius, y: center - y2 * radius, z: z2 };
}

function projectShape(shape: LatLon[], rotLat: number, rotLon: number): ProjectedShape {
  const projected = shape.map(([lat, lon]) => projectPoint(lat, lon, rotLat, rotLon));
  const frontness = projected.reduce((sum, point) => sum + point.z, 0) / projected.length;
  const centerPoint = projected.reduce(
    (acc, point) => ({
      x: acc.x + point.x / projected.length,
      y: acc.y + point.y / projected.length,
      z: acc.z + point.z / projected.length,
    }),
    { x: 0, y: 0, z: 0 }
  );
  return { points: projected.map((point) => `${point.x},${point.y}`).join(" "), center: centerPoint, frontness, visible: frontness > -0.08 };
}

export default function WorldMapPage() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameKey>("cs2");
  const [selectedCountry, setSelectedCountry] = useState<CountryName>("Denmark");
  const [rotation, setRotation] = useState({ lat: -8, lon: -8 });
  const [isDragging, setIsDragging] = useState(false);

  const rotationRef = useRef(rotation);
  const velocityRef = useRef({ lat: 0, lon: 0 });
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; lastX: number; lastY: number; startLat: number; startLon: number; lastTime: number } | null>(null);

  const activeCountries = useMemo(() => {
    return gameData[selectedGame].map((entry) => ({ ...entry, ...countryShapes[entry.country] })).sort((a, b) => b.score - a.score);
  }, [selectedGame]);

  const activeCountry = activeCountries.find((country) => country.country === selectedCountry) ?? activeCountries[0];

  useEffect(() => { rotationRef.current = rotation; }, [rotation]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const firstCountry = gameData[selectedGame][0].country;
    setSelectedCountry(firstCountry);
    focusCountry(countryShapes[firstCountry].anchor);
  }, [selectedGame]);

  useEffect(() => {
    let frame = 0;
    function animate() {
      frame = requestAnimationFrame(animate);
      if (dragRef.current) return;
      const velocity = velocityRef.current;
      velocity.lon *= 0.94;
      velocity.lat *= 0.94;
      const idleSpin = Math.abs(velocity.lon) < 0.01 && Math.abs(velocity.lat) < 0.01 ? 0.045 : 0;
      const next = { lat: clamp(rotationRef.current.lat + velocity.lat, -58, 58), lon: rotationRef.current.lon + velocity.lon + idleSpin };
      rotationRef.current = next;
      setRotation(next);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  function focusCountry(anchor: LatLon) {
    const [lat, lon] = anchor;
    const next = { lat: clamp(lat * 0.42, -42, 42), lon: -lon };
    velocityRef.current = { lat: 0, lon: 0 };
    rotationRef.current = next;
    setRotation(next);
  }

  function selectCountry(countryName: CountryName) {
    setSelectedCountry(countryName);
    focusCountry(countryShapes[countryName].anchor);
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const scale = svgSize / bounds.width;
    const svgX = x * scale;
    const svgY = y * scale;
    const distanceFromCenter = Math.hypot(svgX - center, svgY - center);
    if (distanceFromCenter > radius + 18) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    velocityRef.current = { lat: 0, lon: 0 };
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, startLat: rotationRef.current.lat, startLon: rotationRef.current.lon, lastTime: performance.now() };
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!dragRef.current) return;
    const drag = dragRef.current;
    const now = performance.now();
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    const moveX = event.clientX - drag.lastX;
    const moveY = event.clientY - drag.lastY;
    const deltaTime = Math.max(16, now - drag.lastTime);
    const next = { lat: clamp(drag.startLat - deltaY * 0.18, -58, 58), lon: drag.startLon + deltaX * 0.24 };
    velocityRef.current = { lon: (moveX / deltaTime) * 7.5, lat: (-moveY / deltaTime) * 5.5 };
    rotationRef.current = next;
    setRotation(next);
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = now;
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
      dragRef.current = null;
      setIsDragging(false);
    }
  }

  const projectedContinents = useMemo(() => continentShapes.map((shape) => projectShape(shape, rotation.lat, rotation.lon)), [rotation]);

  const projectedCountries = useMemo(() => {
    return activeCountries.map((country) => ({ ...country, projected: projectShape(country.shape, rotation.lat, rotation.lon) })).sort((a, b) => a.projected.frontness - b.projected.frontness);
  }, [activeCountries, rotation]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#111827]">
      <WorldMapBackground />
      <header className={`fixed left-0 right-0 top-0 z-50 border-b border-[#ff2fa8]/25 bg-white/95 backdrop-blur transition-all duration-300 ${scrolled ? "h-[72px]" : "h-[126px]"}`}>
        <div className="mx-auto flex h-full max-w-7xl items-center px-8">
          <div className="mr-14 flex shrink-0 items-center gap-5">
            <a href="/space-invaders" className={`relative shrink-0 transition-all duration-300 ${scrolled ? "h-11 w-11" : "h-24 w-24"}`}><Image src="/skillatlas-logo.png" alt="SkillAtlas logo" fill className="object-contain" priority /></a>
            <a href="/" className={`relative shrink-0 transition-all duration-300 ${scrolled ? "h-7 w-44" : "h-14 w-80"}`}><Image src="/skillatlas-title.png" alt="SkillAtlas title" fill className="object-contain object-left" priority /></a>
          </div>
          <nav className="hidden flex-1 items-center justify-around md:flex">
            {["Rankings", "World Map", "Countries", "Profiles", "User Rankings", "About"].map((item) => (
              <a key={item} className={`font-semibold transition-all duration-300 ${item === "World Map" ? "text-[#19d3cf]" : "text-gray-700 hover:text-[#19d3cf]"} ${scrolled ? "text-sm" : "text-[1rem]"}`} href={item === "Rankings" ? "/" : `/${item.toLowerCase().replace(" ", "-")}`}>{item}</a>
            ))}
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-8 pb-10 pt-[150px]">
        <div className="mb-6 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#19d3cf]">World Map</p>
          <h1 className="mb-2 text-xl font-black tracking-tight">Spin the globe. See where each game belongs.</h1>
          <p className="text-sm text-gray-600 md:whitespace-nowrap">Select a game, rotate the globe, and explore which countries dominate the global skill map.</p>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.02fr_2.25fr_1.05fr]">
          <aside className="rounded-3xl border border-[#ff2fa8]/40 bg-white/92 p-5 shadow-sm backdrop-blur">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">Select Game</p>
            <div className="grid gap-3">
              {gameOrder.map((game) => (
                <button key={game} onClick={() => setSelectedGame(game)} className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition-all duration-300 ${selectedGame === game ? "border-[#19d3cf] bg-[#19d3cf] text-white shadow-md" : "border-gray-200 bg-white text-gray-700 hover:border-[#ff2fa8] hover:text-[#ff2fa8]"}`}>{gameLabels[game]}</button>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-[#19d3cf]/25 bg-[#19d3cf]/5 p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#19d3cf]">Heat Map Key</p>
              <div className="space-y-2 text-xs font-semibold text-gray-600">
                {Object.entries(tierStyles).map(([tier, style]) => <div key={tier} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: style.color }} />{style.label}</div>)}
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[#ff2fa8]/25 bg-[#ff2fa8]/5 p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff2fa8]">Controls</p>
              <p className="text-xs font-semibold leading-relaxed text-gray-600">Grab anywhere on the globe and drag. The spin now uses smoother movement and carries momentum after release.</p>
            </div>
          </aside>

          <section className="relative min-h-[720px] overflow-hidden rounded-3xl border border-[#ff2fa8]/40 bg-white/88 shadow-sm backdrop-blur">
            <div className="absolute left-6 top-5 z-20"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#19d3cf]">{gameLabels[selectedGame]}</p><p className="mt-1 text-sm font-semibold text-gray-500">Country-shape dominance globe</p></div>
            <div className="absolute inset-0 flex items-center justify-center pt-12">
              <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className={`h-[680px] w-[680px] max-w-[94%] select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
                <defs>
                  <radialGradient id="globeFill" cx="35%" cy="28%" r="78%"><stop offset="0%" stopColor="rgba(255,255,255,0.96)" /><stop offset="32%" stopColor="rgba(25,211,207,0.15)" /><stop offset="58%" stopColor="rgba(255,47,168,0.10)" /><stop offset="100%" stopColor="rgba(15,23,42,0.12)" /></radialGradient>
                  <clipPath id="globeClip"><circle cx={center} cy={center} r={radius} /></clipPath>
                  <filter id="shapeGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                <circle cx={center} cy={center} r={radius} fill="url(#globeFill)" />
                <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(148,163,184,0.42)" strokeWidth="1.4" />
                <g clipPath="url(#globeClip)">
                  {[0.78, 0.55, 0.32].map((scale) => <ellipse key={`lat-${scale}`} cx={center} cy={center} rx={radius} ry={radius * scale} fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="1" />)}
                  {[0.78, 0.55, 0.32].map((scale) => <ellipse key={`lon-${scale}`} cx={center} cy={center} rx={radius * scale} ry={radius} fill="none" stroke="rgba(148,163,184,0.22)" strokeWidth="1" />)}
                  <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
                  <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
                  {projectedContinents.map((continent, index) => continent.visible ? <polygon key={`continent-${index}`} points={continent.points} fill="rgba(100,116,139,0.085)" stroke="rgba(100,116,139,0.12)" strokeWidth="1" /> : null)}
                  {projectedCountries.map((country) => {
                    if (!country.projected.visible) return null;
                    const selected = country.country === selectedCountry;
                    const tier = tierStyles[country.tier];
                    const opacity = selected ? 0.92 : Math.max(0.28, 0.46 + country.projected.frontness * 0.34);
                    return <g key={country.country}>
                      {selected && <polygon points={country.projected.points} fill={tier.soft} stroke={tier.color} strokeWidth="10" opacity="0.20" filter="url(#shapeGlow)" />}
                      <polygon points={country.projected.points} fill={tier.color} fillOpacity={opacity} stroke={selected ? "#ffffff" : tier.color} strokeWidth={selected ? 2.4 : 1} filter={selected ? "url(#shapeGlow)" : undefined} className="transition-all duration-300" onClick={(event) => { event.stopPropagation(); setSelectedCountry(country.country); }} />
                      <polygon points={country.projected.points} fill="transparent" stroke={tier.color} strokeWidth={selected ? 2.8 : 1.4} strokeOpacity={selected ? 0.9 : 0.4} />
                    </g>;
                  })}
                  {projectedCountries.map((country) => {
                    const selected = country.country === selectedCountry;
                    if (!country.projected.visible || (!selected && country.score < 88)) return null;
                    const tier = tierStyles[country.tier];
                    return <g key={`label-${country.country}`}>
                      <rect x={country.projected.center.x - (selected ? 54 : 38)} y={country.projected.center.y + 14} width={selected ? 108 : 76} height={selected ? 30 : 24} rx={13} fill="rgba(255,255,255,0.92)" stroke={tier.color} strokeOpacity={selected ? 0.34 : 0.18} />
                      <text x={country.projected.center.x} y={country.projected.center.y + (selected ? 34 : 31)} textAnchor="middle" fontSize={selected ? 15 : 11} fontWeight="900" fill={tier.color}>{country.country}</text>
                    </g>;
                  })}
                </g>
                <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.62)" strokeWidth="2" />
              </svg>
            </div>
            <div className="absolute bottom-5 left-6 right-6 z-20 grid gap-3 md:grid-cols-3"><MiniStat label="Top Nation" value={activeCountries[0].name} /><MiniStat label="Dominance Score" value={`${activeCountries[0].score}`} /><MiniStat label="Biggest Mover" value={`${activeCountries.find((item) => item.rankMove > 0)?.name ?? activeCountries[0].name} ▲`} /></div>
          </section>

          <aside className="grid gap-4">
            <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/92 p-5 shadow-sm backdrop-blur">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#19d3cf]">Top Countries</p>
              <div className="space-y-3">
                {activeCountries.slice(0, 7).map((country, index) => <button key={country.country} onClick={() => selectCountry(country.country)} className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all duration-300 ${selectedCountry === country.country ? "bg-[#19d3cf] text-white shadow-md" : "bg-gray-50 text-gray-700 hover:bg-[#ff2fa8]/8"}`}><span className="flex items-center gap-3"><span className={selectedCountry === country.country ? "font-black text-white" : "font-black text-[#ff2fa8]"}>{index + 1}</span><span className="font-black">{country.name}</span></span><span className="text-xs font-black">{country.score}</span></button>)}
              </div>
            </div>
            <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/92 p-5 shadow-sm backdrop-blur">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#ff2fa8]">Country Detail</p><h2 className="text-2xl font-black">{activeCountry.name}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#19d3cf]/10 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Score</p><p className="mt-2 text-xl font-black text-[#19d3cf]">{activeCountry.score}</p></div><div className="rounded-2xl bg-[#ff2fa8]/10 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Rank Move</p><p className={`mt-2 text-xl font-black ${activeCountry.rankMove >= 0 ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>{activeCountry.rankMove >= 0 ? "▲" : "▼"} {Math.abs(activeCountry.rankMove)}</p></div></div>
              <div className="mt-5"><p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Why they win</p><div className="flex flex-wrap gap-2">{activeCountry.why.map((item) => <span key={item} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600">{item}</span>)}</div></div>
              <div className="mt-5"><p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Room for improvement</p><div className="flex flex-wrap gap-2">{activeCountry.improve.map((item) => <span key={item} className="rounded-full border border-[#ff2fa8]/25 bg-[#ff2fa8]/5 px-3 py-1 text-xs font-bold text-gray-600">{item}</span>)}</div></div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[#ff2fa8]/30 bg-white/90 p-4 shadow-sm backdrop-blur"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{label}</p><p className="mt-2 text-lg font-black text-[#19d3cf]">{value}</p></div>;
}

function WorldMapBackground() {
  return <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden"><div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]" /><div className="absolute left-1/2 top-[42%] h-[880px] w-[880px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(25,211,207,0.10)_0%,rgba(255,47,168,0.055)_42%,transparent_72%)] blur-2xl" /><div className="absolute left-[8%] top-[22%] h-80 w-80 rounded-full bg-[#19d3cf]/[0.07] blur-3xl" /><div className="absolute bottom-[14%] right-[8%] h-80 w-80 rounded-full bg-[#ff2fa8]/[0.07] blur-3xl" /></div>;
}
