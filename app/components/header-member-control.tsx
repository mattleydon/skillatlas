"use client";

import Link from "next/link";
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/auth/actions";
import { getHeaderMemberState, type HeaderMemberSnapshot } from "@/app/auth/header-state";
import { memberRoute, ROUTES } from "@/constants/routes";
import { PROFILE_IDENTITY_UPDATED_EVENT } from "@/lib/account/profile-events";
import { isPlainNavigationClick, navigationCurrent, pathIsActive, preventRedundantNavigation } from "@/lib/navigation";

export type HeaderMemberState = HeaderMemberSnapshot | { status: "checking" };

export function useHeaderMemberState(refreshKey: string, enabled = true) {
  const [memberState, setMemberState] = useState<HeaderMemberState>({ status: "checking" });

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let generation = 0;
    const refreshMember = async () => {
      const requestGeneration = ++generation;
      try {
        const nextState = await getHeaderMemberState();
        if (active && requestGeneration === generation) setMemberState(nextState);
      } catch {
        if (active && requestGeneration === generation) setMemberState({ status: "unavailable" });
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshMember();
    };
    // HttpOnly auth changes are not visible to browser-client subscriptions.
    // Recheck on return from another tab and on restored browser history pages.
    void refreshMember();
    window.addEventListener("focus", refreshWhenVisible);
    window.addEventListener("pageshow", refreshWhenVisible);
    window.addEventListener(PROFILE_IDENTITY_UPDATED_EVENT, refreshMember);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.removeEventListener("focus", refreshWhenVisible);
      window.removeEventListener("pageshow", refreshWhenVisible);
      window.removeEventListener(PROFILE_IDENTITY_UPDATED_EVENT, refreshMember);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [enabled, refreshKey]);

  return memberState;
}

function memberInitials(displayName: string, username: string) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || username.slice(0, 2).toUpperCase();
}

type HeaderMemberControlProps = {
  memberState: HeaderMemberState;
  pathname: string;
  compact?: boolean;
  interactive?: boolean;
  onNavigate?: () => void;
};

export default function HeaderMemberControl({
  memberState,
  pathname,
  compact = false,
  interactive = true,
  onNavigate,
}: HeaderMemberControlProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        if (rootRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const focusItem = (index: number) => {
    rootRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']")[index]?.focus();
  };
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number;
    if (event.key === "ArrowDown") next = index < 0 ? 0 : (index + 1) % items.length;
    else if (event.key === "ArrowUp") next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length;
    else if (event.key === "Home" && index >= 0) next = 0;
    else if (event.key === "End" && index >= 0) next = items.length - 1;
    else return;
    event.preventDefault();
    setOpen(true);
    window.requestAnimationFrame(() => focusItem(next));
  };

  const shellClassName = compact
    ? "skillatlas-member-control skillatlas-member-control-mobile"
    : "skillatlas-member-control skillatlas-member-control-desktop";

  if (memberState.status === "checking") {
    return (
      <div className={`${shellClassName} skillatlas-member-control-static`} role="status" aria-label="Checking profile status">
        <span className="skillatlas-member-glyph" aria-hidden="true">··</span>
        <span className="skillatlas-member-copy"><small>Profile</small><strong>Checking</strong></span>
      </div>
    );
  }

  if (memberState.status === "signed_out") {
    return (
      <Link className={shellClassName} href={ROUTES.authSignIn} aria-current={navigationCurrent(pathname, ROUTES.authSignIn)} tabIndex={interactive ? 0 : -1} onClick={(event) => {
        if (!isPlainNavigationClick(event)) return;
        preventRedundantNavigation(event, pathname, ROUTES.authSignIn);
        onNavigate?.();
      }}>
        <span className="skillatlas-member-glyph" aria-hidden="true">→</span>
        <span className="skillatlas-member-copy"><small>Profile</small><strong>Sign in</strong></span>
      </Link>
    );
  }

  if (memberState.status === "profile_incomplete") {
    return (
      <Link className={shellClassName} href={ROUTES.accountOnboarding} aria-current={navigationCurrent(pathname, ROUTES.accountOnboarding)} tabIndex={interactive ? 0 : -1} onClick={(event) => {
        if (!isPlainNavigationClick(event)) return;
        preventRedundantNavigation(event, pathname, ROUTES.accountOnboarding);
        onNavigate?.();
      }}>
        <span className="skillatlas-member-glyph" aria-hidden="true">+</span>
        <span className="skillatlas-member-copy"><small>Profile</small><strong>Complete profile</strong></span>
      </Link>
    );
  }

  if (memberState.status === "unavailable") {
    return (
      <div className={`${shellClassName} skillatlas-member-control-static`} role="status" aria-label="Profile status unavailable">
        <span className="skillatlas-member-glyph" aria-hidden="true">!</span>
        <span className="skillatlas-member-copy"><small>Profile</small><strong>Unavailable</strong></span>
      </div>
    );
  }

  const publicProfileHref = memberRoute(memberState.username);
  const displayName = memberState.displayName.trim();
  const memberLabel = displayName || `@${memberState.username}`;
  const initials = memberInitials(memberState.displayName, memberState.username);

  return (
    <div ref={rootRef} className="skillatlas-member-menu-root" onKeyDown={handleKeyDown} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button
        ref={triggerRef}
        type="button"
        className={shellClassName}
        aria-haspopup="menu"
        aria-expanded={interactive && open}
        aria-current={pathIsActive(pathname, ROUTES.account) || pathname === publicProfileHref ? "location" : undefined}
        aria-controls={compact ? "skillatlas-mobile-member-menu" : "skillatlas-desktop-member-menu"}
        tabIndex={interactive ? 0 : -1}
        onClick={() => {
          setOpen(!open);
          if (!open) window.requestAnimationFrame(() => focusItem(0));
        }}
      >
        <span className="skillatlas-member-glyph" aria-hidden="true">{initials}</span>
        <span className="skillatlas-member-copy"><small>Profile</small><strong>{memberLabel}</strong></span>
        <span className="skillatlas-member-chevron" aria-hidden="true">⌄</span>
      </button>

      <div
        id={compact ? "skillatlas-mobile-member-menu" : "skillatlas-desktop-member-menu"}
        className="skillatlas-member-menu"
        role="menu"
        aria-label="Profile"
        aria-hidden={!interactive || !open}
        inert={!interactive || !open}
      >
        <Link
          href={ROUTES.account}
          role="menuitem"
          aria-current={navigationCurrent(pathname, ROUTES.account)}
          tabIndex={interactive && open ? 0 : -1}
          onClick={(event) => {
            if (!isPlainNavigationClick(event)) return;
            preventRedundantNavigation(event, pathname, ROUTES.account);
            setOpen(false);
            if (event.defaultPrevented) triggerRef.current?.focus();
            else onNavigate?.();
          }}
        >
          <span>Profile</span><small>Identity and privacy controls</small>
        </Link>
        <Link
          href={publicProfileHref}
          role="menuitem"
          aria-label={`View public profile: ${memberLabel}${displayName ? ` (@${memberState.username})` : ""}`}
          aria-current={navigationCurrent(pathname, publicProfileHref)}
          tabIndex={interactive && open ? 0 : -1}
          onClick={(event) => {
            if (!isPlainNavigationClick(event)) return;
            preventRedundantNavigation(event, pathname, publicProfileHref);
            setOpen(false);
            if (event.defaultPrevented) triggerRef.current?.focus();
            else onNavigate?.();
          }}
        >
          <span>{displayName || "View public profile"}</span><small>@{memberState.username}</small>
        </Link>
        <form action={signOutAction}>
          <button type="submit" role="menuitem" tabIndex={interactive && open ? 0 : -1} onClick={() => {
            triggerRef.current?.focus();
            setOpen(false);
          }}>
            <span>Sign out</span><small>End this SkillAtlas session</small>
          </button>
        </form>
      </div>
    </div>
  );
}
