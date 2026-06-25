"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const THEME_KEY = "skillatlas-theme";

function applyTheme(darkMode: boolean) {
  document.documentElement.classList.toggle("skillatlas-dark", darkMode);
  document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  window.localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  window.dispatchEvent(new CustomEvent("skillatlas-theme-change", { detail: { darkMode } }));
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setDarkMode(shouldUseDark);
    applyTheme(shouldUseDark);
    setReady(true);
  }, []);

  function toggleTheme() {
    setDarkMode((current) => {
      const next = !current;
      applyTheme(next);
      return next;
    });
  }

  return (
    <>
      <style>{`
        :root {
          --skillatlas-charcoal: #2f3a46;
          --skillatlas-charcoal-2: #354250;
          --skillatlas-charcoal-3: #273341;
          --skillatlas-charcoal-4: #202b37;
          --skillatlas-text-dark: #e8eef7;
          --skillatlas-muted-dark: #cbd5e1;
          --skillatlas-turquoise: #19d3cf;
          --skillatlas-pink: #ff2fa8;
        }

        html.skillatlas-dark,
        html.skillatlas-dark body {
          background: var(--skillatlas-charcoal);
          color: var(--skillatlas-text-dark);
        }

        html.skillatlas-dark [class*="bg-[#F8FAFC]"],
        html.skillatlas-dark [class*="bg-[#f8fafc]"],
        html.skillatlas-dark [class*="bg-slate-50"] {
          background-color: var(--skillatlas-charcoal) !important;
        }

        html.skillatlas-dark [class*="bg-white"] {
          background-color: rgba(53, 66, 80, 0.94) !important;
        }

        html.skillatlas-dark [class*="bg-gray-50"] {
          background-color: rgba(39, 51, 65, 0.82) !important;
        }

        html.skillatlas-dark [class*="bg-[linear-gradient"] {
          background-image: linear-gradient(180deg, #2f3a46 0%, #283442 100%) !important;
        }

        html.skillatlas-dark [class*="bg-[radial-gradient"] {
          opacity: 0.62 !important;
          filter: saturate(1.1) brightness(0.72);
        }

        html.skillatlas-dark [class*="text-gray-"] {
          color: var(--skillatlas-muted-dark) !important;
        }

        html.skillatlas-dark [class*="text-[#111827]"] {
          color: var(--skillatlas-text-dark) !important;
        }

        html.skillatlas-dark [class*="border-gray-"] {
          border-color: rgba(203, 213, 225, 0.34) !important;
        }

        html.skillatlas-dark header {
          background-color: rgba(47, 58, 70, 0.97) !important;
        }

        html.skillatlas-dark input,
        html.skillatlas-dark textarea,
        html.skillatlas-dark select {
          background-color: rgba(39, 51, 65, 0.9) !important;
          color: var(--skillatlas-text-dark) !important;
        }

        html.skillatlas-dark table,
        html.skillatlas-dark tr {
          border-color: rgba(255, 47, 168, 0.28) !important;
        }

        html.skillatlas-dark canvas {
          filter: drop-shadow(0 0 34px rgba(25, 211, 207, 0.08));
        }

        .skillatlas-theme-switch {
          position: fixed;
          right: 76px;
          top: 12px;
          z-index: 100;
          width: 58px;
          height: 30px;
          border-radius: 999px;
          border: 2px solid #0f2530;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.12);
          transition:
            background-color 260ms ease,
            border-color 260ms ease,
            opacity 260ms ease,
            transform 260ms ease;
        }

        .skillatlas-theme-switch:hover {
          transform: translateY(-1px);
          border-color: var(--skillatlas-turquoise);
        }

        .skillatlas-theme-track-icon {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          line-height: 1;
          transition: opacity 220ms ease;
          pointer-events: none;
        }

        .skillatlas-theme-sun {
          left: 9px;
          color: #facc15;
          opacity: 1;
        }

        .skillatlas-theme-moon {
          right: 9px;
          color: #facc15;
          opacity: 0;
        }

        .skillatlas-theme-knob {
          position: absolute;
          left: 3px;
          top: 3px;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #facc15 !important;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.22);
          transition:
            transform 260ms ease,
            background-color 260ms ease;
        }

        html.skillatlas-dark .skillatlas-theme-switch {
          background: #152734 !important;
          border-color: var(--skillatlas-turquoise);
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.22);
        }

        html.skillatlas-dark .skillatlas-theme-sun {
          opacity: 0;
        }

        html.skillatlas-dark .skillatlas-theme-moon {
          opacity: 1;
        }

        html.skillatlas-dark .skillatlas-theme-knob {
          transform: translateX(28px);
          background: #f8fafc !important;
        }

        @media (max-width: 900px) {
          .skillatlas-theme-switch {
            right: 18px;
            top: 12px;
          }
        }
      `}</style>

      <button
        type="button"
        onClick={toggleTheme}
        className={`skillatlas-theme-switch ${ready ? "opacity-100" : "opacity-0"}`}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={darkMode}
      >
        <span className="skillatlas-theme-track-icon skillatlas-theme-sun">☀</span>
        <span className="skillatlas-theme-track-icon skillatlas-theme-moon">☾</span>
        <span className="skillatlas-theme-knob" />
      </button>

      {children}
    </>
  );
}
