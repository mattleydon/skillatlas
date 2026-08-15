"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/auth/actions";
import { memberRoute, ROUTES } from "@/constants/routes";
import { preventRedundantNavigation } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";

export type HeaderMemberState =
  | { status: "checking" }
  | { status: "signed_out" }
  | { status: "profile_incomplete" }
  | { status: "profile_complete"; username: string; displayName: string }
  | { status: "unavailable" };

export function useHeaderMemberState(refreshKey: string, enabled = true) {
  const [memberState, setMemberState] = useState<HeaderMemberState>({ status: "checking" });

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let requestedProfileUserId: string | null = null;
    const scheduled: number[] = [];

    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      const timeout = window.setTimeout(() => {
        if (active) setMemberState({ status: "unavailable" });
      }, 0);
      scheduled.push(timeout);
      return () => {
        active = false;
        window.clearTimeout(timeout);
      };
    }

    const resolveMember = async (knownUserId?: string) => {
      try {
        let userId = knownUserId;

        if (!userId) {
          const { data, error } = await supabase.auth.getUser();
          if (!active) return;
          if (error) {
            setMemberState({ status: "unavailable" });
            return;
          }
          if (!data.user) {
            setMemberState({ status: "signed_out" });
            return;
          }
          userId = data.user.id;
        }

        if (requestedProfileUserId === userId) return;
        requestedProfileUserId = userId;

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("id", userId)
          .maybeSingle();

        if (!active) return;
        if (profileError) {
          setMemberState({ status: "unavailable" });
        } else if (!profile) {
          setMemberState({ status: "profile_incomplete" });
        } else {
          setMemberState({
            status: "profile_complete",
            username: profile.username,
            displayName: profile.display_name,
          });
        }
      } catch {
        if (active) setMemberState({ status: "unavailable" });
      }
    };

    void resolveMember();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const timeout = window.setTimeout(() => {
        if (!active) return;
        if (!session?.user) {
          requestedProfileUserId = null;
          setMemberState({ status: "signed_out" });
        }
        else void resolveMember(session.user.id);
      }, 0);
      scheduled.push(timeout);
    });

    return () => {
      active = false;
      scheduled.forEach((timeout) => window.clearTimeout(timeout));
      authListener.subscription.unsubscribe();
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

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
      <Link className={shellClassName} href={ROUTES.authSignIn} tabIndex={interactive ? 0 : -1} onClick={onNavigate}>
        <span className="skillatlas-member-glyph" aria-hidden="true">→</span>
        <span className="skillatlas-member-copy"><small>Profile</small><strong>Sign in</strong></span>
      </Link>
    );
  }

  if (memberState.status === "profile_incomplete") {
    return (
      <Link className={shellClassName} href={ROUTES.accountOnboarding} tabIndex={interactive ? 0 : -1} onClick={onNavigate}>
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
  const initials = memberInitials(memberState.displayName, memberState.username);

  return (
    <div ref={rootRef} className="skillatlas-member-menu-root">
      <button
        ref={triggerRef}
        type="button"
        className={shellClassName}
        aria-haspopup="menu"
        aria-expanded={interactive && open}
        aria-controls={compact ? "skillatlas-mobile-member-menu" : "skillatlas-desktop-member-menu"}
        tabIndex={interactive ? 0 : -1}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="skillatlas-member-glyph" aria-hidden="true">{initials}</span>
        <span className="skillatlas-member-copy"><small>Profile</small><strong>@{memberState.username}</strong></span>
        <span className="skillatlas-member-chevron" aria-hidden="true">⌄</span>
      </button>

      <div
        id={compact ? "skillatlas-mobile-member-menu" : "skillatlas-desktop-member-menu"}
        className="skillatlas-member-menu"
        role="menu"
        aria-hidden={!interactive || !open}
      >
        <Link
          href={ROUTES.account}
          role="menuitem"
          tabIndex={interactive && open ? 0 : -1}
          onClick={(event) => {
            preventRedundantNavigation(event, pathname, ROUTES.account);
            setOpen(false);
            onNavigate?.();
          }}
        >
          <span>Profile</span><small>Identity and privacy controls</small>
        </Link>
        <Link
          href={publicProfileHref}
          role="menuitem"
          tabIndex={interactive && open ? 0 : -1}
          onClick={(event) => {
            preventRedundantNavigation(event, pathname, publicProfileHref);
            setOpen(false);
            onNavigate?.();
          }}
        >
          <span>View public profile</span><small>@{memberState.username}</small>
        </Link>
        <form action={signOutAction}>
          <button type="submit" role="menuitem" tabIndex={interactive && open ? 0 : -1} onClick={() => setOpen(false)}>
            <span>Sign out</span><small>End this SkillAtlas session</small>
          </button>
        </form>
      </div>
    </div>
  );
}
