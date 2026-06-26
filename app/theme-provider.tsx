"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const THEME_KEY = "skillatlas-theme";
const LIGHT_TITLE_LOGO_SRC = "/skillatlas-title.png";
const DARK_TITLE_LOGO_SRC = "/skillatlas-title-dark.png";

function applyTheme(darkMode: boolean) {
  document.documentElement.classList.add("skillatlas-theme-changing");
  document.documentElement.classList.toggle("skillatlas-dark", darkMode);
  document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  window.localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  swapTitleLogos(darkMode);
  window.dispatchEvent(new CustomEvent("skillatlas-theme-change", { detail: { darkMode } }));

  window.setTimeout(() => {
    document.documentElement.classList.remove("skillatlas-theme-changing");
  }, 620);
}


function normaliseHref(path: string) {
  if (!path) return "/";
  const withoutOrigin = path.replace(/^https?:\/\/[^/]+/i, "");
  const cleanPath = withoutOrigin.split("?")[0].split("#")[0];
  if (!cleanPath || cleanPath === "") return "/";
  return cleanPath.endsWith("/") && cleanPath.length > 1 ? cleanPath.slice(0, -1) : cleanPath;
}

function updateActiveHeaderNavigation() {
  const currentPath = normaliseHref(window.location.pathname);
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("header nav a[href]"));

  links.forEach((link) => {
    const linkPath = normaliseHref(link.getAttribute("href") ?? "");
    const isRankings = currentPath === "/" && linkPath === "/";
    const isOtherPage = linkPath !== "/" && currentPath.startsWith(linkPath);
    const isActive = isRankings || isOtherPage;

    link.classList.toggle("skillatlas-active-nav", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });
}


function isSkillAtlasTitleImage(image: HTMLImageElement) {
  const alt = image.getAttribute("alt")?.toLowerCase() ?? "";
  const src = image.getAttribute("src") ?? "";
  const currentSrc = image.currentSrc ?? "";

  return (
    alt.includes("skillatlas title") ||
    src.includes("skillatlas-title") ||
    currentSrc.includes("skillatlas-title")
  );
}

function swapTitleLogos(darkMode: boolean, animated = true) {
  const targetSrc = darkMode ? DARK_TITLE_LOGO_SRC : LIGHT_TITLE_LOGO_SRC;
  const images = Array.from(document.querySelectorAll<HTMLImageElement>("img")).filter(isSkillAtlasTitleImage);

  images.forEach((image) => {
    const currentRawSrc = image.getAttribute("src") ?? "";
    const currentSrc = image.currentSrc || currentRawSrc;

    if (currentRawSrc.includes(targetSrc) || currentSrc.includes(targetSrc)) return;

    image.classList.add("skillatlas-title-logo-transition");

    if (!animated) {
      image.removeAttribute("srcset");
      image.src = targetSrc;
      return;
    }

    image.classList.add("skillatlas-title-logo-fade-out");

    window.setTimeout(() => {
      image.removeAttribute("srcset");
      image.src = targetSrc;
      image.classList.remove("skillatlas-title-logo-fade-out");
    }, 190);
  });
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [ready, setReady] = useState(false);
  const [headerShrunk, setHeaderShrunk] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setDarkMode(shouldUseDark);
    applyTheme(shouldUseDark);
    window.setTimeout(() => swapTitleLogos(shouldUseDark, false), 0);
    setReady(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setHeaderShrunk(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    updateActiveHeaderNavigation();

    const observer = new MutationObserver(() => {
      updateActiveHeaderNavigation();
      swapTitleLogos(document.documentElement.classList.contains("skillatlas-dark"), false);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("popstate", updateActiveHeaderNavigation);
    window.addEventListener("skillatlas-theme-change", updateActiveHeaderNavigation);

    const handleClick = () => {
      window.setTimeout(updateActiveHeaderNavigation, 0);
      window.setTimeout(updateActiveHeaderNavigation, 120);
    };

    document.addEventListener("click", handleClick);

    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", updateActiveHeaderNavigation);
      window.removeEventListener("skillatlas-theme-change", updateActiveHeaderNavigation);
      document.removeEventListener("click", handleClick);
    };
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


        header nav a.skillatlas-active-nav {
          color: var(--skillatlas-turquoise) !important;
        }

        header nav a[aria-current="page"] {
          color: var(--skillatlas-turquoise) !important;
        }



        html,
        body,
        main,
        header,
        section,
        aside,
        nav,
        article,
        div,
        button,
        a,
        p,
        h1,
        h2,
        h3,
        span,
        table,
        thead,
        tbody,
        tr,
        th,
        td,
        input,
        textarea,
        select,
        canvas {
          transition-property: background-color, background-image, border-color, color, fill, stroke, opacity, box-shadow, filter, transform;
          transition-duration: 520ms;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }

        html.skillatlas-theme-changing *,
        html.skillatlas-theme-changing *::before,
        html.skillatlas-theme-changing *::after {
          transition-delay: 0ms !important;
          transition-duration: 520ms !important;
          transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important;
        }

        html.skillatlas-theme-changing [class*="duration-500"],
        html.skillatlas-theme-changing [class*="duration-700"],
        html.skillatlas-theme-changing [class*="duration-1000"] {
          transition-duration: 520ms !important;
        }

        html.skillatlas-theme-changing [class*="bg-white"],
        html.skillatlas-theme-changing [class*="bg-gray-50"],
        html.skillatlas-theme-changing [class*="bg-[#F8FAFC]"],
        html.skillatlas-theme-changing [class*="bg-[#f8fafc]"],
        html.skillatlas-theme-changing [class*="text-gray-"],
        html.skillatlas-theme-changing [class*="text-[#111827]"] {
          transition-property: background-color, background-image, border-color, color, opacity, box-shadow, filter, transform !important;
        }

        .skillatlas-title-logo-transition {
          transition:
            opacity 380ms cubic-bezier(0.22, 1, 0.36, 1),
            filter 380ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 380ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, filter, transform;
        }

        .skillatlas-title-logo-fade-out {
          opacity: 0;
          filter: blur(1.5px);
          transform: translateY(-1px) scale(0.992);
        }

        .skillatlas-theme-switch {
          position: fixed;
          right: 56px;
          top: 12px;
          z-index: 100;
          width: 46px;
          height: 24px;
          border-radius: 999px;
          border: 2px solid #0f2530;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.12);
          transition:
            background-color 420ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 420ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 420ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .skillatlas-theme-switch:hover {
          transform: translateY(-1px);
          border-color: var(--skillatlas-turquoise);
        }

        .skillatlas-theme-track-icon {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          font-size: 11px;
          line-height: 1;
          transition: opacity 360ms cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: none;
        }

        .skillatlas-theme-sun {
          left: 7px;
          color: #facc15;
          opacity: 1;
        }

        .skillatlas-theme-moon {
          right: 7px;
          color: #facc15;
          opacity: 0;
        }

        .skillatlas-theme-knob {
          position: absolute;
          left: 3px;
          top: 2px;
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: var(--skillatlas-charcoal) !important;
          box-shadow: 0 2px 7px rgba(15, 23, 42, 0.22);
          transition:
            transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
            background-color 420ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        html.skillatlas-dark .skillatlas-theme-switch {
          background: #172838 !important;
          border-color: #f8fafc;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
        }

        html.skillatlas-dark .skillatlas-theme-switch:hover {
          border-color: var(--skillatlas-turquoise);
        }

        html.skillatlas-dark .skillatlas-theme-sun {
          opacity: 0;
        }

        html.skillatlas-dark .skillatlas-theme-moon {
          opacity: 1;
        }

        html.skillatlas-dark .skillatlas-theme-knob {
          transform: translateX(20px);
          background: #f8fafc !important;
        }


        @media (prefers-reduced-motion: reduce) {
          html,
          body,
          main,
          header,
          section,
          aside,
          nav,
          article,
          div,
          button,
          a,
          p,
          h1,
          h2,
          h3,
          span,
          table,
          thead,
          tbody,
          tr,
          th,
          td,
          input,
          textarea,
          select,
          canvas,
          *,
          *::before,
          *::after {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
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
        className={`skillatlas-theme-switch ${
          ready && !headerShrunk ? "opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
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
