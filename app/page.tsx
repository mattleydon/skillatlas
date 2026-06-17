"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const periods = ["7 Days", "1 Month", "1 Year"] as const;

type Period = (typeof periods)[number];

const games = [
  {
    name: "CS2",
    topGame: "CS2",
    leadingNation: "Denmark",
    dominanceScore: 98,
    biggestMover: "Sweden",
    moverChange: "+3",
    direction: "up",
    trend: "M 0 42 C 20 38, 38 39, 54 30 S 82 16, 105 18 S 130 8, 150 6",
  },
  {
    name: "League of Legends",
    topGame: "LoL",
    leadingNation: "South Korea",
    dominanceScore: 96,
    biggestMover: "China",
    moverChange: "+2",
    direction: "up",
    trend: "M 0 40 C 22 34, 38 36, 55 28 S 82 20, 105 13 S 130 9, 150 10",
  },
  {
    name: "Valorant",
    topGame: "Valorant",
    leadingNation: "Brazil",
    dominanceScore: 93,
    biggestMover: "Turkey",
    moverChange: "+4",
    direction: "up",
    trend: "M 0 44 C 20 36, 42 40, 60 32 S 88 24, 110 14 S 132 12, 150 7",
  },
  {
    name: "Fortnite",
    topGame: "Fortnite",
    leadingNation: "USA",
    dominanceScore: 95,
    biggestMover: "Canada",
    moverChange: "+2",
    direction: "up",
    trend: "M 0 38 C 20 35, 36 28, 58 32 S 88 18, 108 20 S 130 12, 150 8",
  },
  {
    name: "Rocket League",
    topGame: "RL",
    leadingNation: "France",
    dominanceScore: 92,
    biggestMover: "Netherlands",
    moverChange: "+3",
    direction: "up",
    trend: "M 0 45 C 25 42, 38 35, 58 36 S 85 24, 112 16 S 132 11, 150 9",
  },
  {
    name: "Chess",
    topGame: "Chess",
    leadingNation: "India",
    dominanceScore: 94,
    biggestMover: "Uzbekistan",
    moverChange: "+5",
    direction: "up",
    trend: "M 0 42 C 18 35, 35 31, 52 33 S 78 22, 102 14 S 128 9, 150 6",
  },
];

const leaderboard = [
  {
    rank: 1,
    country: "Denmark",
    score: 98,
    rankChange: "+2",
    percentChange: "+4.2%",
    direction: "up",
    trends: {
      "7 Days": "M 0 36 C 25 34, 38 30, 55 28 S 85 20, 108 15 S 130 9, 150 7",
      "1 Month": "M 0 42 C 20 38, 40 39, 58 31 S 88 20, 112 17 S 135 9, 150 6",
      "1 Year": "M 0 44 C 22 40, 42 35, 62 32 S 92 18, 112 15 S 135 8, 150 5",
    },
    reasons: ["Team cohesion", "Tactical culture", "Elite CS systems"],
  },
  {
    rank: 2,
    country: "South Korea",
    score: 96,
    rankChange: "+1",
    percentChange: "+3.8%",
    direction: "up",
    trends: {
      "7 Days": "M 0 39 C 22 35, 38 34, 56 29 S 82 22, 108 16 S 130 12, 150 10",
      "1 Month": "M 0 42 C 25 36, 38 32, 58 33 S 88 22, 112 16 S 132 10, 150 11",
      "1 Year": "M 0 44 C 25 38, 42 34, 62 32 S 90 20, 110 15 S 132 10, 150 8",
    },
    reasons: ["Esports academies", "Training discipline", "Low-latency infrastructure"],
  },
  {
    rank: 3,
    country: "China",
    score: 94,
    rankChange: "-1",
    percentChange: "-1.1%",
    direction: "down",
    trends: {
      "7 Days": "M 0 18 C 22 18, 40 20, 58 19 S 88 26, 108 25 S 132 34, 150 35",
      "1 Month": "M 0 16 C 20 15, 40 18, 55 20 S 85 28, 105 29 S 130 38, 150 36",
      "1 Year": "M 0 14 C 20 16, 42 19, 62 18 S 90 30, 115 32 S 132 39, 150 41",
    },
    reasons: ["Huge player base", "Professional investment", "MOBA depth"],
  },
  {
    rank: 4,
    country: "Sweden",
    score: 91,
    rankChange: "+3",
    percentChange: "+1.7%",
    direction: "up",
    trends: {
      "7 Days": "M 0 43 C 22 40, 42 38, 58 34 S 86 24, 110 15 S 132 12, 150 9",
      "1 Month": "M 0 45 C 20 41, 40 39, 58 35 S 88 25, 112 16 S 134 13, 150 10",
      "1 Year": "M 0 46 C 22 42, 44 38, 64 34 S 92 22, 116 14 S 136 10, 150 7",
    },
    reasons: ["FPS history", "Grassroots scene", "Mechanical skill"],
  },
  {
    rank: 5,
    country: "USA",
    score: 89,
    rankChange: "-2",
    percentChange: "-0.6%",
    direction: "down",
    trends: {
      "7 Days": "M 0 18 C 22 20, 38 21, 55 25 S 82 30, 108 35 S 132 37, 150 42",
      "1 Month": "M 0 16 C 25 21, 38 20, 58 26 S 85 31, 105 36 S 130 34, 150 42",
      "1 Year": "M 0 14 C 22 19, 42 22, 62 27 S 92 32, 114 38 S 134 39, 150 44",
    },
    reasons: ["Large talent pool", "Creator scene", "Prize exposure"],
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("7 Days");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveGameIndex((current) => (current + 1) % games.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const activeGame = games[activeGameIndex];

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <header className="sticky top-0 z-50 border-b border-[#ff2fa8]/25 bg-white transition-all duration-300">
        <div
          className={`mx-auto flex max-w-7xl items-center px-8 transition-all duration-300 ${
            scrolled ? "py-2" : "py-3"
          }`}
        >
          <div className="mr-14 flex shrink-0 items-center gap-5">
            <div className={`relative transition-all duration-300 ${scrolled ? "h-16 w-16" : "h-24 w-24"}`}>
              <Image src="/skillatlas-logo.png" alt="SkillAtlas logo" fill className="object-contain" priority />
            </div>

            <div className={`relative transition-all duration-300 ${scrolled ? "h-10 w-56" : "h-14 w-80"}`}>
              <Image src="/skillatlas-title.png" alt="SkillAtlas title" fill className="object-contain object-left" priority />
            </div>
          </div>

          <nav className="hidden flex-1 items-center justify-around md:flex">
            {["Rankings", "World Map", "Countries", "Profiles", "About"].map((item) => (
              <a
                key={item}
                className="text-[1.05rem] font-semibold text-gray-700 transition-colors hover:text-[#19d3cf]"
                href={item === "Rankings" ? "/" : `/${item.toLowerCase().replace(" ", "-")}`}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-8 py-8">
        <div className="mb-5 rounded-3xl border border-[#ff2fa8]/45 bg-white p-6 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#19d3cf]">
            Global Gaming Rankings
          </p>

          <h2 className="mb-2 text-lg font-black tracking-tight">
            Which country is actually the best at gaming?
          </h2>

          <p className="text-sm text-gray-600 md:whitespace-nowrap">
            Track which countries dominate each game, why they win, and how skill changes across the world.
          </p>
        </div>

        <div className="mb-5 grid gap-4 md:grid-cols-4">
          <RotatingStatCard
            label="Top Game"
            value={activeGame.topGame}
            className="text-[#19d3cf]"
          />

          <div className="rounded-2xl border border-[#ff2fa8]/35 bg-white p-5 shadow-sm md:col-span-2">
            <div className="grid h-full grid-cols-3 items-start gap-6 transition-all duration-700">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                  Leading Nation
                </p>
                <p className="mt-4 text-lg font-black leading-none transition-all duration-700">
                  {activeGame.leadingNation}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                  7D Trend
                </p>
                <svg viewBox="0 0 150 50" className="mt-1 h-12 w-36">
                  <path
                    d={activeGame.trend}
                    fill="none"
                    stroke={activeGame.direction === "up" ? "#19d3cf" : "#ff2fa8"}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                  Dominance Score
                </p>
                <p className="mt-4 text-lg font-black leading-none text-[#19d3cf] transition-all duration-700">
                  {activeGame.dominanceScore}
                </p>
              </div>
            </div>
          </div>

          <RotatingStatCard
            label="Biggest Mover"
            value={`${activeGame.biggestMover} ▲${activeGame.moverChange.replace("+", "")}`}
            className="text-[#19d3cf]"
          />
        </div>

        <div className="mb-6 flex items-center justify-between gap-4 rounded-3xl border border-[#ff2fa8]/45 bg-white p-4 shadow-sm">
          <div className="flex gap-3 overflow-x-auto">
            {games.map((game, index) => (
              <button
                key={game.name}
                onClick={() => setActiveGameIndex(index)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                  index === activeGameIndex
                    ? "bg-[#19d3cf] text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-[#ff2fa8]"
                }`}
              >
                {game.name}
              </button>
            ))}
          </div>

          <div className="hidden shrink-0 gap-2 md:flex">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 ${
                  selectedPeriod === period
                    ? "bg-[#ff2fa8] text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-[#19d3cf]"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white shadow-sm">
          <div className="grid grid-cols-[0.6fr_1.7fr_1.3fr_1.7fr_1.2fr_1.2fr_3.3fr] border-b border-[#ff2fa8]/20 bg-gray-50 px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
            <div>Rank</div>
            <div>Country</div>
            <div>Score</div>
            <div>{selectedPeriod} Score</div>
            <div>{selectedPeriod} Rank</div>
            <div>{selectedPeriod} %</div>
            <div>Why they win</div>
          </div>

          {leaderboard.map((item) => {
            const isUp = item.direction === "up";

            return (
              <div
                key={item.rank}
                className="grid grid-cols-[0.6fr_1.7fr_1.3fr_1.7fr_1.2fr_1.2fr_3.3fr] items-center border-b border-gray-100 px-6 py-4 text-sm last:border-b-0 hover:bg-gray-50"
              >
                <div className="text-base font-normal text-[#ff2fa8]">{item.rank}</div>

                <div className="text-base font-semibold">{item.country}</div>

                <div>
                  <span className="rounded-full bg-[#19d3cf]/10 px-4 py-2 text-sm font-black text-[#19d3cf]">
                    {item.score}
                  </span>
                </div>

                <div>
                  <svg viewBox="0 0 150 50" className="h-10 w-32">
                    <path
                      d={item.trends[selectedPeriod]}
                      fill="none"
                      stroke={isUp ? "#19d3cf" : "#ff2fa8"}
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className={`font-bold ${isUp ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>
                  {isUp ? "▲" : "▼"} {item.rankChange}
                </div>

                <div className={`font-bold ${isUp ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>
                  {item.percentChange}
                </div>

                <div>
                  <div className="flex flex-wrap gap-2">
                    {item.reasons.map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </section>
    </main>
  );
}

function RotatingStatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className="rounded-2xl border border-[#ff2fa8]/35 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <p className={`mt-4 text-lg font-black leading-none transition-all duration-700 ${className}`}>
        {value}
      </p>
    </div>
  );
}