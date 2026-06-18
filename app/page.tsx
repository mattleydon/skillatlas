"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const periods = ["7 Days", "1 Month", "1 Year"] as const;
type Period = (typeof periods)[number];

const games = ["CS2", "League of Legends", "Valorant", "Fortnite", "Rocket League", "Chess"] as const;
type Game = (typeof games)[number];

type Direction = "up" | "down";

type RankingRow = {
  country: string;
  score: number;
  rankChange: string;
  percentChange: string;
  direction: Direction;
  reasons: string[];
  improvements: string[];
};

function row(
  country: string,
  score: number,
  rankChange: string,
  percentChange: string,
  direction: Direction,
  reasons: string[],
  improvements: string[]
): RankingRow {
  return { country, score, rankChange, percentChange, direction, reasons, improvements };
}

const statGames = [
  { name: "CS2", nation: "Denmark", score: 98, mover: "Sweden", moverChange: "+3", loser: "USA", loserChange: "-2", trend: "M 0 42 C 20 38, 38 39, 54 30 S 82 16, 105 18 S 130 8, 150 6" },
  { name: "League of Legends", nation: "South Korea", score: 99, mover: "India", moverChange: "+4", loser: "USA", loserChange: "-2", trend: "M 0 40 C 22 34, 38 36, 55 28 S 82 20, 105 13 S 130 9, 150 10" },
  { name: "Valorant", nation: "Brazil", score: 93, mover: "Turkey", moverChange: "+4", loser: "Japan", loserChange: "-2", trend: "M 0 44 C 20 36, 42 40, 60 32 S 88 24, 110 14 S 132 12, 150 7" },
  { name: "Fortnite", nation: "USA", score: 95, mover: "Canada", moverChange: "+2", loser: "Brazil", loserChange: "-2", trend: "M 0 38 C 20 35, 36 28, 58 32 S 88 18, 108 20 S 130 12, 150 8" },
  { name: "Rocket League", nation: "France", score: 92, mover: "Netherlands", moverChange: "+3", loser: "Australia", loserChange: "-1", trend: "M 0 45 C 25 42, 38 35, 58 36 S 85 24, 112 16 S 132 11, 150 9" },
  { name: "Chess", nation: "India", score: 94, mover: "Uzbekistan", moverChange: "+5", loser: "China", loserChange: "-2", trend: "M 0 42 C 18 35, 35 31, 52 33 S 78 22, 102 14 S 128 9, 150 6" },
];

const topCountriesByGame: Record<Game, RankingRow[]> = {
  CS2: [
    row("Denmark", 98, "+2", "+4.2%", "up", ["Team cohesion", "Tactical culture", "Elite CS systems"], ["Larger talent pool", "More aim depth"]),
    row("South Korea", 96, "+1", "+3.8%", "up", ["Esports academies", "Training discipline", "Low-latency infrastructure"], ["More CS history", "More tier-one teams"]),
    row("China", 94, "-1", "-1.1%", "down", ["Huge player base", "Professional investment", "MOBA depth"], ["Tactical consistency", "LAN pressure"]),
    row("Sweden", 91, "+3", "+1.7%", "up", ["FPS history", "Grassroots scene", "Mechanical skill"], ["Modern team depth", "Youth pipeline"]),
    row("USA", 89, "-2", "-0.6%", "down", ["Large talent pool", "Creator scene", "Prize exposure"], ["Team discipline", "Tactical identity"]),
  ],
  "League of Legends": [
    row("South Korea", 99, "+1", "+2.9%", "up", ["Elite coaching", "Solo queue depth", "Esports culture"], ["Risk-taking creativity", "Meta flexibility"]),
    row("China", 97, "-1", "-0.8%", "down", ["Massive league", "Investment", "Mechanical talent"], ["International consistency", "Macro discipline"]),
    row("Denmark", 89, "+2", "+1.4%", "up", ["Mid-lane legacy", "Team systems", "EU infrastructure"], ["Player depth", "Domestic scale"]),
    row("Taiwan", 86, "+1", "+0.9%", "up", ["Regional history", "Discipline", "Strong fundamentals"], ["Investment scale", "Talent retention"]),
    row("USA", 80, "-2", "-1.2%", "down", ["Big market", "Imports", "Content ecosystem"], ["Native talent", "Practice culture"]),
  ],
  Valorant: [
    row("Brazil", 93, "+2", "+3.1%", "up", ["Aggression", "Aim culture", "LAN confidence"], ["Utility discipline", "Map pool depth"]),
    row("South Korea", 92, "+1", "+2.4%", "up", ["Structure", "Utility discipline", "Coaching"], ["Peak aim volatility", "Creative mid-rounding"]),
    row("USA", 90, "-1", "-0.7%", "down", ["Creator pipeline", "Talent pool", "Org investment"], ["Role stability", "Consistency"]),
    row("Turkey", 88, "+4", "+4.8%", "up", ["Aim mechanics", "Ranked depth", "Young talent"], ["Team structure", "LAN experience"]),
    row("Japan", 84, "-2", "-0.9%", "down", ["Fanbase", "Organisation", "Tactical growth"], ["Aggression", "Mechanical ceiling"]),
  ],
  Fortnite: [
    row("USA", 95, "+1", "+2.2%", "up", ["Creator scene", "Prize exposure", "Huge player base"], ["Consistency", "Burnout management"]),
    row("Canada", 91, "+2", "+2.7%", "up", ["Mechanical skill", "NA servers", "Tournament depth"], ["Scale", "Team transition"]),
    row("UK", 88, "-1", "-0.5%", "down", ["EU competition", "Scrim culture", "Young talent"], ["Pressure control", "Late-game consistency"]),
    row("France", 87, "+1", "+0.8%", "up", ["EU ecosystem", "Technical skill", "Competitive scene"], ["Creator exposure", "Regional dominance"]),
    row("Brazil", 84, "-2", "-1.3%", "down", ["Aggressive play", "Large player base", "Creative meta"], ["Defensive structure", "Tournament stability"]),
  ],
  "Rocket League": [
    row("France", 92, "+1", "+2.0%", "up", ["Team play", "Mechanical depth", "EU dominance"], ["Mental reset", "Rotation risk"]),
    row("Netherlands", 89, "+3", "+3.5%", "up", ["Fast rotations", "Young talent", "Club systems"], ["LAN experience", "Depth past top players"]),
    row("USA", 87, "-1", "-0.9%", "down", ["NA depth", "Org backing", "Content pipeline"], ["EU pace adaptation", "Defensive structure"]),
    row("UK", 85, "+1", "+1.0%", "up", ["EU competition", "Mechanical ceiling", "LAN exposure"], ["Consistency", "Elite striker depth"]),
    row("Australia", 78, "-1", "-0.4%", "down", ["Regional scene", "Dedicated talent", "Team chemistry"], ["Ping barrier", "International reps"]),
  ],
  Chess: [
    row("India", 94, "+2", "+3.9%", "up", ["Youth wave", "Coaching culture", "Online chess boom"], ["World title conversion", "Veteran depth"]),
    row("Russia", 93, "-1", "-0.6%", "down", ["Historic depth", "Schools", "Grandmaster density"], ["Youth momentum", "International access"]),
    row("USA", 91, "+1", "+1.3%", "up", ["University chess", "Online platforms", "Elite tournaments"], ["Grassroots scale", "Junior consistency"]),
    row("Uzbekistan", 88, "+5", "+5.1%", "up", ["Young grandmasters", "Team success", "Rapid growth"], ["Depth", "Long-term infrastructure"]),
    row("China", 86, "-2", "-1.4%", "down", ["Structured training", "Strong federation", "Elite players"], ["Tournament volume", "Visibility"]),
  ],
};

const countryPool = ["Germany", "France", "UK", "Canada", "Australia", "Netherlands", "Brazil", "Turkey", "Japan", "India", "Russia", "Uzbekistan", "Taiwan", "Poland", "Finland", "Norway", "Spain", "Portugal", "Italy", "Mexico", "Argentina", "Chile", "Colombia", "Peru", "New Zealand", "Singapore", "Malaysia", "Thailand", "Vietnam", "Philippines", "Indonesia", "Saudi Arabia", "UAE", "Israel", "Ukraine", "Czech Republic", "Austria", "Switzerland", "Belgium", "Ireland", "Greece", "Romania", "Hungary", "Serbia", "Croatia", "Slovenia", "Slovakia", "Lithuania", "Latvia", "Estonia", "Iceland", "South Africa", "Egypt", "Morocco", "Nigeria", "Kenya", "Ghana", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Iran", "Iraq", "Qatar", "Kuwait", "Jordan", "Lebanon", "Kazakhstan", "Mongolia", "Hong Kong", "Uruguay", "Paraguay", "Bolivia", "Ecuador", "Venezuela", "Costa Rica", "Panama", "Dominican Republic", "Jamaica", "Cuba", "Luxembourg", "Malta", "Cyprus", "Bulgaria", "Belarus", "Georgia", "Armenia", "Azerbaijan", "Algeria", "Tunisia", "Ethiopia", "Tanzania", "Uganda", "Zimbabwe", "Cambodia"];

const trendUp = "M 0 42 C 20 38, 40 36, 58 30 S 88 20, 112 14 S 135 9, 150 7";
const trendDown = "M 0 16 C 22 19, 42 20, 62 26 S 92 31, 114 38 S 134 39, 150 44";

function buildTop100(game: Game): RankingRow[] {
  const existing = topCountriesByGame[game];
  const used = new Set(existing.map((item) => item.country));

  const extras = countryPool
    .filter((country) => !used.has(country))
    .slice(0, 95)
    .map((country, index) => {
      const score = Math.max(42, 84 - Math.floor(index * 0.45));
      const isUp = index % 4 !== 2;

      return row(
        country,
        score,
        isUp ? `+${(index % 5) + 1}` : `-${(index % 3) + 1}`,
        isUp ? `+${(0.4 + (index % 9) * 0.3).toFixed(1)}%` : `-${(0.3 + (index % 6) * 0.2).toFixed(1)}%`,
        isUp ? "up" : "down",
        ["Growing talent", "Online access", "Competitive base"],
        ["Elite infrastructure", "International exposure"]
      );
    });

  return [...existing, ...extras];
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [statsIndex, setStatsIndex] = useState(0);
  const [statsVisible, setStatsVisible] = useState(true);
  const [manualStatsGame, setManualStatsGame] = useState<Game | "Auto">("Auto");
  const [selectedGame, setSelectedGame] = useState<Game>("CS2");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("7 Days");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (manualStatsGame !== "Auto") return;

    const stayTimer = window.setTimeout(() => {
      setStatsVisible(false);

      const switchTimer = window.setTimeout(() => {
        setStatsIndex((current) => (current + 1) % statGames.length);
        setStatsVisible(true);
      }, 3000);

      return () => window.clearTimeout(switchTimer);
    }, 6000);

    return () => window.clearTimeout(stayTimer);
  }, [statsIndex, manualStatsGame]);

  const activeStats = manualStatsGame === "Auto"
    ? statGames[statsIndex]
    : statGames.find((game) => game.name === manualStatsGame) ?? statGames[0];

  const leaderboard = useMemo(() => buildTop100(selectedGame), [selectedGame]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#111827]">
      <RotatingGlobeBackground />

      <header className="sticky top-0 z-50 border-b border-[#ff2fa8]/25 bg-white/95 backdrop-blur transition-all duration-300">
        <div className={`mx-auto flex max-w-7xl items-center px-8 transition-all duration-300 ${scrolled ? "py-2" : "py-3"}`}>
          <div className="mr-14 flex shrink-0 items-center gap-5">
            <a href="/space-invaders" className={`relative transition-all duration-300 ${scrolled ? "h-16 w-16" : "h-24 w-24"}`}>
              <Image src="/skillatlas-logo.png" alt="SkillAtlas logo" fill className="object-contain" priority />
            </a>

            <a href="/" className={`relative transition-all duration-300 ${scrolled ? "h-10 w-56" : "h-14 w-80"}`}>
              <Image src="/skillatlas-title.png" alt="SkillAtlas title" fill className="object-contain object-left" priority />
            </a>
          </div>

          <nav className="hidden flex-1 items-center justify-around md:flex">
            {["Rankings", "World Map", "Countries", "Profiles", "User Rankings", "About"].map((item) => (
              <a
                key={item}
                className="text-[1rem] font-semibold text-gray-700 transition-colors hover:text-[#19d3cf]"
                href={item === "Rankings" ? "/" : `/${item.toLowerCase().replace(" ", "-")}`}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-8 py-8">
        <div className="mb-5 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#19d3cf]">Global Gaming Rankings</p>
          <h2 className="mb-2 text-lg font-black tracking-tight">Which country is actually the best at gaming?</h2>
          <p className="text-sm text-gray-600 md:whitespace-nowrap">Track which countries dominate each game, why they win, where they are improving, and where they are still vulnerable.</p>
        </div>

        <div className="mb-3 flex justify-end">
          <label className="flex items-center gap-3 rounded-full border border-[#ff2fa8]/35 bg-white/95 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-gray-500 shadow-sm">
            Stats
            <select
              value={manualStatsGame}
              onChange={(event) => {
                const value = event.target.value as Game | "Auto";
                setManualStatsGame(value);
                setStatsVisible(true);

                if (value !== "Auto") {
                  const nextIndex = statGames.findIndex((game) => game.name === value);
                  if (nextIndex >= 0) setStatsIndex(nextIndex);
                }
              }}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-black normal-case tracking-normal text-[#111827] outline-none transition focus:border-[#19d3cf]"
            >
              <option value="Auto">Auto rotate</option>
              {games.map((game) => (
                <option key={game} value={game}>{game}</option>
              ))}
            </select>
          </label>
        </div>

        <div className={`mb-5 grid gap-4 transition-all duration-[3000ms] ease-in-out md:grid-cols-5 ${statsVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
          <StatCard label="Top Game" value={activeStats.name} valueColor="text-[#19d3cf]" />

          <div className="rounded-2xl border border-[#ff2fa8]/35 bg-white/92 p-5 shadow-sm backdrop-blur md:col-span-2">
            <div className="grid h-full grid-cols-3 items-start gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Leading Nation</p>
                <p className="mt-4 text-lg font-black leading-none">{activeStats.nation}</p>
              </div>

              <div className="flex flex-col items-center">
                <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">7D Trend</p>
                <svg viewBox="0 0 150 50" className="mt-1 h-12 w-36">
                  <path d={activeStats.trend} fill="none" stroke="#19d3cf" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>

              <div className="text-right">
                <p className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Dominance Score</p>
                <p className="mt-4 text-lg font-black leading-none text-[#19d3cf]">{activeStats.score}</p>
              </div>
            </div>
          </div>

          <StatCard label="Biggest Mover" value={`${activeStats.mover} ▲${activeStats.moverChange.replace("+", "")}`} valueColor="text-[#19d3cf]" />
          <StatCard label="Biggest Loser" value={`${activeStats.loser} ▼${activeStats.loserChange.replace("-", "")}`} valueColor="text-[#ff2fa8]" />
        </div>

        <div className="mb-6 flex items-center justify-between gap-4 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-4 shadow-sm backdrop-blur">
          <div className="flex gap-3 overflow-x-auto">
            {games.map((game) => (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${game === selectedGame ? "bg-[#19d3cf] text-white" : "border border-gray-200 bg-white text-gray-700 hover:border-[#ff2fa8]"}`}
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
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 ${selectedPeriod === period ? "bg-[#ff2fa8] text-white" : "border border-gray-200 bg-white text-gray-600 hover:border-[#19d3cf]"}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white/92 shadow-sm backdrop-blur">
          <div className="grid grid-cols-[0.6fr_1.4fr_1fr_1.4fr_1fr_1fr_2.2fr_2.2fr] border-b border-[#ff2fa8]/20 bg-gray-50/90 px-6 py-4 text-[11px] font-bold uppercase tracking-wide text-gray-500">
            <div>Rank</div>
            <div>Country</div>
            <div>Score</div>
            <div>{selectedPeriod} Score</div>
            <div>{selectedPeriod} Rank</div>
            <div>{selectedPeriod} %</div>
            <div>Why they win</div>
            <div>Room for improvement</div>
          </div>

          {leaderboard.map((item, index) => {
            const isUp = item.direction === "up";

            return (
              <div key={`${selectedGame}-${item.country}`} className="grid grid-cols-[0.6fr_1.4fr_1fr_1.4fr_1fr_1fr_2.2fr_2.2fr] items-center border-b border-gray-100 px-6 py-4 text-sm last:border-b-0 hover:bg-gray-50/90">
                <div className="text-base font-normal text-[#ff2fa8]">{index + 1}</div>
                <div className="text-sm font-semibold">{item.country}</div>
                <div><span className="rounded-full bg-[#19d3cf]/10 px-4 py-2 text-sm font-black text-[#19d3cf]">{item.score}</span></div>
                <div><svg viewBox="0 0 150 50" className="h-10 w-28"><path d={isUp ? trendUp : trendDown} fill="none" stroke={isUp ? "#19d3cf" : "#ff2fa8"} strokeWidth="1.5" strokeLinecap="round" /></svg></div>
                <div className={`font-bold ${isUp ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>{isUp ? "▲" : "▼"} {item.rankChange}</div>
                <div className={`font-bold ${isUp ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>{item.percentChange}</div>
                <div className="flex flex-wrap gap-2">{item.reasons.map((reason) => <span key={reason} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">{reason}</span>)}</div>
                <div className="flex flex-wrap gap-2">{item.improvements.map((improvement) => <span key={improvement} className="rounded-full border border-[#ff2fa8]/20 bg-[#ff2fa8]/5 px-3 py-1 text-xs font-semibold text-gray-600">{improvement}</span>)}</div>
              </div>
            );
          })}
        </section>
      </section>

      <style jsx global>{`
        @keyframes globeSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

function StatCard({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
  return (
    <div className="rounded-2xl border border-[#ff2fa8]/35 bg-white/92 p-5 shadow-sm backdrop-blur">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className={`mt-4 text-lg font-black leading-none ${valueColor}`}>{value}</p>
    </div>
  );
}

function RotatingGlobeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
      <div className="relative h-[760px] w-[760px] opacity-[0.055]">
        <div className="absolute inset-0 rounded-full border border-gray-700" />
        <div className="absolute inset-[8%] rounded-full border border-gray-700" />
        <div className="absolute inset-[18%] rounded-full border border-gray-700" />

        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gray-700" />
        <div className="absolute left-[30%] top-0 h-full w-px -translate-x-1/2 rounded-full bg-gray-700" />
        <div className="absolute left-[70%] top-0 h-full w-px -translate-x-1/2 rounded-full bg-gray-700" />

        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-gray-700" />
        <div className="absolute left-0 top-[35%] h-px w-full -translate-y-1/2 bg-gray-700" />
        <div className="absolute left-0 top-[65%] h-px w-full -translate-y-1/2 bg-gray-700" />

        <div className="absolute inset-0 animate-[globeSpin_70s_linear_infinite] rounded-full border border-dashed border-gray-700" />
        <div className="absolute inset-[12%] animate-[globeSpin_90s_linear_infinite_reverse] rounded-full border border-dashed border-gray-700" />
      </div>
    </div>
  );
}