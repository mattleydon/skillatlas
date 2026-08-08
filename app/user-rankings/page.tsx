"use client";

import { useMemo, useState } from "react";
import Sparkline from "@/app/components/sparkline";
import { GAMES as games } from "@/constants/games";
import { clamp } from "@/lib/math";

type VoteCountry = {
  name: string;
  code: string;
  gameScores: Record<string, number>;
  trend: number;
  voters: number;
  reasons: string[];
  sparkline: number[];
};

const countries: VoteCountry[] = [
  { name: "Denmark", code: "dk", gameScores: { CS2: 98, "League of Legends": 77, Valorant: 82, Fortnite: 71, "Rocket League": 84, Chess: 80 }, trend: 2, voters: 1420, reasons: ["Elite CS systems", "Tactical culture", "Team cohesion"], sparkline: [88, 90, 91, 93, 94, 96, 97, 98] },
  { name: "South Korea", code: "kr", gameScores: { CS2: 83, "League of Legends": 99, Valorant: 91, Fortnite: 74, "Rocket League": 73, Chess: 78 }, trend: 1, voters: 1684, reasons: ["Esports academies", "Practice discipline", "MOBA dominance"], sparkline: [91, 92, 94, 95, 96, 97, 98, 99] },
  { name: "China", code: "cn", gameScores: { CS2: 79, "League of Legends": 96, Valorant: 87, Fortnite: 75, "Rocket League": 72, Chess: 86 }, trend: -1, voters: 1552, reasons: ["Huge player base", "Investment", "Mechanical ceiling"], sparkline: [93, 94, 95, 96, 95, 96, 95, 96] },
  { name: "USA", code: "us", gameScores: { CS2: 81, "League of Legends": 82, Valorant: 92, Fortnite: 97, "Rocket League": 89, Chess: 84 }, trend: 3, voters: 1876, reasons: ["Creator ecosystem", "Genre diversity", "Massive market"], sparkline: [84, 85, 87, 89, 91, 94, 96, 97] },
  { name: "Brazil", code: "br", gameScores: { CS2: 94, "League of Legends": 80, Valorant: 89, Fortnite: 83, "Rocket League": 78, Chess: 73 }, trend: 4, voters: 1318, reasons: ["FPS passion", "Aggression", "Fan intensity"], sparkline: [82, 84, 86, 88, 90, 92, 93, 94] },
  { name: "France", code: "fr", gameScores: { CS2: 88, "League of Legends": 83, Valorant: 86, Fortnite: 80, "Rocket League": 96, Chess: 79 }, trend: 2, voters: 1124, reasons: ["Rocket League depth", "Technical play", "Strong orgs"], sparkline: [86, 88, 90, 91, 93, 94, 95, 96] },
  { name: "Sweden", code: "se", gameScores: { CS2: 91, "League of Legends": 79, Valorant: 81, Fortnite: 70, "Rocket League": 78, Chess: 83 }, trend: -2, voters: 874, reasons: ["CS legacy", "LAN history", "Mechanical tradition"], sparkline: [94, 93, 92, 92, 91, 90, 91, 91] },
  { name: "Japan", code: "jp", gameScores: { CS2: 74, "League of Legends": 78, Valorant: 88, Fortnite: 76, "Rocket League": 70, Chess: 90 }, trend: 3, voters: 968, reasons: ["Fighting roots", "Precision", "Arcade culture"], sparkline: [80, 82, 84, 86, 87, 88, 89, 90] },
];


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


export default function UserRankingsPage() {
  const [selectedGame, setSelectedGame] = useState("CS2");
  const [localVotes, setLocalVotes] = useState<Record<string, number>>({});

  const rankedCountries = useMemo(() => {
    return countries
      .map((country) => ({
        ...country,
        userScore: country.gameScores[selectedGame] + (localVotes[country.name] ?? 0),
      }))
      .sort((a, b) => b.userScore - a.userScore);
  }, [localVotes, selectedGame]);

  const topCountry = rankedCountries[0];
  const totalVotes = rankedCountries.reduce((sum, country) => sum + country.voters + Math.max(localVotes[country.name] ?? 0, 0), 0);

  function vote(countryName: string, direction: 1 | -1) {
    setLocalVotes((votes) => {
      const nextValue = clamp((votes[countryName] ?? 0) + direction, -8, 8);
      return { ...votes, [countryName]: nextValue };
    });
  }

  return (
    <main className="rankings-shell relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#111827] transition-colors duration-300">
      <RankingsBackground />
      <style>{pageThemeStyles()}</style>
      <section className="relative z-10 mx-auto max-w-7xl px-8 pb-16 pt-[150px]">
        <div className="mb-6 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#19d3cf]">User Rankings</p>
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="mb-2 text-xl font-black tracking-tight">Let players vote on which countries are best.</h1>
              <p className="max-w-4xl text-sm font-semibold leading-relaxed text-gray-600">
                A community-powered ranking layer where visitors can push countries up or down for each game.
              </p>
            </div>

            <div className="rounded-2xl border border-[#19d3cf]/35 bg-white/90 p-2">
              <div className="flex flex-wrap gap-2">
                {games.map((game) => (
                  <button
                    key={game}
                    type="button"
                    onClick={() => setSelectedGame(game)}
                    className={`rounded-full border px-4 py-2 text-xs font-black transition-all duration-300 ${
                      selectedGame === game
                        ? "border-[#19d3cf] bg-[#19d3cf] text-white shadow-lg shadow-[#19d3cf]/20"
                        : "border-gray-200 bg-white/70 text-gray-700 hover:border-[#19d3cf]/60 hover:text-[#19d3cf]"
                    }`}
                  >
                    {game}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Community Leader</p>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-3xl bg-gray-50 shadow-inner">
                  <img src={`https://flagcdn.com/w160/${topCountry.code}.png`} alt={`${topCountry.name} flag`} className="h-full w-full object-cover" />
                </span>
                <div>
                  <h2 className="text-3xl font-black">{topCountry.name}</h2>
                  <p className="font-black text-[#ff2fa8]">{selectedGame}</p>
                </div>
              </div>
              <div className="rounded-3xl bg-[#19d3cf]/12 px-4 py-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">User Score</p>
                <p className="text-3xl font-black text-[#19d3cf]">{topCountry.userScore}</p>
              </div>
            </div>

            <p className="mt-5 text-sm font-semibold leading-relaxed text-gray-600">
              This page is the future community voting layer. Right now the votes are simulated locally, then we can connect it to Supabase once the design feels right.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/88 p-4 shadow-sm backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Total Votes</p>
              <p className="text-2xl font-black text-[#19d3cf]">{totalVotes.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/88 p-4 shadow-sm backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Current Game</p>
              <p className="truncate text-lg font-black text-[#ff2fa8]">{selectedGame}</p>
            </div>
            <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/88 p-4 shadow-sm backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Voting Mode</p>
              <p className="text-lg font-black">Community</p>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white/92 shadow-sm backdrop-blur">
          <div className="border-b border-[#ff2fa8]/20 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Community Ranking Table</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] uppercase tracking-[0.16em] text-gray-500">
                  <th className="px-5 py-4 font-black">Rank</th>
                  <th className="px-5 py-4 font-black">Country</th>
                  <th className="px-5 py-4 font-black">User Score</th>
                  <th className="px-5 py-4 font-black">Trend</th>
                  <th className="px-5 py-4 font-black">Votes</th>
                  <th className="px-5 py-4 font-black">Score Path</th>
                  <th className="px-5 py-4 font-black">Vote</th>
                  <th className="px-5 py-4 font-black">Why Users Pick Them</th>
                </tr>
              </thead>
              <tbody>
                {rankedCountries.map((country, index) => (
                  <tr key={country.name} className="border-b border-gray-200/80 transition-colors hover:bg-[#19d3cf]/5">
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
                      <span className="rounded-full bg-[#19d3cf]/12 px-3 py-1 text-sm font-black text-[#19d3cf]">{country.userScore}</span>
                    </td>
                    <td className={`px-5 py-4 text-sm font-black ${country.trend >= 0 ? "text-[#19d3cf]" : "text-[#ff2fa8]"}`}>
                      {country.trend >= 0 ? `▲ ${country.trend}` : `▼ ${Math.abs(country.trend)}`}
                    </td>
                    <td className="px-5 py-4 text-sm font-black">{(country.voters + Math.max(localVotes[country.name] ?? 0, 0)).toLocaleString()}</td>
                    <td className="px-5 py-4"><Sparkline values={country.sparkline} /></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => vote(country.name, 1)} className="rounded-full bg-[#19d3cf] px-3 py-1 text-xs font-black text-white">Up</button>
                        <button type="button" onClick={() => vote(country.name, -1)} className="rounded-full bg-[#ff2fa8] px-3 py-1 text-xs font-black text-white">Down</button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {country.reasons.map((reason) => (
                          <span key={reason} className="rounded-full border border-[#19d3cf]/25 bg-[#19d3cf]/10 px-3 py-1 text-xs font-black text-gray-700">{reason}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
