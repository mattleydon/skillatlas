import type { Metadata } from "next";
import EntityDevelopmentPage from "@/app/components/entity-development-page";
import { GAME_DEFINITIONS } from "@/constants/games";

export const metadata: Metadata = {
  title: "Game Atlas | SkillAtlas",
  description: "The developing SkillAtlas directory for competitive game intelligence.",
};

export default function GamesPage() {
  return (
    <EntityDevelopmentPage
      title="Game Atlas"
      status="Intelligence layer in development"
      description="Game intelligence is being assembled. Individual game records, country strength, competitive ecosystems, and historical performance will become available here."
      directoryLabel="Canonical starting field"
      directoryDescription="Known game identities only. No rankings, scores, trends, or population metrics are implied."
      items={GAME_DEFINITIONS}
    />
  );
}
