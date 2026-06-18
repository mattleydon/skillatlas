"use client";

import Image from "next/image";
import type { PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const games = ["CS2", "League of Legends", "Valorant", "Fortnite", "Rocket League", "Chess"] as const;
type Game = (typeof games)[number];

type CountryPoint = {
  country: string;
  lat: number;
  lon: number;
  score: number;
  rank: number;
  trend: "up" | "down";
  change: string;
  why: string[];
  improvement: string[];
};

const gameData: Record<Game, CountryPoint[]> = {
  CS2: [
    { country: "Denmark", lat: 56.2, lon: 9.5, score: 98, rank: 1, trend: "up", change: "+2", why: ["Elite team systems", "Tactical culture", "LAN history"], improvement: ["Larger talent pool", "More aim depth"] },
    { country: "South Korea", lat: 36.5, lon: 127.8, score: 96, rank: 2, trend: "up", change: "+1", why: ["Esports discipline", "Fast practice culture", "Infrastructure"], improvement: ["More CS history", "More top-tier teams"] },
    { country: "China", lat: 35.8, lon: 104.1, score: 94, rank: 3, trend: "down", change: "-1", why: ["Huge player base", "Professional investment", "Mechanical ceiling"], improvement: ["LAN consistency", "Tactical identity"] },
    { country: "Sweden", lat: 60.1, lon: 18.6, score: 91, rank: 4, trend: "up", change: "+3", why: ["FPS heritage", "Grassroots scene", "Mechanical skill"], improvement: ["Modern team depth", "Youth pipeline"] },
    { country: "USA", lat: 39.8, lon: -98.6, score: 89, rank: 5, trend: "down", change: "-2", why: ["Large talent pool", "Creator scene", "Prize exposure"], improvement: ["Team discipline", "Tactical identity"] },
    { country: "France", lat: 46.2, lon: 2.2, score: 86, rank: 6, trend: "up", change: "+1", why: ["EU competition", "Strong clubs", "FPS culture"], improvement: ["Consistency", "More elite IGLs"] },
    { country: "Brazil", lat: -14.2, lon: -51.9, score: 84, rank: 7, trend: "down", change: "-1", why: ["Aggressive style", "Passionate scene", "LAN energy"], improvement: ["Structure", "Map pool depth"] },
    { country: "Australia", lat: -25.3, lon: 133.8, score: 78, rank: 8, trend: "up", change: "+1", why: ["Dedicated scene", "Strong mechanics", "OCE rivalry"], improvement: ["International reps", "Ping barrier"] },
  ],
  "League of Legends": [
    { country: "South Korea", lat: 36.5, lon: 127.8, score: 99, rank: 1, trend: "up", change: "+1", why: ["Elite coaching", "Solo queue depth", "Esports culture"], improvement: ["Meta risk-taking", "Creative drafting"] },
    { country: "China", lat: 35.8, lon: 104.1, score: 97, rank: 2, trend: "down", change: "-1", why: ["Massive league", "Investment", "Mechanical talent"], improvement: ["International consistency", "Macro discipline"] },
    { country: "Denmark", lat: 56.2, lon: 9.5, score: 89, rank: 3, trend: "up", change: "+2", why: ["Mid-lane legacy", "EU systems", "High-level exports"], improvement: ["Domestic scale", "Player depth"] },
    { country: "Taiwan", lat: 23.7, lon: 121.0, score: 86, rank: 4, trend: "up", change: "+1", why: ["Regional history", "Discipline", "Strong fundamentals"], improvement: ["Investment scale", "Talent retention"] },
    { country: "USA", lat: 39.8, lon: -98.6, score: 80, rank: 5, trend: "down", change: "-2", why: ["Big market", "Imports", "Content ecosystem"], improvement: ["Native talent", "Practice culture"] },
    { country: "Vietnam", lat: 14.1, lon: 108.3, score: 79, rank: 6, trend: "up", change: "+3", why: ["Aggressive meta", "Regional fire", "Mechanical play"], improvement: ["Macro discipline", "Global consistency"] },
  ],
  Valorant: [
    { country: "Brazil", lat: -14.2, lon: -51.9, score: 93, rank: 1, trend: "up", change: "+2", why: ["Aggression", "Aim culture", "LAN confidence"], improvement: ["Utility discipline", "Map pool depth"] },
    { country: "South Korea", lat: 36.5, lon: 127.8, score: 92, rank: 2, trend: "up", change: "+1", why: ["Structure", "Utility discipline", "Coaching"], improvement: ["Creative mid-rounding", "Peak aim volatility"] },
    { country: "USA", lat: 39.8, lon: -98.6, score: 90, rank: 3, trend: "down", change: "-1", why: ["Creator pipeline", "Talent pool", "Org investment"], improvement: ["Role stability", "Consistency"] },
    { country: "Turkey", lat: 39.0, lon: 35.2, score: 88, rank: 4, trend: "up", change: "+4", why: ["Aim mechanics", "Ranked depth", "Young talent"], improvement: ["Team structure", "LAN experience"] },
    { country: "Japan", lat: 36.2, lon: 138.3, score: 84, rank: 5, trend: "down", change: "-2", why: ["Fanbase", "Organisation", "Tactical growth"], improvement: ["Aggression", "Mechanical ceiling"] },
    { country: "France", lat: 46.2, lon: 2.2, score: 83, rank: 6, trend: "up", change: "+1", why: ["EU structure", "FPS history", "Talent exports"], improvement: ["International peaks", "Role depth"] },
  ],
  Fortnite: [
    { country: "USA", lat: 39.8, lon: -98.6, score: 95, rank: 1, trend: "up", change: "+1", why: ["Creator scene", "Prize exposure", "Huge player base"], improvement: ["Consistency", "Burnout management"] },
    { country: "Canada", lat: 56.1, lon: -106.3, score: 91, rank: 2, trend: "up", change: "+2", why: ["Mechanical skill", "NA servers", "Tournament depth"], improvement: ["Scale", "Team transition"] },
    { country: "UK", lat: 55.4, lon: -3.4, score: 88, rank: 3, trend: "down", change: "-1", why: ["EU competition", "Scrim culture", "Young talent"], improvement: ["Pressure control", "Late-game consistency"] },
    { country: "France", lat: 46.2, lon: 2.2, score: 87, rank: 4, trend: "up", change: "+1", why: ["EU ecosystem", "Technical skill", "Competitive scene"], improvement: ["Creator exposure", "Regional dominance"] },
    { country: "Brazil", lat: -14.2, lon: -51.9, score: 84, rank: 5, trend: "down", change: "-2", why: ["Aggressive play", "Large player base", "Creative meta"], improvement: ["Defensive structure", "Tournament stability"] },
  ],
  "Rocket League": [
    { country: "France", lat: 46.2, lon: 2.2, score: 92, rank: 1, trend: "up", change: "+1", why: ["Team play", "Mechanical depth", "EU dominance"], improvement: ["Mental reset", "Rotation risk"] },
    { country: "Netherlands", lat: 52.1, lon: 5.3, score: 89, rank: 2, trend: "up", change: "+3", why: ["Fast rotations", "Young talent", "Club systems"], improvement: ["LAN experience", "Depth past top players"] },
    { country: "USA", lat: 39.8, lon: -98.6, score: 87, rank: 3, trend: "down", change: "-1", why: ["NA depth", "Org backing", "Content pipeline"], improvement: ["EU pace adaptation", "Defensive structure"] },
    { country: "UK", lat: 55.4, lon: -3.4, score: 85, rank: 4, trend: "up", change: "+1", why: ["EU competition", "Mechanical ceiling", "LAN exposure"], improvement: ["Consistency", "Elite striker depth"] },
    { country: "Australia", lat: -25.3, lon: 133.8, score: 78, rank: 5, trend: "down", change: "-1", why: ["Regional scene", "Dedicated talent", "Team chemistry"], improvement: ["Ping barrier", "International reps"] },
  ],
  Chess: [
    { country: "India", lat: 20.6, lon: 78.9, score: 94, rank: 1, trend: "up", change: "+2", why: ["Youth wave", "Coaching culture", "Online chess boom"], improvement: ["World title conversion", "Veteran depth"] },
    { country: "Russia", lat: 61.5, lon: 105.3, score: 93, rank: 2, trend: "down", change: "-1", why: ["Historic depth", "Schools", "Grandmaster density"], improvement: ["Youth momentum", "International access"] },
    { country: "USA", lat: 39.8, lon: -98.6, score: 91, rank: 3, trend: "up", change: "+1", why: ["University chess", "Online platforms", "Elite tournaments"], improvement: ["Grassroots scale", "Junior consistency"] },
    { country: "Uzbekistan", lat: 41.4, lon: 64.6, score: 88, rank: 4, trend: "up", change: "+5", why: ["Young grandmasters", "Team success", "Rapid growth"], improvement: ["Depth", "Long-term infrastructure"] },
    { country: "China", lat: 35.8, lon: 104.1, score: 86, rank: 5, trend: "down", change: "-2", why: ["Structured training", "Strong federation", "Elite players"], improvement: ["Tournament volume", "Visibility"] },
  ],
};

function heatColor(score: number) {
  if (score >= 94) return "#19d3cf";
  if (score >= 88) return "#31c9da";
  if (score >= 82) return "#b28af6";
  return "#ff2fa8";
}

function projectPoint(lat: number, lon: number, rotX: number, rotY: number) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = ((lon + rotY) * Math.PI) / 180;
  const tilt = (rotX * Math.PI) / 180;

  const x = Math.cos(latRad) * Math.sin(lonRad);
  const y = Math.sin(latRad);
  const z = Math.cos(latRad) * Math.cos(lonRad);

  const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
  const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);

  return {
    x: 50 + x * 42,
    y: 50 - y2 * 42,
    z: z2,
    visible: z2 > -0.2,
    scale: Math.max(0.55, 0.82 + z2 * 0.38),
    opacity: z2 > -0.2 ? Math.max(0.35, 0.58 + z2 * 0.36) : 0.14,
  };
}

export default function WorldMapPage() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game>("CS2");
  const [selectedCountryName, setSelectedCountryName] = useState("Denmark");
  const [rotation, setRotation] = useState({ x: -8, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startRotX: number;
    startRotY: number;
  } | null>(null);

  const activeData = gameData[selectedGame];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setSelectedCountryName(gameData[selectedGame][0].country);
  }, [selectedGame]);

  useEffect(() => {
    if (isDragging) return;

    const timer = window.setInterval(() => {
      setRotation((current) => ({
        ...current,
        y: current.y + 0.18,
      }));
    }, 40);

    return () => window.clearInterval(timer);
  }, [isDragging]);

  const selectedCountry = activeData.find((item) => item.country === selectedCountryName) ?? activeData[0];

  const projectedCountries = useMemo(() => {
    return activeData.map((country) => ({
      ...country,
      projection: projectPoint(country.lat, country.lon, rotation.x, rotation.y),
    }));
  }, [activeData, rotation]);

  const projectedRoutes = useMemo(() => {
    const leader = activeData[0];
    return activeData.slice(1, 6).map((target) => {
      const start = projectPoint(leader.lat, leader.lon, rotation.x, rotation.y);
      const end = projectPoint(target.lat, target.lon, rotation.x, rotation.y);

      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2 - 12;

      return { start, end, midX, midY, target };
    });
  }, [activeData, rotation]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startRotX: rotation.x,
      startRotY: rotation.y,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    setRotation({
      y: dragRef.current.startRotY + deltaX * 0.35,
      x: Math.max(-55, Math.min(55, dragRef.current.startRotX - deltaY * 0.22)),
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    setIsDragging(false);
    dragRef.current = null;

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // no-op
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
            Select a game, rotate the globe, and explore which countries dominate the global skill map.
          </p>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_2.4fr_1.15fr]">
          <aside className="rounded-3xl border border-[#ff2fa8]/40 bg-white/92 p-5 shadow-sm backdrop-blur">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">Select Game</p>

            <div className="grid gap-3">
              {games.map((game) => (
                <button
                  key={game}
                  onClick={() => setSelectedGame(game)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition-all duration-300 ${
                    selectedGame === game
                      ? "border-[#19d3cf] bg-[#19d3cf] text-white shadow-md"
                      : "border-gray-200 bg-white text-gray-700 hover:border-[#ff2fa8] hover:text-[#ff2fa8]"
                  }`}
                >
                  {game}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#19d3cf]/25 bg-[#19d3cf]/5 p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#19d3cf]">Heat Map Key</p>
              <div className="space-y-2 text-xs font-semibold text-gray-600">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#19d3cf]" />Elite dominance</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#31c9da]" />High strength</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#b28af6]" />Emerging force</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#ff2fa8]" />Developing contender</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#ff2fa8]/25 bg-[#ff2fa8]/5 p-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff2fa8]">Controls</p>
              <p className="text-xs font-semibold leading-relaxed text-gray-600">
                Drag the globe left, right, up, or down. Release it and it slowly rotates again.
              </p>
            </div>
          </aside>

          <section className="relative min-h-[650px] overflow-hidden rounded-3xl border border-[#ff2fa8]/40 bg-white/88 shadow-sm backdrop-blur">
            <div className="absolute left-6 top-5 z-20">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#19d3cf]">{selectedGame}</p>
              <p className="mt-1 text-sm font-semibold text-gray-500">Interactive dominance globe</p>
            </div>

            <div
              className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.95)_0%,rgba(25,211,207,0.13)_34%,rgba(255,47,168,0.09)_58%,rgba(15,23,42,0.10)_100%)] shadow-[inset_-30px_-40px_80px_rgba(15,23,42,0.12),0_0_100px_rgba(25,211,207,0.18)]">
                <div
                  className="absolute inset-0 rounded-full border border-slate-300/80 transition-transform duration-300"
                  style={{
                    transform: `rotateX(${rotation.x * 0.2}deg) rotateZ(${rotation.y * 0.12}deg)`,
                  }}
                />

                <div className="absolute inset-[8%] rounded-full border border-slate-300/50" />
                <div className="absolute inset-[18%] rounded-full border border-slate-300/35" />
                <div className="absolute left-1/2 top-[5%] h-[90%] w-px -translate-x-1/2 bg-slate-300/60" />
                <div className="absolute left-[28%] top-[12%] h-[76%] w-px rotate-[24deg] bg-slate-300/40" />
                <div className="absolute left-[72%] top-[12%] h-[76%] w-px -rotate-[24deg] bg-slate-300/40" />
                <div className="absolute left-[8%] top-1/2 h-px w-[84%] -translate-y-1/2 bg-slate-300/60" />
                <div className="absolute left-[16%] top-[34%] h-px w-[68%] -translate-y-1/2 bg-slate-300/40" />
                <div className="absolute left-[16%] top-[66%] h-px w-[68%] -translate-y-1/2 bg-slate-300/40" />

                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
                  {projectedRoutes.map((route) => {
                    if (route.start.opacity < 0.25 || route.end.opacity < 0.25) return null;

                    return (
                      <path
                        key={route.target.country}
                        d={`M ${route.start.x} ${route.start.y} Q ${route.midX} ${route.midY} ${route.end.x} ${route.end.y}`}
                        fill="none"
                        stroke={route.target.trend === "up" ? "#19d3cf" : "#ff2fa8"}
                        strokeWidth="0.35"
                        strokeDasharray="1.4 1.8"
                        opacity="0.55"
                      />
                    );
                  })}
                </svg>

                {projectedCountries.map((country) => {
                  const color = heatColor(country.score);
                  const selected = selectedCountryName === country.country;

                  return (
                    <button
                      key={country.country}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedCountryName(country.country);
                      }}
                      className="absolute rounded-full transition-all duration-300"
                      style={{
                        left: `${country.projection.x}%`,
                        top: `${country.projection.y}%`,
                        opacity: country.projection.opacity,
                        transform: `translate(-50%, -50%) scale(${country.projection.scale})`,
                        zIndex: Math.round(country.projection.z * 100 + 100),
                        pointerEvents: country.projection.visible ? "auto" : "none",
                      }}
                      aria-label={country.country}
                    >
                      <span
                        className={`block rounded-full ${selected ? "h-6 w-6" : "h-4 w-4"}`}
                        style={{
                          backgroundColor: color,
                          boxShadow: selected ? `0 0 0 8px ${color}22, 0 0 34px ${color}` : `0 0 22px ${color}`,
                        }}
                      />
                      <span
                        className="absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-gray-700 shadow-sm md:block"
                        style={{ color }}
                      >
                        {country.country}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-5 left-6 right-6 z-20 grid gap-3 md:grid-cols-3">
              <MiniStat label="Top Nation" value={activeData[0].country} />
              <MiniStat label="Dominance Score" value={`${activeData[0].score}`} />
              <MiniStat label="Biggest Mover" value={`${activeData.find((item) => item.trend === "up")?.country ?? activeData[0].country} ▲`} />
            </div>
          </section>

          <aside className="grid gap-4">
            <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/92 p-5 shadow-sm backdrop-blur">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-[#19d3cf]">Top Countries</p>

              <div className="space-y-3">
                {activeData.slice(0, 6).map((country) => (
                  <button
                    key={country.country}
                    onClick={() => setSelectedCountryName(country.country)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all duration-300 ${
                      selectedCountryName === country.country
                        ? "bg-[#19d3cf] text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-[#ff2fa8]/8"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={selectedCountryName === country.country ? "font-black text-white" : "font-black text-[#ff2fa8]"}>{country.rank}</span>
                      <span className="font-black">{country.country}</span>
                    </span>
                    <span className="text-xs font-black">{country.score}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/92 p-5 shadow-sm backdrop-blur">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#ff2fa8]">Country Detail</p>
              <h2 className="text-2xl font-black">{selectedCountry.country}</h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#19d3cf]/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Score</p>
                  <p className="mt-2 text-xl font-black text-[#19d3cf]">{selectedCountry.score}</p>
                </div>

                <div className="rounded-2xl bg-[#ff2fa8]/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Rank Move</p>
                  <p className={`mt-2 text-xl font-black ${selectedCountry.trend === "up" ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>
                    {selectedCountry.trend === "up" ? "▲" : "▼"} {selectedCountry.change}
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
                  {selectedCountry.improvement.map((item) => (
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