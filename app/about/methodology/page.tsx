import type { Metadata } from "next";
import Link from "next/link";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import { DataStateBadge, ConfidenceIndicator, WhyThisResult } from "@/app/components/evidence/evidence-ui";
import { DATA_STATES, RANKING_EVIDENCE, type DataState } from "@/lib/evidence";
import { ROUTES } from "@/constants/routes";
import styles from "@/app/components/evidence/evidence.module.css";

export const metadata: Metadata = {
  title: "Methodology | SkillAtlas",
  description: "What SkillAtlas knows, what demonstration rankings mean, and where evidence is still missing.",
};

export default function MethodologyPage() {
  return <main className="min-h-screen bg-sa-canvas text-sa-text-primary">
    <div className="skillatlas-page-shell mx-auto max-w-[1280px] space-y-3 pb-12">
      <IntelligencePanel as="section" aria-labelledby="methodology-title" bodyClassName="p-sa-4">
        <p className="sa-type-label text-xs text-sa-text-muted">SkillAtlas / About / Methodology</p>
        <h1 id="methodology-title" className="sa-type-page-title mt-sa-2">What we know. What we do not.</h1>
        <p className="sa-type-intro mt-sa-2 max-w-3xl text-sa-text-muted">SkillAtlas aims to compare competitive gaming performance across countries and games. Today, the competitive values on Rankings, Countries and Atlas are demonstration fixtures—not verified rankings.</p>
        <div className="mt-sa-3 flex flex-wrap items-center gap-sa-3"><DataStateBadge state="fixture" /><ConfidenceIndicator /></div>
        <p className="mt-sa-3 max-w-3xl text-sm text-sa-text-muted">The production scoring methodology is not yet approved. There are no canonical or admitted provisional competitive values on these surfaces. A polished interface is not a measure of evidence quality.</p>
      </IntelligencePanel>

      <IntelligencePanel as="section" aria-labelledby="truth-states-title" bodyClassName="p-sa-4">
        <h2 id="truth-states-title" className="sa-type-heading text-base">Read the data state</h2>
        <p className="mt-sa-2 text-sm text-sa-text-muted">These labels describe a value’s status, not how impressive it looks. Definitions below are not endorsements of any current competitive result.</p>
        <dl className="mt-sa-3 grid gap-sa-4 sm:grid-cols-2">
          {(Object.keys(DATA_STATES) as DataState[]).map((state) => <div key={state}>
            <dt><DataStateBadge state={state} /></dt>
            <dd className="mt-sa-2 text-sm text-sa-text-muted">{DATA_STATES[state].meaning}</dd>
          </div>)}
        </dl>
        <p className="mt-sa-4 text-sm">UNKNOWN is a limit to what we can claim. UNAVAILABLE is a gap in access or coverage. Neither means zero, poor performance or no talent.</p>
      </IntelligencePanel>

      <IntelligencePanel as="section" aria-labelledby="current-values-title" bodyClassName="p-sa-4">
        <h2 id="current-values-title" className="sa-type-heading text-base">Why these numbers appear today</h2>
        <p className="my-sa-3 text-sm text-sa-text-muted">Fixtures let us test comparison, selection and presentation. They are not a temporary estimate of real strength and must not be used as evidence.</p>
        <WhyThisResult evidence={RANKING_EVIDENCE} context="Current country rankings" />
        <details className={styles.disclosure}>
          <summary>Geographic identity is a different claim</summary>
          <div className={styles.content}>
            <DataStateBadge state="canonical" />
            <p>The admitted product catalogue contains 195 countries: 193 UN member states plus the Holy See and the State of Palestine. Its identifiers, names and regions support consistent browsing. This product scope is not a statement about disputed recognition or boundaries.</p>
            <p>Maps use locally stored Natural Earth outlines with retained source attribution. A geographic reference does not support a country’s competitive rank, score or attribution of a player’s results.</p>
            <p>Canonical catalogue identity does not make the competitive fields stored alongside it canonical.</p>
          </div>
        </details>
      </IntelligencePanel>

      <IntelligencePanel as="section" aria-labelledby="reasoning-title" bodyClassName="p-sa-4">
        <h2 id="reasoning-title" className="sa-type-heading text-base">Evidence is not the same as explanation</h2>
        <dl className="mt-sa-3 grid gap-sa-4 md:grid-cols-3">
          <div><dt className="sa-type-label text-xs">Observed</dt><dd className="mt-sa-2 text-sm text-sa-text-muted">A recorded result with an identifiable source. Current competitive fixtures are not observations.</dd></div>
          <div><dt className="sa-type-label text-xs">Derived</dt><dd className="mt-sa-2 text-sm text-sa-text-muted">A calculation from inputs. Calculating a change between fixture points does not turn it into real historical evidence.</dd></div>
          <div><dt className="sa-type-label text-xs">Interpretation</dt><dd className="mt-sa-2 text-sm text-sa-text-muted">An explanation of what evidence might mean. It is not an established cause.</dd></div>
        </dl>
        <details className={styles.disclosure}>
          <summary>Intent, forecasts and unresolved questions</summary>
          <div className={styles.content}><p>Inferred intent is a hypothesis about purpose; a forecast is a claim about a future outcome. Both remain distinct from observed results. Unknown or unresolved questions remain explicit rather than becoming confident-sounding stories. None of these are generated from current fixtures.</p></div>
        </details>
      </IntelligencePanel>

      <IntelligencePanel as="section" aria-labelledby="confidence-title" bodyClassName="p-sa-4">
        <h2 id="confidence-title" className="sa-type-heading text-base">When we withhold a claim</h2>
        <p className="mt-sa-3 max-w-3xl text-sm text-sa-text-muted">We do not know enough to assess current competitive confidence. No High, Medium, Low or percentage is assigned. Future confidence must explain its evidence and limitations—not just supply a reassuring label.</p>
        <details className={styles.disclosure}>
          <summary>Versions, sources and dates</summary>
          <div className={styles.content}>
            <p>No approved production scoring version or verified data-update timestamp is available for the current competitive fixtures. A code release date is not a data freshness date.</p>
            <p>Future admitted results should identify their sources, inputs, coverage, country-attribution rules and scoring version. A methodology change should be explicit so two differently calculated results are not mistaken for a trend.</p>
            <p>Historical snapshots should begin only when current scoring and source data are defensible. Missing history, rivalry evidence and player attribution remain unavailable; we will withhold a number rather than invent one.</p>
          </div>
        </details>
        <div className="mt-sa-3 flex flex-wrap gap-x-sa-4">
          <Link className={styles.link} href={ROUTES.rankings}>Rankings</Link>
          <Link className={styles.link} href={ROUTES.countries}>Country Intelligence</Link>
          <Link className={styles.link} href={ROUTES.atlas}>Atlas</Link>
          <Link className={styles.link} href={ROUTES.about}>About SkillAtlas</Link>
        </div>
      </IntelligencePanel>
    </div>
  </main>;
}
