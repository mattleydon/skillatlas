"use client";

import { useEffect, useId, useRef, useState } from "react";

export type CompactSelectOption<Value extends string = string> = {
  value: Value;
  label: string;
  disabled?: boolean;
};

type CompactSelectProps<Value extends string> = {
  id?: string;
  label: string;
  value: Value;
  options: readonly CompactSelectOption<Value>[];
  onChange: (value: Value) => void;
  className?: string;
};

export default function CompactSelect<Value extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className = "",
}: CompactSelectProps<Value>) {
  const generatedId = useId();
  const controlId = id ?? `compact-select-${generatedId.replace(/:/g, "")}`;
  const labelId = `${controlId}-label`;
  const valueId = `${controlId}-value`;
  const listboxId = `${controlId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef(new Map<number, HTMLLIElement>());
  const selectedIndex = options.findIndex((option) => option.value === value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(selectedIndex, 0));

  const enabledIndices = options.flatMap((option, index) =>
    option.disabled ? [] : [index]
  );
  const firstEnabledIndex = enabledIndices[0] ?? -1;
  const lastEnabledIndex = enabledIndices.at(-1) ?? -1;
  const selectedOption = options[selectedIndex] ?? options[firstEnabledIndex];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const listbox = listboxRef.current;
    const option = optionRefs.current.get(activeIndex);
    if (!listbox || !option) return;

    if (option.offsetTop < listbox.scrollTop) {
      listbox.scrollTop = option.offsetTop;
    } else if (option.offsetTop + option.offsetHeight > listbox.scrollTop + listbox.clientHeight) {
      listbox.scrollTop = option.offsetTop + option.offsetHeight - listbox.clientHeight;
    }
  }, [activeIndex, open]);

  function openListbox() {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabledIndex);
    setOpen(true);
  }

  function moveActive(direction: 1 | -1) {
    if (enabledIndices.length === 0) return;

    const currentPosition = enabledIndices.indexOf(activeIndex);
    const nextPosition =
      currentPosition < 0
        ? 0
        : Math.min(enabledIndices.length - 1, Math.max(0, currentPosition + direction));
    setActiveIndex(enabledIndices[nextPosition]);
  }

  function chooseOption(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) openListbox();
      else moveActive(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex(event.key === "Home" ? firstEnabledIndex : lastEnabledIndex);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) chooseOption(activeIndex);
      else openListbox();
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative min-w-0 ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <span id={labelId} className="mb-sa-1 block text-[10px] font-bold uppercase leading-4 tracking-[0.16em] text-sa-text-technical">
        {label}
      </span>
      <button
        id={controlId}
        type="button"
        role="combobox"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open && activeIndex >= 0 ? `${controlId}-option-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openListbox())}
        onKeyDown={handleKeyDown}
        className="flex h-11 w-full items-center justify-between gap-sa-3 rounded-sa-control border border-sa-border-subtle bg-sa-surface-1 px-sa-3 text-left text-sm font-semibold text-sa-text-primary outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-sa-standard hover:border-sa-border-strong focus-visible:border-sa-border-active focus-visible:ring-4 focus-visible:ring-sa-accent/15 lg:h-10"
      >
        <span id={valueId} className="min-w-0 truncate">{selectedOption?.label ?? "Select"}</span>
        <svg
          viewBox="0 0 16 16"
          className={`h-4 w-4 flex-none text-sa-accent transition-transform duration-200 ease-sa-standard ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
        </svg>
      </button>

      {open ? (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-y-auto rounded-sa-control border border-sa-border-strong bg-sa-surface-1 p-sa-1 shadow-[0_12px_30px_rgba(15,23,42,0.16)]"
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            const active = index === activeIndex;

            return (
              <li
                key={option.value}
                ref={(node) => {
                  if (node) optionRefs.current.set(index, node);
                  else optionRefs.current.delete(index);
                }}
                id={`${controlId}-option-${index}`}
                role="option"
                aria-selected={selected}
                aria-disabled={option.disabled || undefined}
                onPointerMove={() => {
                  if (!option.disabled) setActiveIndex(index);
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseOption(index)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-sa-3 rounded-sa-sm px-sa-3 py-sa-2 text-sm font-semibold transition-colors duration-150 ease-sa-standard ${
                  option.disabled
                    ? "cursor-not-allowed text-sa-text-technical opacity-50"
                    : active
                      ? "bg-sa-accent/12 text-sa-text-primary"
                      : "text-sa-text-muted hover:bg-sa-surface-2"
                }`}
              >
                <span>{option.label}</span>
                {selected ? (
                  <svg viewBox="0 0 16 16" className="h-4 w-4 flex-none text-sa-accent" aria-hidden="true">
                    <path d="m3.5 8.3 2.8 2.8 6.2-6.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                  </svg>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
