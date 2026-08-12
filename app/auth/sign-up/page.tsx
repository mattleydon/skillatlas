import type { Metadata } from "next";
import AuthRequestForm from "@/app/auth/components/auth-request-form";
import AuthShell from "@/app/auth/components/auth-shell";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Create Account | SkillAtlas",
  description: "Create a SkillAtlas account with a verified email one-time code.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create Your Account"
      description="Verify your email to establish a SkillAtlas account. Community profile setup follows in the next account phase."
      footer="PR 1 creates only an authenticated account. Username, country, avatar, bio, and public member profile are deliberately not collected yet."
    >
      <AuthRequestForm flow="sign-up" configurationAvailable={hasSupabasePublicConfig()} />
    </AuthShell>
  );
}
