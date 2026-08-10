"use client";

import { useMemo, useState } from "react";
import CountryFlag from "@/app/components/country-flag";
import CompactSelect, {
  type CompactSelectOption,
} from "@/app/components/intelligence-ui/compact-select";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import SearchBar from "@/app/components/search-bar";
import Sparkline from "@/app/components/sparkline";
import { GAMES, type Game as RankedGame } from "@/constants/games";
import { matchesSearchQuery } from "@/lib/search";
import {
  prototypePlayers,
  type PrototypePlayer as PlayerProfile,
} from "./player-data";

type GameFilter = "Overall" | RankedGame;
type SortKey = "rank" | "score" | "country" | "game";
type SortDirection = "asc" | "desc";

const GAME_FILTER_OPTIONS: readonly CompactSelectOption<GameFilter>[] = [
  { value: "Overall", label: "Overall" },
  ...GAMES.map((game) => ({
    value: game,
    label: game === "CS2" ? "Counter-Strike 2" : game,
  })),
];

function gameDisplayName(game: RankedGame) {
  return game === "CS2" ? "Counter-Strike 2" : game;
}

function PlayerAvatar({ profile }: { profile: PlayerProfile }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-sa-control border border-sa-border-strong bg-sa-surface-2 text-[11px] font-black uppercase tracking-[0.08em] text-sa-accent"
    >
      {profile.handle.slice(0, 2)}
    </span>
  );
}

function movementLabel(value: number) {
  if (value > 0) return `+${value}`;
  if (value < 0) return String(value);
  return "—";
}

function movementClass(value: number) {
  if (value > 0) return "text-sa-positive";
  if (value < 0) return "text-sa-negative";
  return "text-sa-text-technical";
}

function mostCommonValue(values: string[]) {
  const counts = new Map<string, number>();
  let leader = "";
  let leaderCount = 0;

  values.forEach((value) => {
    const nextCount = (counts.get(value) ?? 0) + 1;
    counts.set(value, nextCount);
    if (nextCount > leaderCount) {
      leader = value;
      leaderCount = nextCount;
    }
  });

  return leader;
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

function PlayersBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--sa-border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--sa-border-subtle)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />
      <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-sa-accent/8 blur-3xl" />
      <div className="absolute -left-32 bottom-12 h-64 w-64 rounded-full bg-sa-negative/5 blur-3xl" />
    </div>
  );
}

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState<GameFilter>("Overall");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const scopedPlayers = useMemo(
    () =>
      selectedGame === "Overall"
        ? [...prototypePlayers]
        : prototypePlayers.filter((profile) => profile.game === selectedGame),
    [selectedGame],
  );

  const scopeRanks = useMemo(() => {
    const ranked = [...scopedPlayers].sort(
      (left, right) => right.score - left.score || left.rank - right.rank,
    );
    return new Map(ranked.map((profile, index) => [profile.id, index + 1]));
  }, [scopedPlayers]);

  const visiblePlayers = useMemo(() => {
    const filtered = scopedPlayers.filter((profile) =>
      matchesSearchQuery(search, [
        profile.handle,
        profile.realName,
        profile.country,
        profile.team ?? "",
        profile.game,
        gameDisplayName(profile.game),
      ]),
    );

    return filtered.sort((left, right) => {
      let comparison = 0;

      if (sortKey === "rank") {
        comparison =
          (scopeRanks.get(left.id) ?? left.rank) -
          (scopeRanks.get(right.id) ?? right.rank);
      } else if (sortKey === "score") {
        comparison = left.score - right.score;
      } else if (sortKey === "country") {
        comparison = left.country.localeCompare(right.country);
      } else {
        comparison = gameDisplayName(left.game).localeCompare(
          gameDisplayName(right.game),
        );
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [scopeRanks, scopedPlayers, search, sortDirection, sortKey]);

  const summary = useMemo(() => {
    const ranked = [...scopedPlayers].sort(
      (left, right) => right.score - left.score || left.rank - right.rank,
    );
    const biggestMover = [...ranked]
      .filter((profile) => profile.trend > 0)
      .sort(
        (left, right) =>
          right.trend - left.trend || left.rank - right.rank,
      )[0];
    const biggestFaller = [...ranked]
      .filter((profile) => profile.trend < 0)
      .sort(
        (left, right) =>
          left.trend - right.trend || left.rank - right.rank,
      )[0];

    return {
      topPlayer: ranked[0],
      leadingCountry: mostCommonValue(
        ranked
          .slice(0, Math.min(10, ranked.length))
          .map((profile) => profile.country),
      ),
      biggestMover,
      biggestFaller,
    };
  }, [scopedPlayers]);

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "score" ? "desc" : "asc");
  }

  function clearFilters() {
    setSearch("");
    setSelectedGame("Overall");
    setSortKey("rank");
    setSortDirection("asc");
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-sa-canvas text-sa-text-primary">
      <PlayersBackground />

      <div className="skillatlas-page-shell relative mx-auto w-full max-w-[1600px] px-4 pb-7 sm:px-6 lg:px-8 lg:pb-9">
        <IntelligencePanel
          as="section"
          aria-labelledby="elite-player-rankings-title"
          className="mb-sa-3"
          bodyClassName="px-sa-3 py-sa-3 sm:px-sa-4"
        >
          <div className="flex flex-col gap-sa-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <DataLabel as="p" className="mb-sa-1 text-sa-accent">
                SkillAtlas / Players
              </DataLabel>
              <h1
                id="elite-player-rankings-title"
                className="text-[1.625rem] font-black leading-tight tracking-[-0.045em] sm:text-4xl"
              >
                Elite Player Rankings
              </h1>
              <p className="mt-sa-1 max-w-2xl text-sm leading-6 text-sa-text-muted sm:text-[15px]">
                Compare the current prototype player field across the overall index
                and six competitive disciplines.
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
          aria-label="Player ranking controls"
          className="mb-sa-3"
          bodyClassName="p-sa-3"
        >
          <div className="grid gap-sa-3 md:grid-cols-[minmax(0,1fr)_minmax(210px,0.28fr)] md:items-end">
            <div>
              <DataLabel as="span" className="mb-sa-1 block">
                Search players
              </DataLabel>
              <SearchBar
                label="Search players by handle, real name, country, team, or game"
                placeholder="Search handle, real name, country, team, or game"
                value={search}
                onValueChange={setSearch}
                variant="intelligence"
              />
            </div>
            <CompactSelect
              id="player-game-filter"
              label="Ranking scope"
              value={selectedGame}
              options={GAME_FILTER_OPTIONS}
              onChange={(value) => {
                setSelectedGame(value);
                setSortKey("rank");
                setSortDirection("asc");
              }}
            />
          </div>
        </IntelligencePanel>

        <section
          aria-label="Player ranking summary"
          className="mb-sa-3 grid grid-cols-2 overflow-hidden rounded-sa-panel border border-sa-border-subtle bg-sa-surface-1 lg:grid-cols-4"
        >
          <div className="min-w-0 border-b border-r border-sa-border-subtle px-sa-3 py-sa-3 lg:border-b-0">
            <DataLabel as="p">#1 player</DataLabel>
            <p className="mt-1 truncate text-sm font-black">
              {summary.topPlayer?.handle ?? "—"}
            </p>
          </div>
          <div className="min-w-0 border-b border-sa-border-subtle px-sa-3 py-sa-3 lg:border-b-0 lg:border-r">
            <DataLabel as="p">Leading country</DataLabel>
            <p className="mt-1 truncate text-sm font-black">
              {summary.leadingCountry || "—"}
            </p>
          </div>
          <div className="min-w-0 border-r border-sa-border-subtle px-sa-3 py-sa-3">
            <DataLabel as="p">Biggest mover</DataLabel>
            <p className="mt-1 flex items-center gap-2 truncate text-sm font-black">
              <span className="truncate">{summary.biggestMover?.handle ?? "—"}</span>
              {summary.biggestMover ? (
                <span className={movementClass(summary.biggestMover.trend)}>
                  {movementLabel(summary.biggestMover.trend)}
                </span>
              ) : null}
            </p>
          </div>
          <div className="min-w-0 px-sa-3 py-sa-3">
            <DataLabel as="p">Biggest faller</DataLabel>
            <p className="mt-1 flex items-center gap-2 truncate text-sm font-black">
              <span className="truncate">{summary.biggestFaller?.handle ?? "—"}</span>
              {summary.biggestFaller ? (
                <span className={movementClass(summary.biggestFaller.trend)}>
                  {movementLabel(summary.biggestFaller.trend)}
                </span>
              ) : null}
            </p>
          </div>
        </section>

        <IntelligencePanel
          as="section"
          aria-labelledby="elite-ranking-table-title"
          bodyClassName="overflow-x-auto"
          header={
            <div className="flex flex-col gap-sa-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="elite-ranking-table-title" className="text-sm font-black">
                  {selectedGame === "Overall"
                    ? "Overall player index"
                    : `${gameDisplayName(selectedGame)} player index`}
                </h2>
                <p className="mt-1 text-xs leading-5 text-sa-text-technical">
                  Prototype scores, movement, and histories are local presentation
                  fixtures—not methodology-approved rankings.
                </p>
              </div>
              <p className="shrink-0 text-xs font-bold tabular-nums text-sa-text-muted">
                {visiblePlayers.length} of {scopedPlayers.length} records
              </p>
            </div>
          }
        >
          {visiblePlayers.length ? (
            <table className="w-full table-fixed border-collapse sm:min-w-[640px] sm:table-auto lg:min-w-[1040px]">
              <caption className="sr-only">
                Prototype elite player rankings. Activate a column heading to sort.
              </caption>
              <thead className="border-b border-sa-border-subtle bg-sa-surface-2/75">
                <tr>
                  <SortHeader
                    label="Rank"
                    sortKey="rank"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="w-14 sm:w-20"
                  />
                  <th
                    scope="col"
                    className="px-sa-3 py-sa-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-sa-text-technical"
                  >
                    Player
                  </th>
                  <SortHeader
                    label="Country"
                    sortKey="country"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="w-14 sm:w-44"
                  />
                  <SortHeader
                    label="Game"
                    sortKey="game"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="hidden w-44 md:table-cell"
                  />
                  <th
                    scope="col"
                    className="hidden px-sa-3 py-sa-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-sa-text-technical lg:table-cell"
                  >
                    Team
                  </th>
                  <SortHeader
                    label="Player skill score"
                    sortKey="score"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="w-24 text-right sm:w-36"
                  />
                  <th
                    scope="col"
                    className="hidden px-sa-3 py-sa-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-sa-text-technical xl:table-cell"
                  >
                    Trend
                  </th>
                  <th
                    scope="col"
                    className="hidden w-28 px-sa-3 py-sa-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-sa-text-technical lg:table-cell"
                  >
                    Rank change
                  </th>
                </tr>
              </thead>
              <tbody>
                {visiblePlayers.map((profile) => {
                  const rank = scopeRanks.get(profile.id) ?? profile.rank;

                  return (
                    <tr
                      key={profile.id}
                      className="border-b border-sa-border-subtle last:border-b-0 hover:bg-sa-surface-2/70"
                    >
                      <td className="px-2 py-sa-2 align-middle sm:px-sa-3">
                        <span className="text-sm font-black tabular-nums">
                          #{rank}
                        </span>
                      </td>
                      <td className="px-2 py-sa-2 align-middle sm:px-sa-3">
                        <div className="flex min-w-0 items-center gap-sa-2">
                          <PlayerAvatar profile={profile} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">
                              {profile.handle}
                            </p>
                            <p className="hidden truncate text-[11px] text-sa-text-technical sm:block">
                              {profile.realName}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] text-sa-text-technical md:hidden">
                              {profile.country} · {gameDisplayName(profile.game)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-sa-2 align-middle sm:px-sa-3">
                        <div className="flex items-center gap-sa-2">
                          <CountryFlag
                            country={{
                              name: profile.country,
                              flagCode: profile.countryCode,
                            }}
                            size="sm"
                          />
                          <span className="hidden truncate text-xs font-semibold sm:inline">
                            {profile.country}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-sa-3 py-sa-2 align-middle text-xs font-semibold text-sa-text-muted md:table-cell">
                        {gameDisplayName(profile.game)}
                      </td>
                      <td className="hidden px-sa-3 py-sa-2 align-middle text-xs text-sa-text-technical lg:table-cell">
                        {profile.team ?? "—"}
                      </td>
                      <td className="px-2 py-sa-2 text-right align-middle sm:px-sa-3">
                        <span className="text-sm font-black tabular-nums text-sa-accent">
                          {profile.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="hidden px-sa-3 py-sa-2 align-middle xl:table-cell">
                        <Sparkline values={profile.oneYearScore} />
                      </td>
                      <td
                        className={`hidden px-sa-3 py-sa-2 text-right align-middle text-xs font-black tabular-nums lg:table-cell ${movementClass(
                          profile.trend,
                        )}`}
                      >
                        {movementLabel(profile.trend)}
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
                Adjust the player search or ranking scope.
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
