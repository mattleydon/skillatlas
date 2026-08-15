"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  PRIMARY_NAV_ITEMS as navigationItems,
  RANKING_NAV_ITEMS as rankingItems,
  ROUTES,
} from "@/constants/routes";
import { useSkillAtlasTheme } from "@/app/theme-provider";

const rankingPaths = new Set<string>(rankingItems.map((item) => item.href));
const desktopNavigationItems = navigationItems.filter((item) => item.href !== ROUTES.about);
const aboutNavigationItem = navigationItems.find((item) => item.href === ROUTES.about);
const mobileMenuId = "skillatlas-mobile-navigation";
const mobileRankingsMenuId = "skillatlas-mobile-rankings-navigation";

function normalisePath(pathname: string) {
  if (!pathname || pathname === ROUTES.rankings) return ROUTES.rankings;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function pathIsActive(pathname: string, href: string) {
  if (href === ROUTES.rankings) return pathname === ROUTES.rankings;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function preventRedundantNavigation(
  event: MouseEvent<HTMLAnchorElement>,
  pathname: string,
  href: string
) {
  if (
    normalisePath(href) !== pathname ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.currentTarget.target === "_blank"
  ) {
    return;
  }

  event.preventDefault();
}

function ThemeSwitch({
  className,
  darkMode,
  onToggle,
}: {
  className: string;
  darkMode: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`skillatlas-theme-switch ${className}`}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={darkMode}
    >
      <span className="skillatlas-theme-visual-track" aria-hidden="true">
        <span className="skillatlas-theme-track-icon skillatlas-theme-sun">☀</span>
        <span className="skillatlas-theme-track-icon skillatlas-theme-moon">☾</span>
        <span className="skillatlas-theme-knob" />
      </span>
    </button>
  );
}

export default function SiteHeader() {
  const pathname = normalisePath(usePathname() || ROUTES.rankings);
  const { darkMode, toggleTheme } = useSkillAtlasTheme();
  const hidden = pathname.startsWith(ROUTES.spaceInvaders);
  const rankingsActive = rankingPaths.has(pathname);
  const mobileRankingsDefaultOpen = pathname === ROUTES.userRankings || pathname === ROUTES.liveRankings;
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const [mobileRankingsState, setMobileRankingsState] = useState({
    pathname,
    open: mobileRankingsDefaultOpen,
  });
  const headerRef = useRef<HTMLElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuOpen = mobileMenuPath === pathname;
  const mobileRankingsOpen =
    mobileRankingsState.pathname === pathname
      ? mobileRankingsState.open
      : mobileRankingsDefaultOpen;

  const closeMobileMenu = useCallback(() => {
    setMobileMenuPath(null);
    setMobileRankingsState({ pathname, open: mobileRankingsDefaultOpen });
  }, [mobileRankingsDefaultOpen, pathname]);

  const toggleMobileMenu = useCallback(() => {
    if (mobileMenuOpen) {
      closeMobileMenu();
      return;
    }

    setMobileRankingsState({ pathname, open: mobileRankingsDefaultOpen });
    setMobileMenuPath(pathname);
  }, [closeMobileMenu, mobileMenuOpen, mobileRankingsDefaultOpen, pathname]);

  useEffect(() => {
    if (hidden) return;

    const handleScroll = () => setScrolled(window.scrollY > 24);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [hidden]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;

      closeMobileMenu();
      mobileMenuButtonRef.current?.focus();
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (target instanceof Node && !headerRef.current?.contains(target)) {
        closeMobileMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closeMobileMenu, mobileMenuOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1280px)");
    const handleDesktopChange = () => {
      if (desktopQuery.matches) closeMobileMenu();
    };

    desktopQuery.addEventListener("change", handleDesktopChange);

    return () => desktopQuery.removeEventListener("change", handleDesktopChange);
  }, [closeMobileMenu]);

  if (hidden) return null;

  const linkClassName = `font-semibold text-gray-700 transition-all duration-300 hover:text-[#19d3cf] ${
    scrolled ? "text-sm" : "text-[1rem]"
  }`;

  return (
    <header
      ref={headerRef}
      data-scrolled={scrolled ? "true" : "false"}
      className={`fixed left-0 right-0 top-0 z-50 border-b border-[#ff2fa8]/25 bg-white/95 backdrop-blur transition-all duration-300 ${
        scrolled ? "h-[68px] xl:h-[72px]" : "h-[80px] xl:h-[126px]"
      }`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center px-4 pr-[124px] sm:px-6 sm:pr-[124px] min-[901px]:pr-[164px] xl:px-8 xl:pr-8">
        <div className="flex min-w-0 shrink-0 items-center gap-3 xl:mr-8 xl:gap-5">
          <Link
            href={ROUTES.spaceInvaders}
            className={`relative shrink-0 transition-all duration-300 ${
              scrolled ? "h-10 w-10 xl:h-11 xl:w-11" : "h-14 w-14 xl:h-24 xl:w-24"
            }`}
          >
            <Image
              src="/skillatlas-logo.png"
              alt="SkillAtlas logo"
              fill
              sizes={scrolled ? "(min-width: 1280px) 44px, 40px" : "(min-width: 1280px) 96px, 56px"}
              className="object-contain"
              priority
            />
          </Link>

          <Link
            href={ROUTES.rankings}
            onClick={(event) => preventRedundantNavigation(event, pathname, ROUTES.rankings)}
            className={`relative hidden min-w-0 shrink-0 transition-all duration-300 min-[360px]:block ${
              scrolled
                ? "h-6 w-28 sm:w-40 xl:h-7 xl:w-44"
                : "h-8 w-28 sm:w-48 xl:h-14 xl:w-80"
            }`}
          >
            <Image
              src="/skillatlas-title.png"
              alt="SkillAtlas title"
              fill
              sizes={
                scrolled
                  ? "(min-width: 1280px) 176px, (min-width: 640px) 160px, 112px"
                  : "(min-width: 1280px) 320px, (min-width: 640px) 192px, 112px"
              }
              className="object-contain object-left"
              priority
            />
          </Link>
        </div>

        <nav
          className="skillatlas-desktop-nav hidden items-center xl:grid"
          aria-label="Primary navigation"
        >
          <div className="skillatlas-rankings-dropdown" data-skillatlas-rankings-dropdown="true">
            <Link
              href={ROUTES.rankings}
              className={`${linkClassName} skillatlas-rankings-trigger ${rankingsActive ? "skillatlas-active-nav" : ""}`}
              aria-haspopup="true"
              aria-current={rankingsActive ? "page" : undefined}
              onClick={(event) => preventRedundantNavigation(event, pathname, ROUTES.rankings)}
            >
              <span>Rankings</span>
            </Link>

            <div className="skillatlas-rankings-menu" role="menu">
              {rankingItems.map((item) => {
                const active = pathIsActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`skillatlas-rankings-menu-item ${active ? "skillatlas-active-nav" : ""}`}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                    onClick={(event) => preventRedundantNavigation(event, pathname, item.href)}
                  >
                    <span>{item.label}</span>
                    <small>{item.description}</small>
                  </Link>
                );
              })}
            </div>
          </div>

          {desktopNavigationItems.map((item) => {
            const active = pathIsActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${linkClassName} ${active ? "skillatlas-active-nav" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={(event) => preventRedundantNavigation(event, pathname, item.href)}
              >
                {item.label}
              </Link>
            );
          })}

          {aboutNavigationItem && (
            <div className="skillatlas-about-slot">
              <Link
                href={aboutNavigationItem.href}
                className={`${linkClassName} ${pathIsActive(pathname, aboutNavigationItem.href) ? "skillatlas-active-nav" : ""}`}
                aria-current={pathIsActive(pathname, aboutNavigationItem.href) ? "page" : undefined}
                onClick={(event) =>
                  preventRedundantNavigation(event, pathname, aboutNavigationItem.href)
                }
              >
                {aboutNavigationItem.label}
              </Link>
              <ThemeSwitch
                className="skillatlas-theme-switch-desktop"
                darkMode={darkMode}
                onToggle={toggleTheme}
              />
            </div>
          )}
        </nav>

        <ThemeSwitch
          className="skillatlas-theme-switch-mobile xl:hidden"
          darkMode={darkMode}
          onToggle={toggleTheme}
        />

        <button
          ref={mobileMenuButtonRef}
          type="button"
          className="skillatlas-mobile-menu-button absolute right-[76px] top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl min-[901px]:right-[116px] xl:hidden"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-controls={mobileMenuId}
          aria-expanded={mobileMenuOpen}
          onClick={toggleMobileMenu}
        >
          <span className="relative block h-4 w-5" aria-hidden="true">
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-5 rounded-full bg-[#19d3cf] transition-transform duration-300 ${
                mobileMenuOpen ? "rotate-45" : "-translate-y-1.5"
              }`}
            />
            <span
              className={`skillatlas-mobile-menu-middle absolute left-0 top-1/2 h-0.5 w-5 rounded-full bg-[#2f3a46] transition-opacity duration-200 ${
                mobileMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-5 rounded-full bg-[#ff2fa8] transition-transform duration-300 ${
                mobileMenuOpen ? "-rotate-45" : "translate-y-1.5"
              }`}
            />
          </span>
        </button>

        <nav
          id={mobileMenuId}
          className={`skillatlas-mobile-nav absolute left-3 right-3 top-full mt-3 max-h-[calc(100vh-96px)] origin-top-right overflow-y-auto rounded-3xl p-3 shadow-2xl transition-[opacity,transform] duration-300 ease-out sm:left-auto sm:right-5 sm:w-[380px] min-[901px]:right-14 xl:hidden ${
            mobileMenuOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-2 scale-95 opacity-0"
          }`}
          aria-label="Mobile navigation"
          aria-hidden={!mobileMenuOpen}
        >
          <div
            className={`skillatlas-mobile-rankings rounded-2xl border p-2 ${
              rankingsActive ? "skillatlas-mobile-section-active" : ""
            }`}
          >
            <button
              type="button"
              className="skillatlas-mobile-section-label flex w-full items-center justify-between px-3 py-2 text-left text-xs font-black uppercase tracking-[0.18em]"
              aria-controls={mobileRankingsMenuId}
              aria-expanded={mobileRankingsOpen}
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() =>
                setMobileRankingsState({ pathname, open: !mobileRankingsOpen })
              }
            >
              <span>Rankings</span>
              <svg
                viewBox="0 0 16 16"
                className={`h-4 w-4 text-[#19d3cf] transition-transform duration-300 ${mobileRankingsOpen ? "rotate-180" : "rotate-0"}`}
                aria-hidden="true"
              >
                <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>

            <div
              id={mobileRankingsMenuId}
              aria-hidden={!mobileRankingsOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                mobileRankingsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="grid gap-1">
                  {rankingItems.map((item) => {
                    const active = pathIsActive(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        tabIndex={mobileMenuOpen && mobileRankingsOpen ? 0 : -1}
                        className={`skillatlas-mobile-nav-link skillatlas-mobile-ranking-link flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-extrabold ${
                          active ? "skillatlas-active-nav skillatlas-mobile-nav-link-active" : ""
                        }`}
                        aria-current={active ? "page" : undefined}
                        onClick={(event) => {
                          preventRedundantNavigation(event, pathname, item.href);
                          closeMobileMenu();
                        }}
                      >
                        <span>{item.label}</span>
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-[#ff2fa8]" aria-hidden="true" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 grid gap-1">
            {navigationItems.map((item) => {
              const active = pathIsActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  tabIndex={mobileMenuOpen ? 0 : -1}
                  className={`skillatlas-mobile-nav-link flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black ${
                    active ? "skillatlas-active-nav skillatlas-mobile-nav-link-active" : ""
                  }`}
                  aria-current={active ? "page" : undefined}
                  onClick={(event) => {
                    preventRedundantNavigation(event, pathname, item.href);
                    closeMobileMenu();
                  }}
                >
                  <span>{item.label}</span>
                  {active && <span className="h-2 w-2 rounded-full bg-[#ff2fa8]" aria-hidden="true" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
