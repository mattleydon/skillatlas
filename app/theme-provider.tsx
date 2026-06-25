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
        html.skillatlas-dark,
        html.skillatlas-dark body {
          background: #111827;
          color: #f8fafc;
        }

        html.skillatlas-dark [class*="bg-[#F8FAFC]"],
        html.skillatlas-dark [class*="bg-[#f8fafc]"] {
          background-color: #111827 !important;
        }

        html.skillatlas-dark [class*="bg-white"] {
          background-color: rgba(31, 41, 55, 0.92) !important;
        }

        html.skillatlas-dark [class*="bg-gray-50"] {
          background-color: rgba(15, 23, 42, 0.72) !important;
        }

        html.skillatlas-dark [class*="text-gray-"] {
          color: rgb(203, 213, 225) !important;
        }

        html.skillatlas-dark [class*="text-[#111827]"] {
          color: rgb(248, 250, 252) !important;
        }

        html.skillatlas-dark header {
          background-color: rgba(17, 24, 39, 0.96) !important;
        }

        html.skillatlas-dark input,
        html.skillatlas-dark textarea,
        html.skillatlas-dark select {
          background-color: rgba(15, 23, 42, 0.84) !important;
          color: #f8fafc !important;
        }

        html.skillatlas-dark table,
        html.skillatlas-dark tr {
          border-color: rgba(255, 47, 168, 0.28) !important;
        }

        html.skillatlas-dark canvas {
          filter: drop-shadow(0 0 34px rgba(25, 211, 207, 0.08));
        }
      `}</style>

      <button
        type="button"
        onClick={toggleTheme}
        className={`fixed right-8 top-3 z-[100] rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] shadow-sm transition-all duration-300 ${
          darkMode
            ? "border-[#19d3cf]/50 bg-[#111827] text-[#19d3cf] hover:bg-[#1f2937]"
            : "border-[#ff2fa8]/30 bg-white/90 text-gray-700 hover:border-[#19d3cf] hover:text-[#19d3cf]"
        } ${ready ? "opacity-100" : "opacity-0"}`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? "Light" : "Dark"}
      </button>

      {children}
    </>
  );
}
