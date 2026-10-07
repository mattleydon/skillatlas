"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CountryRankingScope, PrototypeCountryRanking } from "@/data/country-rankings";
import { rankingFilterValues, suggestRankingFilters } from "@/lib/rankings-filter";

export default function RankingsFilter({ label, placeholder, value, onValueChange, rows, scope }: {
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  rows: readonly PrototypeCountryRanking[];
  scope: CountryRankingScope;
}) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const values = useMemo(() => rankingFilterValues(rows, scope), [rows, scope]);
  const suggestions = useMemo(() => suggestRankingFilters(values, value), [values, value]);
  const expanded = open && value.trim().length > 0;
  const activeIndex = active < suggestions.length ? active : -1;

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  useEffect(() => {
    const option = optionRefs.current[activeIndex];
    const list = listRef.current;
    if (!expanded || !option || !list) return;
    const row = option.getBoundingClientRect();
    const box = list.getBoundingClientRect();
    if (row.top < box.top) list.scrollTop -= box.top - row.top;
    else if (row.bottom > box.bottom) list.scrollTop += row.bottom - box.bottom;
  }, [activeIndex, expanded]);

  function choose(index: number) {
    const suggestion = suggestions[index];
    if (!suggestion) return;
    onValueChange(suggestion.label);
    inputRef.current?.focus({ preventScroll: true });
    setOpen(false);
    setActive(-1);
  }

  return (
    <div ref={containerRef} className="relative min-w-0" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <label className="relative block">
        <span className="sr-only">{label}</span>
        <input ref={inputRef} value={value} placeholder={placeholder} role="combobox" aria-autocomplete="list"
          aria-expanded={expanded} aria-controls={expanded ? `${id}-suggestions` : undefined}
          aria-activedescendant={expanded && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
          autoComplete="off" spellCheck={false}
          onFocus={() => setOpen(true)}
          onChange={(event) => { onValueChange(event.target.value); setActive(-1); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Escape" && expanded) {
              event.preventDefault(); event.stopPropagation(); setOpen(false);
            } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && suggestions.length) {
              event.preventDefault(); setOpen(true);
              setActive(!expanded || activeIndex < 0 ? (event.key === "ArrowDown" ? 0 : suggestions.length - 1)
                : (activeIndex + (event.key === "ArrowDown" ? 1 : suggestions.length - 1)) % suggestions.length);
            } else if (event.key === "Enter" && expanded && suggestions.length && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
              event.preventDefault(); choose(activeIndex >= 0 ? activeIndex : 0);
            } else if (event.key === "Tab") setOpen(false);
          }}
          className="h-11 w-full rounded-sa-control border border-sa-border-subtle bg-sa-surface-1 px-sa-3 pr-10 text-sm font-normal text-sa-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-sa-standard placeholder:text-sa-text-technical focus:border-sa-border-active focus:ring-4 focus:ring-sa-accent/15 lg:h-10" />
        <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-sa-accent" aria-hidden="true">
          <path d="M3 4h14M6 10h8M9 16h2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </label>
      {expanded ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 border border-sa-border-strong bg-sa-surface-1 text-sa-text-primary shadow-[0_12px_30px_rgba(15,23,42,0.16)]">
          <div ref={listRef} id={`${id}-suggestions`} role="listbox" aria-label="Rankings filter suggestions" className="max-h-[min(16rem,35dvh)] overflow-y-auto overscroll-contain p-sa-1">
            {(["Countries", "Regions", "Games"] as const).map((group) => {
              const options = suggestions.filter((option) => option.group === group);
              return options.length ? <div key={group} role="group" aria-labelledby={`${id}-${group}`}>
                <div id={`${id}-${group}`} className="sa-type-label px-sa-2 py-sa-1 text-[10px] text-sa-text-technical">{group}</div>
                {options.map((option) => {
                  const index = suggestions.indexOf(option);
                  return <button key={option.id} ref={(node) => { optionRefs.current[index] = node; }} id={`${id}-option-${index}`}
                    type="button" role="option" aria-selected={index === activeIndex} tabIndex={-1}
                    onMouseDown={(event) => event.preventDefault()} onClick={() => choose(index)}
                    className={`flex min-h-11 w-full items-center justify-between gap-2 border-l-2 px-sa-2 py-sa-2 text-left text-sm hover:bg-sa-surface-inset focus-visible:outline-2 focus-visible:outline-sa-text-primary ${index === activeIndex ? "border-sa-border-active bg-sa-surface-inset" : "border-transparent"}`}>
                    {option.label}<span aria-hidden="true">{index === activeIndex ? "↵" : ""}</span>
                  </button>;
                })}
              </div> : null;
            })}
          </div>
          <p role="status" className="border-t border-sa-border-subtle px-sa-3 py-sa-2 text-xs text-sa-text-technical">
            {suggestions.length ? `${suggestions.length} matching values · ↑ ↓ to choose · Enter to apply · Esc to close` : "No matching filter values."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
