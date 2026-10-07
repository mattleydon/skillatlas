import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { isDataTimestamp } from "@/lib/data-foundations";
import { DATA_STATES, UNKNOWN_CONFIDENCE, type Confidence, type DataState, type EvidenceSummary } from "@/lib/evidence";
import styles from "./evidence.module.css";

export function DataStateBadge({ state }: { state: DataState }) {
  return <span className={`sa-type-label ${styles.badge}`} data-state={state}><span className="sr-only">Data state: </span>{DATA_STATES[state].label}</span>;
}

export function ConfidenceIndicator({ confidence = UNKNOWN_CONFIDENCE }: { confidence?: Confidence }) {
  return <span className={styles.confidence}>
    <span>Confidence: </span>
    <strong>{confidence.status === "unknown" ? "UNKNOWN" : confidence.label}</strong>
    {confidence.status === "assessed" ? <span> — {confidence.rationale} (Evidence: {confidence.sourceIds.join(", ")})</span> : null}
  </span>;
}

export function MethodologyLink() {
  return <Link className={styles.link} href={ROUTES.methodology}>Methodology</Link>;
}

export function WhyThisResult({ evidence, compact = false, showMethodologyLink = true, context }: {
  evidence: EvidenceSummary; compact?: boolean; showMethodologyLink?: boolean; context: string;
}) {
  // Each clock keeps its meaning. Never substitute build/deployment time.
  const clocks = [
    ["sourceUpdatedAt", "Source updated at"], ["observedAt", "SkillAtlas observed at"],
    ["collectedAt", "SkillAtlas collected at"], ["admittedAt", "SkillAtlas admitted at"],
    ["recalculatedAt", "Value recalculated at"],
  ] as const;
  const knownClocks = clocks.flatMap(([key, label]) => {
    const value = evidence.timestamps?.[key];
    return value && isDataTimestamp(value) ? [{ key, label, value }] : [];
  });
  return <details className={styles.disclosure}>
    <summary>Why this result?<span className="sr-only"> {context}</span></summary>
    <div className={styles.content}>
      <DataStateBadge state={evidence.state} />
      <p>{evidence.explanation}</p>
      <ConfidenceIndicator confidence={evidence.confidence} />
      {!compact ? <>
        <dl className={styles.metadata}>
          <div><dt>Competitive evidence</dt><dd>{evidence.evidenceStatus === "available" ? "Available — see named sources" : DATA_STATES[evidence.evidenceStatus].label}</dd></div>
          <div><dt>Scoring methodology version</dt><dd>{evidence.methodologyVersion ?? "UNAVAILABLE — no approved production version"}</dd></div>
          {knownClocks.length ? knownClocks.map(({ key, label, value }) => <div key={key}><dt>{label}</dt><dd><time dateTime={value}>{value}</time></dd></div>)
            : <div><dt>Data timestamps</dt><dd>UNKNOWN — no verified update timestamp</dd></div>}
        </dl>
        {evidence.sources?.length ? <div>
          <p className="sa-type-label text-xs">Value origins</p>
          <ul className={styles.list}>{evidence.sources.map((source) => <li key={source.id}>
            {source.label} — {source.kind === "fixture" ? "fixture origin, not competitive evidence" : source.kind === "reference" ? "reference only" : "competitive evidence"}.
          </li>)}</ul>
        </div> : null}
      </> : null}
      <ul className={styles.list}>{evidence.limitations.map((note) => <li key={note}>{note}</li>)}</ul>
      {showMethodologyLink ? <MethodologyLink /> : null}
    </div>
  </details>;
}
