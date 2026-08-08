"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GAMES as games, type Game } from "@/constants/games";

const periods = ["7 Days", "1 Month", "1 Year"] as const;
type Period = (typeof periods)[number];

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
  {
    name: "CS2",
    nation: "Denmark",
    score: 98,
    mover: "Sweden",
    moverChange: "+3",
    loser: "USA",
    loserChange: "-2",
    trend: "M 0 42 C 20 38, 38 39, 54 30 S 82 16, 105 18 S 130 8, 150 6",
  },
  {
    name: "League of Legends",
    nation: "South Korea",
    score: 99,
    mover: "India",
    moverChange: "+4",
    loser: "USA",
    loserChange: "-2",
    trend: "M 0 40 C 22 34, 38 36, 55 28 S 82 20, 105 13 S 130 9, 150 10",
  },
  {
    name: "Valorant",
    nation: "Brazil",
    score: 93,
    mover: "Turkey",
    moverChange: "+4",
    loser: "Japan",
    loserChange: "-2",
    trend: "M 0 44 C 20 36, 42 40, 60 32 S 88 24, 110 14 S 132 12, 150 7",
  },
  {
    name: "Fortnite",
    nation: "USA",
    score: 95,
    mover: "Canada",
    moverChange: "+2",
    loser: "Brazil",
    loserChange: "-2",
    trend: "M 0 38 C 20 35, 36 28, 58 32 S 88 18, 108 20 S 130 12, 150 8",
  },
  {
    name: "Rocket League",
    nation: "France",
    score: 92,
    mover: "Netherlands",
    moverChange: "+3",
    loser: "Australia",
    loserChange: "-1",
    trend: "M 0 45 C 25 42, 38 35, 58 36 S 85 24, 112 16 S 132 11, 150 9",
  },
  {
    name: "Chess",
    nation: "India",
    score: 94,
    mover: "Uzbekistan",
    moverChange: "+5",
    loser: "China",
    loserChange: "-2",
    trend: "M 0 42 C 18 35, 35 31, 52 33 S 78 22, 102 14 S 128 9, 150 6",
  },
] as const;

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

const countryPool = [
  "Germany", "France", "UK", "Canada", "Australia", "Netherlands", "Brazil", "Turkey", "Japan", "India",
  "Russia", "Uzbekistan", "Taiwan", "Poland", "Finland", "Norway", "Spain", "Portugal", "Italy", "Mexico",
  "Argentina", "Chile", "Colombia", "Peru", "New Zealand", "Singapore", "Malaysia", "Thailand", "Vietnam",
  "Philippines", "Indonesia", "Saudi Arabia", "UAE", "Israel", "Ukraine", "Czech Republic", "Austria",
  "Switzerland", "Belgium", "Ireland", "Greece", "Romania", "Hungary", "Serbia", "Croatia", "Slovenia",
  "Slovakia", "Lithuania", "Latvia", "Estonia", "Iceland", "South Africa", "Egypt", "Morocco", "Nigeria",
  "Kenya", "Ghana", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal", "Iran", "Iraq", "Qatar", "Kuwait",
  "Jordan", "Lebanon", "Kazakhstan", "Mongolia", "Hong Kong", "Uruguay", "Paraguay", "Bolivia", "Ecuador",
  "Venezuela", "Costa Rica", "Panama", "Dominican Republic", "Jamaica", "Cuba", "Luxembourg", "Malta",
  "Cyprus", "Bulgaria", "Belarus", "Georgia", "Armenia", "Azerbaijan", "Algeria", "Tunisia", "Ethiopia",
  "Tanzania", "Uganda", "Zimbabwe", "Cambodia",
];

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
  const [statsIndex, setStatsIndex] = useState(0);
  const [statsVisible, setStatsVisible] = useState(true);
  const [gameTitleVisible, setGameTitleVisible] = useState(true);
  const [manualStatsGame, setManualStatsGame] = useState<Game | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game>("CS2");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("7 Days");

  useEffect(() => {
    if (manualStatsGame) return;

    const stayTimer = window.setTimeout(() => {
      setStatsVisible(false);
      setGameTitleVisible(false);

      window.setTimeout(() => {
        setStatsIndex((current) => (current + 1) % statGames.length);
        setStatsVisible(true);

        window.setTimeout(() => {
          setGameTitleVisible(true);
        }, 100);
      }, 3000);
    }, 6000);

    return () => window.clearTimeout(stayTimer);
  }, [statsIndex, manualStatsGame]);

  const activeStats = manualStatsGame
    ? statGames.find((game) => game.name === manualStatsGame) ?? statGames[0]
    : statGames[statsIndex];

  const leaderboard = useMemo(() => buildTop100(selectedGame), [selectedGame]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#111827]">
      <RotatingGlobeBackground />

      <section className="relative z-10 mx-auto max-w-7xl px-8 pb-8 pt-[150px]">
        <div className="mb-6 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#19d3cf]">Global Gaming Rankings</p>
          <h2 className="mb-2 text-lg font-black tracking-tight">Which country is actually the best at gaming?</h2>
          <p className="text-sm text-gray-600 md:whitespace-nowrap">
            Track which countries dominate each game, why they win, where they are improving, and where they are still vulnerable.
          </p>
        </div>

        <div className="relative z-30 mb-5 grid items-stretch gap-4 overflow-visible md:grid-cols-[1.45fr_2.7fr_1.35fr_1.35fr]">
          <div className="relative z-50 min-h-[124px] rounded-2xl border border-[#ff2fa8]/35 bg-white/92 p-5 shadow-sm backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-gray-500">Top Game</p>

            <CustomGameDropdown
              value={activeStats.name as Game}
              visible={gameTitleVisible}
              onChange={(game) => {
                setManualStatsGame(game);
                setStatsVisible(true);
                setGameTitleVisible(true);

                const nextIndex = statGames.findIndex((item) => item.name === game);
                if (nextIndex >= 0) setStatsIndex(nextIndex);
              }}
            />
          </div>

          <div
            className={`min-h-[124px] rounded-2xl border border-[#ff2fa8]/35 bg-white/92 p-5 shadow-sm backdrop-blur transition-all duration-[3000ms] ease-in-out ${
              statsVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            <div className="grid h-full grid-cols-3 items-start gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">Leading Nation</p>
                <p className="mt-8 text-base font-black leading-tight">{activeStats.nation}</p>
              </div>

              <div className="flex flex-col items-center">
                <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">7D Trend</p>
                <svg viewBox="0 0 150 50" className="mt-4 h-10 w-32">
                  <path d={activeStats.trend} fill="none" stroke="#19d3cf" strokeWidth="1.45" strokeLinecap="round" />
                </svg>
              </div>

              <div className="pr-4 text-right">
                <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">Dominance Score</p>
                <p className="mt-8 text-base font-black leading-tight text-[#19d3cf]">{activeStats.score}</p>
              </div>
            </div>
          </div>

          <StatCard visible={statsVisible} label="Biggest Mover" value={`${activeStats.mover} ▲${activeStats.moverChange.replace("+", "")}`} valueColor="text-[#19d3cf]" />
          <StatCard visible={statsVisible} label="Biggest Loser" value={`${activeStats.loser} ▼${activeStats.loserChange.replace("-", "")}`} valueColor="text-[#ff2fa8]" />
        </div>

        <div className="relative z-10 mb-6 flex items-center justify-between gap-4 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-4 shadow-sm backdrop-blur">
          <div className="flex gap-3 overflow-x-auto">
            {games.map((game) => (
              <button
                key={game}
                onClick={() => setSelectedGame(game)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                  game === selectedGame ? "bg-[#19d3cf] text-white" : "border border-gray-200 bg-white text-gray-700 hover:border-[#ff2fa8]"
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
                  selectedPeriod === period ? "bg-[#ff2fa8] text-white" : "border border-gray-200 bg-white text-gray-600 hover:border-[#19d3cf]"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <section className="relative z-0 overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white/92 shadow-sm backdrop-blur">
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
              <div
                key={`${selectedGame}-${item.country}`}
                className="grid grid-cols-[0.6fr_1.4fr_1fr_1.4fr_1fr_1fr_2.2fr_2.2fr] items-center border-b border-gray-100 px-6 py-4 text-sm last:border-b-0 hover:bg-gray-50/90"
              >
                <div className="text-base font-normal text-[#ff2fa8]">{index + 1}</div>
                <div className="text-sm font-semibold">{item.country}</div>
                <div>
                  <span className="rounded-full bg-[#19d3cf]/10 px-4 py-2 text-sm font-black text-[#19d3cf]">{item.score}</span>
                </div>
                <div>
                  <svg viewBox="0 0 150 50" className="h-10 w-28">
                    <path d={isUp ? trendUp : trendDown} fill="none" stroke={isUp ? "#19d3cf" : "#ff2fa8"} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className={`font-bold ${isUp ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>{isUp ? "▲" : "▼"} {item.rankChange}</div>
                <div className={`font-bold ${isUp ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>{item.percentChange}</div>
                <div className="flex flex-wrap gap-2">
                  {item.reasons.map((reason) => (
                    <span key={reason} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">{reason}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.improvements.map((improvement) => (
                    <span key={improvement} className="rounded-full border border-[#ff2fa8]/20 bg-[#ff2fa8]/5 px-3 py-1 text-xs font-semibold text-gray-600">{improvement}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </section>

      <style jsx global>{`
        @keyframes globeSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes globeReverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes globeFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          33% {
            transform: translate3d(22px, -28px, 0) scale(1.025);
          }
          66% {
            transform: translate3d(-18px, 18px, 0) scale(1.01);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes nodePulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(2.15);
          }
        }

        @keyframes nodeDriftOne {
          0% {
            transform: translate3d(0, 0, 0);
          }
          35% {
            transform: translate3d(34px, -22px, 0);
          }
          70% {
            transform: translate3d(-24px, 18px, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes nodeDriftTwo {
          0% {
            transform: translate3d(0, 0, 0);
          }
          40% {
            transform: translate3d(-38px, 24px, 0);
          }
          72% {
            transform: translate3d(26px, 32px, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes nodeDriftThree {
          0% {
            transform: translate3d(0, 0, 0);
          }
          28% {
            transform: translate3d(24px, 36px, 0);
          }
          66% {
            transform: translate3d(-34px, -26px, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes orbitDash {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -260;
          }
        }

        @keyframes pathSwayOne {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(24px, -18px, 0) rotate(4deg);
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
        }

        @keyframes pathSwayTwo {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(-28px, 24px, 0) rotate(-5deg);
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
        }

        @keyframes scanSweep {
          0% {
            transform: translateX(-35%) rotate(-8deg);
            opacity: 0;
          }
          20% {
            opacity: 0.35;
          }
          55% {
            opacity: 0.55;
          }
          100% {
            transform: translateX(135%) rotate(-8deg);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}

function CustomGameDropdown({ value, visible, onChange }: { value: Game; visible: boolean; onChange: (game: Game) => void }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative z-[9999] mt-5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-[48px] w-full items-center justify-between rounded-2xl border bg-white px-4 py-2 text-left font-black shadow-sm transition-all duration-300 ${
          open ? "border-[#ff2fa8] shadow-md" : "border-[#19d3cf]/30 hover:border-[#ff2fa8]/60 hover:shadow-md"
        }`}
      >
        <span className={`block max-w-[245px] whitespace-nowrap text-[0.82rem] leading-none text-[#19d3cf] transition-all duration-1000 ease-in-out ${visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}>
          {value}
        </span>
        <span className={`ml-3 shrink-0 text-xs text-[#ff2fa8] transition-transform duration-300 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      <div className={`absolute left-0 top-[calc(100%+0.5rem)] z-[9999] w-full overflow-hidden rounded-2xl border border-[#ff2fa8]/35 bg-white shadow-xl transition-all duration-300 ${
        open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
      }`}>
        {games.map((game) => {
          const selected = game === value;

          return (
            <button
              key={game}
              type="button"
              onClick={() => {
                onChange(game);
                setOpen(false);
              }}
              className={`block w-full px-4 py-3 text-left text-sm font-black transition-all duration-200 ${
                selected ? "bg-[#19d3cf]/10 text-[#19d3cf]" : "text-[#ff2fa8] hover:bg-[#ff2fa8]/8 hover:text-[#ff2fa8]"
              }`}
            >
              {game}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, valueColor, visible }: { label: string; value: string; valueColor: string; visible: boolean }) {
  return (
    <div className={`min-h-[124px] rounded-2xl border border-[#ff2fa8]/35 bg-white/92 p-5 shadow-sm backdrop-blur transition-all duration-[3000ms] ease-in-out ${
      visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
    }`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className={`mt-8 text-base font-black leading-tight ${valueColor}`}>{value}</p>
    </div>
  );
}

function RotatingGlobeBackground() {
  const nodes = [
    { left: "24%", top: "26%", color: "#19d3cf", size: "h-4 w-4", delay: "0s", drift: "nodeDriftOne", duration: "12s" },
    { left: "39%", top: "18%", color: "#94a3b8", size: "h-3 w-3", delay: "0.8s", drift: "nodeDriftTwo", duration: "14s" },
    { left: "61%", top: "24%", color: "#ff2fa8", size: "h-4 w-4", delay: "1.4s", drift: "nodeDriftThree", duration: "13s" },
    { left: "72%", top: "40%", color: "#19d3cf", size: "h-3 w-3", delay: "2s", drift: "nodeDriftTwo", duration: "15s" },
    { left: "58%", top: "62%", color: "#ff2fa8", size: "h-3.5 w-3.5", delay: "1.2s", drift: "nodeDriftOne", duration: "16s" },
    { left: "35%", top: "68%", color: "#19d3cf", size: "h-3 w-3", delay: "0.4s", drift: "nodeDriftThree", duration: "14.5s" },
    { left: "21%", top: "52%", color: "#ff2fa8", size: "h-3.5 w-3.5", delay: "1.8s", drift: "nodeDriftTwo", duration: "17s" },
    { left: "47%", top: "49%", color: "#94a3b8", size: "h-3 w-3", delay: "2.2s", drift: "nodeDriftOne", duration: "13.5s" },
    { left: "78%", top: "68%", color: "#19d3cf", size: "h-3 w-3", delay: "2.8s", drift: "nodeDriftThree", duration: "18s" },
    { left: "50%", top: "30%", color: "#ff2fa8", size: "h-2.5 w-2.5", delay: "3.1s", drift: "nodeDriftTwo", duration: "12.5s" },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]" />

      <div className="absolute left-1/2 top-[44%] h-[940px] w-[940px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(25,211,207,0.16)_0%,rgba(25,211,207,0.09)_24%,rgba(255,47,168,0.07)_42%,rgba(148,163,184,0.04)_58%,transparent_74%)] blur-2xl" />

      <div className="absolute left-[8%] top-[24%] h-80 w-80 rounded-full bg-[#19d3cf]/[0.09] blur-3xl" />
      <div className="absolute right-[8%] top-[34%] h-80 w-80 rounded-full bg-[#ff2fa8]/[0.09] blur-3xl" />
      <div className="absolute bottom-[14%] left-[26%] h-72 w-72 rounded-full bg-[#94a3b8]/[0.07] blur-3xl" />

      <div className="absolute left-1/2 top-[50%] h-[1080px] w-[1080px] -translate-x-1/2 -translate-y-1/2 opacity-[0.58]">
        <div className="absolute inset-0 animate-[globeFloat_13s_ease-in-out_infinite]">
          <div className="absolute inset-0 rounded-full border border-slate-300/85 shadow-[0_0_90px_rgba(148,163,184,0.12)] animate-[globeSpin_115s_linear_infinite]" />
          <div className="absolute inset-[7%] rounded-full border border-slate-300/70 animate-[globeReverse_95s_linear_infinite]" />
          <div className="absolute inset-[15%] rounded-full border border-slate-300/60 animate-[globeSpin_78s_linear_infinite]" />
          <div className="absolute inset-[24%] rounded-full border border-slate-300/48 animate-[globeReverse_88s_linear_infinite]" />
          <div className="absolute inset-[33%] rounded-full border border-slate-300/38" />

          <div className="absolute left-1/2 top-[4%] h-[92%] w-px -translate-x-1/2 bg-slate-300/75" />
          <div className="absolute left-[34%] top-[6%] h-[88%] w-px rotate-[10deg] bg-slate-300/60" />
          <div className="absolute left-[66%] top-[6%] h-[88%] w-px -rotate-[10deg] bg-slate-300/60" />
          <div className="absolute left-[22%] top-[14%] h-[72%] w-px rotate-[24deg] bg-slate-300/48" />
          <div className="absolute left-[78%] top-[14%] h-[72%] w-px -rotate-[24deg] bg-slate-300/48" />

          <div className="absolute left-[4%] top-1/2 h-px w-[92%] -translate-y-1/2 bg-slate-300/80" />
          <div className="absolute left-[10%] top-[36%] h-px w-[80%] -translate-y-1/2 bg-slate-300/65" />
          <div className="absolute left-[10%] top-[64%] h-px w-[80%] -translate-y-1/2 bg-slate-300/65" />
          <div className="absolute left-[18%] top-[25%] h-px w-[64%] -translate-y-1/2 bg-slate-300/52" />
          <div className="absolute left-[18%] top-[75%] h-px w-[64%] -translate-y-1/2 bg-slate-300/52" />

          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute top-0 h-full w-[35%] bg-gradient-to-r from-transparent via-white/35 to-transparent blur-md animate-[scanSweep_18s_ease-in-out_infinite]" />
          </div>

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1080 1080" fill="none">
            <g style={{ animation: "pathSwayOne 16s ease-in-out infinite", transformOrigin: "540px 540px" }}>
              <path
                d="M180 610 C 320 450, 500 395, 680 295 C 780 238, 876 212, 954 180"
                stroke="#19d3cf"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeDasharray="12 20"
                opacity="0.7"
                style={{ animation: "orbitDash 14s linear infinite" }}
              />
            </g>

            <g style={{ animation: "pathSwayTwo 19s ease-in-out infinite", transformOrigin: "540px 540px" }}>
              <path
                d="M168 436 C 312 500, 430 640, 608 680 C 742 712, 848 652, 940 560"
                stroke="#ff2fa8"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeDasharray="10 20"
                opacity="0.64"
                style={{ animation: "orbitDash 17s linear infinite reverse" }}
              />
            </g>

            <g style={{ animation: "pathSwayOne 22s ease-in-out infinite reverse", transformOrigin: "540px 540px" }}>
              <path
                d="M318 238 C 454 362, 560 432, 702 524 C 816 598, 874 712, 906 854"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="8 18"
                opacity="0.48"
                style={{ animation: "orbitDash 24s linear infinite" }}
              />
            </g>

            <g style={{ animation: "pathSwayTwo 21s ease-in-out infinite reverse", transformOrigin: "540px 540px" }}>
              <path
                d="M222 742 C 372 620, 512 570, 672 470 C 770 410, 842 330, 912 240"
                stroke="#19d3cf"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray="6 16"
                opacity="0.42"
                style={{ animation: "orbitDash 20s linear infinite reverse" }}
              />
            </g>

            <g style={{ animation: "pathSwayOne 24s ease-in-out infinite", transformOrigin: "540px 540px" }}>
              <path
                d="M214 308 C 340 360, 420 470, 548 500 C 690 533, 792 488, 904 430"
                stroke="#ff2fa8"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeDasharray="6 18"
                opacity="0.36"
                style={{ animation: "orbitDash 26s linear infinite" }}
              />
            </g>
          </svg>

          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.22)_38%,rgba(255,255,255,0)_72%)]" />

          {nodes.map((node, index) => (
            <div
              key={`${node.left}-${node.top}-${index}`}
              className="absolute"
              style={{
                left: node.left,
                top: node.top,
                animation: `${node.drift} ${node.duration} ease-in-out infinite`,
                animationDelay: node.delay,
              }}
            >
              <div
                className={`rounded-full ${node.size}`}
                style={{
                  backgroundColor: node.color,
                  boxShadow: `0 0 30px ${node.color}`,
                  animation: "nodePulse 3.6s ease-in-out infinite",
                  animationDelay: node.delay,
                }}
              />
            </div>
          ))}

          <div className="absolute inset-[12%] rounded-full border border-[#19d3cf]/25 animate-[globeSpin_46s_linear_infinite]" />
          <div className="absolute inset-[20%] rounded-full border border-[#ff2fa8]/22 animate-[globeReverse_58s_linear_infinite]" />
          <div className="absolute inset-[28%] rounded-full border border-[#19d3cf]/16 animate-[globeSpin_72s_linear_infinite]" />
        </div>
      </div>
    </div>
  );
}
