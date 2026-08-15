"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import HeaderMemberControl, {
  useHeaderMemberState,
} from "@/app/components/header-member-control";
import { useSkillAtlasTheme } from "@/app/theme-provider";
import {
  EXPLORE_NAV_ITEMS as exploreItems,
  RANKING_NAV_ITEMS as rankingItems,
  ROUTES,
} from "@/constants/routes";
import {
  normalisePath,
  pathIsActive,
  preventRedundantNavigation,
} from "@/lib/navigation";

const rankingPaths = new Set<string>(rankingItems.map((item) => item.href));
const mobileMenuId = "skillatlas-mobile-navigation";
const mobileRankingsMenuId = "skillatlas-mobile-rankings-navigation";
const mobileExploreMenuId = "skillatlas-mobile-explore-navigation";

type FamilyItem = {
  readonly label: string;
  readonly href: string;
  readonly description: string;
};

function DisplayControl({
  darkMode,
  onToggle,
  compact = false,
  interactive = true,
}: {
  darkMode: boolean;
  onToggle: () => void;
  compact?: boolean;
  interactive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`skillatlas-display-control ${compact ? "skillatlas-display-control-mobile" : "skillatlas-display-control-desktop"}`}
      aria-label={darkMode ? "Switch display to light mode" : "Switch display to dark mode"}
      aria-pressed={darkMode}
      tabIndex={interactive ? 0 : -1}
    >
      <span className="skillatlas-display-marker" aria-hidden="true" />
      <span className="skillatlas-display-copy">
        <small>Display</small>
        <strong>{darkMode ? "Dark" : "Light"}</strong>
      </span>
      <span className="skillatlas-display-icon" aria-hidden="true">
        {darkMode ? (
          <svg viewBox="0 0 20 20"><path d="M15.8 12.4A6.6 6.6 0 0 1 7.6 4.2a6.7 6.7 0 1 0 8.2 8.2Z" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        ) : (
          <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M10 2v2m0 12v2M2 10h2m12 0h2M4.3 4.3l1.4 1.4m8.6 8.6 1.4 1.4m0-11.4-1.4 1.4m-8.6 8.6-1.4 1.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" /></svg>
        )}
      </span>
    </button>
  );
}

function DesktopFamilyMenu({
  id,
  label,
  href,
  items,
  pathname,
  active,
}: {
  id: string;
  label: string;
  href?: string;
  items: readonly FamilyItem[];
  pathname: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = `skillatlas-${id}-menu`;

  const focusItem = (index: number) => {
    const links = Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement>("a[role='menuitem']") ?? []);
    links[index]?.focus();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }

    const links = Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement>("a[role='menuitem']") ?? []);
    const currentIndex = links.indexOf(document.activeElement as HTMLAnchorElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      window.requestAnimationFrame(() => focusItem(currentIndex < 0 ? 0 : (currentIndex + 1) % links.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      window.requestAnimationFrame(() => focusItem(currentIndex < 0 ? links.length - 1 : (currentIndex - 1 + links.length) % links.length));
    } else if (event.key === "Home" && currentIndex >= 0) {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End" && currentIndex >= 0) {
      event.preventDefault();
      focusItem(links.length - 1);
    }
  };

  const triggerClassName = `skillatlas-primary-nav-trigger ${active ? "skillatlas-nav-family-active" : ""}`;

  return (
    <div
      ref={rootRef}
      className="skillatlas-nav-family"
      data-open={open ? "true" : "false"}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={handleKeyDown}
    >
      {href ? (
        <Link
          ref={(node) => { triggerRef.current = node; }}
          href={href}
          className={triggerClassName}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          aria-current={pathname === href ? "page" : undefined}
          onClick={(event) => preventRedundantNavigation(event, pathname, href)}
        >
          <span>{label}</span><span className="skillatlas-nav-chevron" aria-hidden="true">⌄</span>
        </Link>
      ) : (
        <button
          ref={(node) => { triggerRef.current = node; }}
          type="button"
          className={triggerClassName}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen(true)}
        >
          <span>{label}</span><span className="skillatlas-nav-chevron" aria-hidden="true">⌄</span>
        </button>
      )}

      <div ref={menuRef} id={menuId} className="skillatlas-nav-menu" role="menu" aria-hidden={!open}>
        <div className="skillatlas-nav-menu-heading" aria-hidden="true">
          <span>Directory</span><span>{String(items.length).padStart(2, "0")}</span>
        </div>
        {items.map((item, index) => {
          const itemActive = pathIsActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              tabIndex={open ? 0 : -1}
              className={`skillatlas-nav-menu-item ${itemActive ? "skillatlas-nav-menu-item-active" : ""}`}
              aria-current={itemActive ? "page" : undefined}
              onClick={(event) => {
                preventRedundantNavigation(event, pathname, item.href);
                setOpen(false);
              }}
            >
              <span className="skillatlas-nav-menu-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className="skillatlas-nav-menu-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
              <span className="skillatlas-nav-menu-state" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileFamily({
  label,
  id,
  open,
  active,
  menuOpen,
  items,
  pathname,
  onToggle,
  onNavigate,
}: {
  label: string;
  id: string;
  open: boolean;
  active: boolean;
  menuOpen: boolean;
  items: readonly FamilyItem[];
  pathname: string;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  return (
    <section className={`skillatlas-mobile-family ${active ? "skillatlas-mobile-family-active" : ""}`}>
      <button
        type="button"
        className="skillatlas-mobile-family-trigger"
        aria-controls={id}
        aria-expanded={open}
        tabIndex={menuOpen ? 0 : -1}
        onClick={onToggle}
      >
        <span><small>Directory</small><strong>{label}</strong></span>
        <span className="skillatlas-mobile-family-chevron" aria-hidden="true">⌄</span>
      </button>
      <div id={id} aria-hidden={!open} className={`skillatlas-mobile-family-content ${open ? "skillatlas-mobile-family-content-open" : ""}`}>
        <div>
          {items.map((item, index) => {
            const itemActive = pathIsActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                tabIndex={menuOpen && open ? 0 : -1}
                className={`skillatlas-mobile-nav-link ${itemActive ? "skillatlas-mobile-nav-link-active" : ""}`}
                aria-current={itemActive ? "page" : undefined}
                onClick={(event) => {
                  preventRedundantNavigation(event, pathname, item.href);
                  onNavigate();
                }}
              >
                <span className="skillatlas-mobile-nav-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span>{item.label}</span>
                <span className="skillatlas-mobile-nav-state" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function SiteHeader() {
  const pathname = normalisePath(usePathname() || ROUTES.rankings);
  const { darkMode, toggleTheme } = useSkillAtlasTheme();
  const hidden = pathname.startsWith(ROUTES.spaceInvaders);
  const rankingsActive = rankingPaths.has(pathname);
  const exploreActive = exploreItems.some((item) => pathIsActive(pathname, item.href));
  const mobileRankingsDefaultOpen = pathname === ROUTES.userRankings || pathname === ROUTES.liveRankings;
  const mobileExploreDefaultOpen = exploreActive;
  const authRefreshKey = pathname.startsWith("/auth") || pathname.startsWith(ROUTES.account)
    ? pathname
    : "public";
  const memberState = useHeaderMemberState(authRefreshKey, !hidden);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const [mobileSectionState, setMobileSectionState] = useState({
    pathname,
    rankings: mobileRankingsDefaultOpen,
    explore: mobileExploreDefaultOpen,
  });
  const headerRef = useRef<HTMLElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuOpen = mobileMenuPath === pathname;
  const mobileRankingsOpen = mobileSectionState.pathname === pathname
    ? mobileSectionState.rankings
    : mobileRankingsDefaultOpen;
  const mobileExploreOpen = mobileSectionState.pathname === pathname
    ? mobileSectionState.explore
    : mobileExploreDefaultOpen;

  const closeMobileMenu = useCallback(() => {
    setMobileMenuPath(null);
    setMobileSectionState({
      pathname,
      rankings: mobileRankingsDefaultOpen,
      explore: mobileExploreDefaultOpen,
    });
  }, [mobileExploreDefaultOpen, mobileRankingsDefaultOpen, pathname]);

  const toggleMobileMenu = useCallback(() => {
    if (mobileMenuOpen) {
      closeMobileMenu();
      return;
    }

    setMobileSectionState({
      pathname,
      rankings: mobileRankingsDefaultOpen,
      explore: mobileExploreDefaultOpen,
    });
    setMobileMenuPath(pathname);
  }, [closeMobileMenu, mobileExploreDefaultOpen, mobileMenuOpen, mobileRankingsDefaultOpen, pathname]);

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
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) closeMobileMenu();
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

  return (
    <header
      ref={headerRef}
      data-scrolled={scrolled ? "true" : "false"}
      className={`skillatlas-site-header fixed inset-x-0 top-0 z-50 ${scrolled ? "skillatlas-site-header-scrolled" : ""}`}
    >
      <div className="skillatlas-header-inner">
        <div className="skillatlas-brand-lockup">
          <Link href={ROUTES.spaceInvaders} className="skillatlas-brand-mark" aria-label="Open SkillInvaders">
            <Image src="/skillatlas-logo.png" alt="SkillAtlas logo" fill sizes="(min-width: 1280px) 72px, 52px" className="object-contain" priority />
          </Link>
          <Link
            href={ROUTES.rankings}
            onClick={(event) => preventRedundantNavigation(event, pathname, ROUTES.rankings)}
            className="skillatlas-brand-title"
          >
            <Image src="/skillatlas-title.png" alt="SkillAtlas title" fill sizes="(min-width: 1280px) 220px, (min-width: 640px) 174px, 112px" className="object-contain object-left" priority />
          </Link>
        </div>

        <nav className="skillatlas-desktop-nav" aria-label="Primary navigation">
          <DesktopFamilyMenu key={`rankings-${pathname}`} id="rankings" label="Rankings" href={ROUTES.rankings} items={rankingItems} pathname={pathname} active={rankingsActive} />
          <Link
            href={ROUTES.atlas}
            className={`skillatlas-primary-nav-trigger ${pathIsActive(pathname, ROUTES.atlas) ? "skillatlas-nav-family-active" : ""}`}
            aria-current={pathIsActive(pathname, ROUTES.atlas) ? "page" : undefined}
            onClick={(event) => preventRedundantNavigation(event, pathname, ROUTES.atlas)}
          >Atlas</Link>
          <DesktopFamilyMenu key={`explore-${pathname}`} id="explore" label="Explore" items={exploreItems} pathname={pathname} active={exploreActive} />
          <Link
            href={ROUTES.forum}
            className={`skillatlas-primary-nav-trigger ${pathIsActive(pathname, ROUTES.forum) ? "skillatlas-nav-family-active" : ""}`}
            aria-current={pathIsActive(pathname, ROUTES.forum) ? "page" : undefined}
            onClick={(event) => preventRedundantNavigation(event, pathname, ROUTES.forum)}
          >Forum</Link>
          <Link
            href={ROUTES.about}
            className={`skillatlas-primary-nav-trigger ${pathIsActive(pathname, ROUTES.about) ? "skillatlas-nav-family-active" : ""}`}
            aria-current={pathIsActive(pathname, ROUTES.about) ? "page" : undefined}
            onClick={(event) => preventRedundantNavigation(event, pathname, ROUTES.about)}
          >About</Link>
        </nav>

        <div className="skillatlas-desktop-system-stack" aria-label="Member and display controls">
          <HeaderMemberControl memberState={memberState} pathname={pathname} />
          <DisplayControl darkMode={darkMode} onToggle={toggleTheme} />
        </div>

        <button
          ref={mobileMenuButtonRef}
          type="button"
          className="skillatlas-mobile-menu-button"
          aria-label={mobileMenuOpen ? "Close navigation console" : "Open navigation console"}
          aria-controls={mobileMenuId}
          aria-expanded={mobileMenuOpen}
          onClick={toggleMobileMenu}
        >
          <span aria-hidden="true"><i /><i /><i /></span>
        </button>

        <nav
          id={mobileMenuId}
          className={`skillatlas-mobile-nav ${mobileMenuOpen ? "skillatlas-mobile-nav-open" : ""}`}
          aria-label="Navigation console"
          aria-hidden={!mobileMenuOpen}
        >
          <div className="skillatlas-mobile-console-heading" aria-hidden="true"><span>Navigation console</span><span>SA / 01</span></div>
          <MobileFamily
            label="Rankings"
            id={mobileRankingsMenuId}
            open={mobileRankingsOpen}
            active={rankingsActive}
            menuOpen={mobileMenuOpen}
            items={rankingItems}
            pathname={pathname}
            onToggle={() => setMobileSectionState({ pathname, rankings: !mobileRankingsOpen, explore: mobileExploreOpen })}
            onNavigate={closeMobileMenu}
          />

          <Link
            href={ROUTES.atlas}
            tabIndex={mobileMenuOpen ? 0 : -1}
            className={`skillatlas-mobile-direct-link ${pathIsActive(pathname, ROUTES.atlas) ? "skillatlas-mobile-direct-link-active" : ""}`}
            aria-current={pathIsActive(pathname, ROUTES.atlas) ? "page" : undefined}
            onClick={(event) => {
              preventRedundantNavigation(event, pathname, ROUTES.atlas);
              closeMobileMenu();
            }}
          ><span><small>Flagship</small><strong>Atlas</strong></span><span aria-hidden="true" /></Link>

          <MobileFamily
            label="Explore"
            id={mobileExploreMenuId}
            open={mobileExploreOpen}
            active={exploreActive}
            menuOpen={mobileMenuOpen}
            items={exploreItems}
            pathname={pathname}
            onToggle={() => setMobileSectionState({ pathname, rankings: mobileRankingsOpen, explore: !mobileExploreOpen })}
            onNavigate={closeMobileMenu}
          />

          <div className="skillatlas-mobile-direct-group">
            {[{ label: "Forum", href: ROUTES.forum }, { label: "About", href: ROUTES.about }].map((item) => {
              const active = pathIsActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  tabIndex={mobileMenuOpen ? 0 : -1}
                  className={`skillatlas-mobile-direct-link ${active ? "skillatlas-mobile-direct-link-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={(event) => {
                    preventRedundantNavigation(event, pathname, item.href);
                    closeMobileMenu();
                  }}
                ><span><small>Destination</small><strong>{item.label}</strong></span><span aria-hidden="true" /></Link>
              );
            })}
          </div>

          <div className="skillatlas-mobile-system-stack">
            <div className="skillatlas-mobile-console-heading" aria-hidden="true"><span>Member / system</span><span>02</span></div>
            <HeaderMemberControl
              key={`mobile-member-${mobileMenuOpen}`}
              memberState={memberState}
              pathname={pathname}
              compact
              interactive={mobileMenuOpen}
              onNavigate={closeMobileMenu}
            />
            <DisplayControl darkMode={darkMode} onToggle={toggleTheme} compact interactive={mobileMenuOpen} />
          </div>
        </nav>
      </div>
    </header>
  );
}
