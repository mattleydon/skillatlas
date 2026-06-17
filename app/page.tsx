"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const games = ["CS2", "League of Legends", "Valorant", "Fortnite", "Rocket League", "Chess"];

const leaderboard = [
  {
    rank: 1,
    country: "Denmark",
    score: 98,
    rankChange: "+2",
    percentChange: "+4.2%",
    direction: "up",
    trend: "M 0 40 C 20 35, 30 38, 45 28 S 70 14, 90 18 S 120 8, 150 6",
    reasons: ["Team cohesion", "Tactical culture", "Elite CS systems"],
  },
  {
    rank: 2,
    country: "South Korea",
    score: 96,
    rankChange: "+1",
    percentChange: "+3.8%",
    direction: "up",
    trend: "M 0 42 C 25 36, 35 30, 55 32 S 85 20, 105 18 S 130 10, 150 12",
    reasons: ["Esports academies", "Training discipline", "Low-latency infrastructure"],
  },
  {
    rank: 3,
    country: "China",
    score: 94,
    rankChange: "-1",
    percentChange: "-1.1%",
    direction: "down",
    trend: "M 0 18 C 20 15, 40 22, 55 20 S 85 30, 105 28 S 130 38, 150 35",
    reasons: ["Huge player base", "Professional investment", "MOBA depth"],
  },
  {
    rank: 4,
    country: "Sweden",
    score: 91,
    rankChange: "+3",
    percentChange: "+1.7%",
    direction: "up",
    trend: "M 0 44 C 20 38, 40 40, 55 34 S 85 24, 110 16 S 135 12, 150 8",
    reasons: ["FPS history", "Grassroots scene", "Mechanical skill"],
  },
  {
    rank: 5,
    country: "USA",
    score: 89,
    rankChange: "-2",
    percentChange: "-0.6%",
    direction: "down",
    trend: "M 0 16 C 25 22, 35 18, 55 25 S 80 30, 105 36 S 130 34, 150 42",
    reasons: ["Large talent pool", "Creator scene", "Prize exposure"],
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <header className="sticky top-0 z-50 border-b border-[#ff2fa8]/25 bg-white transition-all duration-300">
        <div
          className={`mx-auto flex max-w-7xl items-center px-8 transition-all duration-300 ${
            scrolled ? "py-1" : "py-2"
          }`}
        >
          <div className="mr-16 flex shrink-0 items-center gap-5">
            <div
              className={`relative shrink-0 overflow-hidden transition-all duration-300 ${
                scrolled ? "h-20 w-28" : "h-28 w-40"
              }`}
            >
              <Image
                src="/skillatlas-logo.png"
                alt="SkillAtlas logo"
                width={420}
                height={420}
                className={`absolute left-1/2 max-w-none -translate-x-1/2 object-contain transition-all duration-300 ${
                  scrolled ? "-top-7 w-36" : "-top-10 w-52"
                }`}
                priority
              />
            </div>

            <div className="hidden md:block">
              <div
                className={`font-black leading-none tracking-[0.42em] transition-all duration-300 ${
                  scrolled ? "text-xl" : "text-2xl"
                }`}
              >
                <span className="text-black">SKILL</span>
                <span className="text-[#19d3cf]">A</span>
                <span className="text-black">T</span>
                <span className="text-[#ff2fa8]">LAS</span>
              </div>

              <div
                className={`mt-2 flex items-center gap-3 uppercase tracking-[0.28em] text-gray-500 transition-all duration-300 ${
                  scrolled ? "text-[7px]" : "text-[8px]"
                }`}
              >
                <span className="h-[1px] w-5 bg-[#19d3cf]" />
                <span>Map Your Skill. Know Your Edge.</span>
                <span className="h-[1px] w-5 bg-[#ff2fa8]" />
              </div>
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
        <div className="mb-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[#ff2fa8]/35 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Top Game
            </p>
            <p className="mt-2 text-2xl font-black text-[#19d3cf]">CS2</p>
          </div>

          <div className="rounded-2xl border border-[#ff2fa8]/35 bg-white p-5 shadow-sm md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Leading Nation
            </p>

            <div className="mt-2 flex items-end justify-between gap-6">
              <p className="text-3xl font-black">Denmark</p>

              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                  Dominance Score
                </p>
                <p className="text-3xl font-black text-[#19d3cf]">98</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ff2fa8]/35 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Biggest Mover
            </p>
            <p className="mt-2 text-2xl font-black text-[#19d3cf]">Sweden ▲3</p>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-[#ff2fa8]/45 bg-white p-6 shadow-sm">
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

        <div className="mb-6 flex gap-3 overflow-x-auto rounded-3xl border border-[#ff2fa8]/45 bg-white p-4 shadow-sm">
          {games.map((game, index) => (
            <button
              key={game}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold ${
                index === 0
                  ? "bg-[#19d3cf] text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-[#ff2fa8]"
              }`}
            >
              {game}
            </button>
          ))}
        </div>

        <section className="overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white shadow-sm">
          <div className="grid grid-cols-12 border-b border-[#ff2fa8]/20 bg-gray-50 px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
            <div className="col-span-1">#</div>
            <div className="col-span-2">Country</div>
            <div className="col-span-2">Score</div>
            <div className="col-span-2">1Y Score</div>
            <div className="col-span-2">7D</div>
            <div className="col-span-3">Why they win</div>
          </div>

          {leaderboard.map((item) => {
            const isUp = item.direction === "up";

            return (
              <div
                key={item.rank}
                className="grid grid-cols-12 items-center border-b border-gray-100 px-6 py-4 text-sm last:border-b-0 hover:bg-gray-50"
              >
                <div className="col-span-1 text-base font-normal text-[#ff2fa8]">
                  {item.rank}
                </div>

                <div className="col-span-2 text-base font-semibold">{item.country}</div>

                <div className="col-span-2">
                  <span className="rounded-full bg-[#19d3cf]/10 px-4 py-2 text-sm font-black text-[#19d3cf]">
                    {item.score}
                  </span>
                </div>

                <div className="col-span-2">
                  <svg viewBox="0 0 150 50" className="h-10 w-32">
                    <path
                      d={item.trend}
                      fill="none"
                      stroke={isUp ? "#19d3cf" : "#ff2fa8"}
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center gap-2 font-bold ${
                      isUp ? "text-[#19d3cf]" : "text-[#ff2fa8]"
                    }`}
                  >
                    {isUp ? "▲" : "▼"} {item.rankChange}
                    <span>{item.percentChange}</span>
                  </span>
                </div>

                <div className="col-span-3">
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