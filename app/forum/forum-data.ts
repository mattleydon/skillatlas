export const forumCategories = [
  { id: "general", label: "General", description: "Site news, gaming culture, and community conversation." },
  { id: "rankings", label: "Rankings", description: "Debate country placements, scoring, and movement." },
  { id: "countries", label: "Countries", description: "Explore national scenes, strengths, and competitive identity." },
  { id: "players", label: "Players", description: "Discuss roles, archetypes, and the people behind each scene." },
  { id: "suggestions", label: "Suggestions", description: "Propose useful improvements for SkillAtlas." },
] as const;

export type ForumCategoryId = (typeof forumCategories)[number]["id"];
export type ForumStatus = "Hot" | "New" | "Answered" | "Debate" | "Suggestion";

export type ForumThread = {
  id: string;
  slug: string;
  title: string;
  category: ForumCategoryId;
  author: string;
  country: string;
  replies: number;
  votes: number;
  views: number;
  status: ForumStatus;
  preview: string;
  body: string;
  tags: string[];
  lastActivity: string;
};

export const initialForumThreads: ForumThread[] = [
  {
    id: "denmark-cs-legacy",
    slug: "denmark-cs-legacy",
    title: "Is Denmark still the best CS country of all time?",
    category: "rankings",
    author: "AtlasCore",
    country: "Denmark",
    replies: 42,
    votes: 301,
    views: 3400,
    status: "Hot",
    preview: "Denmark dominated for years, but Brazil and Sweden have arguments depending on how we weight each era.",
    body: "Denmark has the systems, leaders, and trophy history, but the answer changes when longevity, peak dominance, and player depth receive different weights. Which measures should matter most in the country ranking?",
    tags: ["CS2", "Legacy", "Debate"],
    lastActivity: "2 min ago",
  },
  {
    id: "south-korea-dominance",
    slug: "south-korea-dominance",
    title: "What actually makes South Korea so consistently dominant?",
    category: "countries",
    author: "MacroMind",
    country: "South Korea",
    replies: 28,
    votes: 210,
    views: 2100,
    status: "Debate",
    preview: "Infrastructure, practice culture, coaching, PC bangs, or the combination of all four?",
    body: "South Korea succeeds across multiple competitive eras. This thread is for separating the visible results from the systems underneath them: infrastructure, practice discipline, coaching depth, and cultural status.",
    tags: ["MOBA", "Infrastructure", "Culture"],
    lastActivity: "8 min ago",
  },
  {
    id: "community-game-nights",
    slug: "community-game-nights",
    title: "Which games should lead the first SkillAtlas community nights?",
    category: "general",
    author: "OceanicQueue",
    country: "Australia",
    replies: 19,
    votes: 94,
    views: 870,
    status: "New",
    preview: "A rotating schedule could connect players without turning the Forum into another tournament platform.",
    body: "The goal would be relaxed country-versus-country community sessions rather than formal competition. Which games are accessible across regions and still show a country's gaming personality?",
    tags: ["Community", "Games"],
    lastActivity: "14 min ago",
  },
  {
    id: "rivalry-system",
    slug: "rivalry-system",
    title: "Suggestion: country rivalry pages with historical context",
    category: "suggestions",
    author: "GameTheory",
    country: "Brazil",
    replies: 17,
    votes: 120,
    views: 1200,
    status: "Suggestion",
    preview: "Country rivalry pages could add emotion without changing the ranking methodology.",
    body: "Rivalry pages could compare results, signature games, famous players, and momentum over time. They should remain country-level and explain the history rather than manufacture hostility.",
    tags: ["Feature", "Countries"],
    lastActivity: "22 min ago",
  },
  {
    id: "silent-closer-archetype",
    slug: "silent-closer-archetype",
    title: "Player identity idea: The Silent Closer",
    category: "players",
    author: "FinalRound",
    country: "Canada",
    replies: 9,
    votes: 66,
    views: 540,
    status: "Answered",
    preview: "Not flashy, but always wins the rounds that decide the match.",
    body: "The Silent Closer would describe players whose impact concentrates in late rounds and high-pressure moments. The identity should reward decision quality and composure, not just highlight clips.",
    tags: ["Identity", "Clutch"],
    lastActivity: "40 min ago",
  },
  {
    id: "india-chess-momentum",
    slug: "india-chess-momentum",
    title: "How should India's chess momentum affect the overall table?",
    category: "rankings",
    author: "EndgameAtlas",
    country: "India",
    replies: 31,
    votes: 188,
    views: 1600,
    status: "Debate",
    preview: "Youth depth and recent results are surging, but how quickly should all-time reputation move?",
    body: "Current strength and historical strength answer different questions. A transparent ranking should explain how recent form, youth depth, and long-term achievements combine without letting one hot season erase history.",
    tags: ["Chess", "Momentum", "Rankings"],
    lastActivity: "1 hr ago",
  },
];

export function getForumCategory(categoryId: ForumCategoryId) {
  return forumCategories.find((category) => category.id === categoryId);
}

export function getForumThread(slug: string) {
  return initialForumThreads.find((thread) => thread.slug === slug);
}
