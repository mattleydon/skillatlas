"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HeaderMemberState } from "@/app/components/header-member-control";
import CountryFlag from "@/app/components/country-flag";
import { createSearchIndex, groupSearchResults, memberSearchRecords, SEARCH_GROUP_LABELS, searchRecords, type SearchRecord } from "@/lib/global-search";
import { isPlainNavigationClick } from "@/lib/navigation";
import styles from "./global-search.module.css";

function SearchPalette({ records, memberState, onClose }: {
  records: readonly SearchRecord[];
  memberState: HeaderMemberState;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const identityRecords = useMemo(() => memberSearchRecords(memberState), [memberState]);
  const index = useMemo(() => createSearchIndex([...records, ...identityRecords]), [records, identityRecords]);
  const matches = useMemo(() => query.trim()
    ? searchRecords(index, query)
    : records.filter((record) => record.type === "pages" && ["rankings", "atlas", "countries", "games", "players", "methodology"].includes(record.id)), [index, query, records]);
  const groups = groupSearchResults(matches);
  const ordered = groups.flatMap((group) => group.results);
  const currentIndex = Math.min(activeIndex, Math.max(ordered.length - 1, 0));

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    inputRef.current?.focus({ preventScroll: true });
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const viewport = window.visualViewport;
    const fitViewport = () => {
      dialog?.style.setProperty("--search-viewport-height", `${viewport?.height ?? window.innerHeight}px`);
      dialog?.style.setProperty("--search-viewport-top", `${viewport?.offsetTop ?? 0}px`);
    };
    fitViewport();
    viewport?.addEventListener("resize", fitViewport);
    viewport?.addEventListener("scroll", fitViewport);
    return () => {
      viewport?.removeEventListener("resize", fitViewport);
      viewport?.removeEventListener("scroll", fitViewport);
      document.documentElement.style.overflow = previousOverflow;
      dialog?.close();
    };
  }, []);

  function moveSelection(next: number) {
    setActiveIndex(next);
    // Scroll only the internal results region, never the underlying document.
    const row = resultRefs.current[next];
    const region = row?.closest<HTMLElement>(`[data-search-results]`);
    if (row && region) {
      const bounds = row.getBoundingClientRect();
      const parent = region.getBoundingClientRect();
      if (bounds.top < parent.top) region.scrollTop -= parent.top - bounds.top;
      else if (bounds.bottom > parent.bottom) region.scrollTop += bounds.bottom - parent.bottom;
    }
  }

  return createPortal(
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="global-search-title" onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        // Search inputs consume Escape to clear their value in some browsers.
        // Handle it explicitly so the documented close gesture always wins.
        if (event.key === "Escape" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        } else if (event.key === "Tab") {
          const stops = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button, input, a[href]") ?? []);
          const first = stops[0];
          const last = stops[stops.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({ preventScroll: true }); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
        } else if (event.target instanceof HTMLAnchorElement && ordered.length) {
          const next = event.key === "ArrowDown" ? (currentIndex + 1) % ordered.length
            : event.key === "ArrowUp" ? (currentIndex + ordered.length - 1) % ordered.length
              : event.key === "Home" ? 0 : event.key === "End" ? ordered.length - 1 : null;
          if (next !== null) { event.preventDefault(); moveSelection(next); resultRefs.current[next]?.focus({ preventScroll: true }); }
        }
      }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={styles.surface}>
        <div className={styles.heading}>
          <h2 id="global-search-title" className="sa-type-label">Global Search</h2>
          <button type="button" onClick={onClose} className={styles.close} aria-label="Close Global Search">Close <span aria-hidden="true">×</span></button>
        </div>
        <label className={styles.inputLabel}>
          <span className="sr-only">Search SkillAtlas</span>
          <input ref={inputRef} type="search" role="combobox" aria-expanded="true" aria-autocomplete="list"
            aria-controls="global-search-results" aria-activedescendant={ordered.length ? `global-search-result-${currentIndex}` : undefined}
            aria-describedby="global-search-help" autoComplete="off" spellCheck={false} maxLength={120}
            value={query} placeholder="Countries, games, players, destinations…"
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (ordered.length) moveSelection((currentIndex + (event.key === "ArrowDown" ? 1 : ordered.length - 1)) % ordered.length);
              } else if (event.key === "Enter" && ordered.length && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
                event.preventDefault();
                resultRefs.current[currentIndex]?.click();
              }
            }} />
        </label>
        <p className={styles.status} role="status" aria-live="polite" aria-atomic="true">
          {query.trim() ? `${ordered.length}${ordered.length === 20 ? " top" : ""} ${ordered.length === 1 ? "result" : "results"}` : "Jump to a destination, or type to find an entity."}
        </p>
        <div id="global-search-results" role="listbox" aria-label="Search results" data-search-results className={styles.results}>
          {groups.map((group) => (
            <div key={group.type} role="group" aria-labelledby={`global-search-group-${group.type}`}>
              <h3 id={`global-search-group-${group.type}`} className={`sa-type-label ${styles.group}`}>{SEARCH_GROUP_LABELS[group.type]}</h3>
              {group.results.map((record) => {
                const position = ordered.indexOf(record);
                return <Link key={`${record.type}:${record.id}`} id={`global-search-result-${position}`} ref={(node) => { resultRefs.current[position] = node; }}
                  role="option" aria-selected={position === currentIndex} tabIndex={0} prefetch={false}
                  href={record.href} className={styles.result} onFocus={() => setActiveIndex(position)}
                  onClick={(event) => { if (isPlainNavigationClick(event)) onClose(); }}>
                  {record.flagCode ? <span aria-hidden="true"><CountryFlag country={{ name: record.label, flagCode: record.flagCode }} size="sm" /></span> : null}
                  <span className={styles.copy}><strong>{record.label}</strong><small>{record.context}</small></span>
                  <span aria-hidden="true" className={styles.arrow}>→</span>
                </Link>;
              })}
            </div>
          ))}
          {ordered.length === 0 ? <p className={styles.empty}>No results. Try a country, game, player name or destination such as Methodology.</p> : null}
        </div>
        <p id="global-search-help" className={styles.help}>↑ ↓ to choose · Enter to open · Esc to close. Member discovery is not yet available; signed-in members can find their own profile.</p>
      </div>
    </dialog>, document.body,
  );
}

export default function GlobalSearch({ records, memberState, onOpen }: {
  records: readonly SearchRecord[];
  memberState: HeaderMemberState;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const openSearch = useCallback(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    onOpen();
    setOpen(true);
  }, [onOpen]);
  const closeSearch = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => {
      const previous = returnFocusRef.current;
      if (previous?.isConnected && !previous.closest("[inert]")) previous.focus({ preventScroll: true });
      else triggerRef.current?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat || event.altKey || event.shiftKey || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return;
      if (!open && document.querySelector("dialog[open]")) return;
      event.preventDefault();
      if (open) closeSearch(); else openSearch();
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [open, openSearch, closeSearch]);

  return <>
    <button ref={triggerRef} type="button" className={styles.trigger} aria-label="Search SkillAtlas" aria-haspopup="dialog" aria-keyshortcuts="Control+k Meta+k" onClick={openSearch}>
      <svg viewBox="0 0 20 20" width="19" height="19" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.25" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="m12.4 12.4 4.1 4.1" stroke="currentColor" strokeWidth="1.5" /></svg>
    </button>
    {open ? <SearchPalette records={records} memberState={memberState} onClose={closeSearch} /> : null}
  </>;
}
