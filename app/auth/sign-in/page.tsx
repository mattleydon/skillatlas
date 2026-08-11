import type { Metadata } from "next";
import AuthRequestForm from "@/app/auth/components/auth-request-form";
import AuthShell from "@/app/auth/components/auth-shell";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Sign In | SkillAtlas",
  description: "Sign in to SkillAtlas with a verified email one-time code.",
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign In"
      description="Access your SkillAtlas account with a verified email code. Passwords are not used."
      footer="Use the email address attached to your SkillAtlas account. The response remains intentionally generic to protect account privacy."
    >
      <AuthRequestForm flow="sign-in" configurationAvailable={hasSupabasePublicConfig()} />
    </AuthShell>
  );
}
