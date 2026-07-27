"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

/* ================= TYPES ================= */

type CategoryId =
  | "all"
  | "general"
  | "rankings"
  | "countries"
  | "players"
  | "suggestions";

type ForumPost = {
  id: number;
  title: string;
  category: Exclude<CategoryId, "all">;
  author: string;
  country: string;
  replies: number;
  votes: number;
  views: string;
  status: "Hot" | "New" | "Answered" | "Debate" | "Suggestion";
  preview: string;
  tags: string[];
  lastActive: string;
};

/* ================= DATA ================= */

const categories = [
  { id: "all", label: "All" },
  { id: "general", label: "General" },
  { id: "rankings", label: "Rankings" },
  { id: "countries", label: "Countries" },
  { id: "players", label: "Players" },
  { id: "suggestions", label: "Suggestions" },
] as const;

const posts: ForumPost[] = [
  {
    id: 1,
    title: "Is Denmark still the best CS country of all time?",
    category: "rankings",
    author: "AtlasCore",
    country: "Denmark",
    replies: 42,
    votes: 301,
    views: "3.4k",
    status: "Hot",
    preview:
      "Denmark dominated for years, but Brazil and Sweden have arguments depending on how you weight eras.",
    tags: ["CS2", "Debate"],
    lastActive: "2 min ago",
  },
  {
    id: 2,
    title: "What actually makes South Korea dominant?",
    category: "countries",
    author: "MacroMind",
    country: "South Korea",
    replies: 28,
    votes: 210,
    views: "2.1k",
    status: "Debate",
    preview:
      "Infrastructure? Culture? Coaching? PC bang ecosystem? Or all of it combined?",
    tags: ["MOBA", "Infrastructure"],
    lastActive: "8 min ago",
  },
  {
    id: 3,
    title: "Add rivalry system between countries",
    category: "suggestions",
    author: "GameTheory",
    country: "Brazil",
    replies: 17,
    votes: 120,
    views: "1.2k",
    status: "Suggestion",
    preview:
      "Brazil vs Argentina, USA vs Canada — rivalry pages would bring emotion into rankings.",
    tags: ["Feature"],
    lastActive: "22 min ago",
  },
  {
    id: 4,
    title: "Player identity idea: The Silent Closer",
    category: "players",
    author: "FinalRound",
    country: "Canada",
    replies: 9,
    votes: 66,
    views: "540",
    status: "New",
    preview:
      "Not flashy, but wins the rounds that actually matter.",
    tags: ["Profiles"],
    lastActive: "40 min ago",
  },
];

/* ================= HELPERS ================= */

function statusStyle(status: ForumPost["status"]) {
  if (status === "Hot") return "text-[#ff2fa8]";
  if (status === "Suggestion") return "text-[#19d3cf]";
  if (status === "Answered") return "text-emerald-500";
  if (status === "Debate") return "text-purple-500";
  return "text-gray-500";
}

/* ================= HEADER ================= */

function Header({ scrolled }: { scrolled: boolean }) {
  const nav = [
    ["Rankings", "/"],
    ["World Map", "/world-map"],
    ["Countries", "/countries"],
    ["Players", "/profiles"],
    ["Forum", "/forum"],
    ["About", "/about"],
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-pink-200 transition-all ${
        scrolled ? "h-[70px]" : "h-[120px]"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center h-full px-8">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14">
            <Image src="/skillatlas-logo.png" alt="logo" fill />
          </div>
          <div className="relative h-8 w-40">
            <Image src="/skillatlas-title.png" alt="title" fill />
          </div>
        </div>

        <nav className="flex-1 flex justify-around ml-10">
          {nav.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className={`font-semibold ${
                label === "Forum"
                  ? "text-[#19d3cf]"
                  : "text-gray-700 hover:text-[#19d3cf]"
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* ================= PAGE ================= */

export default function ForumPage() {
  const [scrolled, setScrolled] = useState(false);
  const [category, setCategory] = useState<CategoryId>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchCategory = category === "all" || p.category === category;
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.preview.toLowerCase().includes(search.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [category, search]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Header scrolled={scrolled} />

      <div className="max-w-7xl mx-auto px-8 pt-[140px] pb-16">
        {/* HERO */}
        <div className="bg-white border border-pink-200 rounded-3xl p-6 mb-6">
          <h1 className="text-3xl font-black mb-2">
            SkillAtlas Forum
          </h1>
          <p className="text-gray-600 font-semibold">
            Debate rankings, break down countries, and shape the future of SkillAtlas.
          </p>
        </div>

        <div className="grid grid-cols-[260px_1fr] gap-6">
          {/* SIDEBAR */}
          <div className="bg-white border rounded-3xl p-4">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`block w-full text-left px-4 py-3 rounded-xl mb-2 ${
                  category === c.id
                    ? "bg-[#19d3cf] text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* POSTS */}
          <div className="bg-white border rounded-3xl overflow-hidden">
            {/* SEARCH */}
            <div className="p-4 border-b">
              <input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl"
              />
            </div>

            {/* THREADS */}
            {filtered.map((p) => (
              <div
                key={p.id}
                className="p-5 border-b hover:bg-gray-50 transition"
              >
                <div className="flex justify-between mb-2">
                  <span className={`text-xs font-bold ${statusStyle(p.status)}`}>
                    {p.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {p.lastActive}
                  </span>
                </div>

                <h3 className="font-black text-lg mb-1">{p.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{p.preview}</p>

                <div className="flex justify-between text-sm">
                  <div className="flex gap-3">
                    <span>💬 {p.replies}</span>
                    <span>⬆️ {p.votes}</span>
                    <span>👁 {p.views}</span>
                  </div>

                  <span className="text-gray-400">{p.country}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}