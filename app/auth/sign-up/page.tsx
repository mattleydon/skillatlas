import type { Metadata } from "next";
import AuthRequestForm from "@/app/auth/components/auth-request-form";
import AuthShell from "@/app/auth/components/auth-shell";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Create Account | SkillAtlas",
  description: "Create a SkillAtlas account with a verified 8-digit email access code.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create Your Account"
      description="Verify your email to create a SkillAtlas account. You’ll choose your public member identity after verification."
      footer="Your account gives you access to SkillAtlas community features as they become available."
    >
      <AuthRequestForm flow="sign-up" configurationAvailable={hasSupabasePublicConfig()} />
    </AuthShell>
  );
}
