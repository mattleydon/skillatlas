import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AccountUnavailable from "@/app/account/components/account-unavailable";
import AuthShell from "@/app/auth/components/auth-shell";
import CountryFlag from "@/app/components/country-flag";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import { createClient } from "@/lib/supabase/server";

type MemberPageProps = {
  params: Promise<{ username: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: MemberPageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} | SkillAtlas Member`,
    description: `Public SkillAtlas member profile for @${username}.`,
  };
}

function memberInitials(displayName: string, username: string) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || username.slice(0, 2).toUpperCase();
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { username } = await params;
  let profile:
    | {
        username: string;
        display_name: string;
        created_at: string;
        country: { id: string; iso2: string; name: string; region: string } | null;
      }
    | null = null;
  let unavailable = false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("username, display_name, created_at, country:countries(id, iso2, name, region)")
      .eq("username", username)
      .maybeSingle();

    if (error) unavailable = true;
    else profile = data;
  } catch {
    unavailable = true;
  }

  if (unavailable) return <AccountUnavailable />;
  if (!profile) notFound();

  const memberSince = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(profile.created_at));

  return (
    <AuthShell
      eyebrow="SkillAtlas / Member"
      title={profile.display_name}
      description="SkillAtlas community member"
      footer={`Member since ${memberSince}`}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="grid h-20 w-20 place-items-center rounded-sa-panel border border-sa-border-active bg-sa-accent/10 text-2xl font-black tracking-[-0.04em] text-sa-accent"
          aria-label={`${profile.display_name} member initials`}
        >
          {memberInitials(profile.display_name, profile.username)}
        </div>
        <DataLabel as="p" className="mt-sa-4 text-sa-accent">Public member</DataLabel>
        <p className="mt-sa-1 text-lg font-black text-sa-text-primary">@{profile.username}</p>
        {profile.country ? (
          <div className="mt-sa-4 flex min-h-11 items-center gap-sa-2 rounded-sa-control border border-sa-border-subtle bg-sa-surface-inset px-sa-3 text-left">
            <CountryFlag
              country={{ name: profile.country.name, flagCode: profile.country.iso2 }}
              size="sm"
            />
            <div>
              <p className="text-sm font-bold text-sa-text-primary">{profile.country.name}</p>
              <p className="text-[10px] uppercase tracking-[0.1em] text-sa-text-technical">{profile.country.region}</p>
            </div>
          </div>
        ) : null}
      </div>
    </AuthShell>
  );
}
