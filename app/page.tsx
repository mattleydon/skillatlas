"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CountryFlag from "@/app/components/country-flag";
import CompactSelect, {
  type CompactSelectOption,
} from "@/app/components/intelligence-ui/compact-select";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import SearchBar from "@/app/components/search-bar";
import Sparkline from "@/app/components/sparkline";
import { GAMES, type Game } from "@/constants/games";
import { countryRoute } from "@/constants/routes";
import {
  getPrototypeCountryRankings,
  type CountryRankingScope,
  type PrototypeCountryRanking,
} from "@/data/country-rankings";
import { matchesSearchQuery } from "@/lib/search";

type SortKey = "rank" | "country" | "score" | "scoreChange" | "rankChange";
type SortDirection = "asc" | "desc";

const RANKING_SCOPE_OPTIONS: readonly CompactSelectOption<CountryRankingScope>[] = [
  { value: "Overall", label: "Overall" },
  ...GAMES.map((game) => ({
    value: game,
    label: gameDisplayName(game),
  })),
];

function gameDisplayName(game: Game | string) {
  return game === "CS2" ? "Counter-Strike 2" : game;
}

function movementLabel(value: number) {
  if (value > 0) return `▲ +${value}`;
  if (value < 0) return `▼ ${value}`;
  return "—";
}

function movementClass(value: number) {
  if (value > 0) return "text-sa-positive";
  if (value < 0) return "text-sa-negative";
  return "text-sa-text-technical";
}

function scoreChangeLabel(row: PrototypeCountryRanking) {
  if (row.scoreChange === 0) return "—";

  const value = row.scoreChangeUnit === "percent"
    ? `${Math.abs(row.scoreChange).toFixed(1)}%`
    : `${Math.abs(row.scoreChange)} pt${Math.abs(row.scoreChange) === 1 ? "" : "s"}`;

  return `${row.scoreChange > 0 ? "▲ +" : "▼ −"}${value}`;
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sortKey === activeKey;

  return (
    <th
      scope="col"
      aria-sort={
        active ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
      className={`px-2 py-sa-3 text-left sm:px-sa-3 ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex min-h-8 items-center gap-1 rounded-sa-sm text-[10px] font-bold uppercase tracking-[0.14em] outline-none transition-colors duration-200 ease-sa-standard focus-visible:ring-2 focus-visible:ring-sa-accent/35 ${
          active
            ? "text-sa-accent"
            : "text-sa-text-technical hover:text-sa-text-primary"
        }`}
      >
        {label}
        <span
          aria-hidden="true"
          className={`text-[9px] transition-opacity ${
            active ? "opacity-100" : "opacity-35"
          }`}
        >
          {active && direction === "desc" ? "▼" : "▲"}
        </span>
      </button>
    </th>
  );
}

function RankingsBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--sa-border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--sa-border-subtle)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-sa-accent/8 blur-3xl" />
    </div>
  );
}

function RankingTableColumns({ scope }: { scope: CountryRankingScope }) {
  const overall = scope === "Overall";

  return (
    <colgroup>
      <col
        className={`w-[14%] sm:w-[10%] md:w-[8%] lg:w-[7%] ${overall ? "xl:w-[6%]" : "xl:w-[7%]"}`}
      />
      <col
        className={`w-[62%] sm:w-[52%] md:w-[31%] ${overall ? "lg:w-[25%] xl:w-[24%]" : "lg:w-[31%] xl:w-[31%]"}`}
      />
      <col
        className={`hidden md:table-column md:w-[18%] ${overall ? "lg:w-[13%] xl:w-[12%]" : "lg:w-[16%] xl:w-[16%]"}`}
      />
      {overall ? (
        <col className="hidden lg:table-column lg:w-[18%] xl:w-[16%]" />
      ) : null}
      <col
        className={`w-[24%] sm:w-[20%] md:w-[15%] ${overall ? "lg:w-[13%] xl:w-[11%]" : "lg:w-[18%] xl:w-[18%]"}`}
      />
      {overall ? (
        <col className="hidden xl:table-column xl:w-[11%]" />
      ) : null}
      <col
        className={`hidden md:table-column md:w-[16%] ${overall ? "lg:w-[14%] xl:w-[11%]" : "lg:w-[16%] xl:w-[16%]"}`}
      />
      <col
        className={`hidden sm:table-column sm:w-[18%] md:w-[12%] ${overall ? "lg:w-[10%] xl:w-[9%]" : "lg:w-[12%] xl:w-[12%]"}`}
      />
    </colgroup>
  );
}

export default function RankingsPage() {
  const [search, setSearch] = useState("");
  const [selectedScope, setSelectedScope] =
    useState<CountryRankingScope>("Overall");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const scopedCountries = useMemo(
    () => [...getPrototypeCountryRankings(selectedScope)],
    [selectedScope],
  );

  const scopeRanks = useMemo(
    () => new Map(scopedCountries.map((country, index) => [country.countryId, index + 1])),
    [scopedCountries],
  );

  const visibleCountries = useMemo(() => {
    const filtered = scopedCountries.filter((country) =>
      matchesSearchQuery(search, [
        country.country,
        country.region,
        country.bestGame ?? "",
        selectedScope === "Overall" ? "Overall" : selectedScope,
        selectedScope === "Overall" ? "" : gameDisplayName(selectedScope),
      ]),
    );

    return filtered.sort((left, right) => {
      let comparison = 0;

      if (sortKey === "rank") {
        comparison =
          (scopeRanks.get(left.countryId) ?? 0) -
          (scopeRanks.get(right.countryId) ?? 0);
      } else if (sortKey === "country") {
        comparison = left.country.localeCompare(right.country);
      } else if (sortKey === "score") {
        comparison = left.score - right.score;
      } else if (sortKey === "scoreChange") {
        comparison = left.scoreChange - right.scoreChange;
      } else {
        comparison = left.rankChange - right.rankChange;
      }

      if (comparison === 0) {
        comparison =
          (scopeRanks.get(left.countryId) ?? 0) -
          (scopeRanks.get(right.countryId) ?? 0);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [scopeRanks, scopedCountries, search, selectedScope, sortDirection, sortKey]);

  const summary = useMemo(() => {
    const biggestMover = [...scopedCountries]
      .filter((country) => country.rankChange > 0)
      .sort(
        (left, right) =>
          right.rankChange - left.rankChange ||
          (scopeRanks.get(left.countryId) ?? 0) -
            (scopeRanks.get(right.countryId) ?? 0),
      )[0];
    const biggestFaller = [...scopedCountries]
      .filter((country) => country.rankChange < 0)
      .sort(
        (left, right) =>
          left.rankChange - right.rankChange ||
          (scopeRanks.get(left.countryId) ?? 0) -
            (scopeRanks.get(right.countryId) ?? 0),
      )[0];

    return {
      topCountry: scopedCountries[0],
      leadingRegion: scopedCountries[0]?.region,
      biggestMover,
      biggestFaller,
    };
  }, [scopeRanks, scopedCountries]);

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(
      nextKey === "score" || nextKey === "scoreChange" || nextKey === "rankChange"
        ? "desc"
        : "asc",
    );
  }

  function clearFilters() {
    setSearch("");
    setSelectedScope("Overall");
    setSortKey("rank");
    setSortDirection("asc");
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-sa-canvas text-sa-text-primary">
      <RankingsBackground />

      <div className="relative mx-auto w-full max-w-[1600px] px-4 pb-7 pt-[88px] sm:px-6 sm:pt-[92px] lg:px-8 lg:pb-9 xl:pt-[132px]">
        <IntelligencePanel
          as="section"
          aria-labelledby="global-country-rankings-title"
          className="mb-sa-3"
          bodyClassName="px-sa-3 py-sa-3 sm:px-sa-4"
        >
          <div className="flex flex-col gap-sa-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <DataLabel as="p" className="mb-sa-1 text-sa-accent">
                SkillAtlas / Rankings
              </DataLabel>
              <h1
                id="global-country-rankings-title"
                className="text-[1.625rem] font-black leading-tight tracking-[-0.045em] sm:text-4xl"
              >
                Global Country Rankings
              </h1>
              <p className="mt-sa-1 max-w-2xl text-sm leading-6 text-sa-text-muted sm:text-[15px]">
                Compare competitive gaming strength across countries and SkillAtlas games.
              </p>
            </div>

            <div className="flex items-center gap-sa-2 self-start rounded-sa-control border border-sa-border-strong bg-sa-surface-1 px-sa-3 py-sa-2 lg:self-auto">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sa-accent opacity-35 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sa-accent" />
              </span>
              <span className="leading-tight">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-sa-text-technical">
                  Calibration preview
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold text-sa-text-muted">
                  Prototype ranking data
                </span>
              </span>
            </div>
          </div>
        </IntelligencePanel>

        <IntelligencePanel
          as="section"
          aria-label="Country ranking controls"
          className="mb-sa-3"
          bodyClassName="p-sa-3"
        >
          <div className="grid gap-sa-3 md:grid-cols-[minmax(0,1fr)_minmax(210px,0.28fr)] md:items-end">
            <div>
              <DataLabel as="span" className="mb-sa-1 block">
                Search countries
              </DataLabel>
              <SearchBar
                label="Search countries by name, game, or region"
                placeholder="Search country, game, or region"
                value={search}
                onValueChange={setSearch}
                variant="intelligence"
              />
            </div>
            <CompactSelect
              id="country-ranking-scope"
              label="Ranking scope"
              value={selectedScope}
              options={RANKING_SCOPE_OPTIONS}
              onChange={(value) => {
                setSelectedScope(value);
                setSortKey("rank");
                setSortDirection("asc");
              }}
            />
          </div>
        </IntelligencePanel>

        <section
          aria-label="Country ranking summary"
          className="mb-sa-3 grid grid-cols-2 overflow-hidden rounded-sa-panel border border-sa-border-subtle bg-sa-surface-1 lg:grid-cols-4"
        >
          <div className="min-w-0 border-b border-r border-sa-border-subtle px-sa-3 py-sa-3 lg:border-b-0">
            <DataLabel as="p">#1 country</DataLabel>
            <p className="mt-1 truncate text-sm font-black">
              {summary.topCountry ? (
                <Link
                  href={countryRoute(summary.topCountry.countryId)}
                  className="rounded-sa-sm transition-colors duration-200 ease-sa-standard hover:text-sa-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sa-accent/35"
                >
                  {summary.topCountry.country}
                </Link>
              ) : (
                "—"
              )}
            </p>
          </div>
          <div className="min-w-0 border-b border-sa-border-subtle px-sa-3 py-sa-3 lg:border-b-0 lg:border-r">
            <DataLabel as="p">Leading region</DataLabel>
            <p className="mt-1 truncate text-sm font-black">
              {summary.leadingRegion ?? "—"}
            </p>
          </div>
          <div className="min-w-0 border-r border-sa-border-subtle px-sa-3 py-sa-3">
            <DataLabel as="p">Biggest mover</DataLabel>
            <p className="mt-1 flex min-w-0 items-center gap-2 text-sm font-black">
              <span className="truncate">{summary.biggestMover?.country ?? "—"}</span>
              {summary.biggestMover ? (
                <span className={`shrink-0 tabular-nums ${movementClass(summary.biggestMover.rankChange)}`}>
                  {movementLabel(summary.biggestMover.rankChange)}
                </span>
              ) : null}
            </p>
          </div>
          <div className="min-w-0 px-sa-3 py-sa-3">
            <DataLabel as="p">Biggest faller</DataLabel>
            <p className="mt-1 flex min-w-0 items-center gap-2 text-sm font-black">
              <span className="truncate">{summary.biggestFaller?.country ?? "—"}</span>
              {summary.biggestFaller ? (
                <span className={`shrink-0 tabular-nums ${movementClass(summary.biggestFaller.rankChange)}`}>
                  {movementLabel(summary.biggestFaller.rankChange)}
                </span>
              ) : null}
            </p>
          </div>
        </section>

        <IntelligencePanel
          as="section"
          aria-labelledby="country-ranking-table-title"
          bodyClassName="overflow-x-auto"
          header={
            <div className="flex flex-col gap-sa-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="country-ranking-table-title" className="text-sm font-black">
                  {selectedScope === "Overall"
                    ? "Overall country index"
                    : `${gameDisplayName(selectedScope)} country index`}
                </h2>
                <p className="mt-1 text-xs leading-5 text-sa-text-technical">
                  Prototype scores, movement, and histories are local presentation fixtures—not methodology-approved rankings.
                </p>
              </div>
              <p className="shrink-0 text-xs font-bold tabular-nums text-sa-text-muted">
                {visibleCountries.length} of {scopedCountries.length} records
              </p>
            </div>
          }
        >
          {visibleCountries.length ? (
            <table className="w-full table-fixed border-collapse">
              <caption className="sr-only">
                Prototype global country rankings. Activate a column heading to sort.
              </caption>
              <RankingTableColumns scope={selectedScope} />
              <thead className="border-b border-sa-border-subtle bg-sa-surface-2/75">
                <tr>
                  <SortHeader
                    label="Rank"
                    sortKey="rank"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="Country"
                    sortKey="country"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <th
                    scope="col"
                    className="hidden px-sa-3 py-sa-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-sa-text-technical md:table-cell"
                  >
                    Region
                  </th>
                  {selectedScope === "Overall" ? (
                    <th
                      scope="col"
                      className="hidden px-sa-3 py-sa-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-sa-text-technical lg:table-cell"
                    >
                      Best game
                    </th>
                  ) : null}
                  <SortHeader
                    label="Skill score"
                    sortKey="score"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="text-right"
                  />
                  {selectedScope === "Overall" ? (
                    <th
                      scope="col"
                      className="hidden px-sa-3 py-sa-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-sa-text-technical xl:table-cell"
                    >
                      Trend
                    </th>
                  ) : null}
                  <SortHeader
                    label="Score change"
                    sortKey="scoreChange"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="hidden text-right md:table-cell"
                  />
                  <SortHeader
                    label="Rank change"
                    sortKey="rankChange"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="hidden text-right sm:table-cell"
                  />
                </tr>
              </thead>
              <tbody>
                {visibleCountries.map((country) => {
                  const rank = scopeRanks.get(country.countryId) ?? 0;

                  return (
                    <tr
                      key={country.countryId}
                      className="border-b border-sa-border-subtle last:border-b-0 hover:bg-sa-surface-2/70"
                    >
                      <td className="px-2 py-sa-2 align-middle sm:px-sa-3">
                        <span className={`text-sm font-black tabular-nums ${rank <= 3 ? "text-sa-accent" : ""}`}>
                          #{rank}
                        </span>
                      </td>
                      <td className="min-w-0 px-2 py-sa-2 align-middle sm:px-sa-3">
                        <div className="flex min-w-0 items-center gap-sa-2">
                          <CountryFlag
                            country={{
                              name: country.country,
                              flagCode: country.countryCode,
                            }}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <Link
                              href={countryRoute(country.countryId)}
                              className="block truncate rounded-sa-sm text-sm font-black transition-colors duration-200 ease-sa-standard hover:text-sa-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sa-accent/35"
                            >
                              {country.country}
                            </Link>
                            <p className="mt-0.5 truncate text-[10px] text-sa-text-technical md:hidden">
                              {selectedScope === "Overall" && country.bestGame
                                ? `${gameDisplayName(country.bestGame)} · ${country.region}`
                                : country.region}
                              <span className="hidden sm:inline">
                                {` · ${scoreChangeLabel(country)} · ${movementLabel(country.rankChange)}`}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-sa-3 py-sa-2 align-middle text-xs font-medium text-sa-text-technical md:table-cell">
                        {country.region}
                      </td>
                      {selectedScope === "Overall" ? (
                        <td className="hidden px-sa-3 py-sa-2 align-middle text-xs font-semibold text-sa-text-muted lg:table-cell">
                          {country.bestGame ? gameDisplayName(country.bestGame) : "—"}
                        </td>
                      ) : null}
                      <td className="px-2 py-sa-2 text-right align-middle sm:px-sa-3">
                        <span className="text-sm font-black tabular-nums text-sa-accent">
                          {country.score.toFixed(1)}
                        </span>
                      </td>
                      {selectedScope === "Overall" ? (
                        <td className="hidden px-sa-3 py-sa-2 align-middle xl:table-cell">
                          {country.history?.length ? (
                            <Sparkline values={[...country.history]} />
                          ) : (
                            <span className="text-xs text-sa-text-technical">—</span>
                          )}
                        </td>
                      ) : null}
                      <td className={`hidden px-sa-3 py-sa-2 text-right align-middle text-xs font-black tabular-nums md:table-cell ${movementClass(country.scoreChange)}`}>
                        {scoreChangeLabel(country)}
                      </td>
                      <td className={`hidden px-sa-3 py-sa-2 text-right align-middle text-xs font-black tabular-nums sm:table-cell ${movementClass(country.rankChange)}`}>
                        {movementLabel(country.rankChange)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-sa-4 py-16 text-center">
              <DataLabel as="p" className="text-sa-accent">
                No matching records
              </DataLabel>
              <h2 className="mt-sa-2 text-lg font-black">
                Adjust the country search or ranking scope.
              </h2>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-sa-4 min-h-11 rounded-sa-control border border-sa-border-active bg-sa-accent/10 px-sa-4 text-xs font-black uppercase tracking-[0.12em] text-sa-text-primary transition-colors duration-200 ease-sa-standard hover:bg-sa-accent/18 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sa-accent/20"
              >
                Reset filters
              </button>
            </div>
          )}
        </IntelligencePanel>
      </div>
    </main>
  );
}
