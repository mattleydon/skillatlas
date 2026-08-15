import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import AccountUnavailable from "@/app/account/components/account-unavailable";
import AuthShell from "@/app/auth/components/auth-shell";
import CountryFlag from "@/app/components/country-flag";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import { memberRoute } from "@/constants/routes";
import {
  getPublicMemberProfile,
  type PublicMemberCountry,
} from "@/lib/account/public-profile";

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

function CountryRecord({ label, country }: { label: string; country: PublicMemberCountry }) {
  return (
    <div className="min-w-0 border-l-2 border-sa-border-active pl-sa-3">
      <DataLabel as="p" className="text-sa-text-technical">{label}</DataLabel>
      <div className="mt-sa-2 flex min-w-0 items-center gap-sa-2">
        <CountryFlag
          country={{ name: country.name, flagCode: country.iso2 }}
          size="md"
          variant="atlas"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-sa-text-primary">{country.name}</p>
          <p className="truncate text-[10px] uppercase tracking-[0.1em] text-sa-text-technical">{country.region}</p>
        </div>
      </div>
    </div>
  );
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { username } = await params;
  const result = await getPublicMemberProfile(username);

  if (result.status === "error") return <AccountUnavailable />;
  if (result.status === "not_found") notFound();

  const profile = result.profile;
  if (username !== profile.username) redirect(memberRoute(profile.username));

  const memberSince = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(profile.createdAt));
  const hasPublicCountryIdentity = Boolean(
    profile.representingCountry ||
      profile.birthCountry ||
      profile.residenceCountry ||
      profile.cityTown ||
      profile.heritageCountries
  );

  return (
    <AuthShell
      eyebrow="SkillAtlas / Member Record"
      title={profile.displayName}
      description="Public SkillAtlas identity record"
      contentClassName="max-w-[920px]"
      bare
    >
      <div className="space-y-sa-4">
        <IntelligencePanel as="section" bodyClassName="px-sa-4 py-sa-4 sm:px-sa-5">
          <div className="grid gap-sa-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
            <div
              className="grid h-16 w-16 place-items-center rounded-sa-control border border-sa-border-active bg-sa-accent/8 font-sa-data text-xl font-black tracking-[-0.04em] text-sa-accent"
              aria-hidden="true"
            >
              {memberInitials(profile.displayName, profile.username)}
            </div>
            <div className="min-w-0">
              <DataLabel as="p" className="text-sa-accent">Profile / Identity</DataLabel>
              <p className="mt-sa-1 truncate text-xl font-black text-sa-text-primary">@{profile.username}</p>
              {profile.bio ? (
                <p className="mt-sa-2 whitespace-pre-line text-sm leading-6 text-sa-text-muted">{profile.bio}</p>
              ) : null}
            </div>
            <div className="border-l border-sa-border-subtle pl-sa-3 sm:text-right">
              <DataLabel as="p" className="text-sa-text-technical">Member since</DataLabel>
              <p className="mt-sa-1 font-sa-data text-sm font-bold text-sa-text-primary">{memberSince}</p>
            </div>
          </div>
        </IntelligencePanel>

        {hasPublicCountryIdentity ? (
          <IntelligencePanel
            as="section"
            header={<DataLabel as="h2" className="text-sa-accent">Country Identity</DataLabel>}
            bodyClassName="px-sa-4 py-sa-4 sm:px-sa-5"
          >
            <div className="grid gap-sa-5 sm:grid-cols-2 lg:grid-cols-3">
              {profile.representingCountry ? <CountryRecord label="Representing" country={profile.representingCountry} /> : null}
              {profile.birthCountry ? <CountryRecord label="Born" country={profile.birthCountry} /> : null}
              {profile.residenceCountry ? <CountryRecord label="Lives In" country={profile.residenceCountry} /> : null}
              {profile.cityTown ? (
                <div className="border-l-2 border-sa-border-active pl-sa-3">
                  <DataLabel as="p" className="text-sa-text-technical">City / Town</DataLabel>
                  <p className="mt-sa-2 text-sm font-bold text-sa-text-primary">{profile.cityTown}</p>
                </div>
              ) : null}
            </div>

            {profile.heritageCountries ? (
              <div className="mt-sa-5 border-t border-sa-border-subtle pt-sa-4">
                <DataLabel as="h3" className="text-sa-text-technical">Heritage</DataLabel>
                {profile.heritageCountries.length > 0 ? (
                  <ol className="mt-sa-3 grid gap-sa-2 sm:grid-cols-2">
                    {profile.heritageCountries.map((country) => (
                      <li key={country.id} className="flex min-h-11 items-center gap-sa-3 rounded-sa-control border border-sa-border-subtle bg-sa-surface-inset px-sa-3 py-sa-2">
                        <span className="font-sa-data text-[11px] font-black text-sa-accent">{String(country.position).padStart(2, "0")}</span>
                        <CountryFlag country={{ name: country.name, flagCode: country.iso2 }} size="sm" variant="atlas" />
                        <span className="min-w-0 truncate text-sm font-bold text-sa-text-primary">{country.name}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-sa-2 text-sm text-sa-text-technical">No Heritage countries selected.</p>
                )}
              </div>
            ) : null}
          </IntelligencePanel>
        ) : null}

        <p className="px-sa-1 text-xs leading-5 text-sa-text-technical">
          This public record contains only fields the member has chosen to share. Private profile data is not exposed.
        </p>
      </div>
    </AuthShell>
  );
}
