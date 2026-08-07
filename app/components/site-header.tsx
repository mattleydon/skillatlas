"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const rankingItems = [
  { label: "Rankings", href: "/", description: "General country rankings" },
  { label: "User Rankings", href: "/user-rankings", description: "Community country votes" },
  { label: "Live Rankings", href: "/live-rankings", description: "Rank countries in real time" },
] as const;

const navigationItems = [
  { label: "World Map", href: "/world-map" },
  { label: "Countries", href: "/countries" },
  { label: "Players", href: "/profiles" },
  { label: "Forum", href: "/forum" },
  { label: "About", href: "/about" },
] as const;

const rankingPaths = rankingItems.map((item) => item.href);

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname() || "/";
  const navRef = useRef<HTMLElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isForumPage = pathname === "/forum";
  const isSkillInvadersPage = pathname.startsWith("/space-invaders");
  const scrollThreshold = isForumPage ? 20 : 24;
  const rankingsActive = rankingPaths.includes(pathname as (typeof rankingPaths)[number]);

  useEffect(() => {
    const syncTheme = () => {
      setDarkMode(document.documentElement.classList.contains("skillatlas-dark"));
    };

    syncTheme();
    window.addEventListener("skillatlas-theme-change", syncTheme);

    return () => window.removeEventListener("skillatlas-theme-change", syncTheme);
  }, []);

  useEffect(() => {
    if (isSkillInvadersPage) {
      setScrolled(false);
      return;
    }

    const onScroll = () => setScrolled(window.scrollY > scrollThreshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, [isSkillInvadersPage, scrollThreshold]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    const closeAtDesktopWidth = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeAtDesktopWidth);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeAtDesktopWidth);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (isSkillInvadersPage) return;

    let frame = 0;

    const alignNavigation = () => {
      const nav = navRef.current;
      const switchButton = document.querySelector<HTMLElement>(".skillatlas-theme-switch");

      if (!nav) return;

      const items = Array.from(nav.children).filter(
        (child): child is HTMLElement => child instanceof HTMLElement
      );

      items.forEach((item) => {
        item.style.transform = "";
      });

      if (!switchButton || items.length < 2 || nav.getBoundingClientRect().width <= 0) return;

      const switchRect = switchButton.getBoundingClientRect();
      if (switchRect.width <= 0) return;

      const switchCentre = switchRect.left + switchRect.width / 2;
      const itemRects = items.map((item) => item.getBoundingClientRect());
      const itemWidths = itemRects.map((rect) => rect.width);
      const firstLeft = itemRects[0].left;
      const lastWidth = itemWidths[itemWidths.length - 1] ?? 0;
      const lastLeft = switchCentre - lastWidth / 2;
      const totalItemWidth = itemWidths.reduce((sum, width) => sum + width, 0);
      const availableGapSpace = Math.max(0, lastLeft + lastWidth - firstLeft - totalItemWidth);
      const equalGap = availableGapSpace / Math.max(items.length - 1, 1);

      let nextLeft = firstLeft;

      items.forEach((item, index) => {
        const rect = itemRects[index];
        const targetLeft = index === items.length - 1 ? lastLeft : nextLeft;
        const offset = targetLeft - rect.left;

        item.style.transform = `translateX(${offset.toFixed(2)}px)`;
        nextLeft = targetLeft + itemWidths[index] + equalGap;
      });
    };

    const scheduleAlignment = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(alignNavigation);
    };

    scheduleAlignment();
    const settleTimer = window.setTimeout(scheduleAlignment, 120);
    window.addEventListener("resize", scheduleAlignment);
    window.addEventListener("skillatlas-theme-change", scheduleAlignment);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", scheduleAlignment);
      window.removeEventListener("skillatlas-theme-change", scheduleAlignment);
    };
  }, [darkMode, isSkillInvadersPage, pathname, scrolled]);

  if (isSkillInvadersPage) return null;

  const headerClassName = isForumPage
    ? `fixed top-0 left-0 right-0 z-50 h-[88px] bg-white border-b border-pink-200 transition-all ${
        scrolled ? "lg:h-[70px]" : "lg:h-[120px]"
      }`
    : `fixed left-0 right-0 top-0 z-50 h-[88px] border-b border-[#ff2fa8]/25 bg-white/95 backdrop-blur transition-all duration-300 ${
        scrolled ? "lg:h-[72px]" : "lg:h-[126px]"
      }`;

  const navClassName = isForumPage
    ? "skillatlas-desktop-nav flex-1 flex justify-around ml-10"
    : "skillatlas-desktop-nav hidden flex-1 items-center justify-around md:flex";

  const linkClassName = isForumPage
    ? "font-semibold text-gray-700 hover:text-[#19d3cf]"
    : `font-semibold text-gray-700 transition-all duration-300 hover:text-[#19d3cf] ${
        scrolled ? "text-sm" : "text-[1rem]"
      }`;

  return (
    <header className={headerClassName}>
      <div className="mx-auto flex h-full max-w-7xl items-center px-4 pr-20 sm:px-6 lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <a href="/space-invaders" className="relative h-12 w-12 shrink-0" aria-label="SkillAtlas logo">
            <Image
              src="/skillatlas-logo.png"
              alt="SkillAtlas logo"
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
          </a>
          <a href="/" className="relative h-7 w-32 shrink-0 sm:w-40" aria-label="SkillAtlas title">
            <Image
              src={darkMode ? "/skillatlas-title-dark.png" : "/skillatlas-title.png"}
              alt="SkillAtlas title"
              fill
              sizes="(max-width: 639px) 128px, 160px"
              className="object-contain object-left"
              priority
            />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="absolute right-[18px] top-[43px] grid h-10 w-10 place-items-center rounded-full border border-[#19d3cf]/45 bg-white/95 text-[#111827] shadow-sm transition hover:border-[#ff2fa8]/60 hover:text-[#ff2fa8]"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="skillatlas-mobile-navigation"
        >
          <span className="relative block h-4 w-5" aria-hidden="true">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition-transform ${
                mobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition-opacity ${
                mobileMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute bottom-0 left-0 h-0.5 w-5 rounded-full bg-current transition-transform ${
                mobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      <div
        className={
          isForumPage
            ? "max-w-7xl mx-auto hidden items-center h-full px-8 lg:flex"
            : "mx-auto hidden h-full max-w-7xl items-center px-8 lg:flex"
        }
      >
        {isForumPage ? (
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14">
              <Image src="/skillatlas-logo.png" alt="logo" fill sizes="56px" />
            </div>
            <div className="relative h-8 w-40">
              <Image
                src={darkMode ? "/skillatlas-title-dark.png" : "/skillatlas-title.png"}
                alt="title"
                fill
                sizes="160px"
              />
            </div>
          </div>
        ) : (
          <div className="mr-14 flex shrink-0 items-center gap-5">
            <a
              href="/space-invaders"
              className={`relative shrink-0 transition-all duration-300 ${
                scrolled ? "h-11 w-11" : "h-24 w-24"
              }`}
            >
              <Image
                src="/skillatlas-logo.png"
                alt="SkillAtlas logo"
                fill
                sizes="(min-width: 1024px) 96px, 48px"
                className="object-contain"
                priority
              />
            </a>

            <a
              href="/"
              className={`relative shrink-0 transition-all duration-300 ${
                scrolled ? "h-7 w-44" : "h-14 w-80"
              }`}
            >
              <Image
                src={darkMode ? "/skillatlas-title-dark.png" : "/skillatlas-title.png"}
                alt="SkillAtlas title"
                fill
                sizes="(min-width: 1024px) 320px, 160px"
                className="object-contain object-left"
                priority
              />
            </a>
          </div>
        )}

        <nav ref={navRef} className={navClassName}>
          <div className="skillatlas-rankings-dropdown" data-skillatlas-rankings-dropdown="true">
            <a
              href="/"
              className={`${linkClassName} skillatlas-rankings-trigger ${
                rankingsActive ? "skillatlas-active-nav" : ""
              }`}
              aria-haspopup="true"
              aria-current={rankingsActive ? "page" : undefined}
            >
              <span>Rankings</span>
            </a>

            <div className="skillatlas-rankings-menu" role="menu">
              {rankingItems.map((item) => {
                const active = isPathActive(pathname, item.href);

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`skillatlas-rankings-menu-item ${active ? "skillatlas-active-nav" : ""}`}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                  >
                    <span>{item.label}</span>
                    <small>{item.description}</small>
                  </a>
                );
              })}
            </div>
          </div>

          {navigationItems.map((item) => {
            const active = isPathActive(pathname, item.href);

            return (
              <a
                key={item.href}
                href={item.href}
                className={`${linkClassName} ${active ? "skillatlas-active-nav" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>

      {mobileMenuOpen && (
        <nav
          id="skillatlas-mobile-navigation"
          aria-label="Mobile navigation"
          className="absolute inset-x-3 top-[82px] max-h-[calc(100vh-94px)] overflow-y-auto rounded-3xl border border-[#ff2fa8]/30 bg-white/95 p-3 shadow-2xl backdrop-blur-xl lg:hidden"
        >
          <div className="rounded-2xl border border-[#19d3cf]/25 bg-gray-50/80 p-3">
            <p className="px-2 pb-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#19d3cf]">
              Rankings
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {rankingItems.map((item) => {
                const active = isPathActive(pathname, item.href);

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-black transition ${
                      active
                        ? "border-[#19d3cf] bg-[#19d3cf] text-white"
                        : "border-gray-200 bg-white/80 text-gray-700 hover:border-[#19d3cf]/60 hover:text-[#19d3cf]"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="mt-3 grid gap-1 sm:grid-cols-2">
            {navigationItems.map((item) => {
              const active = isPathActive(pathname, item.href);

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                    active
                      ? "bg-[#ff2fa8]/10 text-[#ff2fa8]"
                      : "text-gray-700 hover:bg-[#19d3cf]/10 hover:text-[#19d3cf]"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
