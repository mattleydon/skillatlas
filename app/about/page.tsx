"use client";

import { useState } from "react";
import { ROUTES } from "@/constants/routes";

type FAQItem = {
  question: string;
  answer: string;
};

const rankingSignals = [
  {
    title: "Tournament results",
    description: "Major wins, consistent placements, deep international runs, and performance across different competitive eras.",
  },
  {
    title: "Player depth",
    description: "How many elite players, rising prospects, specialist roles, and high-level grinders a country produces.",
  },
  {
    title: "Game identity",
    description: "Some countries are FPS furnaces, some are MOBA machines, some are fighting-game laboratories. SkillAtlas keeps that flavour visible.",
  },
  {
    title: "Infrastructure",
    description: "Teams, academies, coaching, sponsors, LAN culture, servers, grassroots scenes, and the boring machinery behind greatness.",
  },
  {
    title: "Community opinion",
    description: "User Rankings and Live Rankings will let players vote, argue, reorder, and build the public pulse of the site.",
  },
  {
    title: "Momentum",
    description: "Rankings should not feel frozen. Form, trends, new games, breakout players, and rising scenes all matter.",
  },
];

const siteAreas = [
  {
    name: "Rankings",
    description: "The homepage. A general country leaderboard showing who is currently strongest across games and why.",
    href: ROUTES.rankings,
  },
  {
    name: "User Rankings",
    description: "Community voting by game. Players decide which countries deserve to rise or fall.",
    href: ROUTES.userRankings,
  },
  {
    name: "Live Rankings",
    description: "A real-time ranking sandbox where users can move countries up and down the leaderboard.",
    href: ROUTES.liveRankings,
  },
  {
    name: "World Map",
    description: "A visual globe layer for exploring country strength by game and geography.",
    href: ROUTES.worldMap,
  },
  {
    name: "Countries",
    description: "Country profile cards with rankings, strengths, weaknesses, identities, and gaming fingerprints.",
    href: ROUTES.countries,
  },
  {
    name: "Players",
    description: "Player archetypes, roles, and eventually real user-created SkillAtlas profiles.",
    href: ROUTES.players,
  },
];

const roadmapItems = [
  "Connect rankings to real datasets and transparent scoring rules.",
  "Let users create profiles and receive a SkillAtlas player identity.",
  "Add country pages with deeper game-by-game breakdowns.",
  "Build voting, comments, and community ranking history.",
  "Add game pages for CS2, League of Legends, Valorant, Fortnite, Rocket League, Chess, and more.",
  "Make the World Map feel like a living atlas of competitive gaming culture.",
];

const faqs: FAQItem[] = [
  {
    question: "What is SkillAtlas?",
    answer:
      "SkillAtlas is a country ranking website for gaming and esports. It is designed to show which countries are strongest at each game, why they are strong, and how different gaming cultures compare across the world.",
  },
  {
    question: "Are the current rankings final?",
    answer:
      "No. The current version is a design and concept base with sample data. The goal is to evolve it into a transparent ranking system using real performance data, community votes, and live movement over time.",
  },
  {
    question: "How will countries be ranked?",
    answer:
      "The long-term scoring system can combine tournament results, elite player output, player depth, infrastructure, community votes, recent form, and game-specific dominance.",
  },
  {
    question: "Why rank countries instead of only teams or players?",
    answer:
      "Teams and players are already tracked everywhere. SkillAtlas looks at the deeper question underneath them: where talent comes from, which cultures produce certain playstyles, and why different countries dominate different games.",
  },
  {
    question: "What is User Rankings?",
    answer:
      "User Rankings is the community voting layer. Visitors can vote on which countries they believe are strongest for each game, creating a public pulse alongside the main rankings.",
  },
  {
    question: "What is Live Rankings?",
    answer:
      "Live Rankings is a more interactive ranking board where countries can be moved in real time. It is meant to feel immediate, playful, and community-driven.",
  },
  {
    question: "What are player identities?",
    answer:
      "Player identities are SkillAtlas-style archetypes like Tactical Brain, Mechanical Demon, Clutch Artist, Team Anchor, or Creative Builder. They help describe how a player wins, not just whether they win.",
  },
  {
    question: "Can users create their own profiles?",
    answer:
      "That is the plan. Eventually users should be able to create a SkillAtlas profile, choose their country and main game, describe their playstyle, and receive a player identity.",
  },
  {
    question: "Will SkillAtlas include every game?",
    answer:
      "The site can start with major competitive games and expand over time. Each game may need its own scoring logic because being dominant at CS2 is different from being dominant at Chess, Rocket League, Fortnite, or League of Legends.",
  },
];

function AboutBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(25,211,207,0.18),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(255,47,168,0.14),transparent_30%),linear-gradient(180deg,#F8FAFC_0%,#EEF7FA_100%)]" />
      <div className="absolute left-[-10%] top-40 h-[560px] w-[560px] rounded-full border border-[#19d3cf]/20" />
      <div className="absolute right-[-12%] top-72 h-[620px] w-[620px] rounded-full border border-[#ff2fa8]/20" />
      <div className="absolute inset-x-0 top-[250px] h-px bg-[#ff2fa8]/25" />
      <div className="absolute left-1/2 top-[180px] h-[700px] w-[700px] -translate-x-1/2 rounded-full border border-slate-300/40" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(15,23,42,0.32)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.32)_1px,transparent_1px)] [background-size:96px_96px]" />
    </div>
  );
}

export default function AboutPage() {
  const [openFAQ, setOpenFAQ] = useState(0);

  return (
    <main className="about-shell relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#111827] transition-colors duration-300">
      <AboutBackground />

      <style>{`
        html.skillatlas-dark .about-shell [class*="bg-white"] {
          background-color: rgba(53, 66, 80, 0.92) !important;
        }

        html.skillatlas-dark .about-shell [class*="bg-gray-50"] {
          background-color: rgba(32, 43, 55, 0.92) !important;
        }

        html.skillatlas-dark .about-shell [class*="text-gray-"] {
          color: rgb(203, 213, 225) !important;
        }

        html.skillatlas-dark .about-shell [class*="text-[#111827]"] {
          color: rgb(248, 250, 252) !important;
        }

        html.skillatlas-dark .about-shell {
          background: #2f3a46;
          color: rgb(248, 250, 252);
        }

        html.skillatlas-dark .about-shell > div:first-child {
          opacity: 0.58;
          filter: brightness(0.72) saturate(1.25);
        }
      `}</style>

      <section className="relative z-10 mx-auto max-w-7xl px-8 pb-16 pt-[150px]">
        <div className="mb-6 overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white/92 shadow-sm backdrop-blur">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#19d3cf]">About SkillAtlas</p>
              <h1 className="mb-3 max-w-4xl text-3xl font-black tracking-tight md:text-4xl">
                Building the ultimate country ranking website for gaming.
              </h1>
              <p className="max-w-4xl text-sm font-semibold leading-relaxed text-gray-600 md:text-base">
                SkillAtlas connects gamers across the world by mapping which countries dominate each game, why they win, and how different gaming cultures create different kinds of players.
              </p>
            </div>

            <div className="rounded-3xl border border-[#19d3cf]/30 bg-[#19d3cf]/8 p-5 lg:mt-8">
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#ff2fa8]">The simple idea</p>
              <p className="text-xl font-black leading-tight">
                Every country has a gaming fingerprint. SkillAtlas is here to map it.
              </p>
            </div>
          </div>

          <div className="grid border-t border-[#ff2fa8]/20 md:grid-cols-3">
            {[
              ["Mission", "Connect gamers globally through country-based rankings, maps, profiles, and community debate."],
              ["Goal", "Become the go-to website for understanding which countries are best at each game."],
              ["Spirit", "Competitive, curious, global, playful, and obsessed with why certain places produce certain skills."],
            ].map(([title, description]) => (
              <div key={title} className="border-t border-[#ff2fa8]/10 p-5 md:border-l md:border-t-0 first:md:border-l-0">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">{title}</p>
                <p className="text-sm font-bold leading-relaxed text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="mb-6 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Mission & Goals</p>
            <h2 className="mb-4 text-2xl font-black">What SkillAtlas is trying to become.</h2>
            <div className="space-y-4 text-sm font-semibold leading-relaxed text-gray-600">
              <p>
                SkillAtlas is not just another leaderboard. It is an atlas for gaming culture: a place to explore how countries develop talent, which games they dominate, and what makes their players different.
              </p>
              <p>
                The long-term goal is to combine real competitive data, community voting, player profiles, live rankings, and a world map into one clean home for global gaming comparison.
              </p>
              <p>
                It should be useful for esports fans, casual gamers, content creators, analysts, and anyone who has ever wondered, “Why is that country so good at this game?”
              </p>
              <p>
                The bigger vision is to make global gaming feel connected: a place where a player in Sydney, Seoul, São Paulo, Copenhagen, or Lagos can see their scene represented and compare it with the rest of the world.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {rankingSignals.map((signal) => (
              <div key={signal.title} className="rounded-3xl border border-[#ff2fa8]/35 bg-white/88 p-5 shadow-sm backdrop-blur">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#19d3cf]">{signal.title}</p>
                <p className="text-sm font-semibold leading-relaxed text-gray-600">{signal.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">How the site works</p>
              <h2 className="text-2xl font-black">The SkillAtlas ecosystem.</h2>
            </div>
            <p className="max-w-3xl whitespace-nowrap text-sm font-semibold leading-relaxed text-gray-600">
              Each page answers one question: where does gaming skill come from?
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {siteAreas.map((area) => (
              <a
                key={area.name}
                href={area.href}
                className="group rounded-3xl border border-gray-200 bg-white/70 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#19d3cf]/70 hover:shadow-lg"
              >
                <p className="mb-2 text-lg font-black transition-colors group-hover:text-[#19d3cf]">{area.name}</p>
                <p className="text-sm font-semibold leading-relaxed text-gray-600">{area.description}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mb-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Roadmap</p>
            <h2 className="mb-5 text-2xl font-black">Where it can go next.</h2>
            <div className="space-y-3">
              {roadmapItems.map((item, index) => (
                <div key={item} className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-gray-200 bg-white/70 p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ff2fa8]/10 text-xs font-black text-[#ff2fa8]">
                    {index + 1}
                  </span>
                  <p className="text-sm font-bold leading-snug text-gray-600">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Core Principles</p>
            <h2 className="mb-5 text-2xl font-black">Rules for the atlas.</h2>

            <div className="grid gap-3">
              {[
                ["Global first", "Every region deserves to be visible, not just the biggest esports markets."],
                ["Explain the why", "A ranking without reasoning is just a number wearing a crown."],
                ["Keep it alive", "Rankings should move as scenes rise, fall, rebuild, and surprise everyone."],
                ["Let the community speak", "Players should be able to vote, comment, challenge, and shape the public layer."],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                  <p className="mb-1 text-sm font-black text-[#ff2fa8]">{title}</p>
                  <p className="text-sm font-semibold leading-relaxed text-gray-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
          <div className="mb-5">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">FAQ</p>
            <h2 className="text-2xl font-black">Questions players will probably ask.</h2>
          </div>

          <div className="grid gap-3">
            {faqs.map((faq, index) => {
              const open = openFAQ === index;

              return (
                <div key={faq.question} className="overflow-hidden rounded-3xl border border-gray-200 bg-white/70">
                  <button
                    type="button"
                    onClick={() => setOpenFAQ(open ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <span className="font-black">{faq.question}</span>
                    <span className={`text-xl font-black text-[#ff2fa8] transition-transform duration-300 ${open ? "rotate-45" : ""}`}>+</span>
                  </button>

                  <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <p className="border-t border-gray-200 px-5 py-4 text-sm font-semibold leading-relaxed text-gray-600">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 text-center shadow-sm backdrop-blur">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Join the map</p>
          <h2 className="mx-auto mb-3 max-w-3xl text-2xl font-black">
            The dream is a living atlas built by gamers, not just watched by them.
          </h2>
          <p className="mx-auto max-w-3xl text-sm font-semibold leading-relaxed text-gray-600">
            Rankings, country identities, player archetypes, comments, votes, and live movement can turn SkillAtlas into a global gaming argument machine, but a useful one.
          </p>
        </section>
      </section>
    </main>
  );
}
