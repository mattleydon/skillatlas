export type ForumDiscussion = {
  id: string;
  slug: string;
  title: string;
  author: string;
  country: string;
  preview: string;
  body: string;
};

// These discussions are existing product fixtures, not persisted community
// records. Keep this collection separate from any future Forum data adapter.
export const sampleForumDiscussions: ForumDiscussion[] = [
  {
    id: "denmark-cs-legacy",
    slug: "denmark-cs-legacy",
    title: "Is Denmark still the best CS country of all time?",
    author: "AtlasCore",
    country: "Denmark",
    preview:
      "Denmark dominated for years, but Brazil and Sweden have arguments depending on how we weight each era.",
    body:
      "Denmark has the systems, leaders, and trophy history, but the answer changes when longevity, peak dominance, and player depth receive different weights. Which measures should matter most in the country ranking?",
  },
  {
    id: "south-korea-dominance",
    slug: "south-korea-dominance",
    title: "What actually makes South Korea so consistently dominant?",
    author: "MacroMind",
    country: "South Korea",
    preview:
      "Infrastructure, practice culture, coaching, PC bangs, or the combination of all four?",
    body:
      "South Korea succeeds across multiple competitive eras. This thread is for separating the visible results from the systems underneath them: infrastructure, practice discipline, coaching depth, and cultural status.",
  },
  {
    id: "community-game-nights",
    slug: "community-game-nights",
    title: "Which games should lead the first SkillAtlas community nights?",
    author: "OceanicQueue",
    country: "Australia",
    preview:
      "A rotating schedule could connect players without turning the Forum into another tournament platform.",
    body:
      "The goal would be relaxed country-versus-country community sessions rather than formal competition. Which games are accessible across regions and still show a country's gaming personality?",
  },
  {
    id: "rivalry-system",
    slug: "rivalry-system",
    title: "Suggestion: country rivalry pages with historical context",
    author: "GameTheory",
    country: "Brazil",
    preview:
      "Country rivalry pages could add emotion without changing the ranking methodology.",
    body:
      "Rivalry pages could compare results, signature games, famous players, and momentum over time. They should remain country-level and explain the history rather than manufacture hostility.",
  },
  {
    id: "silent-closer-archetype",
    slug: "silent-closer-archetype",
    title: "Player identity idea: The Silent Closer",
    author: "FinalRound",
    country: "Canada",
    preview: "Not flashy, but always wins the rounds that decide the match.",
    body:
      "The Silent Closer would describe players whose impact concentrates in late rounds and high-pressure moments. The identity should reward decision quality and composure, not just highlight clips.",
  },
  {
    id: "india-chess-momentum",
    slug: "india-chess-momentum",
    title: "How should India's chess momentum affect the overall table?",
    author: "EndgameAtlas",
    country: "India",
    preview:
      "Youth depth and recent results are surging, but how quickly should all-time reputation move?",
    body:
      "Current strength and historical strength answer different questions. A transparent ranking should explain how recent form, youth depth, and long-term achievements combine without letting one hot season erase history.",
  },
];

export function getForumDiscussion(slug: string) {
  return sampleForumDiscussions.find((discussion) => discussion.slug === slug);
}
