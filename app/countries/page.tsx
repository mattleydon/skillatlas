"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Region =
  | "World"
  | "Europe"
  | "Asia"
  | "North America"
  | "South America"
  | "Oceania"
  | "Africa"
  | "Middle East";

type CountryRegion = Exclude<Region, "World">;

type Category =
  | "All"
  | "Top Ranked"
  | "Biggest Movers"
  | "FPS Nations"
  | "MOBA Nations"
  | "Strategy Nations"
  | "Emerging Nations"
  | "Underdogs";

type Genre = "FPS" | "MOBA" | "Strategy" | "Battle Royale" | "Sports" | "Fighting" | "Hybrid";

type CountryProfile = {
  id: string;
  name: string;
  flag: string;
  region: CountryRegion;
  rank: number;
  bestGame: string;
  dominanceScore: number;
  trend: number;
  primaryGenre: Genre;
  identity: string;
  aura: string;
  strengths: string[];
  weakness: string;
  description: string;
  oneYearScore: number[];
};

const regions: Region[] = [
  "World",
  "Europe",
  "Asia",
  "North America",
  "South America",
  "Oceania",
  "Africa",
  "Middle East",
];

const categories: Category[] = [
  "All",
  "Top Ranked",
  "Biggest Movers",
  "FPS Nations",
  "MOBA Nations",
  "Strategy Nations",
  "Emerging Nations",
  "Underdogs",
];

const countries: CountryProfile[] = [
  {
    id: "denmark",
    name: "Denmark",
    flag: "🇩🇰",
    region: "Europe",
    rank: 1,
    bestGame: "CS2",
    dominanceScore: 98,
    trend: 2,
    primaryGenre: "FPS",
    identity: "Tactical Powerhouse",
    aura: "The Tactician",
    strengths: ["Team cohesion", "Elite CS systems", "In-game leadership"],
    weakness: "Smaller player base",
    description: "A small country with an absurd record of producing elite Counter-Strike talent and disciplined team structures.",
    oneYearScore: [82, 84, 86, 87, 90, 92, 94, 98],
  },
  {
    id: "south-korea",
    name: "South Korea",
    flag: "🇰🇷",
    region: "Asia",
    rank: 2,
    bestGame: "League of Legends",
    dominanceScore: 97,
    trend: 1,
    primaryGenre: "MOBA",
    identity: "Esports Machine",
    aura: "The Machine",
    strengths: ["Academy systems", "Practice discipline", "Elite coaching"],
    weakness: "Pressure-heavy culture",
    description: "The gold-standard esports ecosystem: deep infrastructure, fierce practice culture, and legendary MOBA dominance.",
    oneYearScore: [91, 92, 92, 94, 95, 96, 97, 97],
  },
  {
    id: "china",
    name: "China",
    flag: "🇨🇳",
    region: "Asia",
    rank: 3,
    bestGame: "League of Legends",
    dominanceScore: 95,
    trend: -1,
    primaryGenre: "MOBA",
    identity: "Scale Giant",
    aura: "The Giant",
    strengths: ["Huge player base", "Major investment", "Mechanical ceiling"],
    weakness: "International volatility",
    description: "A vast competitive ecosystem with huge investment, massive player pools, and terrifying peaks across multiple genres.",
    oneYearScore: [90, 91, 93, 94, 95, 94, 95, 95],
  },
  {
    id: "usa",
    name: "USA",
    flag: "🇺🇸",
    region: "North America",
    rank: 4,
    bestGame: "Fortnite",
    dominanceScore: 94,
    trend: 3,
    primaryGenre: "Battle Royale",
    identity: "Talent Pool",
    aura: "The Factory",
    strengths: ["Creator ecosystem", "Massive market", "Genre diversity"],
    weakness: "Fragmented pipelines",
    description: "A giant talent market with strong streaming culture, major orgs, and wide strength across shooters, battle royale, and sports titles.",
    oneYearScore: [83, 84, 86, 88, 89, 92, 93, 94],
  },
  {
    id: "brazil",
    name: "Brazil",
    flag: "🇧🇷",
    region: "South America",
    rank: 5,
    bestGame: "CS2",
    dominanceScore: 93,
    trend: 4,
    primaryGenre: "FPS",
    identity: "Raw Talent Nation",
    aura: "The Firestorm",
    strengths: ["FPS passion", "Aggressive style", "Loud fan culture"],
    weakness: "Economic barriers",
    description: "A high-emotion, high-mechanics region with explosive FPS identity and one of the loudest competitive fanbases in gaming.",
    oneYearScore: [79, 81, 84, 84, 88, 90, 91, 93],
  },
  {
    id: "france",
    name: "France",
    flag: "🇫🇷",
    region: "Europe",
    rank: 6,
    bestGame: "Rocket League",
    dominanceScore: 92,
    trend: 2,
    primaryGenre: "Hybrid",
    identity: "Hybrid Power",
    aura: "The Technician",
    strengths: ["Rocket League depth", "FPS stars", "Strong org scene"],
    weakness: "Uneven genre spread",
    description: "A versatile esports nation with technical brilliance, strong clubs, and elite performance across Rocket League and FPS titles.",
    oneYearScore: [82, 83, 85, 87, 88, 90, 91, 92],
  },
  {
    id: "sweden",
    name: "Sweden",
    flag: "🇸🇪",
    region: "Europe",
    rank: 7,
    bestGame: "CS2",
    dominanceScore: 91,
    trend: -2,
    primaryGenre: "FPS",
    identity: "Legacy Nation",
    aura: "The Elder",
    strengths: ["FPS heritage", "LAN history", "Mechanical tradition"],
    weakness: "Modern depth rebuild",
    description: "A historic FPS force with deep Counter-Strike roots and a legacy that still shapes the competitive imagination.",
    oneYearScore: [94, 93, 92, 92, 91, 91, 90, 91],
  },
  {
    id: "germany",
    name: "Germany",
    flag: "🇩🇪",
    region: "Europe",
    rank: 8,
    bestGame: "FIFA / EA FC",
    dominanceScore: 90,
    trend: 1,
    primaryGenre: "Sports",
    identity: "Structured Contender",
    aura: "The Engineer",
    strengths: ["Organisation", "Sports titles", "Stable scene"],
    weakness: "Less explosive star output",
    description: "A structured nation with strong sports-game culture, steady infrastructure, and quietly consistent esports foundations.",
    oneYearScore: [84, 84, 85, 86, 88, 89, 89, 90],
  },
  {
    id: "japan",
    name: "Japan",
    flag: "🇯🇵",
    region: "Asia",
    rank: 9,
    bestGame: "Street Fighter",
    dominanceScore: 89,
    trend: 3,
    primaryGenre: "Fighting",
    identity: "Arcade Master",
    aura: "The Duelist",
    strengths: ["Fighting games", "Arcade culture", "Technical mastery"],
    weakness: "Team esport depth",
    description: "A fighting-game empire built on precision, patience, arcade lineage, and terrifying one-on-one mastery.",
    oneYearScore: [80, 82, 83, 85, 87, 88, 89, 89],
  },
  {
    id: "united-kingdom",
    name: "United Kingdom",
    flag: "🇬🇧",
    region: "Europe",
    rank: 10,
    bestGame: "Rocket League",
    dominanceScore: 88,
    trend: 2,
    primaryGenre: "Hybrid",
    identity: "Balanced Challenger",
    aura: "The Adapter",
    strengths: ["Caster culture", "Rocket League", "FPS support"],
    weakness: "Needs deeper top-end density",
    description: "A broad competitive scene with strong personalities, adaptable players, and growing presence across multiple esports.",
    oneYearScore: [79, 81, 82, 84, 85, 87, 88, 88],
  },
  {
    id: "canada",
    name: "Canada",
    flag: "🇨🇦",
    region: "North America",
    rank: 11,
    bestGame: "Valorant",
    dominanceScore: 87,
    trend: 4,
    primaryGenre: "FPS",
    identity: "Quiet Sharpshooter",
    aura: "The Iceblade",
    strengths: ["FPS talent", "NA infrastructure", "Composure"],
    weakness: "Smaller domestic market",
    description: "A calmer North American force with sharp FPS talent and strong integration into the wider NA competitive scene.",
    oneYearScore: [74, 76, 79, 80, 82, 85, 86, 87],
  },
  {
    id: "australia",
    name: "Australia",
    flag: "🇦🇺",
    region: "Oceania",
    rank: 12,
    bestGame: "CS2",
    dominanceScore: 86,
    trend: 3,
    primaryGenre: "FPS",
    identity: "Distance Fighter",
    aura: "The Outpost",
    strengths: ["Resilience", "FPS grit", "Regional pride"],
    weakness: "Ping and travel distance",
    description: "A region that fights the map itself: distance, ping, and isolation, yet still produces stubborn competitive talent.",
    oneYearScore: [72, 73, 75, 78, 81, 83, 85, 86],
  },
  {
    id: "netherlands",
    name: "Netherlands",
    flag: "🇳🇱",
    region: "Europe",
    rank: 13,
    bestGame: "Rocket League",
    dominanceScore: 85,
    trend: 5,
    primaryGenre: "Hybrid",
    identity: "Precision Cluster",
    aura: "The Clockwork",
    strengths: ["Small-country efficiency", "Rocket League", "Tactical brains"],
    weakness: "Limited player pool",
    description: "A compact nation that punches above its weight through disciplined systems, technical players, and efficient development.",
    oneYearScore: [68, 72, 75, 78, 81, 83, 84, 85],
  },
  {
    id: "india",
    name: "India",
    flag: "🇮🇳",
    region: "Asia",
    rank: 14,
    bestGame: "Mobile Esports",
    dominanceScore: 84,
    trend: 8,
    primaryGenre: "Hybrid",
    identity: "Emerging Giant",
    aura: "The Rising Tide",
    strengths: ["Huge audience", "Mobile-first scale", "Rapid growth"],
    weakness: "Top-tier international conversion",
    description: "An enormous emerging ecosystem with mobile-first momentum, massive audience growth, and huge long-term upside.",
    oneYearScore: [62, 66, 70, 74, 78, 81, 83, 84],
  },
  {
    id: "turkey",
    name: "Turkey",
    flag: "🇹🇷",
    region: "Middle East",
    rank: 15,
    bestGame: "Valorant",
    dominanceScore: 83,
    trend: 5,
    primaryGenre: "FPS",
    identity: "Aim Furnace",
    aura: "The Furnace",
    strengths: ["Raw aim", "Valorant culture", "Passionate fans"],
    weakness: "Consistency at global events",
    description: "A fiery FPS region with cracked aimers, intense fans, and rising Valorant credibility.",
    oneYearScore: [70, 72, 74, 76, 79, 81, 82, 83],
  },
  {
    id: "finland",
    name: "Finland",
    flag: "🇫🇮",
    region: "Europe",
    rank: 16,
    bestGame: "CS2",
    dominanceScore: 82,
    trend: -1,
    primaryGenre: "FPS",
    identity: "Ice Mechanics",
    aura: "The Sniper",
    strengths: ["Aim culture", "Composure", "FPS legacy"],
    weakness: "Team depth",
    description: "A cool-headed FPS nation known for aim, calm execution, and icy individual mechanics.",
    oneYearScore: [84, 83, 82, 81, 81, 82, 82, 82],
  },
  {
    id: "poland",
    name: "Poland",
    flag: "🇵🇱",
    region: "Europe",
    rank: 17,
    bestGame: "CS2",
    dominanceScore: 81,
    trend: 2,
    primaryGenre: "FPS",
    identity: "Legacy Grinder",
    aura: "The Grinder",
    strengths: ["CS history", "Tough practice culture", "Local scene"],
    weakness: "New superstar pipeline",
    description: "A proud FPS nation with historic Counter-Strike weight and a grinding competitive identity.",
    oneYearScore: [76, 77, 78, 78, 79, 80, 81, 81],
  },
  {
    id: "spain",
    name: "Spain",
    flag: "🇪🇸",
    region: "Europe",
    rank: 18,
    bestGame: "Valorant",
    dominanceScore: 80,
    trend: 4,
    primaryGenre: "FPS",
    identity: "Momentum Nation",
    aura: "The Spark",
    strengths: ["Spanish-language audience", "Valorant growth", "Energetic style"],
    weakness: "Sustained top finishes",
    description: "A fast-growing scene with huge language-market reach, strong personalities, and momentum in tactical shooters.",
    oneYearScore: [70, 72, 74, 76, 78, 79, 80, 80],
  },
  {
    id: "south-africa",
    name: "South Africa",
    flag: "🇿🇦",
    region: "Africa",
    rank: 19,
    bestGame: "CS2",
    dominanceScore: 78,
    trend: 6,
    primaryGenre: "FPS",
    identity: "Regional Vanguard",
    aura: "The Vanguard",
    strengths: ["Regional leadership", "FPS resilience", "Community drive"],
    weakness: "International access",
    description: "One of Africa’s strongest esports anchors, fighting infrastructure gaps with resilience and regional leadership.",
    oneYearScore: [61, 64, 67, 70, 73, 75, 77, 78],
  },
  {
    id: "mexico",
    name: "Mexico",
    flag: "🇲🇽",
    region: "North America",
    rank: 20,
    bestGame: "Fighting Games",
    dominanceScore: 77,
    trend: 4,
    primaryGenre: "Fighting",
    identity: "Crowd Energy",
    aura: "The Roar",
    strengths: ["Fan intensity", "Fighting games", "Regional growth"],
    weakness: "Global infrastructure",
    description: "A passionate and rising gaming nation with strong fighting-game energy and a growing competitive footprint.",
    oneYearScore: [66, 67, 70, 72, 74, 76, 77, 77],
  },
  {
    id: "saudi-arabia",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    region: "Middle East",
    rank: 21,
    bestGame: "Rocket League",
    dominanceScore: 76,
    trend: 7,
    primaryGenre: "Hybrid",
    identity: "Investment Surge",
    aura: "The Meteor",
    strengths: ["Investment", "Rocket League", "Rapid event growth"],
    weakness: "Broad grassroots depth",
    description: "A fast-rising esports market with major investment, bold events, and rapidly increasing competitive ambition.",
    oneYearScore: [58, 62, 66, 70, 72, 74, 75, 76],
  },
  {
    id: "argentina",
    name: "Argentina",
    flag: "🇦🇷",
    region: "South America",
    rank: 22,
    bestGame: "FIFA / EA FC",
    dominanceScore: 75,
    trend: 2,
    primaryGenre: "Sports",
    identity: "Football Mindset",
    aura: "The Playmaker",
    strengths: ["Sports titles", "Competitive passion", "Tactical intuition"],
    weakness: "Economic instability",
    description: "A passionate scene with sports-title intelligence, strong gamer culture, and competitive fire.",
    oneYearScore: [69, 70, 71, 72, 73, 74, 75, 75],
  },
  {
    id: "new-zealand",
    name: "New Zealand",
    flag: "🇳🇿",
    region: "Oceania",
    rank: 23,
    bestGame: "Rocket League",
    dominanceScore: 73,
    trend: 1,
    primaryGenre: "Hybrid",
    identity: "Island Underdog",
    aura: "The Skiff",
    strengths: ["Adaptability", "Oceania synergy", "Creative players"],
    weakness: "Small population",
    description: "A smaller but adaptable competitive outpost with creative players and shared Oceania momentum.",
    oneYearScore: [68, 68, 69, 70, 71, 72, 73, 73],
  },
  {
    id: "nigeria",
    name: "Nigeria",
    flag: "🇳🇬",
    region: "Africa",
    rank: 24,
    bestGame: "Mobile Esports",
    dominanceScore: 72,
    trend: 9,
    primaryGenre: "Hybrid",
    identity: "Future Market",
    aura: "The Sparkline",
    strengths: ["Young population", "Mobile growth", "Cultural energy"],
    weakness: "Tournament infrastructure",
    description: "A future-facing market with youth, mobile access, and enormous upside once infrastructure catches up.",
    oneYearScore: [52, 56, 60, 64, 67, 70, 71, 72],
  },
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

function categoryMatch(country: CountryProfile, category: Category) {
  if (category === "All") return true;
  if (category === "Top Ranked") return country.rank <= 8;
  if (category === "Biggest Movers") return country.trend >= 4;
  if (category === "FPS Nations") return country.primaryGenre === "FPS";
  if (category === "MOBA Nations") return country.primaryGenre === "MOBA";
  if (category === "Strategy Nations") return country.primaryGenre === "Strategy" || country.bestGame === "Chess";
  if (category === "Emerging Nations") return country.trend >= 5 || country.identity.includes("Emerging");
  if (category === "Underdogs") return country.rank >= 12;
  return true;
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

function CountriesBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(25,211,207,0.18),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,47,168,0.14),transparent_30%),linear-gradient(180deg,#F8FAFC_0%,#EEF7FA_100%)]" />
      <div className="absolute left-[-8%] top-32 h-[520px] w-[520px] rounded-full border border-[#19d3cf]/20" />
      <div className="absolute right-[-10%] top-64 h-[640px] w-[640px] rounded-full border border-[#ff2fa8]/20" />
      <div className="absolute inset-x-0 top-[250px] h-px bg-[#ff2fa8]/25" />
      <div className="absolute left-1/2 top-[180px] h-[700px] w-[700px] -translate-x-1/2 rounded-full border border-slate-300/40" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(15,23,42,0.32)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.32)_1px,transparent_1px)] [background-size:96px_96px]" />
    </div>
  );
}

const countryFlagCodes: Record<string, string> = {
  denmark: "dk",
  "south-korea": "kr",
  china: "cn",
  usa: "us",
  brazil: "br",
  france: "fr",
  sweden: "se",
  germany: "de",
  japan: "jp",
  "united-kingdom": "gb",
  canada: "ca",
  australia: "au",
  netherlands: "nl",
  india: "in",
  turkey: "tr",
  finland: "fi",
  poland: "pl",
  spain: "es",
  "south-africa": "za",
  mexico: "mx",
  "saudi-arabia": "sa",
  argentina: "ar",
  "new-zealand": "nz",
  nigeria: "ng",
};

function CountryFlag({ country, size = "md" }: { country: CountryProfile; size?: "sm" | "md" | "lg" | "xl" }) {
  const flagCode = countryFlagCodes[country.id];
  const sizeClass =
    size === "xl"
      ? "h-16 w-16 rounded-3xl"
      : size === "lg"
        ? "h-14 w-14 rounded-3xl"
        : size === "sm"
          ? "h-8 w-8 rounded-xl"
          : "h-12 w-12 rounded-2xl";

  return (
    <span className={`grid ${sizeClass} shrink-0 place-items-center overflow-hidden bg-gray-50 shadow-inner`}>
      {flagCode ? (
        <img
          src={`https://flagcdn.com/w160/${flagCode}.png`}
          alt={`${country.name} flag`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-xl">{country.flag}</span>
      )}
    </span>
  );
}

function CountryCard({ country, selected, onSelect }: { country: CountryProfile; selected: boolean; onSelect: () => void }) {
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
          <CountryFlag country={country} />
          <div className="min-w-0">
            <p className="truncate text-lg font-black">{country.name}</p>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#19d3cf]">{country.identity}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#ff2fa8]/10 px-3 py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Rank</p>
          <p className="text-xl font-black text-[#ff2fa8]">#{country.rank}</p>
        </div>
      </div>

      <p className="mb-4 line-clamp-3 text-sm font-semibold leading-relaxed text-gray-600">{country.description}</p>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-200/80 bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Best Game</p>
          <p className="mt-1 truncate text-sm font-black text-[#111827]">{country.bestGame}</p>
        </div>
        <div className="rounded-2xl border border-gray-200/80 bg-white/70 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Score</p>
          <p className="mt-1 text-sm font-black text-[#19d3cf]">{country.dominanceScore}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {country.strengths.slice(0, 3).map((strength) => (
          <span key={strength} className="rounded-full border border-[#19d3cf]/25 bg-[#19d3cf]/8 px-3 py-1 text-[11px] font-black text-gray-700">
            {strength}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function CountriesPage() {
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<Region>("World");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [selectedCountryId, setSelectedCountryId] = useState(countries[0].id);
  const [featuredCountryId, setFeaturedCountryId] = useState(countries[0].id);
  const [featuredLocked, setFeaturedLocked] = useState(false);
  const [featuredTransitionPhase, setFeaturedTransitionPhase] = useState<"idle" | "out" | "in">("idle");
  const [atlasView, setAtlasView] = useState<"cards" | "rankings">("cards");
  const countryIdentityRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filteredCountries = useMemo(() => {
    const normalisedSearch = search.trim().toLowerCase();

    return countries
      .filter((country) => (selectedRegion === "World" ? true : country.region === selectedRegion))
      .filter((country) => categoryMatch(country, selectedCategory))
      .filter((country) => {
        if (!normalisedSearch) return true;

        return [
          country.name,
          country.region,
          country.bestGame,
          country.identity,
          country.aura,
          country.primaryGenre,
          country.description,
          ...country.strengths,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalisedSearch);
      })
      .sort((a, b) => a.rank - b.rank);
  }, [search, selectedCategory, selectedRegion]);

  const featuredPool = useMemo(
    () =>
      countries.filter((country) =>
        ["denmark", "south-korea", "china", "usa", "brazil", "france", "sweden", "japan"].includes(country.id)
      ),
    []
  );

  useEffect(() => {
    if (filteredCountries[0]) {
      setSelectedCountryId(filteredCountries[0].id);
    }
  }, [selectedCategory, selectedRegion, search, filteredCountries]);

  useEffect(() => {
    if (featuredLocked || featuredPool.length <= 1) return;

    let swapTimer: number | undefined;
    let settleTimer: number | undefined;

    const showTimer = window.setTimeout(() => {
      setFeaturedTransitionPhase("out");

      swapTimer = window.setTimeout(() => {
        setFeaturedCountryId((currentId) => {
          const currentIndex = featuredPool.findIndex((country) => country.id === currentId);
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
  }, [featuredCountryId, featuredLocked, featuredPool]);

  const featuredCountry = countries.find((country) => country.id === featuredCountryId) ?? featuredPool[0] ?? countries[0];
  const selectedCountry = countries.find((country) => country.id === selectedCountryId) ?? featuredCountry;

  function selectCountry(countryId: string, scrollToIdentity = false) {
    setSelectedCountryId(countryId);
    setFeaturedLocked(false);
    setFeaturedTransitionPhase("idle");

    if (scrollToIdentity) {
      window.setTimeout(() => {
        countryIdentityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  function lockFeaturedCountry() {
    setFeaturedLocked(true);
    setFeaturedTransitionPhase("idle");
    setSelectedCountryId(featuredCountry.id);

    window.setTimeout(() => {
      countryIdentityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }
  const topMover = filteredCountries.reduce((best, country) => (country.trend > best.trend ? country : best), filteredCountries[0] ?? countries[0]);
  const averageScore = Math.round(filteredCountries.reduce((sum, country) => sum + country.dominanceScore, 0) / Math.max(filteredCountries.length, 1));

  return (
    <main className="countries-shell relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#111827] transition-colors duration-300">
      <CountriesBackground />

      <style>{`
        .countries-shell [class*="line-clamp-3"] {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes skillatlas-featured-out {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0);
          }

          100% {
            opacity: 0;
            transform: translateX(26px) scale(0.965);
            filter: blur(3px);
          }
        }

        @keyframes skillatlas-featured-in {
          0% {
            opacity: 0;
            transform: translateX(-32px) scale(0.965);
            filter: blur(3px);
          }

          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
            filter: blur(0);
          }
        }

        .skillatlas-featured-card-out {
          animation: skillatlas-featured-out 1500ms cubic-bezier(0.65, 0, 0.35, 1) both;
        }

        .skillatlas-featured-card-in {
          animation: skillatlas-featured-in 1500ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        html.skillatlas-dark .countries-shell [class*="bg-white"] {
          background-color: rgba(53, 66, 80, 0.92) !important;
        }

        html.skillatlas-dark .countries-shell [class*="bg-gray-50"] {
          background-color: rgba(32, 43, 55, 0.92) !important;
        }

        html.skillatlas-dark .countries-shell [class*="text-gray-"] {
          color: rgb(203, 213, 225) !important;
        }

        html.skillatlas-dark .countries-shell [class*="text-[#111827]"] {
          color: rgb(248, 250, 252) !important;
        }

        html.skillatlas-dark .countries-shell input {
          background-color: rgba(32, 43, 55, 0.96) !important;
          color: rgb(248, 250, 252) !important;
        }

        html.skillatlas-dark .countries-shell {
          background: #2f3a46;
          color: rgb(248, 250, 252);
        }

        html.skillatlas-dark .countries-shell > div:first-child {
          opacity: 0.58;
          filter: brightness(0.72) saturate(1.25);
        }
      `}</style>

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
            {["Rankings", "World Map", "Countries", "Profiles", "User Rankings", "About"].map((item) => (
              <a
                key={item}
                className={`font-semibold transition-all duration-300 ${
                  item === "Countries" ? "text-[#19d3cf]" : "text-gray-700 hover:text-[#19d3cf]"
                } ${scrolled ? "text-sm" : "text-[1rem]"}`}
                href={item === "Rankings" ? "/" : `/${item.toLowerCase().replace(" ", "-")}`}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-8 pb-16 pt-[150px]">
        <div className="mb-6 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#19d3cf]">Countries</p>
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="mb-2 text-xl font-black tracking-tight">Explore the gaming profile of every nation.</h1>
              <p className="max-w-4xl text-sm font-semibold leading-relaxed text-gray-600">
                Browse each country’s competitive identity, strongest games, current trend, and the traits that make its players different.
              </p>
            </div>

            <label className="relative block">
              <span className="sr-only">Search countries</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search country, game, identity..."
                className="h-14 w-full rounded-2xl border border-[#19d3cf]/35 bg-white/90 px-5 pr-12 text-sm font-bold outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[#19d3cf] focus:shadow-[0_0_0_4px_rgba(25,211,207,0.14)]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-[#ff2fa8]">⌕</span>
            </label>
          </div>
        </div>

        <div className="mb-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="flex min-h-[210px] flex-col rounded-3xl border border-[#ff2fa8]/40 bg-white/88 px-4 py-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-start gap-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-gray-500">Region Filters</p>
            </div>

            <div className="flex flex-1 flex-col justify-center">
              <div className="flex flex-wrap justify-start gap-2">
                {regions.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setSelectedRegion(region)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-black transition-all duration-300 ${
                      selectedRegion === region
                        ? "border-[#19d3cf] bg-[#19d3cf] text-white shadow-lg shadow-[#19d3cf]/20"
                        : "border-gray-200 bg-white/70 text-gray-700 hover:border-[#19d3cf]/60 hover:text-[#19d3cf]"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap justify-start gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full border px-3 py-1 text-xs font-black transition-all duration-300 ${
                      selectedCategory === category
                        ? "border-[#ff2fa8] bg-[#ff2fa8] text-white shadow-lg shadow-[#ff2fa8]/20"
                        : "border-gray-200 bg-white/70 text-gray-700 hover:border-[#ff2fa8]/60 hover:text-[#ff2fa8]"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/88 p-3 shadow-sm backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Average Score</p>
              <p className="text-xl font-black text-[#19d3cf]">{averageScore}</p>
            </div>
            <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/88 p-3 shadow-sm backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Top Mover</p>
              <p className="truncate text-base font-black">{topMover?.name}</p>
              <p className={`text-xs font-black ${trendClass(topMover?.trend ?? 0)}`}>{trendLabel(topMover?.trend ?? 0)}</p>
            </div>
            <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/88 p-3 shadow-sm backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Current Lens</p>
              <p className="truncate text-sm font-black text-[#ff2fa8]">{selectedCategory}</p>
            </div>
          </div>
        </div>

        <section className="mb-6 grid items-start gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <button
            type="button"
            onClick={lockFeaturedCountry}
            className="relative self-start overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 text-left shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[#19d3cf]/70 hover:shadow-lg"
          >
            <div className={`relative flex h-full flex-col justify-start ${
              featuredTransitionPhase === "out"
                ? "skillatlas-featured-card-out"
                : featuredTransitionPhase === "in"
                  ? "skillatlas-featured-card-in"
                  : ""
            }`}>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Featured Nation</p>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <CountryFlag country={featuredCountry} size="xl" />
                  <div>
                    <h2 className="text-3xl font-black">{featuredCountry.name}</h2>
                    <p className="font-black text-[#ff2fa8]">{featuredCountry.aura}</p>
                  </div>
                </div>

                <div className="rounded-3xl bg-[#19d3cf]/12 px-4 py-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Score</p>
                  <p className="text-3xl font-black text-[#19d3cf]">{featuredCountry.dominanceScore}</p>
                </div>
              </div>

              <p className="mb-5 text-sm font-semibold leading-relaxed text-gray-600">{featuredCountry.description}</p>

              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Best Game</p>
                  <p className="mt-1 text-sm font-black">{featuredCountry.bestGame}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Identity</p>
                  <p className="mt-1 text-sm font-black">{featuredCountry.identity}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Trend</p>
                  <p className={`mt-1 text-sm font-black ${trendClass(featuredCountry.trend)}`}>{trendLabel(featuredCountry.trend)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {featuredCountry.strengths.map((strength) => (
                  <span key={strength} className="rounded-full border border-[#19d3cf]/25 bg-[#19d3cf]/10 px-3 py-1 text-xs font-black text-gray-700">
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          </button>

          <section ref={countryIdentityRef} className="scroll-mt-28 rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-6 shadow-sm backdrop-blur">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#ff2fa8]">Country Identity</p>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">{selectedCountry.name}</h2>
                <p className="font-black text-[#19d3cf]">{selectedCountry.identity}</p>
              </div>
              <CountryFlag country={selectedCountry} size="xl" />
            </div>

            <p className="mb-5 text-sm font-semibold leading-relaxed text-gray-600">{selectedCountry.description}</p>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Atlas Rank</p>
                <p className="mt-1 text-lg font-black text-[#ff2fa8]">#{selectedCountry.rank}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Best Game</p>
                <p className="mt-1 text-sm font-black">{selectedCountry.bestGame}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Dominance Score</p>
                <p className="mt-1 text-lg font-black text-[#19d3cf]">{selectedCountry.dominanceScore}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Trend</p>
                <p className={`mt-1 text-sm font-black ${trendClass(selectedCountry.trend)}`}>{trendLabel(selectedCountry.trend)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Region</p>
                <p className="mt-1 text-sm font-black">{selectedCountry.region}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Aura</p>
                <p className="mt-1 text-sm font-black text-[#ff2fa8]">{selectedCountry.aura}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Why they win</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCountry.strengths.map((strength) => (
                    <span key={strength} className="rounded-full bg-[#19d3cf]/10 px-3 py-1 text-xs font-black text-gray-700">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Room for improvement</p>
                <p className="text-sm font-black text-[#ff2fa8]">{selectedCountry.weakness}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">One Year Score</p>
                <Sparkline values={selectedCountry.oneYearScore} />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">Primary Lane</p>
                <p className="text-sm font-black">{selectedCountry.primaryGenre}</p>
              </div>
            </div>
          </section>
        </section>

        <section className="mb-6 overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white/92 shadow-sm backdrop-blur">
          <div className="border-b border-[#ff2fa8]/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#19d3cf]">Country Atlas</p>

              <div className="flex rounded-full border border-gray-200 bg-white/70 p-1">
                <button
                  type="button"
                  onClick={() => setAtlasView("cards")}
                  className={`rounded-full px-5 py-2 text-xs font-black transition-all duration-300 ${
                    atlasView === "cards" ? "bg-[#19d3cf] text-white shadow-lg shadow-[#19d3cf]/20" : "text-gray-600 hover:text-[#19d3cf]"
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setAtlasView("rankings")}
                  className={`rounded-full px-5 py-2 text-xs font-black transition-all duration-300 ${
                    atlasView === "rankings" ? "bg-[#ff2fa8] text-white shadow-lg shadow-[#ff2fa8]/20" : "text-gray-600 hover:text-[#ff2fa8]"
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {atlasView === "cards" ? (
            <div className="p-5">
              {filteredCountries.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCountries.map((country) => (
                    <CountryCard
                      key={country.id}
                      country={country}
                      selected={selectedCountry.id === country.id}
                      onSelect={() => selectCountry(country.id, true)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-[#ff2fa8]/45 bg-white/70 p-10 text-center">
                  <p className="text-lg font-black">No countries match that filter yet.</p>
                  <p className="mt-2 text-sm font-semibold text-gray-500">Try clearing the search or switching back to World / All.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] uppercase tracking-[0.16em] text-gray-500">
                    <th className="px-5 py-4 font-black">Rank</th>
                    <th className="px-5 py-4 font-black">Country</th>
                    <th className="px-5 py-4 font-black">Region</th>
                    <th className="px-5 py-4 font-black">Best Game</th>
                    <th className="px-5 py-4 font-black">Score</th>
                    <th className="px-5 py-4 font-black">Trend</th>
                    <th className="px-5 py-4 font-black">Identity</th>
                    <th className="px-5 py-4 font-black">1Y Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCountries.slice(0, 16).map((country) => (
                    <tr key={country.id} className="border-b border-gray-200/80 transition-colors hover:bg-[#19d3cf]/5">
                      <td className="px-5 py-4 text-lg font-black text-[#ff2fa8]">#{country.rank}</td>
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => selectCountry(country.id, true)} className="flex items-center gap-3 text-left">
                          <CountryFlag country={country} size="sm" />
                          <span className="font-black">{country.name}</span>
                        </button>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-600">{country.region}</td>
                      <td className="px-5 py-4 text-sm font-black">{country.bestGame}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#19d3cf]/12 px-3 py-1 text-sm font-black text-[#19d3cf]">{country.dominanceScore}</span>
                      </td>
                      <td className={`px-5 py-4 text-sm font-black ${trendClass(country.trend)}`}>{trendLabel(country.trend)}</td>
                      <td className="px-5 py-4 text-sm font-black text-gray-700">{country.identity}</td>
                      <td className="px-5 py-4">
                        <Sparkline values={country.oneYearScore} />
                      </td>
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
