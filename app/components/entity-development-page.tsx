import Link from "next/link";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import { ROUTES } from "@/constants/routes";

type DirectoryItem = {
  id: string;
  name: string;
};

type EntityDevelopmentPageProps = {
  title: string;
  status: string;
  description: string;
  directoryLabel: string;
  directoryDescription: string;
  items?: readonly DirectoryItem[];
};

export default function EntityDevelopmentPage({
  title,
  status,
  description,
  directoryLabel,
  directoryDescription,
  items = [],
}: EntityDevelopmentPageProps) {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-sa-canvas text-sa-text-primary">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,color-mix(in_srgb,var(--sa-accent)_7%,transparent),transparent_30%),linear-gradient(180deg,var(--sa-canvas),var(--sa-canvas))]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(var(--sa-border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--sa-border-subtle)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:linear-gradient(to_bottom,black,transparent_58%)]" />
      </div>

      <div className="skillatlas-page-shell relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-10 sm:px-6 lg:px-8">
        <IntelligencePanel as="section" bodyClassName="px-sa-4 py-sa-4 sm:px-sa-5 sm:py-sa-5">
          <div className="grid gap-sa-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <DataLabel as="p" className="text-sa-accent">SkillAtlas / Explore</DataLabel>
              <h1 className="mt-sa-1 text-[1.75rem] font-black uppercase leading-none tracking-[-0.045em] sm:text-4xl">
                {title}
              </h1>
              <p className="mt-sa-3 text-sm leading-6 text-sa-text-muted sm:text-[15px]">{description}</p>
            </div>
            <div className="flex min-h-11 items-center gap-sa-3 self-start border-l-2 border-sa-border-active bg-sa-surface-inset px-sa-3 py-sa-2 lg:self-auto">
              <span className="h-2 w-2 rounded-[1px] bg-sa-negative" aria-hidden="true" />
              <span>
                <DataLabel as="span">Development state</DataLabel>
                <strong className="mt-0.5 block text-[11px] uppercase tracking-[0.08em] text-sa-text-primary">{status}</strong>
              </span>
            </div>
          </div>
        </IntelligencePanel>

        <div className="mt-sa-3 grid gap-sa-3 lg:grid-cols-[minmax(0,1fr)_300px]">
          <IntelligencePanel
            as="section"
            header={
              <div>
                <DataLabel as="h2" className="text-sa-accent">{directoryLabel}</DataLabel>
                <p className="mt-sa-1 text-xs leading-5 text-sa-text-technical">{directoryDescription}</p>
              </div>
            }
            bodyClassName="px-sa-4 py-sa-4 sm:px-sa-5"
          >
            {items.length > 0 ? (
              <ol className="grid gap-sa-2 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item, index) => (
                  <li key={item.id} className="grid min-h-16 grid-cols-[34px_minmax(0,1fr)] items-center border border-sa-border-subtle bg-sa-surface-inset px-sa-3 py-sa-2">
                    <span className="font-sa-data text-[10px] font-black text-sa-text-technical">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm font-bold text-sa-text-primary">{item.name}</strong>
                      <small className="mt-1 block font-sa-data text-[9px] uppercase tracking-[0.1em] text-sa-text-technical">Record pending</small>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="border-l-2 border-sa-border-active pl-sa-4">
                <p className="max-w-2xl text-sm leading-6 text-sa-text-muted">
                  No public directory is available yet. SkillAtlas will expose this index only when its canonical entity and privacy model can support it truthfully.
                </p>
              </div>
            )}
          </IntelligencePanel>

          <IntelligencePanel
            as="aside"
            header={<DataLabel as="h2" className="text-sa-accent">Current access</DataLabel>}
            bodyClassName="px-sa-4 py-sa-4"
          >
            <p className="text-sm leading-6 text-sa-text-muted">
              Existing SkillAtlas destinations remain available while this intelligence layer is assembled.
            </p>
            <div className="mt-sa-4 grid gap-sa-2">
              <Link href={ROUTES.countries} className="flex min-h-11 items-center justify-between border border-sa-border-strong bg-sa-surface-inset px-sa-3 text-xs font-bold text-sa-text-primary outline-none transition-colors duration-200 hover:border-sa-border-active focus-visible:ring-2 focus-visible:ring-sa-accent/30">
                Country Atlas <span className="text-sa-accent" aria-hidden="true">→</span>
              </Link>
              <Link href={ROUTES.authSignIn} className="flex min-h-11 items-center justify-between border border-sa-border-strong bg-sa-surface-inset px-sa-3 text-xs font-bold text-sa-text-primary outline-none transition-colors duration-200 hover:border-sa-border-active focus-visible:ring-2 focus-visible:ring-sa-accent/30">
                Sign in <span className="text-sa-accent" aria-hidden="true">→</span>
              </Link>
            </div>
          </IntelligencePanel>
        </div>
      </div>
    </main>
  );
}
