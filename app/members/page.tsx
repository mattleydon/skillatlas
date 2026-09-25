import type { Metadata } from "next";
import EntityDevelopmentPage from "@/app/components/entity-development-page";

export const metadata: Metadata = {
  title: "Member Atlas | SkillAtlas",
  description: "The developing public discovery home for SkillAtlas members.",
};

export default function MembersPage() {
  return (
    <EntityDevelopmentPage
      title="Member Atlas"
      status="Discovery layer in development"
      description="Public member discovery is being developed. Existing direct member-profile routes remain available, but SkillAtlas will not create a public directory until an approved privacy-safe projection supports it."
      directoryLabel="Member discovery"
      directoryDescription="Professional Players and community Members remain separate SkillAtlas identity systems."
    />
  );
}
