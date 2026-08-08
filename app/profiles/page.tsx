"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AtlasViewToggle from "@/app/components/atlas-view-toggle";
import SearchBar from "@/app/components/search-bar";
import Sparkline from "@/app/components/sparkline";
import StatsCard from "@/app/components/stats-card";

type Game = "All" | "CS2" | "League of Legends" | "Valorant" | "Fortnite" | "Rocket League" | "Chess";
type Role =
  | "All Roles"
  | "IGL"
  | "Entry"
  | "Support"
  | "AWPer"
  | "Duelist"
  | "Controller"
  | "Mid Laner"
  | "Jungler"
  | "Striker"
  | "Builder"
  | "Strategist";
type Identity =
  | "All Identities"
  | "Tactical Brain"
  | "Mechanical Demon"
  | "Clutch Artist"
  | "Chaos Agent"
  | "Silent Carry"
  | "Team Anchor"
  | "Momentum Player"
  | "Creative Builder"
  | "Macro Architect"
  | "Ice-Cold Finisher";

type PlayerProfile = {
  id: string;
  handle: string;
  realName: string;
  country: string;
  countryCode: string;
  game: Exclude<Game, "All">;
  role: Exclude<Role, "All Roles">;
  rank: number;
  score: number;
  trend: number;
  identity: Exclude<Identity, "All Identities">;
  aura: string;
  bestMap: string;
  strengths: string[];
  weakness: string;
  summary: string;
  playstyle: string;
  oneYearScore: number[];
};

const games: Game[] = ["All", "CS2", "League of Legends", "Valorant", "Fortnite", "Rocket League", "Chess"];

const roles: Role[] = [
  "All Roles",
  "IGL",
  "Entry",
  "Support",
  "AWPer",
  "Duelist",
  "Controller",
  "Mid Laner",
  "Jungler",
  "Striker",
  "Builder",
  "Strategist",
];

const identities: Identity[] = [
  "All Identities",
  "Tactical Brain",
  "Mechanical Demon",
  "Clutch Artist",
  "Chaos Agent",
  "Silent Carry",
  "Team Anchor",
  "Momentum Player",
  "Creative Builder",
  "Macro Architect",
  "Ice-Cold Finisher",
];

const profiles: PlayerProfile[] = [
  {
    id: "northstar-mika",
    handle: "Northstar",
    realName: "Mika Larsen",
    country: "Denmark",
    countryCode: "dk",
    game: "CS2",
    role: "IGL",
    rank: 1,
    score: 98,
    trend: 2,
    identity: "Tactical Brain",
    aura: "The Compass",
    bestMap: "Ancient",
    strengths: ["Mid-round calling", "Utility discipline", "Team structure"],
    weakness: "Low opening duel frequency",
    summary: "Turns messy CS2 rounds into clean geometry, making the whole team feel one second ahead.",
    playstyle: "Slow information gathering, sharp late-round calls, and calm utility layering.",
    oneYearScore: [88, 90, 91, 93, 94, 96, 97, 98],
  },
  {
    id: "vanta-seo",
    handle: "Vanta",
    realName: "Seo Min-jun",
    country: "South Korea",
    countryCode: "kr",
    game: "League of Legends",
    role: "Mid Laner",
    rank: 2,
    score: 97,
    trend: 1,
    identity: "Mechanical Demon",
    aura: "The Machine Ghost",
    bestMap: "Summoner's Rift",
    strengths: ["Lane control", "Micro spacing", "Teamfight execution"],
    weakness: "Occasionally over-forces tempo",
    summary: "A precision mid laner with surgical mechanics and ruthless spacing punishment.",
    playstyle: "Dominant laning, wave control, and cold teamfight positioning.",
    oneYearScore: [91, 92, 93, 94, 95, 96, 97, 97],
  },
  {
    id: "carnaval-lucas",
    handle: "Carnaval",
    realName: "Lucas Rocha",
    country: "Brazil",
    countryCode: "br",
    game: "CS2",
    role: "Entry",
    rank: 3,
    score: 96,
    trend: 4,
    identity: "Chaos Agent",
    aura: "The Firework",
    bestMap: "Mirage",
    strengths: ["Opening duels", "Pressure swings", "Crowd momentum"],
    weakness: "High-risk decision making",
    summary: "A Brazilian entry who creates space by kicking the door off its hinges.",
    playstyle: "Fast contact, aggressive peeks, and momentum-heavy site explosions.",
    oneYearScore: [84, 86, 89, 90, 92, 94, 95, 96],
  },
  {
    id: "orbit-emily",
    handle: "Orbit",
    realName: "Emily Carter",
    country: "USA",
    countryCode: "us",
    game: "Fortnite",
    role: "Builder",
    rank: 4,
    score: 95,
    trend: 3,
    identity: "Creative Builder",
    aura: "The Architect",
    bestMap: "Endgame Zone",
    strengths: ["Piece control", "Layer swaps", "Endgame creativity"],
    weakness: "Early-game resource greed",
    summary: "Turns late circles into moving architecture and survives by making better shapes faster.",
    playstyle: "Creative tunnelling, quick retakes, and calm high-pressure endgames.",
    oneYearScore: [83, 85, 87, 89, 91, 93, 94, 95],
  },
  {
    id: "shiro-yuki",
    handle: "Shiro",
    realName: "Yuki Tanaka",
    country: "Japan",
    countryCode: "jp",
    game: "Valorant",
    role: "Duelist",
    rank: 5,
    score: 94,
    trend: 3,
    identity: "Ice-Cold Finisher",
    aura: "The Needle",
    bestMap: "Ascent",
    strengths: ["First contact", "Crosshair discipline", "Late-round calm"],
    weakness: "Needs space from initiators",
    summary: "A precise duelist with clean first bullets and unusually quiet retakes.",
    playstyle: "Measured entries, patient angle clearing, and disciplined multi-kill conversions.",
    oneYearScore: [82, 84, 86, 88, 90, 92, 93, 94],
  },
  {
    id: "nova-claire",
    handle: "Nova",
    realName: "Claire Dubois",
    country: "France",
    countryCode: "fr",
    game: "Rocket League",
    role: "Striker",
    rank: 6,
    score: 93,
    trend: 2,
    identity: "Momentum Player",
    aura: "The Comet",
    bestMap: "Champions Field",
    strengths: ["Aerial pressure", "Fast rotations", "Backboard reads"],
    weakness: "Can overcommit in streaks",
    summary: "A French striker who turns one clean touch into three seconds of panic.",
    playstyle: "High-tempo rotations, aerial challenges, and ruthless shot chaining.",
    oneYearScore: [84, 85, 87, 88, 90, 91, 92, 93],
  },
  {
    id: "hex-li",
    handle: "Hex",
    realName: "Li Wei",
    country: "China",
    countryCode: "cn",
    game: "League of Legends",
    role: "Jungler",
    rank: 7,
    score: 92,
    trend: -1,
    identity: "Macro Architect",
    aura: "The Mapmaker",
    bestMap: "Summoner's Rift",
    strengths: ["Pathing", "Objective trading", "Vision timing"],
    weakness: "Low-risk early game",
    summary: "A cerebral jungler who slowly tightens the map until every objective feels pre-owned.",
    playstyle: "Controlled pathing, objective maths, and suffocating vision control.",
    oneYearScore: [93, 93, 92, 92, 91, 92, 92, 92],
  },
  {
    id: "rune-oliver",
    handle: "Rune",
    realName: "Oliver Svensson",
    country: "Sweden",
    countryCode: "se",
    game: "CS2",
    role: "AWPer",
    rank: 8,
    score: 91,
    trend: -2,
    identity: "Clutch Artist",
    aura: "The Cold Scope",
    bestMap: "Nuke",
    strengths: ["Late-round reads", "AWP discipline", "1vX composure"],
    weakness: "Slower opening impact",
    summary: "A Swedish AWPer who seems most awake when everyone else is gone.",
    playstyle: "Patient AWPing, late-round repositioning, and composed clutch routes.",
    oneYearScore: [94, 93, 93, 92, 91, 91, 90, 91],
  },
  {
    id: "signal-aisha",
    handle: "Signal",
    realName: "Aisha Khan",
    country: "India",
    countryCode: "in",
    game: "Valorant",
    role: "Controller",
    rank: 9,
    score: 90,
    trend: 6,
    identity: "Team Anchor",
    aura: "The Relay",
    bestMap: "Bind",
    strengths: ["Smoke timing", "Post-plant stability", "Comms clarity"],
    weakness: "Needs more opening assertiveness",
    summary: "A controller who keeps frantic rounds stitched together and makes chaos readable.",
    playstyle: "Support-first control, late utility value, and clean information calls.",
    oneYearScore: [72, 76, 80, 83, 86, 88, 89, 90],
  },
  {
    id: "surge-benji",
    handle: "Surge",
    realName: "Benji O'Keefe",
    country: "Australia",
    countryCode: "au",
    game: "CS2",
    role: "Entry",
    rank: 10,
    score: 89,
    trend: 5,
    identity: "Momentum Player",
    aura: "The Outback Spark",
    bestMap: "Inferno",
    strengths: ["Tempo breaks", "Fearless entries", "Resilience"],
    weakness: "Occasional dry-peek addiction",
    summary: "An Australian entry with distance-fighter stubbornness and pub-brawl theatre.",
    playstyle: "Fast entries, risky pressure, and high-energy retake disruption.",
    oneYearScore: [70, 74, 78, 81, 84, 87, 88, 89],
  },
  {
    id: "voltage-murat",
    handle: "Voltage",
    realName: "Murat Yilmaz",
    country: "Turkey",
    countryCode: "tr",
    game: "Valorant",
    role: "Duelist",
    rank: 11,
    score: 88,
    trend: 5,
    identity: "Mechanical Demon",
    aura: "The Furnace",
    bestMap: "Haven",
    strengths: ["Raw aim", "Explosive entries", "Confidence spikes"],
    weakness: "Discipline when ahead",
    summary: "A Turkish duelist with furnace-hot aim and the confidence to make defenders feel hunted.",
    playstyle: "Explosive dashes, wide-swing pressure, and fast multi-frag attempts.",
    oneYearScore: [73, 76, 79, 82, 85, 86, 87, 88],
  },
  {
    id: "frost-mia",
    handle: "Frost",
    realName: "Mia Henderson",
    country: "Canada",
    countryCode: "ca",
    game: "Valorant",
    role: "Support",
    rank: 12,
    score: 87,
    trend: 3,
    identity: "Silent Carry",
    aura: "The Snowline",
    bestMap: "Lotus",
    strengths: ["Trade timing", "Utility layering", "Low-error rounds"],
    weakness: "Low highlight visibility",
    summary: "A quiet support who rarely tops clips but often wins the round before the duel starts.",
    playstyle: "Trade-first support, disciplined utility, and clean late-round spacing.",
    oneYearScore: [78, 79, 81, 83, 84, 85, 86, 87],
  },
  {
    id: "keystone-jonas",
    handle: "Keystone",
    realName: "Jonas Müller",
    country: "Germany",
    countryCode: "de",
    game: "Chess",
    role: "Strategist",
    rank: 13,
    score: 86,
    trend: 1,
    identity: "Tactical Brain",
    aura: "The Engineer",
    bestMap: "Sicilian Defence",
    strengths: ["Calculation", "Endgame technique", "Time management"],
    weakness: "Sharp gambit positions",
    summary: "A structured strategist who treats the board like an engine room.",
    playstyle: "Slow squeeze, technical endings, and low-risk positional pressure.",
    oneYearScore: [81, 82, 83, 84, 85, 85, 86, 86],
  },
  {
    id: "clockwork-tess",
    handle: "Clockwork",
    realName: "Tess de Vries",
    country: "Netherlands",
    countryCode: "nl",
    game: "Rocket League",
    role: "Striker",
    rank: 14,
    score: 85,
    trend: 4,
    identity: "Mechanical Demon",
    aura: "The Gearshift",
    bestMap: "Mannfield",
    strengths: ["First touch", "Aerial mechanics", "Boost efficiency"],
    weakness: "Physical defence",
    summary: "A Dutch striker with tiny adjustments that turn harmless clears into instant danger.",
    playstyle: "Fast aerial control, efficient boost paths, and clean attacking chains.",
    oneYearScore: [72, 75, 78, 80, 82, 84, 85, 85],
  },
  {
    id: "ember-diego",
    handle: "Ember",
    realName: "Diego Santos",
    country: "Brazil",
    countryCode: "br",
    game: "Valorant",
    role: "Duelist",
    rank: 15,
    score: 84,
    trend: 4,
    identity: "Chaos Agent",
    aura: "The Bonfire",
    bestMap: "Split",
    strengths: ["Entry creativity", "Mid-round aggression", "Confidence"],
    weakness: "Overheating in anti-ecos",
    summary: "A duelist who wants every round to become a street festival with crossfires.",
    playstyle: "Creative entries, sudden flanks, and fearless close-range pressure.",
    oneYearScore: [70, 72, 75, 78, 80, 82, 83, 84],
  },
  {
    id: "lumen-hana",
    handle: "Lumen",
    realName: "Hana Park",
    country: "South Korea",
    countryCode: "kr",
    game: "League of Legends",
    role: "Support",
    rank: 16,
    score: 83,
    trend: 2,
    identity: "Team Anchor",
    aura: "The Lantern",
    bestMap: "Summoner's Rift",
    strengths: ["Vision webs", "Engage timing", "Lane protection"],
    weakness: "Low roaming risk",
    summary: "A support who keeps the map lit and the carries breathing.",
    playstyle: "Vision control, controlled engages, and carry-first protection.",
    oneYearScore: [75, 77, 78, 80, 81, 82, 83, 83],
  },
  {
    id: "rift-noah",
    handle: "Rift",
    realName: "Noah Johnson",
    country: "USA",
    countryCode: "us",
    game: "Fortnite",
    role: "Builder",
    rank: 17,
    score: 82,
    trend: 3,
    identity: "Creative Builder",
    aura: "The Skybridge",
    bestMap: "Moving Zone",
    strengths: ["Retakes", "Piece pressure", "Fast edits"],
    weakness: "Storm surge planning",
    summary: "A builder who sees vertical space as a second inventory.",
    playstyle: "Edit speed, vertical retakes, and aggressive box pressure.",
    oneYearScore: [73, 74, 76, 78, 79, 80, 81, 82],
  },
  {
    id: "veloce-antoine",
    handle: "Veloce",
    realName: "Antoine Martin",
    country: "France",
    countryCode: "fr",
    game: "Rocket League",
    role: "Support",
    rank: 18,
    score: 81,
    trend: 1,
    identity: "Silent Carry",
    aura: "The Second Touch",
    bestMap: "DFH Stadium",
    strengths: ["Recovery speed", "Pass selection", "Defensive reads"],
    weakness: "Needs more shooting volume",
    summary: "A quiet Rocket League support whose second touch decides whether a team looks brilliant.",
    playstyle: "Fast recoveries, passing lanes, and stabilising rotations.",
    oneYearScore: [76, 76, 78, 79, 80, 80, 81, 81],
  },
  {
    id: "vertex-kai",
    handle: "Vertex",
    realName: "Kai Sato",
    country: "Japan",
    countryCode: "jp",
    game: "Chess",
    role: "Strategist",
    rank: 19,
    score: 80,
    trend: 2,
    identity: "Macro Architect",
    aura: "The Diagram",
    bestMap: "Queen's Gambit",
    strengths: ["Opening prep", "Pattern memory", "Endgame patience"],
    weakness: "Time trouble in wild positions",
    summary: "A strategist with clean preparation and a gift for quiet traps.",
    playstyle: "Prepared openings, long squeezes, and patient conversion.",
    oneYearScore: [72, 74, 75, 76, 78, 79, 80, 80],
  },
  {
    id: "spark-marta",
    handle: "Spark",
    realName: "Marta Kowalska",
    country: "Poland",
    countryCode: "pl",
    game: "CS2",
    role: "Support",
    rank: 20,
    score: 79,
    trend: 2,
    identity: "Team Anchor",
    aura: "The Rivet",
    bestMap: "Overpass",
    strengths: ["Flash assists", "Trade spacing", "Site anchoring"],
    weakness: "Limited star roles",
    summary: "A support who wins the invisible parts of the round.",
    playstyle: "Flash timing, disciplined anchors, and trade-first spacing.",
    oneYearScore: [70, 71, 73, 75, 76, 78, 79, 79],
  },
  {
    id: "pulse-alejandro",
    handle: "Pulse",
    realName: "Alejandro García",
    country: "Spain",
    countryCode: "es",
    game: "Valorant",
    role: "Controller",
    rank: 21,
    score: 78,
    trend: 4,
    identity: "Momentum Player",
    aura: "The Sparkplug",
    bestMap: "Pearl",
    strengths: ["Smoke bursts", "Retake timing", "Emotional tempo"],
    weakness: "Over-rotating",
    summary: "A controller with rhythm who changes the speed of the round.",
    playstyle: "Fast utility bursts, retake orchestration, and tempo shifts.",
    oneYearScore: [66, 69, 72, 74, 76, 77, 78, 78],
  },
  {
    id: "echo-thabo",
    handle: "Echo",
    realName: "Thabo Ndlovu",
    country: "South Africa",
    countryCode: "za",
    game: "CS2",
    role: "IGL",
    rank: 22,
    score: 77,
    trend: 6,
    identity: "Tactical Brain",
    aura: "The Vanguard",
    bestMap: "Anubis",
    strengths: ["Anti-strats", "Resilience", "Regional leadership"],
    weakness: "International reps",
    summary: "An IGL building a map from the edge of the scene.",
    playstyle: "Prepared calls, adaptive defaults, and late-round problem solving.",
    oneYearScore: [60, 64, 68, 71, 73, 75, 76, 77],
  },
  {
    id: "meteor-faris",
    handle: "Meteor",
    realName: "Faris Al-Saud",
    country: "Saudi Arabia",
    countryCode: "sa",
    game: "Rocket League",
    role: "Striker",
    rank: 23,
    score: 76,
    trend: 7,
    identity: "Momentum Player",
    aura: "The Sandstorm",
    bestMap: "Utopia Coliseum",
    strengths: ["Aerial speed", "Solo plays", "Confidence"],
    weakness: "Defensive patience",
    summary: "A rising striker who makes every aerial look like a statement.",
    playstyle: "Fast challenges, solo aerial pressure, and aggressive shooting windows.",
    oneYearScore: [56, 60, 65, 69, 72, 74, 75, 76],
  },
  {
    id: "signalflare-amina",
    handle: "Signalflare",
    realName: "Amina Adebayo",
    country: "Nigeria",
    countryCode: "ng",
    game: "Fortnite",
    role: "Builder",
    rank: 24,
    score: 75,
    trend: 8,
    identity: "Creative Builder",
    aura: "The Signalflare",
    bestMap: "Final Circle",
    strengths: ["Mobile mechanics", "Adaptability", "Community energy"],
    weakness: "Tournament infrastructure",
    summary: "A rising builder shaped by creativity over comfort.",
    playstyle: "Improvised builds, fast edits, and survival-first endgames.",
    oneYearScore: [52, 57, 62, 67, 71, 73, 74, 75],
  },
  {
    id: "gambit-sofia",
    handle: "Gambit",
    realName: "Sofia Rivera",
    country: "Mexico",
    countryCode: "mx",
    game: "Chess",
    role: "Strategist",
    rank: 25,
    score: 74,
    trend: 4,
    identity: "Clutch Artist",
    aura: "The Trapdoor",
    bestMap: "King's Indian",
    strengths: ["Tactical traps", "Time pressure", "Counterplay"],
    weakness: "Passive endgames",
    summary: "A strategist who enjoys positions with teeth.",
    playstyle: "Counter-attacks, tactical baiting, and sharp middle games.",
    oneYearScore: [63, 65, 67, 69, 71, 72, 74, 74],
  },
  {
    id: "anchor-liam",
    handle: "Anchor",
    realName: "Liam Wilson",
    country: "New Zealand",
    countryCode: "nz",
    game: "Rocket League",
    role: "Support",
    rank: 26,
    score: 73,
    trend: 2,
    identity: "Team Anchor",
    aura: "The Keel",
    bestMap: "Aquadome",
    strengths: ["Defensive rotations", "Clears", "Composure"],
    weakness: "Limited offensive pressure",
    summary: "A steady support who turns panic into reset and reset into counterattack.",
    playstyle: "Safe rotations, recovery defence, and patient counter-play.",
    oneYearScore: [66, 67, 68, 70, 71, 72, 73, 73],
  },
  {
    id: "rhythm-sofia",
    handle: "Rhythm",
    realName: "Sofia Silva",
    country: "Argentina",
    countryCode: "ar",
    game: "Fortnite",
    role: "Builder",
    rank: 27,
    score: 72,
    trend: 3,
    identity: "Creative Builder",
    aura: "The Tango",
    bestMap: "Box Fight",
    strengths: ["Edit rhythm", "Close-range fights", "Improvisation"],
    weakness: "Long rotation planning",
    summary: "A creative builder with musical timing and close-range danger.",
    playstyle: "Fast box edits, reactive building, and short-range pressure.",
    oneYearScore: [62, 64, 66, 68, 70, 71, 72, 72],
  },
  {
    id: "lantern-nils",
    handle: "Lantern",
    realName: "Nils Eriksen",
    country: "Norway",
    countryCode: "no",
    game: "CS2",
    role: "Support",
    rank: 28,
    score: 71,
    trend: 2,
    identity: "Silent Carry",
    aura: "The Northern Light",
    bestMap: "Vertigo",
    strengths: ["Flash timing", "Calm comms", "Retake support"],
    weakness: "Low duel volume",
    summary: "A support whose value appears in the scoreboard margins.",
    playstyle: "Careful utility, calm retakes, and low-noise impact.",
    oneYearScore: [64, 65, 66, 68, 69, 70, 71, 71],
  },
  {
    id: "circuit-mei",
    handle: "Circuit",
    realName: "Mei Lin",
    country: "Taiwan",
    countryCode: "tw",
    game: "League of Legends",
    role: "Mid Laner",
    rank: 29,
    score: 70,
    trend: 2,
    identity: "Macro Architect",
    aura: "The Circuit",
    bestMap: "Summoner's Rift",
    strengths: ["Wave control", "Side-lane timing", "Scaling plans"],
    weakness: "Early skirmish volatility",
    summary: "A mid laner who likes clean circuits: wave, ward, rotate, repeat.",
    playstyle: "Scaling lanes, rotation discipline, and calculated side pressure.",
    oneYearScore: [62, 64, 65, 67, 68, 69, 70, 70],
  },
  {
    id: "onyx-omar",
    handle: "Onyx",
    realName: "Omar Hassan",
    country: "Egypt",
    countryCode: "eg",
    game: "Valorant",
    role: "Controller",
    rank: 30,
    score: 69,
    trend: 5,
    identity: "Team Anchor",
    aura: "The Obelisk",
    bestMap: "Sunset",
    strengths: ["Site control", "Post-plants", "Utility patience"],
    weakness: "Opening map pressure",
    summary: "A controller who gives every round a spine.",
    playstyle: "Post-plant control, site denial, and patience under pressure.",
    oneYearScore: [55, 58, 61, 64, 66, 68, 69, 69],
  }
];

function trendLabel(trend: number) {
  if (trend > 0) return `▲ ${trend}`;
  if (trend < 0) return `▼ ${Math.abs(trend)}`;
  return "—";
}

function trendClass(trend: number) {
  if (trend > 0) return "text-[#19d3cf]";
  if (trend < 0) return "text-[#ff2fa8]";
  return "text-gray-500";
}

function PlayerAvatar({ profile, size = "md" }: { profile: PlayerProfile; size?: "sm" | "md" | "lg" | "xl" }) {
  const initials = profile.handle.slice(0, 2).toUpperCase();
  const sizeClass =
    size === "xl"
      ? "h-16 w-16 rounded-3xl text-2xl"
      : size === "lg"
        ? "h-14 w-14 rounded-3xl text-xl"
        : size === "sm"
          ? "h-8 w-8 rounded-xl text-xs"
          : "h-12 w-12 rounded-2xl text-base";

  return (
    <span
      className={`grid ${sizeClass} shrink-0 place-items-center bg-[linear-gradient(135deg,rgba(25,211,207,0.24),rgba(255,47,168,0.24))] font-black text-[#111827] shadow-inner`}
    >
      {initials}
    </span>
  );
}

function CountryFlag({ countryCode, country, size = "sm" }: { countryCode: string; country: string; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "h-8 w-8 rounded-xl" : "h-6 w-6 rounded-lg";

  return (
    <span className={`grid ${sizeClass} shrink-0 place-items-center overflow-hidden bg-gray-50 shadow-inner`}>
      <img
        src={`https://flagcdn.com/w80/${countryCode}.png`}
        alt={`${country} flag`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </span>
  );
}

function ProfilesBackground() {
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

function ProfileCard({ profile, selected, onSelect }: { profile: PlayerProfile; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group rounded-3xl border p-5 text-left shadow-sm backdrop-blur transition-all duration-300 ${
        selected
          ? "border-[#19d3cf] bg-[#19d3cf]/10 shadow-[0_0_0_4px_rgba(25,211,207,0.10)]"
          : "border-[#ff2fa8]/35 bg-white/90 hover:-translate-y-1 hover:border-[#19d3cf]/70 hover:shadow-lg"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PlayerAvatar profile={profile} />
          <div className="min-w-0">
            <p className="truncate text-lg font-black">“{profile.handle}”</p>
            <div className="mt-1 flex items-center gap-2">
              <CountryFlag countryCode={profile.countryCode} country={profile.country} />
              <p className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-[#19d3cf]">{profile.identity}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#ff2fa8]/10 px-3 py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Rank</p>
          <p className="text-xl font-black text-[#ff2fa8]">#{profile.rank}</p>
        </div>
      </div>

      <p className="mb-4 line-clamp-3 text-sm font-semibold leading-relaxed text-gray-600">{profile.summary}</p>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-200/80 bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Game</p>
          <p className="mt-1 truncate text-sm font-black text-[#111827]">{profile.game}</p>
        </div>
        <div className="rounded-2xl border border-gray-200/80 bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Score</p>
          <p className="mt-1 text-sm font-black text-[#19d3cf]">{profile.score}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {profile.strengths.slice(0, 3).map((strength) => (
          <span key={strength} className="rounded-full border border-[#19d3cf]/25 bg-[#19d3cf]/8 px-3 py-1 text-[11px] font-black text-gray-700">
            {strength}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState<Game>("All");
  const [selectedRole, setSelectedRole] = useState<Role>("All Roles");
  const [selectedIdentity, setSelectedIdentity] = useState<Identity>("All Identities");
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0].id);
  const [featuredProfileId, setFeaturedProfileId] = useState(profiles[0].id);
  const [featuredLocked, setFeaturedLocked] = useState(false);
  const [featuredTransitionPhase, setFeaturedTransitionPhase] = useState<"idle" | "out" | "in">("idle");
  const [atlasView, setAtlasView] = useState<"cards" | "table">("cards");
  const profileIdentityRef = useRef<HTMLElement | null>(null);

  const filteredProfiles = useMemo(() => {
    const normalisedSearch = search.trim().toLowerCase();

    return profiles
      .filter((profile) => (selectedGame === "All" ? true : profile.game === selectedGame))
      .filter((profile) => (selectedRole === "All Roles" ? true : profile.role === selectedRole))
      .filter((profile) => (selectedIdentity === "All Identities" ? true : profile.identity === selectedIdentity))
      .filter((profile) => {
        if (!normalisedSearch) return true;

        return [
          profile.handle,
          profile.realName,
          profile.country,
          profile.game,
          profile.role,
          profile.identity,
          profile.aura,
          profile.bestMap,
          profile.summary,
          profile.playstyle,
          ...profile.strengths,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalisedSearch);
      })
      .sort((a, b) => a.rank - b.rank);
  }, [search, selectedGame, selectedIdentity, selectedRole]);

  const featuredPool = useMemo(() => profiles.slice(0, 8), []);

  useEffect(() => {
    if (filteredProfiles[0]) {
      setSelectedProfileId(filteredProfiles[0].id);
    }
  }, [filteredProfiles, selectedGame, selectedRole, selectedIdentity, search]);

  useEffect(() => {
    if (featuredLocked || featuredPool.length <= 1) return;

    let swapTimer: number | undefined;
    let settleTimer: number | undefined;

    const showTimer = window.setTimeout(() => {
      setFeaturedTransitionPhase("out");

      swapTimer = window.setTimeout(() => {
        setFeaturedProfileId((currentId) => {
          const currentIndex = featuredPool.findIndex((profile) => profile.id === currentId);
          const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % featuredPool.length : 0;
          return featuredPool[nextIndex]?.id ?? featuredPool[0].id;
        });

        setFeaturedTransitionPhase("in");

        settleTimer = window.setTimeout(() => {
          setFeaturedTransitionPhase("idle");
        }, 1500);
      }, 1500);
    }, 6000);

    return () => {
      window.clearTimeout(showTimer);
      if (swapTimer) window.clearTimeout(swapTimer);
      if (settleTimer) window.clearTimeout(settleTimer);
    };
  }, [featuredLocked, featuredPool, featuredProfileId]);

  const featuredProfile = profiles.find((profile) => profile.id === featuredProfileId) ?? profiles[0];
  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? featuredProfile;
  const topMover = filteredProfiles.reduce((best, profile) => (profile.trend > best.trend ? profile : best), filteredProfiles[0] ?? profiles[0]);
  const averageScore = Math.round(filteredProfiles.reduce((sum, profile) => sum + profile.score, 0) / Math.max(filteredProfiles.length, 1));

  function selectProfile(profileId: string, scrollToIdentity = false) {
    setSelectedProfileId(profileId);
    setFeaturedLocked(false);
    setFeaturedTransitionPhase("idle");

    if (scrollToIdentity) {
      window.setTimeout(() => {
        profileIdentityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  function lockFeaturedProfile() {
    setFeaturedLocked(true);
    setFeaturedTransitionPhase("idle");
    setSelectedProfileId(featuredProfile.id);

    window.setTimeout(() => {
      profileIdentityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <main className="profiles-shell relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#111827] transition-colors duration-300">
      <ProfilesBackground />

      <style>{`
        .profiles-shell [class*="line-clamp-3"] {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes skillatlas-featured-out {
          0% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
          100% { opacity: 0; transform: translateX(26px) scale(0.965); filter: blur(3px); }
        }

        @keyframes skillatlas-featured-in {
          0% { opacity: 0; transform: translateX(-32px) scale(0.965); filter: blur(3px); }
          100% { opacity: 1; transform: translateX(0) scale(1); filter: blur(0); }
        }

        .skillatlas-featured-card-out {
          animation: skillatlas-featured-out 1500ms cubic-bezier(0.65, 0, 0.35, 1) both;
        }

        .skillatlas-featured-card-in {
          animation: skillatlas-featured-in 1500ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        html.skillatlas-dark .profiles-shell [class*="bg-white"] {
          background-color: rgba(53, 66, 80, 0.92) !important;
        }

        html.skillatlas-dark .profiles-shell [class*="bg-gray-50"] {
          background-color: rgba(32, 43, 55, 0.92) !important;
        }

        html.skillatlas-dark .profiles-shell [class*="text-gray-"] {
          color: rgb(203, 213, 225) !important;
        }

        html.skillatlas-dark .profiles-shell [class*="text-[#111827]"] {
          color: rgb(248, 250, 252) !important;
        }

        html.skillatlas-dark .profiles-shell input {
          background-color: rgba(32, 43, 55, 0.96) !important;
          color: rgb(248, 250, 252) !important;
        }

        html.skillatlas-dark .profiles-shell {
          background: #2f3a46;
          color: rgb(248, 250, 252);
        }

        html.skillatlas-dark .profiles-shell > div:first-child {
          opacity: 0.58;
          filter: brightness(0.72) saturate(1.25);
        }
      `}</style>

      <section className="relative z-10 mx-auto max-w-7xl px-8 pb-16 pt-[150px]">
        <div className="mb-6 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#19d3cf]">Players</p>
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="mb-2 text-xl font-black tracking-tight">Discover the player types behind every gaming nation.</h1>
              <p className="max-w-4xl text-sm font-semibold leading-relaxed text-gray-600">
                Browse playstyles, roles, strengths, rankings, and competitive identity across different games.
              </p>
            </div>

            <SearchBar
              label="Search profiles"
              placeholder="Search player, role, country, game..."
              value={search}
              onValueChange={setSearch}
            />
          </div>
        </div>

        <div className="mb-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="flex min-h-[230px] flex-col rounded-3xl border border-[#ff2fa8]/40 bg-white/88 px-4 py-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-start gap-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-gray-500">Profile Filters</p>
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <div className="flex flex-wrap justify-start gap-2">
                {games.map((game) => (
                  <button
                    key={game}
                    type="button"
                    onClick={() => setSelectedGame(game)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-black transition-all duration-300 ${
                      selectedGame === game
                        ? "border-[#19d3cf] bg-[#19d3cf] text-white shadow-lg shadow-[#19d3cf]/20"
                        : "border-gray-200 bg-white/70 text-gray-700 hover:border-[#19d3cf]/60 hover:text-[#19d3cf]"
                    }`}
                  >
                    {game}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap justify-start gap-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`rounded-full border px-3 py-1 text-xs font-black transition-all duration-300 ${
                      selectedRole === role
                        ? "border-[#ff2fa8] bg-[#ff2fa8] text-white shadow-lg shadow-[#ff2fa8]/20"
                        : "border-gray-200 bg-white/70 text-gray-700 hover:border-[#ff2fa8]/60 hover:text-[#ff2fa8]"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap justify-start gap-2">
                {identities.map((identity) => (
                  <button
                    key={identity}
                    type="button"
                    onClick={() => setSelectedIdentity(identity)}
                    className={`rounded-full border px-3 py-1 text-xs font-black transition-all duration-300 ${
                      selectedIdentity === identity
                        ? "border-[#19d3cf] bg-[#19d3cf] text-white shadow-lg shadow-[#19d3cf]/20"
                        : "border-gray-200 bg-white/70 text-gray-700 hover:border-[#19d3cf]/60 hover:text-[#19d3cf]"
                    }`}
                  >
                    {identity}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <StatsCard label="Average Score">
              <p className="text-xl font-black text-[#19d3cf]">{averageScore}</p>
            </StatsCard>
            <StatsCard label="Top Mover">
              <p className="truncate text-base font-black">“{topMover?.handle}”</p>
              <p className={`text-xs font-black ${trendClass(topMover?.trend ?? 0)}`}>{trendLabel(topMover?.trend ?? 0)}</p>
            </StatsCard>
            <StatsCard label="Current Lens">
              <p className="truncate text-sm font-black text-[#ff2fa8]">{selectedGame === "All" ? selectedIdentity : selectedGame}</p>
            </StatsCard>
          </div>
        </div>

        <section className="mb-6 grid items-start gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <button
            type="button"
            onClick={lockFeaturedProfile}
            className="relative self-start overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 text-left shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[#19d3cf]/70 hover:shadow-lg"
          >
            <div
              className={`relative flex h-full flex-col justify-start ${
                featuredTransitionPhase === "out"
                  ? "skillatlas-featured-card-out"
                  : featuredTransitionPhase === "in"
                    ? "skillatlas-featured-card-in"
                    : ""
              }`}
            >
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Featured Profile</p>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <PlayerAvatar profile={featuredProfile} size="xl" />
                  <div>
                    <h2 className="text-3xl font-black">“{featuredProfile.handle}”</h2>
                    <div className="mt-1 flex items-center gap-2">
                      <CountryFlag countryCode={featuredProfile.countryCode} country={featuredProfile.country} size="md" />
                      <p className="font-black text-[#ff2fa8]">{featuredProfile.country} · {featuredProfile.game}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-[#19d3cf]/12 px-4 py-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Score</p>
                  <p className="text-3xl font-black text-[#19d3cf]">{featuredProfile.score}</p>
                </div>
              </div>

              <p className="mb-5 text-sm font-semibold leading-relaxed text-gray-600">{featuredProfile.summary}</p>

              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Role</p>
                  <p className="mt-1 text-sm font-black">{featuredProfile.role}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Identity</p>
                  <p className="mt-1 text-sm font-black">{featuredProfile.identity}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Trend</p>
                  <p className={`mt-1 text-sm font-black ${trendClass(featuredProfile.trend)}`}>{trendLabel(featuredProfile.trend)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {featuredProfile.strengths.map((strength) => (
                  <span key={strength} className="rounded-full border border-[#19d3cf]/25 bg-[#19d3cf]/10 px-3 py-1 text-xs font-black text-gray-700">
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          </button>

          <section ref={profileIdentityRef} className="scroll-mt-28 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#ff2fa8]">Profile Identity</p>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">“{selectedProfile.handle}”</h2>
                <p className="font-black text-[#19d3cf]">{selectedProfile.identity}</p>
              </div>
              <div className="flex items-center gap-3">
                <CountryFlag countryCode={selectedProfile.countryCode} country={selectedProfile.country} size="md" />
                <PlayerAvatar profile={selectedProfile} size="xl" />
              </div>
            </div>

            <p className="mb-5 text-sm font-semibold leading-relaxed text-gray-600">{selectedProfile.summary}</p>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Profile Rank</p>
                <p className="mt-1 text-lg font-black text-[#ff2fa8]">#{selectedProfile.rank}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Game</p>
                <p className="mt-1 text-sm font-black">{selectedProfile.game}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Score</p>
                <p className="mt-1 text-lg font-black text-[#19d3cf]">{selectedProfile.score}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Role</p>
                <p className="mt-1 text-sm font-black">{selectedProfile.role}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Country</p>
                <p className="mt-1 text-sm font-black">{selectedProfile.country}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Aura</p>
                <p className="mt-1 text-sm font-black text-[#ff2fa8]">{selectedProfile.aura}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Why they win</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.strengths.map((strength) => (
                    <span key={strength} className="rounded-full bg-[#19d3cf]/10 px-3 py-1 text-xs font-black text-gray-700">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Room for improvement</p>
                <p className="text-sm font-black text-[#ff2fa8]">{selectedProfile.weakness}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">One Year Score</p>
                <Sparkline values={selectedProfile.oneYearScore} />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Best Map / Mode</p>
                <p className="text-sm font-black">{selectedProfile.bestMap}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 sm:col-span-2">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Playstyle Summary</p>
                <p className="text-sm font-semibold leading-relaxed text-gray-600">{selectedProfile.playstyle}</p>
              </div>
            </div>
          </section>
        </section>

        <section className="mb-6 overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white/92 shadow-sm backdrop-blur">
          <div className="border-b border-[#ff2fa8]/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Profile Atlas</p>

              <AtlasViewToggle
                value={atlasView}
                cardsValue="cards"
                tableValue="table"
                onChange={setAtlasView}
              />
            </div>
          </div>

          {atlasView === "cards" ? (
            <div className="p-5">
              {filteredProfiles.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProfiles.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      selected={selectedProfile.id === profile.id}
                      onSelect={() => selectProfile(profile.id, true)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-[#ff2fa8]/45 bg-white/70 p-10 text-center">
                  <p className="text-lg font-black">No profiles match that filter yet.</p>
                  <p className="mt-2 text-sm font-semibold text-gray-500">Try clearing the search or switching back to All.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] uppercase tracking-[0.16em] text-gray-500">
                    <th className="px-5 py-4 font-black">Rank</th>
                    <th className="px-5 py-4 font-black">Player</th>
                    <th className="px-5 py-4 font-black">Country</th>
                    <th className="px-5 py-4 font-black">Game</th>
                    <th className="px-5 py-4 font-black">Role</th>
                    <th className="px-5 py-4 font-black">Identity</th>
                    <th className="px-5 py-4 font-black">Score</th>
                    <th className="px-5 py-4 font-black">Trend</th>
                    <th className="px-5 py-4 font-black">Main Strength</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-gray-200/80 transition-colors hover:bg-[#19d3cf]/5">
                      <td className="px-5 py-4 text-lg font-black text-[#ff2fa8]">#{profile.rank}</td>
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => selectProfile(profile.id, true)} className="flex items-center gap-3 text-left">
                          <PlayerAvatar profile={profile} size="sm" />
                          <span className="font-black">“{profile.handle}”</span>
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                          <CountryFlag countryCode={profile.countryCode} country={profile.country} />
                          {profile.country}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-black">{profile.game}</td>
                      <td className="px-5 py-4 text-sm font-black">{profile.role}</td>
                      <td className="px-5 py-4 text-sm font-black text-gray-700">{profile.identity}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#19d3cf]/12 px-3 py-1 text-sm font-black text-[#19d3cf]">{profile.score}</span>
                      </td>
                      <td className={`px-5 py-4 text-sm font-black ${trendClass(profile.trend)}`}>{trendLabel(profile.trend)}</td>
                      <td className="px-5 py-4 text-sm font-black text-gray-700">{profile.strengths[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
