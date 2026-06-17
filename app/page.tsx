"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const periods = ["7 Days", "1 Month", "1 Year"] as const;
type Period = (typeof periods)[number];

const games = ["CS2", "League of Legends", "Valorant", "Fortnite", "Rocket League", "Chess"] as const;
type Game = (typeof games)[number];

const statGames = [
  { name: "CS2", nation: "Denmark", score: 98, mover: "Sweden", moverChange: "+3", trend: "M 0 42 C 20 38, 38 39, 54 30 S 82 16, 105 18 S 130 8, 150 6" },
  { name: "League of Legends", nation: "South Korea", score: 96, mover: "China", moverChange: "+2", trend: "M 0 40 C 22 34, 38 36, 55 28 S 82 20, 105 13 S 130 9, 150 10" },
  { name: "Valorant", nation: "Brazil", score: 93, mover: "Turkey", moverChange: "+4", trend: "M 0 44 C 20 36, 42 40, 60 32 S 88 24, 110 14 S 132 12, 150 7" },
  { name: "Fortnite", nation: "USA", score: 95, mover: "Canada", moverChange: "+2", trend: "M 0 38 C 20 35, 36 28, 58 32 S 88 18, 108 20 S 130 12, 150 8" },
];

const trendUp = "M 0 42 C 20 38, 40 36, 58 30 S 88 20, 112 14 S 135 9, 150 7";
const trendDown = "M 0 16 C 22 19, 42 20, 62 26 S 92 31, 114 38 S 134 39, 150 44";

const rankingsByGame: Record<Game, [string, number, string, string, "up" | "down", string[]][]> = {
  CS2: [
    ["Denmark", 98, "+2", "+4.2%", "up", ["Team cohesion", "Tactical culture", "Elite CS systems"]],
    ["South Korea", 96, "+1", "+3.8%", "up", ["Esports academies", "Training discipline", "Low-latency infrastructure"]],
    ["China", 94, "-1", "-1.1%", "down", ["Huge player base", "Professional investment", "MOBA depth"]],
    ["Sweden", 91, "+3", "+1.7%", "up", ["FPS history", "Grassroots scene", "Mechanical skill"]],
    ["USA", 89, "-2", "-0.6%", "down", ["Large talent pool", "Creator scene", "Prize exposure"]],
  ],
  "League of Legends": [
    ["South Korea", 99, "+1", "+2.9%", "up", ["Elite coaching", "Solo queue depth", "Esports culture"]],
    ["China", 97, "-1", "-0.8%", "down", ["Massive league", "Investment", "Mechanical talent"]],
    ["Denmark", 89, "+2", "+1.4%", "up", ["Mid-lane legacy", "Team systems", "EU infrastructure"]],
    ["Taiwan", 86, "+1", "+0.9%", "up", ["Regional history", "Discipline", "Strong fundamentals"]],
    ["USA", 80, "-2", "-1.2%", "down", ["Big market", "Imports", "Content ecosystem"]],
  ],
  Valorant: [
    ["Brazil", 93, "+2", "+3.1%", "up", ["Aggression", "Aim culture", "LAN confidence"]],
    ["South Korea", 92, "+1", "+2.4%", "up", ["Structure", "Utility discipline", "Coaching"]],
    ["USA", 90, "-1", "-0.7%", "down", ["Creator pipeline", "Talent pool", "Org investment"]],
    ["Turkey", 88, "+4", "+4.8%", "up", ["Aim mechanics", "Ranked depth", "Young talent"]],
    ["Japan", 84, "+1", "+1.1%", "up", ["Fanbase", "Organisation", "Tactical growth"]],
  ],
  Fortnite: [
    ["USA", 95, "+1", "+2.2%", "up", ["Creator scene", "Prize exposure", "Huge player base"]],
    ["Canada", 91, "+2", "+2.7%", "up", ["Mechanical skill", "NA servers", "Tournament depth"]],
    ["UK", 88, "-1", "-0.5%", "down", ["EU competition", "Scrim culture", "Young talent"]],
    ["France", 87, "+1", "+0.8%", "up", ["EU ecosystem", "Technical skill", "Competitive scene"]],
    ["Brazil", 84, "-2", "-1.3%", "down", ["Aggressive play", "Large player base", "Creative meta"]],
  ],
  "Rocket League": [
    ["France", 92, "+1", "+2.0%", "up", ["Team play", "Mechanical depth", "EU dominance"]],
    ["Netherlands", 89, "+3", "+3.5%", "up", ["Fast rotations", "Young talent", "Club systems"]],
    ["USA", 87, "-1", "-0.9%", "down", ["NA depth", "Org backing", "Content pipeline"]],
    ["UK", 85, "+1", "+1.0%", "up", ["EU competition", "Mechanical ceiling", "LAN exposure"]],
    ["Australia", 78, "-1", "-0.4%", "down", ["Regional scene", "High ping barrier", "Dedicated talent"]],
  ],
  Chess: [
    ["India", 94, "+2", "+3.9%", "up", ["Youth wave", "Coaching culture", "Online chess boom"]],
    ["Russia", 93, "-1", "-0.6%", "down", ["Historic depth", "Schools", "Grandmaster density"]],
    ["USA", 91, "+1", "+1.3%", "up", ["University chess", "Online platforms", "Elite tournaments"]],
    ["Uzbekistan", 88, "+5", "+5.1%", "up", ["Young grandmasters", "Team success", "Rapid growth"]],
    ["China", 86, "-2", "-1.4%", "down", ["Structured training", "Strong federation", "Elite players"]],
  ],
};

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [statsIndex, setStatsIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<Game>("CS2");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("7 Days");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStatsIndex((current) => (current + 1) % statGames.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const activeStats = statGames[statsIndex];
  const leaderboard = rankingsByGame[selectedGame];

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <header className="sticky top-0 z-50 border-b border-[#ff2fa8]/25 bg-white transition-all duration-300">
        <div className={`mx-auto flex max-w-7xl items-center px-8 transition-all duration-300 ${scrolled ? "py-2" : "py-3"}`}>
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

        <div key={activeStats.name} className="mb-5 grid animate-[fadeIn_1s_ease] gap-4 md:grid-cols-4">
          <StatCard label="Top Game" value={activeStats.name} valueColor="text-[#19d3cf]" />

          <div className="rounded-2xl border border-[#ff2fa8]/35 bg-white p-5 shadow-sm md:col-span-2">
            <div className="grid h-full grid-cols-3 items-start gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Leading Nation</p>
                <p className="mt-4 text-lg font-black leading-none">{activeStats.nation}</p>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">7D Trend</p>
                <svg viewBox="0 0 150 50" className="mt-1 h-12 w-36">
                  <path d={activeStats.trend} fill="none" stroke="#19d3cf" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>

              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Dominance Score</p>
                <p className="mt-4 text-lg font-black leading-none text-[#19d3cf]">{activeStats.score}</p>
              </div>
            </div>
          </div>

          <StatCard label="Biggest Mover" value={`${activeStats.mover} ▲${activeStats.moverChange.replace("+", "")}`} valueColor="text-[#19d3cf]" />
        </div>

        <div className="mb-6 flex items-center justify-between gap-4 rounded-3xl border border-[#ff2fa8]/45 bg-white p-4 shadow-sm">
          <div className="flex gap-3 overflow-x-auto">
            {games.map((game) => (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                  game === selectedGame
                    ? "bg-[#19d3cf] text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-[#ff2fa8]"
                }`}
              >
                {game}
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
          <div className="grid grid-cols-[0.7fr_1.8fr_1.2fr_1.7fr_1.2fr_1.2fr_3.2fr] border-b border-[#ff2fa8]/20 bg-gray-50 px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
            <div>Rank</div>
            <div>Country</div>
            <div>Score</div>
            <div>{selectedPeriod} Score</div>
            <div>{selectedPeriod} Rank</div>
            <div>{selectedPeriod} %</div>
            <div>Why they win</div>
          </div>

          {leaderboard.map(([country, score, rankChange, percentChange, direction, reasons], index) => {
            const isUp = direction === "up";

            return (
              <div
                key={country}
                className="grid grid-cols-[0.7fr_1.8fr_1.2fr_1.7fr_1.2fr_1.2fr_3.2fr] items-center border-b border-gray-100 px-6 py-4 text-sm last:border-b-0 hover:bg-gray-50"
              >
                <div className="text-base font-normal text-[#ff2fa8]">{index + 1}</div>
                <div className="text-base font-semibold">{country}</div>

                <div>
                  <span className="rounded-full bg-[#19d3cf]/10 px-4 py-2 text-sm font-black text-[#19d3cf]">
                    {score}
                  </span>
                </div>

                <div>
                  <svg viewBox="0 0 150 50" className="h-10 w-32">
                    <path d={isUp ? trendUp : trendDown} fill="none" stroke={isUp ? "#19d3cf" : "#ff2fa8"} strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>

                <div className={`font-bold ${isUp ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>
                  {isUp ? "▲" : "▼"} {rankChange}
                </div>

                <div className={`font-bold ${isUp ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>
                  {percentChange}
                </div>

                <div className="flex flex-wrap gap-2">
                  {reasons.map((reason) => (
                    <span key={reason} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0.2;
              transform: translateY(6px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div className="rounded-2xl border border-[#ff2fa8]/35 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className={`mt-4 text-lg font-black leading-none transition-all duration-1000 ${valueColor}`}>{value}</p>
    </div>
  );
}