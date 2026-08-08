"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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

const rankingPaths = new Set<string>(rankingItems.map((item) => item.href));

function normalisePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function pathIsActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = normalisePath(usePathname() || "/");
  const hidden = pathname.startsWith("/space-invaders");
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (hidden) return;

    const handleScroll = () => setScrolled(window.scrollY > 24);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [hidden]);

  const alignNavigationToThemeToggle = useCallback(() => {
    const nav = navRef.current;

    if (!nav) return;

    const items = Array.from(nav.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    );

    items.forEach((item) => {
      item.style.transform = "";
    });

    if (!window.matchMedia("(min-width: 768px)").matches || items.length < 2) return;

    const switchButton = document.querySelector<HTMLElement>(".skillatlas-theme-switch");

    if (!switchButton) return;

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
  }, []);

  useEffect(() => {
    if (hidden) return;

    let frame = window.requestAnimationFrame(alignNavigationToThemeToggle);
    const scheduleAlignment = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(alignNavigationToThemeToggle);
    };

    window.addEventListener("resize", scheduleAlignment);
    window.addEventListener("skillatlas-theme-change", scheduleAlignment);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", scheduleAlignment);
      window.removeEventListener("skillatlas-theme-change", scheduleAlignment);
    };
  }, [alignNavigationToThemeToggle, hidden, pathname, scrolled]);

  if (hidden) return null;

  const rankingsActive = rankingPaths.has(pathname);
  const linkClassName = `font-semibold text-gray-700 transition-all duration-300 hover:text-[#19d3cf] ${
    scrolled ? "text-sm" : "text-[1rem]"
  }`;

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 border-b border-[#ff2fa8]/25 bg-white/95 backdrop-blur transition-all duration-300 ${
        scrolled ? "h-[72px]" : "h-[126px]"
      }`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center px-8">
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
              sizes={scrolled ? "44px" : "96px"}
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
              src="/skillatlas-title.png"
              alt="SkillAtlas title"
              fill
              sizes={scrolled ? "176px" : "320px"}
              className="object-contain object-left"
              priority
            />
          </a>
        </div>

        <nav ref={navRef} className="hidden flex-1 items-center justify-around md:flex" aria-label="Primary navigation">
          <div className="skillatlas-rankings-dropdown" data-skillatlas-rankings-dropdown="true">
            <a
              href="/"
              className={`${linkClassName} skillatlas-rankings-trigger ${rankingsActive ? "skillatlas-active-nav" : ""}`}
              aria-haspopup="true"
              aria-current={rankingsActive ? "page" : undefined}
            >
              <span>Rankings</span>
            </a>

            <div className="skillatlas-rankings-menu" role="menu">
              {rankingItems.map((item) => {
                const active = pathIsActive(pathname, item.href);

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
            const active = pathIsActive(pathname, item.href);

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
    </header>
  );
}
