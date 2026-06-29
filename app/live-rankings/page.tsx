"use client";

import Image from "next/image";
import type { DragEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type LiveCountry = {
  name: string;
  code: string;
  score: number;
  momentum: number;
  movedBy: string;
  reasons: string[];
};

const initialCountries: LiveCountry[] = [
  { name: "Denmark", code: "dk", score: 98, momentum: 12, movedBy: "Tactical votes", reasons: ["Team play", "CS depth", "IGL culture"] },
  { name: "South Korea", code: "kr", score: 97, momentum: 10, movedBy: "MOBA voters", reasons: ["Academies", "Practice", "Discipline"] },
  { name: "China", code: "cn", score: 95, momentum: 7, movedBy: "Scale voters", reasons: ["Player base", "Investment", "Mechanics"] },
  { name: "USA", code: "us", score: 94, momentum: 9, movedBy: "Fortnite voters", reasons: ["Creators", "Talent pool", "Events"] },
  { name: "Brazil", code: "br", score: 93, momentum: 14, movedBy: "FPS voters", reasons: ["Aggression", "Aim", "Fan energy"] },
  { name: "France", code: "fr", score: 92, momentum: 6, movedBy: "Rocket League voters", reasons: ["Aerial play", "Technical depth", "Clubs"] },
  { name: "Sweden", code: "se", score: 91, momentum: -2, movedBy: "Legacy voters", reasons: ["CS history", "LAN culture", "AWPers"] },
  { name: "Japan", code: "jp", score: 89, momentum: 5, movedBy: "Fighting game voters", reasons: ["Precision", "Arcade roots", "Patience"] },
  { name: "Canada", code: "ca", score: 87, momentum: 8, movedBy: "Valorant voters", reasons: ["Composure", "FPS skill", "NA scene"] },
  { name: "Australia", code: "au", score: 86, momentum: 4, movedBy: "OCE voters", reasons: ["Resilience", "FPS grit", "Distance fighter"] },
];


function SkillAtlasHeader({ active }: { active: "Rankings" | "World Map" | "Countries" | "Profiles" | "About" }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 border-b border-[#ff2fa8]/25 bg-white/95 backdrop-blur transition-all duration-300 ${
        scrolled ? "h-[72px]" : "h-[126px]"
      }`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center px-8">
        <div className="mr-14 flex shrink-0 items-center gap-5">
          <a href="/space-invaders" className={`relative shrink-0 transition-all duration-300 ${scrolled ? "h-11 w-11" : "h-24 w-24"}`}>
            <Image src="/skillatlas-logo.png" alt="SkillAtlas logo" fill className="object-contain" priority />
          </a>

          <a href="/" className={`relative shrink-0 transition-all duration-300 ${scrolled ? "h-7 w-44" : "h-14 w-80"}`}>
            <Image src="/skillatlas-title.png" alt="SkillAtlas title" fill className="object-contain object-left" priority />
          </a>
        </div>

        <nav className="hidden flex-1 items-center justify-around md:flex">
          {[
            ["Rankings", "/"],
            ["World Map", "/world-map"],
            ["Countries", "/countries"],
            ["Profiles", "/profiles"],
            ["About", "/about"],
          ].map(([item, href]) => (
            <a
              key={item}
              className={`font-semibold transition-all duration-300 ${
                item === active ? "text-[#19d3cf]" : "text-gray-700 hover:text-[#19d3cf]"
              } ${scrolled ? "text-sm" : "text-[1rem]"}`}
              href={href}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}



function RankingsBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(25,211,207,0.18),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(255,47,168,0.14),transparent_30%),linear-gradient(180deg,#F8FAFC_0%,#EEF7FA_100%)]" />
      <div className="absolute left-[-10%] top-40 h-[560px] w-[560px] rounded-full border border-[#19d3cf]/20" />
      <div className="absolute right-[-12%] top-72 h-[620px] w-[620px] rounded-full border border-[#ff2fa8]/20" />
      <div className="absolute inset-x-0 top-[250px] h-px bg-[#ff2fa8]/25" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(15,23,42,0.32)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.32)_1px,transparent_1px)] [background-size:96px_96px]" />
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = Math.max(max - min, 1);
      const y = 34 - ((value - min) / range) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 38" className="h-9 w-28 overflow-visible" aria-hidden="true">
      <polyline fill="none" stroke="#19d3cf" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" points={points} />
    </svg>
  );
}

function pageThemeStyles() {
  return `
    html.skillatlas-dark .rankings-shell [class*="bg-white"] {
      background-color: rgba(53, 66, 80, 0.92) !important;
    }

    html.skillatlas-dark .rankings-shell [class*="bg-gray-50"] {
      background-color: rgba(32, 43, 55, 0.92) !important;
    }

    html.skillatlas-dark .rankings-shell [class*="text-gray-"] {
      color: rgb(203, 213, 225) !important;
    }

    html.skillatlas-dark .rankings-shell [class*="text-[#111827]"] {
      color: rgb(248, 250, 252) !important;
    }

    html.skillatlas-dark .rankings-shell input,
    html.skillatlas-dark .rankings-shell select {
      background-color: rgba(32, 43, 55, 0.96) !important;
      color: rgb(248, 250, 252) !important;
    }

    html.skillatlas-dark .rankings-shell {
      background: #2f3a46;
      color: rgb(248, 250, 252);
    }

    html.skillatlas-dark .rankings-shell > div:first-child {
      opacity: 0.58;
      filter: brightness(0.72) saturate(1.25);
    }
  `;
}


export default function LiveRankingsPage() {
  const [selectedGame, setSelectedGame] = useState("CS2");
  const [countries, setCountries] = useState(initialCountries);
  const [draggedName, setDraggedName] = useState<string | null>(null);
  const [activity, setActivity] = useState([
    "Brazil surged after 42 FPS votes.",
    "Denmark defended #1 with tactical votes.",
    "Canada climbed after a Valorant wave.",
  ]);

  const leader = countries[0];

  const liveScore = useMemo(() => countries.reduce((sum, country, index) => sum + country.score - index, 0), [countries]);

  function moveCountry(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= countries.length) return;

    setCountries((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((country, index) => ({
        ...country,
        score: Math.max(1, country.score + (country.name === moved.name ? 1 : 0) - Math.max(0, index - fromIndex > 0 ? 0 : 0)),
      }));
    });

    const movedCountry = countries[fromIndex];
    const targetCountry = countries[toIndex];
    setActivity((items) => [
      `${movedCountry.name} moved ${toIndex < fromIndex ? "up" : "down"} near ${targetCountry.name} in live rankings.`,
      ...items,
    ].slice(0, 6));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, targetIndex: number) {
    event.preventDefault();

    if (!draggedName) return;

    const fromIndex = countries.findIndex((country) => country.name === draggedName);
    moveCountry(fromIndex, targetIndex);
    setDraggedName(null);
  }

  return (
    <main className="rankings-shell relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#111827] transition-colors duration-300">
      <RankingsBackground />
      <style>{pageThemeStyles()}</style>
      <SkillAtlasHeader active="Rankings" />

      <section className="relative z-10 mx-auto max-w-7xl px-8 pb-16 pt-[150px]">
        <div className="mb-6 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#19d3cf]">Live Rankings</p>
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="mb-2 text-xl font-black tracking-tight">Drag countries up and down the rankings in real time.</h1>
              <p className="max-w-4xl text-sm font-semibold leading-relaxed text-gray-600">
                A live ranking sandbox for community movement, instant momentum, and chaotic leaderboard theatre.
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Live Game Lens</span>
              <select
                value={selectedGame}
                onChange={(event) => setSelectedGame(event.target.value)}
                className="h-14 w-full rounded-2xl border border-[#19d3cf]/35 bg-white/90 px-5 text-sm font-bold outline-none transition-all duration-300 focus:border-[#19d3cf] focus:shadow-[0_0_0_4px_rgba(25,211,207,0.14)]"
              >
                {["CS2", "League of Legends", "Valorant", "Fortnite", "Rocket League", "Chess"].map((game) => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mb-6 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Live Leader</p>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-3xl bg-gray-50 shadow-inner">
                  <img src={`https://flagcdn.com/w160/${leader.code}.png`} alt={`${leader.name} flag`} className="h-full w-full object-cover" />
                </span>
                <div>
                  <h2 className="text-3xl font-black">{leader.name}</h2>
                  <p className="font-black text-[#ff2fa8]">{selectedGame} · moving live</p>
                </div>
              </div>

              <div className="rounded-3xl bg-[#19d3cf]/12 px-4 py-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Live Score</p>
                <p className="text-3xl font-black text-[#19d3cf]">{leader.score}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Live Heat</p>
                <p className="text-lg font-black text-[#19d3cf]">{liveScore.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Instruction</p>
                <p className="text-sm font-semibold leading-relaxed text-gray-600">Drag a country card over another country to reorder the live board. Use arrows as a fallback.</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white/92 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-4 border-b border-[#ff2fa8]/20 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Live Board</p>
              <p className="text-xs font-black text-[#ff2fa8]">{selectedGame}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] uppercase tracking-[0.16em] text-gray-500">
                    <th className="px-5 py-4 font-black">Rank</th>
                    <th className="px-5 py-4 font-black">Country</th>
                    <th className="px-5 py-4 font-black">Live Score</th>
                    <th className="px-5 py-4 font-black">Momentum</th>
                    <th className="px-5 py-4 font-black">Moved By</th>
                    <th className="px-5 py-4 font-black">Why</th>
                    <th className="px-5 py-4 font-black">Move</th>
                  </tr>
                </thead>

                <tbody>
                  {countries.map((country, index) => (
                    <tr
                      key={country.name}
                      draggable
                      onDragStart={() => setDraggedName(country.name)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleDrop(event, index)}
                      className={`cursor-grab border-b border-gray-200/80 transition-all duration-300 active:cursor-grabbing ${
                        draggedName === country.name ? "bg-[#19d3cf]/15 opacity-70" : "hover:bg-[#19d3cf]/5"
                      }`}
                    >
                      <td className="px-5 py-4 text-lg font-black text-[#ff2fa8]">#{index + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-gray-50 shadow-inner">
                            <img src={`https://flagcdn.com/w80/${country.code}.png`} alt={`${country.name} flag`} className="h-full w-full object-cover" />
                          </span>
                          <span className="font-black">{country.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#19d3cf]/12 px-3 py-1 text-sm font-black text-[#19d3cf]">{country.score}</span>
                      </td>
                      <td className={`px-5 py-4 text-sm font-black ${country.momentum >= 0 ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>
                        {country.momentum >= 0 ? `▲ ${country.momentum}` : `▼ ${Math.abs(country.momentum)}`}
                      </td>
                      <td className="px-5 py-4 text-sm font-black text-gray-700">{country.movedBy}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {country.reasons.map((reason) => (
                            <span key={reason} className="rounded-full border border-[#19d3cf]/25 bg-[#19d3cf]/10 px-3 py-1 text-xs font-black text-gray-700">{reason}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => moveCountry(index, index - 1)} className="rounded-full border border-[#19d3cf]/35 px-3 py-1 text-xs font-black text-[#19d3cf]">↑</button>
                          <button type="button" onClick={() => moveCountry(index, index + 1)} className="rounded-full border border-[#ff2fa8]/35 px-3 py-1 text-xs font-black text-[#ff2fa8]">↓</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-5 shadow-sm backdrop-blur">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Live Movement Feed</p>
          <div className="grid gap-3 md:grid-cols-3">
            {activity.map((item) => (
              <div key={item} className="rounded-2xl border border-gray-200 bg-white/70 p-4 text-sm font-black text-gray-700">
                {item}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
