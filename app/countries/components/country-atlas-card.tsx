import { memo } from "react";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import MetricStrip, { MetricItem } from "@/app/components/intelligence-ui/metric-strip";
import Sparkline from "@/app/components/sparkline";
import type { CountryAtlasRecord } from "@/data/countries";
import styles from "../countries.module.css";

function CountryAtlasCard({
  country,
  selected,
}: {
  country: CountryAtlasRecord;
  selected: boolean;
}) {
  const trendDirection = country.trend > 0 ? "positive" : country.trend < 0 ? "negative" : "neutral";
  const trendPrefix = country.trend > 0 ? "▲" : country.trend < 0 ? "▼" : "—";
  const latestScore = country.oneYearScore.at(-1) ?? country.dominanceScore;

  return (
    <IntelligencePanel
      as="article"
      className={`${styles.countryCard} ${selected ? styles.countryCardSelected : ""}`}
      data-selected={selected || undefined}
      aria-label={`${country.name} competitive intelligence${selected ? ", selected" : ""}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-sa-3 px-sa-3 py-sa-3">
        <div className="min-w-0">
          <h3 className="break-words text-[15px] font-bold leading-5 text-sa-text-primary">{country.name}</h3>
          <DataLabel as="p" className="mt-0.5">{country.region}</DataLabel>
        </div>
        <p className="font-sa-data text-lg font-bold leading-5 text-sa-accent" aria-label={`Overall rank ${country.rank}`}>
          #{String(country.rank).padStart(2, "0")}
        </p>
      </div>

      <MetricStrip>
        <MetricItem label="Best Game">
          <span className="block break-words">
            {country.highestAchievement.game}
          </span>
        </MetricItem>
        <MetricItem label="Skill Score">{country.dominanceScore.toFixed(1)}</MetricItem>
      </MetricStrip>

      <MetricStrip>
        <MetricItem label="Highest Achievement">
          <span className="block break-words">
            #{country.highestAchievement.rank} {country.highestAchievement.game}
          </span>
        </MetricItem>
        <MetricItem label="Trend">
          <span className={styles[`trend${trendDirection[0].toUpperCase()}${trendDirection.slice(1)}`]}>
            {trendPrefix}{country.trend === 0 ? "" : Math.abs(country.trend)}
          </span>
        </MetricItem>
      </MetricStrip>

      <div className="flex items-end justify-between gap-sa-3 border-t border-sa-border-subtle px-sa-3 py-sa-2">
        <div>
          <DataLabel as="p">1Y Score</DataLabel>
          <p className="mt-0.5 font-sa-data text-xs font-bold text-sa-text-muted">{latestScore.toFixed(1)}</p>
        </div>
        <Sparkline values={country.oneYearScore} />
      </div>
    </IntelligencePanel>
  );
}

export default memo(CountryAtlasCard);
