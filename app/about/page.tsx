import Link from "next/link";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import { GAME_DEFINITIONS } from "@/constants/games";
import { ROUTES } from "@/constants/routes";
import { SOVEREIGN_COUNTRY_COUNT } from "@/data/countries";

type ProductSurface = {
  name: string;
  question: string;
  description: string;
  href: string;
  children?: readonly {
    name: string;
    description: string;
    href: string;
  }[];
};

const productSurfaces: readonly ProductSurface[] = [
  {
    name: "Rankings",
    question: "Which countries are strongest?",
    description: "Compare the country ranking presentation across overall and game-specific scopes.",
    href: ROUTES.rankings,
    children: [
      {
        name: "User Rankings",
        description: "Community-driven perspective on the ranking field, currently represented with local prototype votes.",
        href: ROUTES.userRankings,
      },
      {
        name: "Live Rankings",
        description: "Dynamic ranking sandbox for exploring leaderboard movement through local interaction.",
        href: ROUTES.liveRankings,
      },
    ],
  },
  {
    name: "World Map",
    question: "Where is strength concentrated?",
    description: "Explore the geographic shape of global competitive gaming.",
    href: ROUTES.worldMap,
  },
  {
    name: "Countries",
    question: "What does each country reveal?",
    description: "Browse sovereign-country geography and investigate country intelligence records.",
    href: ROUTES.countries,
  },
  {
    name: "Players",
    question: "Which elite players stand out?",
    description: "Compare the current elite-player presentation across six competitive disciplines.",
    href: ROUTES.players,
  },
  {
    name: "Forum",
    question: "What is the community discussing?",
    description: "Debate rankings, countries, games, players, and new ideas for the atlas.",
    href: ROUTES.forum,
  },
  {
    name: "About",
    question: "How does SkillAtlas work?",
    description: "Understand the product, its principles, and the distinction between current and future intelligence.",
    href: ROUTES.about,
  },
];

const intelligenceLayers = [
  {
    name: "Raw Evidence",
    description: "Competitive records retained with enough source context to remain traceable.",
  },
  {
    name: "Normalised Observations",
    description: "Evidence transformed into consistent observations that can be compared responsibly.",
  },
  {
    name: "Derived Intelligence",
    description: "A versioned methodology turns observations into scores, rankings, movement, and related outputs.",
  },
  {
    name: "Interpretation",
    description: "SkillAtlas explains what an output may indicate without presenting inference as established cause.",
  },
] as const;

const analyticalDisciplines = [
  {
    name: "Observation",
    description: "A country records strong results across multiple competitive events.",
  },
  {
    name: "Interpretation",
    description: "That recurring pattern may indicate competitive depth.",
  },
  {
    name: "Causation",
    description: "A cultural, economic, infrastructure, or training factor should not be named as the cause without supporting evidence.",
  },
] as const;

const methodologyPrinciples = [
  {
    name: "No Fabricated Data",
    description: "Unsupported competitive intelligence should never be presented as fact.",
  },
  {
    name: "Provenance",
    description: "Published intelligence should be traceable to its underlying evidence.",
  },
  {
    name: "Reproducibility",
    description: "A published result should be reproducible from its inputs and methodology version.",
  },
  {
    name: "Versioning",
    description: "Methodology changes should be explicit instead of silently rewriting historical meaning.",
  },
  {
    name: "Confidence",
    description: "Intelligence should communicate how complete and reliable its supporting evidence is.",
  },
  {
    name: "Zero Is Not Unknown",
    description: "Missing evidence must not silently become a signal of poor performance.",
  },
  {
    name: "Source Quality",
    description: "Authoritative and specialist evidence should carry more weight than weak secondary material.",
  },
  {
    name: "Transparency",
    description: "Users should be able to understand what an output means and how it was formed.",
  },
] as const;

const realToday = [
  `A reviewed scope of ${SOVEREIGN_COUNTRY_COUNT} sovereign countries`,
  `A ${GAME_DEFINITIONS.length}-game starting taxonomy`,
  "Local geographic country mapping and atlas exploration",
  "Connected Rankings, World Map, Countries, Players, and Forum surfaces",
  "Formal methodology and governance principles for future intelligence",
] as const;

const futureIntelligence = [
  "Authoritative, sourced country and player rankings",
  "Richer country dossiers and regional comparison",
  "Historical movement and competitive context",
  "Rivalries, competitive gaps, and clearer Data Confidence",
  "Stronger links between intelligence and community discussion",
] as const;

const exploreLinks = [
  { label: "View Rankings", href: ROUTES.rankings },
  { label: "Explore World Map", href: ROUTES.worldMap },
  { label: "Browse Countries", href: ROUTES.countries },
  { label: "View Elite Players", href: ROUTES.players },
  { label: "Join the Forum", href: ROUTES.forum },
] as const;

function AboutBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,color-mix(in_srgb,var(--sa-accent)_7%,transparent),transparent_30%),linear-gradient(180deg,var(--sa-canvas),var(--sa-canvas))]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(var(--sa-border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--sa-border-subtle)_1px,transparent_1px)] [background-size:88px_88px] [mask-image:linear-gradient(to_bottom,black,transparent_52%)]" />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  titleId,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  titleId: string;
}) {
  return (
    <div className="min-w-0">
      <DataLabel as="p" className="text-sa-accent">
        {eyebrow}
      </DataLabel>
      <h2 id={titleId} className="mt-sa-1 text-xl font-bold tracking-tight text-sa-text-primary sm:text-2xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-sa-2 text-sm leading-6 text-sa-text-muted sm:text-[15px]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function CompactList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-sa-3 grid gap-sa-2">
      {items.map((item) => (
        <li key={item} className="flex gap-sa-3 text-sm leading-6 text-sa-text-muted">
          <span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-sa-accent" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-sa-canvas text-sa-text-primary">
      <AboutBackground />

      <div className="skillatlas-page-shell relative z-10 mx-auto w-full max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-8 lg:pb-12">
        <div className="mx-auto max-w-[1320px]">
          <IntelligencePanel
            as="section"
            aria-labelledby="about-skillatlas-title"
            bodyClassName="px-sa-4 py-sa-4 sm:px-sa-5"
          >
            <DataLabel as="p" className="mb-sa-1 text-sa-accent">
              SkillAtlas / About
            </DataLabel>
            <h1
              id="about-skillatlas-title"
              className="text-[1.75rem] font-black leading-[1.08] tracking-[-0.04em] text-sa-text-primary sm:text-4xl"
            >
              About SkillAtlas
            </h1>
            <p className="mt-sa-2 text-sm leading-6 text-sa-text-muted sm:text-[15px]">
              SkillAtlas maps competitive gaming across countries, games, and elite players, connecting global comparison with geographic exploration and community discussion.
            </p>
          </IntelligencePanel>

          <IntelligencePanel as="section" className="mt-sa-3 overflow-hidden">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <article className="px-sa-4 py-sa-5 sm:px-sa-5" aria-labelledby="what-skillatlas-is-title">
                <SectionHeading
                  eyebrow="Product definition"
                  title="What SkillAtlas Is"
                  titleId="what-skillatlas-is-title"
                />
                <div className="mt-sa-3 space-y-sa-3 text-sm leading-6 text-sa-text-muted sm:text-[15px]">
                  <p>
                    SkillAtlas is a global competitive-gaming intelligence product focused on understanding competitive strength across countries, games, and elite professional players.
                  </p>
                  <p>
                    Its current interfaces bring Rankings, World Map, Country Intelligence, Elite Player Rankings, and Community Forum into one connected country-first product.
                  </p>
                </div>
              </article>

              <article className="border-t border-sa-border-subtle px-sa-4 py-sa-5 sm:px-sa-5 lg:border-l lg:border-t-0" aria-labelledby="why-skillatlas-exists-title">
                <SectionHeading
                  eyebrow="Purpose"
                  title="Why SkillAtlas Exists"
                  titleId="why-skillatlas-exists-title"
                />
                <div className="mt-sa-3 space-y-sa-3 text-sm leading-6 text-sa-text-muted sm:text-[15px]">
                  <p>
                    Traditional sport gives countries an intuitive competitive identity. Competitive gaming has global results and devoted communities, but country-level strength is harder to see as one coherent geography.
                  </p>
                  <p>
                    SkillAtlas aims to make that geography easier to understand—encouraging open comparison, discovery, sporting rivalry, and healthy national competitive pride without losing a global perspective.
                  </p>
                </div>
              </article>
            </div>

            <div className="border-t border-sa-border-subtle px-sa-4 py-sa-3 sm:px-sa-5 sm:py-sa-4">
              <div className="border-l-2 border-sa-accent pl-sa-3 sm:grid sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center sm:gap-sa-4">
                <DataLabel as="p">Central question</DataLabel>
                <p className="mt-sa-1 text-lg font-bold leading-6 text-sa-text-primary sm:mt-0 sm:text-xl">
                  Which country is actually the best at gaming—and what evidence helps explain why?
                </p>
              </div>
            </div>
          </IntelligencePanel>

          <IntelligencePanel
            as="section"
            className="mt-sa-3 overflow-hidden"
            aria-labelledby="product-system-title"
            header={
              <SectionHeading
                eyebrow="Connected system"
                title="How SkillAtlas Fits Together"
                description="Each surface answers a different question while remaining part of the same competitive atlas. Surface roles do not imply that current prototype values are final rankings."
                titleId="product-system-title"
              />
            }
          >
            <div className="divide-y divide-sa-border-subtle">
              {productSurfaces.map((surface, index) => (
                <div key={surface.name}>
                  <Link
                    href={surface.href}
                    aria-current={surface.href === ROUTES.about ? "page" : undefined}
                    className="group grid min-h-16 gap-sa-2 px-sa-4 py-sa-3 outline-none transition-colors duration-150 ease-sa-standard hover:bg-sa-surface-2 focus-visible:bg-sa-surface-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sa-accent sm:grid-cols-[42px_150px_minmax(0,1fr)_auto] sm:items-center sm:px-sa-5"
                  >
                    <span className="font-sa-data text-[11px] text-sa-text-technical" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-bold text-sa-text-primary transition-colors duration-150 group-hover:text-sa-accent">
                      {surface.name}
                    </span>
                    <span className="min-w-0 text-sm leading-5 text-sa-text-muted">
                      <span className="font-semibold text-sa-text-primary">{surface.question}</span>{" "}
                      {surface.description}
                    </span>
                    <span className="text-sa-accent" aria-hidden="true">→</span>
                  </Link>

                  {surface.children ? (
                    <div className="border-t border-sa-border-subtle sm:pl-[62px]">
                      {surface.children.map((child, childIndex) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={`group grid min-h-12 gap-x-sa-3 gap-y-sa-1 px-sa-4 py-sa-2 outline-none transition-colors duration-150 ease-sa-standard hover:bg-sa-surface-inset focus-visible:bg-sa-surface-inset focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sa-accent sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-center sm:px-sa-5 ${childIndex === 0 ? "" : "border-t border-sa-border-subtle"}`}
                        >
                          <span className="flex items-center gap-sa-2 text-xs font-bold uppercase tracking-[0.08em] text-sa-text-primary transition-colors duration-150 group-hover:text-sa-accent">
                            <span className="font-sa-data text-sa-accent" aria-hidden="true">↳</span>
                            {child.name}
                          </span>
                          <span className="text-sm leading-5 text-sa-text-muted">{child.description}</span>
                          <span className="text-sa-accent" aria-hidden="true">→</span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </IntelligencePanel>

          <IntelligencePanel
            as="section"
            className="mt-sa-3 overflow-hidden"
            aria-labelledby="intelligence-pipeline-title"
            header={
              <SectionHeading
                eyebrow="Intelligence model"
                title="How SkillAtlas Intelligence Is Built"
                description="A trustworthy production model keeps evidence, analytical outputs, and explanation distinct. This pipeline describes the intended discipline, not a claim that every current prototype value already passes through it."
                titleId="intelligence-pipeline-title"
              />
            }
          >
            <ol className="grid lg:grid-cols-4">
              {intelligenceLayers.map((layer, index) => (
                <li
                  key={layer.name}
                  className={`relative px-sa-4 py-sa-4 sm:px-sa-5 ${index === 0 ? "" : "border-t border-sa-border-subtle lg:border-l lg:border-t-0"}`}
                >
                  <div className="flex items-center justify-between gap-sa-3">
                    <DataLabel as="span">Layer {String(index + 1).padStart(2, "0")}</DataLabel>
                    {index < intelligenceLayers.length - 1 ? (
                      <span className="hidden text-sa-accent lg:inline" aria-hidden="true">→</span>
                    ) : null}
                  </div>
                  <h3 className="mt-sa-2 text-sm font-bold uppercase tracking-[0.08em] text-sa-text-primary">
                    {layer.name}
                  </h3>
                  <p className="mt-sa-2 text-sm leading-6 text-sa-text-muted">{layer.description}</p>
                </li>
              ))}
            </ol>
          </IntelligencePanel>

          <IntelligencePanel
            as="section"
            className="mt-sa-3 overflow-hidden"
            aria-labelledby="analytical-discipline-title"
            header={
              <SectionHeading
                eyebrow="Analytical discipline"
                title="Observation, Interpretation, and Causation"
                description="Useful explanation depends on saying clearly what the evidence shows, what it may indicate, and what it cannot yet prove."
                titleId="analytical-discipline-title"
              />
            }
          >
            <div className="grid md:grid-cols-3">
              {analyticalDisciplines.map((discipline, index) => (
                <article
                  key={discipline.name}
                  className={`px-sa-4 py-sa-4 sm:px-sa-5 ${index === 0 ? "" : "border-t border-sa-border-subtle md:border-l md:border-t-0"}`}
                >
                  <h3 className="text-[10px] font-bold uppercase leading-4 tracking-[0.16em] text-sa-accent">
                    {discipline.name}
                  </h3>
                  <p className="mt-sa-2 text-sm leading-6 text-sa-text-muted">{discipline.description}</p>
                </article>
              ))}
            </div>
          </IntelligencePanel>

          <IntelligencePanel
            as="section"
            className="mt-sa-3 overflow-hidden"
            aria-labelledby="methodology-principles-title"
            header={
              <SectionHeading
                eyebrow="Trust framework"
                title="Data & Methodology Principles"
                description="These principles set the standard future public intelligence is intended to meet without publishing provisional formulas as settled methodology."
                titleId="methodology-principles-title"
              />
            }
          >
            <div className="grid sm:grid-cols-2">
              {methodologyPrinciples.map((principle, index) => (
                <article
                  key={principle.name}
                  className={`border-t border-sa-border-subtle px-sa-4 py-sa-3 sm:px-sa-5 ${index % 2 === 0 ? "sm:border-r" : ""}`}
                >
                  <h3 className="text-[10px] font-bold uppercase leading-4 tracking-[0.16em] text-sa-text-primary">
                    {principle.name}
                  </h3>
                  <p className="mt-sa-1 text-sm leading-6 text-sa-text-muted">{principle.description}</p>
                </article>
              ))}
            </div>
          </IntelligencePanel>

          <IntelligencePanel
            as="section"
            className="mt-sa-3 overflow-hidden border-sa-border-strong"
            aria-labelledby="current-status-title"
          >
            <div className="border-l-2 border-sa-accent px-sa-4 py-sa-4 sm:px-sa-5">
              <SectionHeading
                eyebrow="Current status"
                title="SkillAtlas Is Currently in Calibration"
                titleId="current-status-title"
              />
              <div className="mt-sa-3 space-y-sa-2 text-sm leading-6 text-sa-text-muted sm:text-[15px]">
                <p>
                  SkillAtlas is a real product under active development. Its product and interface structure is distinct from the competitive values displayed inside it.
                </p>
                <p>
                  Some current public scores, ranks, movement, player records, and historical series are prototype presentation data used to develop and test the experience. They are not final methodology-approved rankings.
                </p>
                <p>
                  The production evidence and methodology pipeline is still being developed. Future published intelligence is intended to be sourced, reproducible, versioned, transparent, and accompanied by clearer provenance and Data Confidence.
                </p>
              </div>
            </div>

            <div className="grid border-t border-sa-border-subtle lg:grid-cols-2">
              <article className="px-sa-4 py-sa-4 sm:px-sa-5" aria-labelledby="real-today-title">
                <DataLabel as="p" className="text-sa-accent">Product structure</DataLabel>
                <h3 id="real-today-title" className="mt-sa-1 text-lg font-bold text-sa-text-primary">What Is Real Today</h3>
                <CompactList items={realToday} />
              </article>

              <article className="border-t border-sa-border-subtle px-sa-4 py-sa-4 sm:px-sa-5 lg:border-l lg:border-t-0" aria-labelledby="future-intelligence-title">
                <DataLabel as="p">Intended direction</DataLabel>
                <h3 id="future-intelligence-title" className="mt-sa-1 text-lg font-bold text-sa-text-primary">What Is Still Being Developed</h3>
                <CompactList items={futureIntelligence} />
              </article>
            </div>
          </IntelligencePanel>

          <IntelligencePanel
            as="section"
            className="mt-sa-3 overflow-hidden"
            aria-labelledby="explore-skillatlas-title"
            header={
              <SectionHeading
                eyebrow="Continue exploring"
                title="Explore SkillAtlas"
                description="Move from the product explanation into the atlas, rankings, player field, or community discussion."
                titleId="explore-skillatlas-title"
              />
            }
          >
            <nav aria-label="Explore SkillAtlas" className="grid sm:grid-cols-2 lg:grid-cols-5">
              {exploreLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group flex min-h-12 items-center justify-between gap-sa-3 px-sa-4 py-sa-3 text-sm font-bold text-sa-text-primary outline-none transition-colors duration-150 ease-sa-standard hover:bg-sa-surface-2 hover:text-sa-accent focus-visible:bg-sa-surface-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sa-accent ${index === 0 ? "" : "border-t border-sa-border-subtle sm:[&:nth-child(even)]:border-l lg:border-l lg:border-t-0"}`}
                >
                  <span>{link.label}</span>
                  <span className="text-sa-accent transition-transform duration-150 motion-reduce:transition-none group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0" aria-hidden="true">→</span>
                </Link>
              ))}
            </nav>
          </IntelligencePanel>
        </div>
      </div>
    </main>
  );
}
