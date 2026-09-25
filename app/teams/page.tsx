import type { Metadata } from "next";
import EntityDevelopmentPage from "@/app/components/entity-development-page";

export const metadata: Metadata = {
  title: "Team Atlas | SkillAtlas",
  description: "The developing SkillAtlas directory for team and organisation intelligence.",
};

export default function TeamsPage() {
  return (
    <EntityDevelopmentPage
      title="Team Atlas"
      status="Entity layer in development"
      description="Team and organisation intelligence will live here once SkillAtlas has a canonical entity model and defensible source records. Prototype player-fixture labels are not treated as team entities."
      directoryLabel="Organisation directory"
      directoryDescription="Reserved for verified teams and organisations with clear identity and provenance."
    />
  );
}
