import Link from "next/link";
import { DataStateBadge, ConfidenceIndicator, MethodologyLink, WhyThisResult } from "@/app/components/evidence/evidence-ui";
import { DOSSIER_EVIDENCE } from "@/lib/evidence";
import CountryFlag from "@/app/components/country-flag";
import { ROUTES } from "@/constants/routes";
import { GAMES } from "@/constants/games";
import { sovereignCountries, type CountryAtlasRecord } from "@/data/countries";
import { getPrototypeCountryRankings } from "@/data/country-rankings";
import styles from "../countries.module.css";

export default function CountryDossier({ country, visibleCount, onClear }: {
  country?: CountryAtlasRecord; visibleCount: number; onClear: () => void;
}) {
  if (!country) return <section className={styles.dossier} aria-label="Country information">
    <p className="sa-type-label text-sa-text-muted">Country information / No selection</p>
    <h2 className="sa-type-heading mt-sa-3">A country, in context.</h2>
    <p className="mt-sa-3 text-sa-text-muted">Choose a country from the index or map to inspect its identity, available fixture results and the gaps in our knowledge.</p>
    <dl className={styles.standing}><div><dt>Product catalogue <DataStateBadge state="canonical" /></dt><dd>195 countries</dd></div><div><dt>Current discovery view</dt><dd>{visibleCount} {visibleCount === 1 ? "country" : "countries"}</dd></div></dl>
    <h3 className="sa-type-heading mt-sa-4">What we know — and what we do not</h3>
    <p className="mt-sa-2 text-sa-text-muted">Names, regions and map outlines support geographic discovery. Competitive ranks and scores are demonstration fixtures, not verified performance evidence.</p>
    <p className="mt-sa-3 text-sa-text-muted">Verified history and rivalry evidence are UNAVAILABLE. Competitive confidence and country-attribution policy are UNKNOWN or unresolved.</p>
    <div className="mt-sa-3 flex flex-wrap items-center gap-sa-3"><DataStateBadge state="fixture" /><ConfidenceIndicator /><MethodologyLink /></div>
    <Link className={styles.dossierLink} href={ROUTES.atlas}>Explore global geography in Atlas →</Link>
  </section>;

  const regional = sovereignCountries.filter((item) => item.region === country.region).sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  return <section className={styles.dossier} aria-label="Country information">
    <div className="flex items-start justify-between gap-sa-3">
      <div className="flex items-center gap-sa-3"><CountryFlag country={country} size="lg" />
        <div><p className="sa-type-label text-sa-text-muted">Geographic identity <DataStateBadge state="canonical" /></p><h2 className="sa-type-heading">{country.name}</h2><p className="text-sm text-sa-text-muted">{country.region}</p></div>
      </div>
      <button type="button" onClick={onClear} className={styles.dossierLink} aria-label="Clear selected country">Clear</button>
    </div>
    <div className={styles.dataNotice}><DataStateBadge state="fixture" /> Competitive values below are prototype data, not authoritative intelligence.</div>
    <dl className={styles.standing}>
      <div><dt>Global rank · fixture</dt><dd>#{country.rank}</dd></div>
      <div><dt>Regional rank · fixture</dt><dd>#{regional.findIndex((item) => item.id === country.id) + 1}</dd></div>
      <div><dt>Skill score · fixture</dt><dd>{country.dominanceScore.toFixed(1)}</dd></div>
      <div><dt>Movement · fixture</dt><dd>{country.trend > 0 ? "+" : ""}{country.trend}</dd></div>
      <div><dt>Verified peak / history</dt><dd><DataStateBadge state="unavailable" /></dd></div>
      <div><dt>Data confidence</dt><dd><ConfidenceIndicator /></dd></div>
    </dl>
    <details className={styles.dossierDetails} open>
      <summary>Game breakdown <span>Fixture coverage, not competitive breadth</span></summary>
      <div className={styles.gameRows}>
        {GAMES.map((game) => {
          const rows = getPrototypeCountryRankings(game);
          const index = rows.findIndex((row) => row.countryId === country.id);
          const row = rows[index];
          return <div key={game}><h3>{game === "CS2" ? "Counter-Strike 2" : game}</h3>
            {row ? <div><DataStateBadge state="fixture" /><p>#{index + 1} in fixture subset · score {row.score} · movement {row.rankChange > 0 ? "+" : ""}{row.rankChange}</p><ConfidenceIndicator /></div> : <div><DataStateBadge state="unavailable" /><p>No fixture row; not evidence of weakness.</p></div>}
          </div>;
        })}
      </div>
    </details>
    <details className={styles.dossierDetails}><summary>Strengths, gaps & player ecosystem</summary>
      <p>UNAVAILABLE · No verified competitive strengths, talent relationships, team attribution or rivalry evidence is available for this dossier. Missing coverage is not a competitive gap.</p>
    </details>
    <WhyThisResult evidence={DOSSIER_EVIDENCE} context={`${country.name} dossier values`} />
    <div className={styles.dossierActions}>
      <MethodologyLink />
      <Link className={styles.dossierLink} href={`${ROUTES.atlas}?country=${encodeURIComponent(country.id)}`}>View in Atlas →</Link>
    </div>
  </section>;
}
