"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import { GAME_DEFINITIONS, type GameId } from "@/constants/games";
import { sovereignCountries } from "@/data/countries";
import { matchesSearchQuery } from "@/lib/search";
import {
  ALL_DISCUSSIONS_TOPIC,
  FORUM_DIRECT_TOPICS,
  forumTopicKey,
  type ForumTopic,
} from "./forum-data";

type TopicPickerView = "topics" | "games" | "countries";

type ForumTopicPickerProps = {
  value: ForumTopic;
  onChange: (topic: ForumTopic) => void;
};

type RootTopicOption =
  | { key: string; label: string; topic: ForumTopic }
  | { key: string; label: string; view: Extract<TopicPickerView, "games" | "countries"> };

const gameOptions = GAME_DEFINITIONS.map((game) => ({
  id: game.id,
  label: game.id === "cs2" ? "Counter-Strike 2" : game.name,
}));

const countryOptions = [...sovereignCountries]
  .map((country) => ({ id: country.id, name: country.name }))
  .sort((left, right) => left.name.localeCompare(right.name));

const gameLabelById = new Map<GameId, string>(
  gameOptions.map((game) => [game.id, game.label])
);
const countryNameById = new Map(
  countryOptions.map((country) => [country.id, country.name])
);
const directTopicLabelByType = new Map(
  FORUM_DIRECT_TOPICS.map((topic) => [topic.type, topic.label])
);
const rootTopicOptions: readonly RootTopicOption[] = [
  {
    key: "topic-all",
    label: "All Discussions",
    topic: ALL_DISCUSSIONS_TOPIC,
  },
  { key: "topic-games", label: "Games", view: "games" },
  { key: "topic-countries", label: "Countries", view: "countries" },
  ...FORUM_DIRECT_TOPICS.map((topic) => ({
    key: `topic-${topic.type}`,
    label: topic.label,
    topic: { type: topic.type },
  })),
];
const rootTopicOptionKeys = rootTopicOptions.map((option) => option.key);
const gameOptionKeys = gameOptions.map((game) => `game-${game.id}`);

export function getForumTopicLabel(topic: ForumTopic) {
  if (topic.type === "all") return "All Discussions";
  if (topic.type === "game") {
    return `Games / ${gameLabelById.get(topic.gameId) ?? topic.gameId}`;
  }
  if (topic.type === "country") {
    return `Countries / ${countryNameById.get(topic.countryId) ?? topic.countryId}`;
  }
  return directTopicLabelByType.get(topic.type) ?? "All Discussions";
}

function Chevron({ direction = "right" }: { direction?: "down" | "right" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-4 w-4 flex-none text-sa-accent ${direction === "down" ? "rotate-90" : ""}`}
      aria-hidden="true"
    >
      <path
        d="m6 4 4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export default function ForumTopicPicker({ value, onChange }: ForumTopicPickerProps) {
  const generatedId = useId().replace(/:/g, "");
  const panelId = `forum-topic-picker-${generatedId}`;
  const labelId = `${panelId}-label`;
  const titleId = `${panelId}-title`;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef(new Map<string, HTMLButtonElement>());
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<TopicPickerView>("topics");
  const [countrySearch, setCountrySearch] = useState("");

  const filteredCountries = useMemo(
    () =>
      countryOptions.filter((country) =>
        matchesSearchQuery(countrySearch, [country.name])
      ),
    [countrySearch]
  );
  const filteredCountryKeys = useMemo(
    () => filteredCountries.map((country) => `country-${country.id}`),
    [filteredCountries]
  );

  const closePicker = useCallback((returnFocus = false) => {
    setOpen(false);
    setView("topics");
    setCountrySearch("");

    if (returnFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !containerRef.current?.contains(target)) {
        closePicker(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closePicker, open]);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      if (view === "countries") {
        panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
        return;
      }

      const preferredKey =
        view === "games"
          ? value.type === "game"
            ? `game-${value.gameId}`
            : `game-${gameOptions[0]?.id}`
          : value.type === "game"
            ? "topic-games"
            : value.type === "country"
              ? "topic-countries"
              : `topic-${value.type}`;

      optionRefs.current.get(preferredKey)?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, value, view]);

  function registerOption(key: string, node: HTMLButtonElement | null) {
    if (node) optionRefs.current.set(key, node);
    else optionRefs.current.delete(key);
  }

  function focusOption(keys: readonly string[], index: number) {
    const boundedIndex = Math.min(keys.length - 1, Math.max(0, index));
    const key = keys[boundedIndex];
    if (key) optionRefs.current.get(key)?.focus();
  }

  function handleOptionKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    keys: readonly string[],
    index: number,
    activate: () => void
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(keys, index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(keys, index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusOption(keys, 0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusOption(keys, keys.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  }

  function handleActivationKey(
    event: KeyboardEvent<HTMLButtonElement>,
    activate: () => void
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  }

  function selectTopic(topic: ForumTopic) {
    onChange(topic);
    closePicker(true);
  }

  const selectedKey = forumTopicKey(value);

  function rootOptionIsSelected(option: RootTopicOption) {
    if ("view" in option) {
      return option.view === "games"
        ? value.type === "game"
        : value.type === "country";
    }
    return forumTopicKey(option.topic) === selectedKey;
  }

  function activateRootOption(option: RootTopicOption) {
    if ("view" in option) setView(option.view);
    else selectTopic(option.topic);
  }

  return (
    <div ref={containerRef} className="relative min-w-0">
      <DataLabel id={labelId} as="span" className="mb-sa-1 block">
        Topic
      </DataLabel>
      <button
        ref={triggerRef}
        type="button"
        aria-labelledby={`${labelId} ${panelId}-value`}
        aria-haspopup="dialog"
        aria-controls={panelId}
        aria-expanded={open}
        onClick={() => {
          if (open) closePicker(true);
          else {
            setView("topics");
            setCountrySearch("");
            setOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open) closePicker(true);
            else {
              setView("topics");
              setCountrySearch("");
              setOpen(true);
            }
          } else if (!open && event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex h-11 w-full items-center justify-between gap-sa-3 rounded-sa-control border border-sa-border-subtle bg-sa-surface-1 px-sa-3 text-left text-sm font-semibold text-sa-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-sa-standard hover:border-sa-border-strong focus-visible:border-sa-border-active focus-visible:ring-4 focus-visible:ring-sa-accent/15 lg:h-10"
      >
        <span id={`${panelId}-value`} className="min-w-0 truncate">
          {getForumTopicLabel(value)}
        </span>
        <svg
          viewBox="0 0 16 16"
          className={`h-4 w-4 flex-none text-sa-accent transition-transform duration-200 ease-sa-standard ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            d="m4 6 4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          onKeyDownCapture={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              closePicker(true);
            }
          }}
          className="fixed inset-x-4 bottom-4 z-[130] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-sa-control border border-sa-border-strong bg-sa-surface-1 shadow-[0_16px_40px_rgba(15,23,42,0.2)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+6px)] sm:w-[360px] sm:max-h-[min(28rem,calc(100vh-7rem))] sm:overflow-hidden"
        >
          {view === "topics" ? (
            <div className="p-sa-2">
              <DataLabel id={titleId} as="p" className="px-sa-2 pb-sa-1 pt-sa-1">
                Topics
              </DataLabel>
              <div className="grid" aria-label="Forum topics">
                {rootTopicOptions.map((option, index) => {
                  const selected = rootOptionIsSelected(option);
                  const activate = () => activateRootOption(option);

                  return (
                    <button
                      key={option.key}
                      ref={(node) => registerOption(option.key, node)}
                      type="button"
                      aria-pressed={selected}
                      onClick={activate}
                      onKeyDown={(event) =>
                        handleOptionKeyDown(
                          event,
                          rootTopicOptionKeys,
                          index,
                          activate
                        )
                      }
                      className={`flex min-h-11 w-full items-center justify-between gap-sa-3 rounded-sa-sm px-sa-3 py-sa-2 text-left text-sm font-semibold outline-none transition-colors duration-150 ease-sa-standard focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sa-accent ${
                        selected
                          ? "bg-sa-accent/12 text-sa-text-primary"
                          : "text-sa-text-muted hover:bg-sa-surface-2"
                      }`}
                    >
                      <span>{option.label}</span>
                      {"view" in option ? (
                        <Chevron />
                      ) : selected ? (
                        <span className="font-sa-data text-[10px] font-bold uppercase tracking-[0.12em] text-sa-accent">
                          Selected
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {view === "games" ? (
            <div className="p-sa-2">
              <button
                type="button"
                onClick={() => setView("topics")}
                onKeyDown={(event) =>
                  handleActivationKey(event, () => setView("topics"))
                }
                className="flex min-h-10 items-center gap-sa-2 rounded-sa-sm px-sa-2 text-xs font-bold text-sa-accent outline-none transition-colors duration-150 hover:bg-sa-surface-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sa-accent"
              >
                <span aria-hidden="true">←</span>
                Topics
              </button>
              <DataLabel id={titleId} as="p" className="px-sa-2 pb-sa-1 pt-sa-2">
                Games
              </DataLabel>
              <div className="grid" aria-label="Game topics">
                {gameOptions.map((game, index) => {
                  const optionKey = `game-${game.id}`;
                  const selected = selectedKey === `game:${game.id}`;

                  return (
                    <button
                      key={game.id}
                      ref={(node) => registerOption(optionKey, node)}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectTopic({ type: "game", gameId: game.id })}
                      onKeyDown={(event) =>
                        handleOptionKeyDown(event, gameOptionKeys, index, () =>
                          selectTopic({ type: "game", gameId: game.id })
                        )
                      }
                      className={`flex min-h-11 w-full items-center justify-between gap-sa-3 rounded-sa-sm px-sa-3 py-sa-2 text-left text-sm font-semibold outline-none transition-colors duration-150 ease-sa-standard focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sa-accent ${
                        selected
                          ? "bg-sa-accent/12 text-sa-text-primary"
                          : "text-sa-text-muted hover:bg-sa-surface-2"
                      }`}
                    >
                      <span>{game.label}</span>
                      {selected ? (
                        <span className="font-sa-data text-[10px] font-bold uppercase tracking-[0.12em] text-sa-accent">
                          Selected
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {view === "countries" ? (
            <div className="flex min-h-0 flex-col p-sa-2">
              <button
                type="button"
                onClick={() => setView("topics")}
                onKeyDown={(event) =>
                  handleActivationKey(event, () => setView("topics"))
                }
                className="flex min-h-10 w-fit items-center gap-sa-2 rounded-sa-sm px-sa-2 text-xs font-bold text-sa-accent outline-none transition-colors duration-150 hover:bg-sa-surface-2 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sa-accent"
              >
                <span aria-hidden="true">←</span>
                Topics
              </button>
              <div className="flex items-baseline justify-between gap-sa-3 px-sa-2 pb-sa-1 pt-sa-2">
                <DataLabel id={titleId} as="p">
                  Countries
                </DataLabel>
                <span className="font-sa-data text-[10px] text-sa-text-technical">
                  {countryOptions.length} sovereign countries
                </span>
              </div>
              <label className="relative mx-sa-2 mt-sa-1 block">
                <span className="sr-only">Search countries within Topics</span>
                <input
                  type="search"
                  value={countrySearch}
                  onChange={(event) => setCountrySearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" && filteredCountries[0]) {
                      event.preventDefault();
                      optionRefs.current.get(`country-${filteredCountries[0].id}`)?.focus();
                    }
                  }}
                  placeholder="Search countries..."
                  className="h-11 w-full rounded-sa-control border border-sa-border-subtle bg-sa-surface-1 px-sa-3 pr-10 text-sm font-semibold text-sa-text-primary outline-none transition-[border-color,box-shadow] duration-200 ease-sa-standard placeholder:text-sa-text-technical focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15"
                />
                <svg
                  viewBox="0 0 20 20"
                  className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-sa-accent"
                  aria-hidden="true"
                >
                  <circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m12.4 12.4 4.1 4.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                </svg>
              </label>

              <div
                className="mt-sa-2 max-h-64 overflow-y-auto overscroll-contain px-sa-1 pb-sa-1"
                role="listbox"
                aria-label="Sovereign country topics"
              >
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country, index) => {
                    const optionKey = `country-${country.id}`;
                    const selected = selectedKey === `country:${country.id}`;

                    return (
                      <button
                        key={country.id}
                        ref={(node) => registerOption(optionKey, node)}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        tabIndex={index === 0 ? 0 : -1}
                        onClick={() =>
                          selectTopic({ type: "country", countryId: country.id })
                        }
                        onKeyDown={(event) => {
                          if (event.key === "ArrowUp" && index === 0) {
                            event.preventDefault();
                            panelRef.current
                              ?.querySelector<HTMLInputElement>("input")
                              ?.focus();
                            return;
                          }
                          handleOptionKeyDown(
                            event,
                            filteredCountryKeys,
                            index,
                            () =>
                              selectTopic({
                                type: "country",
                                countryId: country.id,
                              })
                          );
                        }}
                        className={`flex min-h-11 w-full items-center justify-between gap-sa-3 rounded-sa-sm px-sa-3 py-sa-2 text-left text-sm font-semibold outline-none transition-colors duration-150 ease-sa-standard focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sa-accent ${
                          selected
                            ? "bg-sa-accent/12 text-sa-text-primary"
                            : "text-sa-text-muted hover:bg-sa-surface-2"
                        }`}
                      >
                        <span>{country.name}</span>
                        {selected ? (
                          <span className="font-sa-data text-[10px] font-bold uppercase tracking-[0.12em] text-sa-accent">
                            Selected
                          </span>
                        ) : null}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-sa-3 py-sa-5 text-center" role="status">
                    <p className="text-sm font-bold text-sa-text-primary">No countries match.</p>
                    <p className="mt-sa-1 text-xs leading-5 text-sa-text-muted">
                      Try a shorter country name.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
