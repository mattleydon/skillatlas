"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const THEME_KEY = "skillatlas-theme";
const LIGHT_TITLE_LOGO_SRC = "/skillatlas-title.png";
const DARK_TITLE_LOGO_SRC = "/skillatlas-title-dark.png";

type PageComment = {
  id: string;
  page_path: string;
  display_name: string;
  body: string;
  created_at: string;
};

const RAW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_URL = RAW_SUPABASE_URL.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const pageCommentsClient =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const SKILLATLAS_EMOJIS = [
  { label: "Turquoise spark", symbol: "✦", code: ":sa_turquoise_spark:", className: "turquoise" },
  { label: "Pink spark", symbol: "✦", code: ":sa_pink_spark:", className: "pink" },
  { label: "Turquoise smiley", symbol: "☺", code: ":sa_turquoise_smiley:", className: "turquoise face" },
  { label: "Pink frowny", symbol: "☹", code: ":sa_pink_frowny:", className: "pink face" },
  { label: "Turquoise controller", symbol: "🎮", code: ":sa_turquoise_controller:", className: "turquoise controller" },
  { label: "Pink controller", symbol: "🎮", code: ":sa_pink_controller:", className: "pink controller" },
  { label: "Turquoise earth", symbol: "◍", code: ":sa_turquoise_earth:", className: "turquoise earth" },
  { label: "Pink earth", symbol: "◍", code: ":sa_pink_earth:", className: "pink earth" },
  { label: "SkillAtlas mark", symbol: "⟁", code: ":sa_logo:", className: "skillatlas-logo" },
  { label: "Turquoise crown", symbol: "♛", code: ":sa_turquoise_crown:", className: "turquoise crown" },
  { label: "Pink crown", symbol: "♛", code: ":sa_pink_crown:", className: "pink crown" },
  { label: "Skill surge", symbol: "↯", code: ":sa_surge:", className: "skillatlas-gradient" },
] as const;

type SkillAtlasEmoji = (typeof SKILLATLAS_EMOJIS)[number];

function findSkillAtlasEmoji(code: string) {
  return SKILLATLAS_EMOJIS.find((emoji) => emoji.code === code);
}

function shortEmojiLabel(label: string) {
  return label
    .replace("Turquoise ", "TQ ")
    .replace("Pink ", "PK ")
    .replace("SkillAtlas ", "SA ")
    .replace("Skill ", "SA ");
}

function renderSkillAtlasEmoji(emoji: SkillAtlasEmoji, key?: string | number) {
  return (
    <span
      key={key}
      className={`skillatlas-custom-comment-emoji ${emoji.className}`}
      aria-label={emoji.label}
      title={emoji.label}
    >
      {emoji.symbol}
    </span>
  );
}

function renderCommentBody(body: string) {
  return body.split(/(:sa_[a-z_]+:)/g).map((part, index) => {
    const emoji = findSkillAtlasEmoji(part);

    if (!emoji) return part;

    return renderSkillAtlasEmoji(emoji, `${emoji.code}-${index}`);
  });
}

function displayPathName(pathname: string) {
  if (pathname === "/") return "Rankings";

  return pathname
    .split("/")
    .filter(Boolean)
    .map((part) =>
      part
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
    .join(" / ");
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

function swapTitleLogos(darkMode: boolean) {
  const targetSrc = darkMode ? DARK_TITLE_LOGO_SRC : LIGHT_TITLE_LOGO_SRC;
  const images = Array.from(document.querySelectorAll<HTMLImageElement>("img")).filter(isSkillAtlasTitleImage);

  images.forEach((image) => {
    const currentRawSrc = image.getAttribute("src") ?? "";
    const currentSrc = image.currentSrc || currentRawSrc;

    if (currentRawSrc.includes(targetSrc) || currentSrc.includes(targetSrc)) return;

    image.removeAttribute("srcset");
    image.src = targetSrc;
  });
}

function applyTheme(darkMode: boolean) {
  document.documentElement.classList.add("skillatlas-theme-freeze");
  document.documentElement.classList.toggle("skillatlas-dark", darkMode);
  document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  window.localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  swapTitleLogos(darkMode);
  window.dispatchEvent(new CustomEvent("skillatlas-theme-change", { detail: { darkMode } }));

  window.setTimeout(() => {
    document.documentElement.classList.remove("skillatlas-theme-freeze");
  }, 460);
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void | Promise<void>) => {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
};

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSkillInvadersPage = pathname?.startsWith("/space-invaders") ?? false;
  const hideToggle = isSkillInvadersPage;
  const hideLiveChat = isSkillInvadersPage;

  const [darkMode, setDarkMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Visitor");
  const [emojiMenuOpen, setEmojiMenuOpen] = useState(false);
  const [selectedEmojis, setSelectedEmojis] = useState<SkillAtlasEmoji[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [comments, setComments] = useState<PageComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const currentPagePath = pathname || "/";
  const currentPageName = useMemo(() => displayPathName(currentPagePath), [currentPagePath]);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [headerShrunk, setHeaderShrunk] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

    setDarkMode(shouldUseDark);
    applyTheme(shouldUseDark);
    window.setTimeout(() => swapTitleLogos(shouldUseDark), 0);
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
      swapTitleLogos(document.documentElement.classList.contains("skillatlas-dark"));
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

  useEffect(() => {
    if (hideLiveChat) {
      setChatOpen(false);
      return;
    }

    const client = pageCommentsClient;

    if (!client) {
      setComments([]);
      setCommentsLoading(false);
      setCommentsError("Connect Supabase to make this comment section live for everyone. Use the base Project URL, not the /rest/v1 endpoint.");
      return;
    }

    let mounted = true;

    const addComment = (comment: PageComment) => {
      setComments((currentComments) => {
        if (currentComments.some((currentComment) => currentComment.id === comment.id)) return currentComments;

        return [...currentComments, comment]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .slice(-80);
      });
    };

    async function loadComments() {
      setCommentsLoading(true);
      setCommentsError("");

      const { data, error } = await client!
        .from("skillatlas_page_comments")
        .select("id,page_path,display_name,body,created_at")
        .eq("page_path", currentPagePath)
        .order("created_at", { ascending: true })
        .limit(80);

      if (!mounted) return;

      if (error) {
        setComments([]);
        setCommentsError("Could not load page comments yet.");
      } else {
        setComments((data ?? []) as PageComment[]);
      }

      setCommentsLoading(false);
    }

    loadComments();

    const channel = client!
      .channel(`skillatlas-page-comments:${currentPagePath}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "skillatlas_page_comments",
          filter: `page_path=eq.${currentPagePath}`,
        },
        (payload) => {
          addComment(payload.new as PageComment);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      client!.removeChannel(channel);
    };
  }, [currentPagePath, hideLiveChat]);

  useEffect(() => {
    if (!chatOpen) return;

    commentsEndRef.current?.scrollIntoView({ block: "end" });
  }, [chatOpen, comments.length, commentsError]);

  function setTheme(nextDarkMode: boolean) {
    const updateThemeNow = () => {
      flushSync(() => {
        setDarkMode(nextDarkMode);
      });

      applyTheme(nextDarkMode);
    };

    const canUseViewTransition =
      Boolean((document as ViewTransitionDocument).startViewTransition) &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (canUseViewTransition) {
      try {
        (document as ViewTransitionDocument).startViewTransition?.(updateThemeNow);
        return;
      } catch {
        updateThemeNow();
        return;
      }
    }

    updateThemeNow();
  }

  function toggleTheme() {
    setTheme(!document.documentElement.classList.contains("skillatlas-dark"));
  }

  function addEmojiToComment(emoji: SkillAtlasEmoji) {
    setSelectedEmojis((currentEmojis) => [...currentEmojis, emoji].slice(-8));
  }

  function removeSelectedEmoji(indexToRemove: number) {
    setSelectedEmojis((currentEmojis) => currentEmojis.filter((_, index) => index !== indexToRemove));
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = displayName.trim().slice(0, 32) || "Visitor";
    const trimmedMessage = chatInput.trim().slice(0, 350);
    const emojiPrefix = selectedEmojis.map((emoji) => emoji.code).join(" ");
    const commentBody = [emojiPrefix, trimmedMessage].filter(Boolean).join(" ").trim().slice(0, 500);

    if (!commentBody) return;

    const client = pageCommentsClient;

    if (!client) {
      setCommentsError("Supabase is not connected yet. Check the Project URL and public key environment variables.");
      return;
    }

    setCommentsError("");

    const { data, error } = await client!
      .from("skillatlas_page_comments")
      .insert({
        page_path: currentPagePath,
        display_name: trimmedName,
        body: commentBody,
      })
      .select("id,page_path,display_name,body,created_at")
      .single();

    if (error) {
      setCommentsError(`Could not send your comment: ${error.message}`);
      return;
    }

    if (data) {
      setComments((currentComments) => {
        if (currentComments.some((comment) => comment.id === data.id)) return currentComments;
        return [...currentComments, data as PageComment].slice(-80);
      });
    }

    setDisplayName(trimmedName);
    setSelectedEmojis([]);
    setChatInput("");
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

        ::view-transition-group(root) {
          animation-duration: 380ms;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
        }

        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation-duration: 380ms;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          mix-blend-mode: normal;
          pointer-events: none;
        }


        html.skillatlas-theme-freeze *,
        html.skillatlas-theme-freeze *::before,
        html.skillatlas-theme-freeze *::after {
          transition-duration: 0ms !important;
          transition-delay: 0ms !important;
          animation-duration: 0ms !important;
          animation-delay: 0ms !important;
        }

        html.skillatlas-theme-freeze [class*="duration-"],
        html.skillatlas-theme-freeze [class*="transition-"] {
          transition-duration: 0ms !important;
          transition-delay: 0ms !important;
        }

        ::view-transition-old(root) {
          animation-name: skillatlas-theme-fade-out;
        }

        ::view-transition-new(root) {
          animation-name: skillatlas-theme-fade-in;
        }

        @keyframes skillatlas-theme-fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes skillatlas-theme-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
            background-color 180ms ease,
            border-color 180ms ease,
            opacity 180ms ease,
            transform 180ms ease,
            box-shadow 180ms ease;
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
          transition: opacity 160ms ease;
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
            transform 180ms ease,
            background-color 180ms ease,
            box-shadow 180ms ease;
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


        .skillatlas-live-chat {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 120;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          font-family: inherit;
        }

        .skillatlas-live-chat-panel {
          display: flex;
          width: min(480px, calc(100vw - 32px));
          max-height: min(680px, calc(100vh - 116px));
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(255, 47, 168, 0.36);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 22px 60px rgba(15, 23, 42, 0.18);
          backdrop-filter: blur(18px);
          transform-origin: bottom right;
          animation: skillatlas-chat-rise 220ms ease both;
        }

        .skillatlas-live-chat-header {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 16px;
          border-bottom: 1px solid rgba(255, 47, 168, 0.18);
          background:
            linear-gradient(135deg, rgba(25, 211, 207, 0.12), rgba(255, 47, 168, 0.10)),
            rgba(255, 255, 255, 0.84);
        }

        .skillatlas-live-chat-kicker {
          margin: 0;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--skillatlas-turquoise);
        }

        .skillatlas-live-chat-title {
          margin: 3px 0 0;
          font-size: 16px;
          font-weight: 950;
          color: #111827;
        }

        .skillatlas-live-chat-close {
          display: grid;
          width: 32px;
          height: 32px;
          place-items: center;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          color: #111827;
          font-size: 18px;
          font-weight: 900;
          line-height: 1;
          transition:
            border-color 180ms ease,
            color 180ms ease,
            transform 180ms ease;
        }

        .skillatlas-live-chat-close:hover {
          transform: translateY(-1px);
          border-color: var(--skillatlas-pink);
          color: var(--skillatlas-pink);
        }

        .skillatlas-live-chat-body {
          display: grid;
          flex: 1 1 auto;
          min-height: 120px;
          max-height: none;
          gap: 5px;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 10px;
        }

        .skillatlas-live-chat-message {
          width: 100%;
          max-width: 100%;
          border-radius: 12px;
          padding: 6px 8px;
          font-size: 11.5px;
          font-weight: 700;
          line-height: 1.2;
        }

        .skillatlas-live-chat-message.assistant {
          justify-self: stretch;
          background: rgba(25, 211, 207, 0.09);
          color: #243447;
        }

        .skillatlas-live-chat-message.visitor {
          justify-self: stretch;
          background: linear-gradient(135deg, var(--skillatlas-turquoise), var(--skillatlas-pink));
          color: #ffffff;
        }

        .skillatlas-live-chat-meta {
          display: inline;
          margin: 0 7px 0 0;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          opacity: 0.72;
        }

        .skillatlas-live-chat-text {
          display: inline;
          margin: 0;
        }

        .skillatlas-custom-comment-emoji {
          display: inline-grid;
          width: 1.42em;
          height: 1.42em;
          place-items: center;
          margin: 0 0.12em;
          border-radius: 999px;
          font-size: 1.04em;
          font-weight: 950;
          line-height: 1;
          vertical-align: -0.16em;
          background: rgba(255,255,255,0.78);
          box-shadow: inset 0 0 0 1px rgba(15,23,42,0.06);
        }

        .skillatlas-custom-comment-emoji.turquoise {
          color: var(--skillatlas-turquoise);
        }

        .skillatlas-custom-comment-emoji.pink {
          color: var(--skillatlas-pink);
        }

        .skillatlas-custom-comment-emoji.skillatlas-gradient,
        .skillatlas-custom-comment-emoji.skillatlas-logo {
          color: #ffffff;
          background: linear-gradient(135deg, var(--skillatlas-turquoise), var(--skillatlas-pink));
        }

        .skillatlas-custom-comment-emoji.skillatlas-logo {
          font-size: 1.08em;
          clip-path: polygon(50% 2%, 95% 90%, 55% 70%, 50% 47%, 45% 70%, 5% 90%);
        }

        .skillatlas-custom-comment-emoji.earth {
          background:
            radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0 13%, transparent 14%),
            linear-gradient(135deg, rgba(25,211,207,0.18), rgba(255,47,168,0.14)),
            rgba(255,255,255,0.78);
        }

        .skillatlas-custom-comment-emoji.controller {
          font-size: 0.98em;
        }

        .skillatlas-live-chat-empty,
        .skillatlas-live-chat-error {
          margin: 0;
          border-radius: 16px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.35;
        }

        .skillatlas-live-chat-empty {
          background: rgba(25, 211, 207, 0.10);
          color: #334155;
        }

        .skillatlas-live-chat-error {
          background: rgba(255, 47, 168, 0.10);
          color: #be185d;
        }

        .skillatlas-live-chat-form {
          display: grid;
          flex: 0 0 auto;
          gap: 8px;
          padding: 10px 12px;
          border-top: 1px solid rgba(255, 47, 168, 0.16);
          background: rgba(248, 250, 252, 0.86);
        }

        .skillatlas-live-chat-name-row,
        .skillatlas-live-chat-input-row {
          display: flex;
          gap: 8px;
        }

        .skillatlas-live-chat-name-row {
          flex: 0 0 auto;
        }

        .skillatlas-live-chat-input-row {
          align-items: stretch;
        }

        .skillatlas-live-chat-input-shell {
          display: flex;
          min-width: 0;
          flex: 1;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 999px;
          background: #ffffff;
          padding: 5px 10px;
          box-shadow: inset 0 0 0 1px rgba(25, 211, 207, 0);
        }

        .skillatlas-live-chat-input-shell:focus-within {
          border-color: var(--skillatlas-turquoise);
          box-shadow: 0 0 0 3px rgba(25, 211, 207, 0.14);
        }

        .skillatlas-live-chat-selected-emojis {
          display: flex;
          max-width: 42%;
          flex: 0 0 auto;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
        }

        .skillatlas-live-chat-selected-emoji {
          display: grid;
          width: 24px;
          height: 24px;
          place-items: center;
          border: 0;
          border-radius: 999px;
          background: transparent;
          padding: 0;
          transition: transform 160ms ease;
        }

        .skillatlas-live-chat-selected-emoji:hover {
          transform: translateY(-1px) scale(1.06);
        }

        .skillatlas-live-chat-selected-emoji .skillatlas-custom-comment-emoji {
          width: 22px;
          height: 22px;
          margin: 0;
          font-size: 14px;
          vertical-align: middle;
        }

        .skillatlas-live-chat-emoji-menu-wrap {
          position: relative;
          flex: 0 0 auto;
        }

        .skillatlas-live-chat-emoji-trigger {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 1px solid rgba(255, 47, 168, 0.24);
          border-radius: 999px;
          background:
            linear-gradient(135deg, rgba(25,211,207,0.14), rgba(255,47,168,0.14)),
            rgba(255,255,255,0.92);
          color: var(--skillatlas-pink);
          font-size: 18px;
          font-weight: 950;
          line-height: 1;
          transition:
            border-color 160ms ease,
            transform 160ms ease,
            box-shadow 160ms ease;
        }

        .skillatlas-live-chat-emoji-trigger:hover,
        .skillatlas-live-chat-emoji-trigger.open {
          transform: translateY(-1px);
          border-color: var(--skillatlas-turquoise);
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.12);
        }

        .skillatlas-live-chat-emoji-menu {
          position: absolute;
          right: 50%;
          bottom: calc(100% + 8px);
          z-index: 6;
          display: grid;
          width: min(248px, calc(100vw - 64px));
          max-height: min(280px, calc(100vh - 220px));
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 7px;
          overflow-y: auto;
          overscroll-behavior: contain;
          border: 1px solid rgba(255, 47, 168, 0.28);
          border-radius: 18px;
          background: rgba(255,255,255,0.98);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
          padding: 8px;
          transform: translateX(50%);
          backdrop-filter: blur(16px);
        }

        .skillatlas-live-chat-emoji-option {
          display: grid;
          width: 44px;
          height: 44px;
          place-items: center;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 14px;
          background: rgba(248,250,252,0.84);
          padding: 0;
          color: #243447;
          transition:
            border-color 160ms ease,
            transform 160ms ease,
            background-color 160ms ease;
        }

        .skillatlas-live-chat-emoji-option:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,0.98);
        }

        .skillatlas-live-chat-emoji-option .skillatlas-custom-comment-emoji {
          width: 28px;
          height: 28px;
          margin: 0;
          font-size: 17px;
          vertical-align: middle;
        }

        .skillatlas-live-chat-emoji-option.turquoise:hover {
          border-color: var(--skillatlas-turquoise);
        }

        .skillatlas-live-chat-emoji-option.pink:hover,
        .skillatlas-live-chat-emoji-option.skillatlas-logo:hover,
        .skillatlas-live-chat-emoji-option.skillatlas-gradient:hover {
          border-color: var(--skillatlas-pink);
        }

        .skillatlas-live-chat-input,
        .skillatlas-live-chat-name {
          min-width: 0;
          background: #ffffff;
          color: #111827;
          font-size: 13px;
          font-weight: 700;
          outline: none;
        }

        .skillatlas-live-chat-name {
          width: 100%;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 999px;
          padding: 10px 13px;
        }

        .skillatlas-live-chat-input {
          min-width: 84px;
          flex: 1;
          border: 0;
          padding: 5px 0;
        }

        .skillatlas-live-chat-name:focus {
          border-color: var(--skillatlas-turquoise);
          box-shadow: 0 0 0 3px rgba(25, 211, 207, 0.14);
        }

        .skillatlas-live-chat-send {
          border: 0;
          border-radius: 999px;
          background: var(--skillatlas-turquoise);
          color: #ffffff;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 900;
          transition:
            filter 180ms ease,
            transform 180ms ease;
        }

        .skillatlas-live-chat-send:hover {
          filter: brightness(1.04);
          transform: translateY(-1px);
        }

        .skillatlas-live-chat-toggle {
          display: grid;
          width: 54px;
          height: 54px;
          place-items: center;
          border: 1px solid rgba(255, 47, 168, 0.38);
          border-radius: 999px;
          background: linear-gradient(135deg, var(--skillatlas-turquoise), var(--skillatlas-pink));
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.24);
          color: #ffffff;
          font-size: 24px;
          font-weight: 950;
          line-height: 1;
          transition:
            opacity 180ms ease,
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .skillatlas-live-chat-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 38px rgba(15, 23, 42, 0.28);
        }

        .skillatlas-live-chat-arrow {
          display: block;
          transform: rotate(-135deg);
          transition: transform 180ms ease;
        }

        .skillatlas-live-chat-toggle.open .skillatlas-live-chat-arrow {
          transform: rotate(45deg);
        }

        html.skillatlas-dark .skillatlas-live-chat-panel {
          border-color: rgba(255, 47, 168, 0.42);
          background: rgba(47, 58, 70, 0.97);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.26);
        }

        html.skillatlas-dark .skillatlas-live-chat-header {
          border-bottom-color: rgba(255, 47, 168, 0.26);
          background:
            linear-gradient(135deg, rgba(25, 211, 207, 0.12), rgba(255, 47, 168, 0.12)),
            rgba(53, 66, 80, 0.92);
        }

        html.skillatlas-dark .skillatlas-live-chat-title,
        html.skillatlas-dark .skillatlas-live-chat-close {
          color: var(--skillatlas-text-dark);
        }

        html.skillatlas-dark .skillatlas-live-chat-close {
          border-color: rgba(203, 213, 225, 0.22);
          background: rgba(39, 51, 65, 0.88);
        }

        html.skillatlas-dark .skillatlas-live-chat-message.assistant {
          background: rgba(25, 211, 207, 0.12);
          color: var(--skillatlas-text-dark);
        }

        html.skillatlas-dark .skillatlas-live-chat-form {
          border-top-color: rgba(255, 47, 168, 0.22);
          background: rgba(39, 51, 65, 0.86);
        }

        html.skillatlas-dark .skillatlas-live-chat-input,
        html.skillatlas-dark .skillatlas-live-chat-name {
          border-color: rgba(203, 213, 225, 0.24);
          background: rgba(32, 43, 55, 0.96);
          color: var(--skillatlas-text-dark);
        }

        html.skillatlas-dark .skillatlas-live-chat-input-shell {
          border-color: rgba(203, 213, 225, 0.24);
          background: rgba(32, 43, 55, 0.96);
        }

        html.skillatlas-dark .skillatlas-live-chat-emoji-trigger,
        html.skillatlas-dark .skillatlas-live-chat-emoji-menu,
        html.skillatlas-dark .skillatlas-live-chat-selected-emoji,
        html.skillatlas-dark .skillatlas-custom-comment-emoji {
          border-color: rgba(203, 213, 225, 0.18);
          background: rgba(32, 43, 55, 0.92);
        }

        html.skillatlas-dark .skillatlas-live-chat-emoji-option {
          border-color: rgba(203, 213, 225, 0.16);
          background: rgba(39, 51, 65, 0.92);
          color: var(--skillatlas-text-dark);
        }

        html.skillatlas-dark .skillatlas-live-chat-emoji-option:hover {
          background: rgba(53, 66, 80, 0.98);
        }

        html.skillatlas-dark .skillatlas-live-chat-empty {
          background: rgba(25, 211, 207, 0.10);
          color: var(--skillatlas-muted-dark);
        }

        html.skillatlas-dark .skillatlas-live-chat-error {
          background: rgba(255, 47, 168, 0.12);
          color: #ff8ccc;
        }

        @keyframes skillatlas-chat-rise {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          ::view-transition-old(root),
          ::view-transition-new(root),
          .skillatlas-theme-switch,
          .skillatlas-theme-track-icon,
          .skillatlas-theme-knob,
          .skillatlas-live-chat-panel,
          .skillatlas-live-chat-toggle,
          .skillatlas-live-chat-arrow,
          .skillatlas-live-chat-close,
          .skillatlas-live-chat-send,
          .skillatlas-live-chat-emoji-trigger,
          .skillatlas-live-chat-emoji-option,
          .skillatlas-live-chat-selected-emoji {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }

        @media (max-width: 900px) {
          .skillatlas-theme-switch {
            right: 18px;
            top: 12px;
          }

          .skillatlas-live-chat {
            right: 16px;
            bottom: 16px;
          }

          .skillatlas-live-chat-panel {
            width: min(440px, calc(100vw - 32px));
          }

          .skillatlas-live-chat-emoji-menu {
            width: min(220px, calc(100vw - 64px));
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
      `}</style>

      <button
        type="button"
        onClick={toggleTheme}
        className={`skillatlas-theme-switch ${
          ready && !headerShrunk && !hideToggle ? "opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={darkMode}
      >
        <span className="skillatlas-theme-track-icon skillatlas-theme-sun">☀</span>
        <span className="skillatlas-theme-track-icon skillatlas-theme-moon">☾</span>
        <span className="skillatlas-theme-knob" />
      </button>

      {!hideLiveChat && (
        <div className="skillatlas-live-chat">
          {chatOpen && (
            <section className="skillatlas-live-chat-panel" aria-label="SkillAtlas page comments">
              <div className="skillatlas-live-chat-header">
                <div>
                  <p className="skillatlas-live-chat-kicker">Live Comments</p>
                  <p className="skillatlas-live-chat-title">{currentPageName}</p>
                </div>

                <button
                  type="button"
                  className="skillatlas-live-chat-close"
                  onClick={() => setChatOpen(false)}
                  aria-label="Close page comments"
                >
                  ×
                </button>
              </div>

              <div className="skillatlas-live-chat-body">
                {commentsLoading && <p className="skillatlas-live-chat-empty">Loading comments...</p>}

                {!commentsLoading && comments.length === 0 && !commentsError && (
                  <p className="skillatlas-live-chat-empty">No comments on this page yet. Be first through the portal.</p>
                )}

                {comments.map((comment) => (
                  <div key={comment.id} className="skillatlas-live-chat-message assistant">
                    <p className="skillatlas-live-chat-meta">{comment.display_name}</p>
                    <p className="skillatlas-live-chat-text">{renderCommentBody(comment.body)}</p>
                  </div>
                ))}

                {commentsError && <p className="skillatlas-live-chat-error">{commentsError}</p>}

                <div ref={commentsEndRef} />
              </div>

              <form className="skillatlas-live-chat-form" onSubmit={handleChatSubmit}>
                <div className="skillatlas-live-chat-name-row">
                  <input
                    className="skillatlas-live-chat-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Name"
                    maxLength={32}
                    aria-label="Display name"
                  />
                </div>

                <div className="skillatlas-live-chat-input-row">
                  <div className="skillatlas-live-chat-input-shell">
                    {selectedEmojis.length > 0 && (
                      <div className="skillatlas-live-chat-selected-emojis" aria-label="Selected SkillAtlas emojis">
                        {selectedEmojis.map((emoji, index) => (
                          <button
                            key={`${emoji.code}-${index}`}
                            type="button"
                            className={`skillatlas-live-chat-selected-emoji ${emoji.className}`}
                            onClick={() => removeSelectedEmoji(index)}
                            aria-label={`Remove ${emoji.label}`}
                          >
                            {renderSkillAtlasEmoji(emoji)}
                          </button>
                        ))}
                      </div>
                    )}

                    <input
                      className="skillatlas-live-chat-input"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder={selectedEmojis.length > 0 ? "Add text..." : "Add a comment..."}
                      maxLength={350}
                      aria-label="Page comment"
                    />
                  </div>

                  <div className="skillatlas-live-chat-emoji-menu-wrap">
                    <button
                      type="button"
                      className={`skillatlas-live-chat-emoji-trigger ${emojiMenuOpen ? "open" : ""}`}
                      onClick={() => setEmojiMenuOpen((open) => !open)}
                      aria-label="Open SkillAtlas emoji menu"
                      aria-expanded={emojiMenuOpen}
                    >
                      ✦
                    </button>

                    {emojiMenuOpen && (
                      <div className="skillatlas-live-chat-emoji-menu" aria-label="SkillAtlas emojis">
                        {SKILLATLAS_EMOJIS.map((emoji) => (
                          <button
                            key={emoji.code}
                            type="button"
                            className={`skillatlas-live-chat-emoji-option ${emoji.className}`}
                            onClick={() => addEmojiToComment(emoji)}
                            aria-label={`Add ${emoji.label}`}
                            title={emoji.label}
                          >
                            {renderSkillAtlasEmoji(emoji)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="skillatlas-live-chat-send">
                    Send
                  </button>
                </div>
              </form>
            </section>
          )}

          <button
            type="button"
            className={`skillatlas-live-chat-toggle ${chatOpen ? "open" : ""}`}
            onClick={() => setChatOpen((open) => !open)}
            aria-label={chatOpen ? "Close page comments" : "Open page comments"}
            aria-expanded={chatOpen}
          >
            <span className="skillatlas-live-chat-arrow">➜</span>
          </button>
        </div>
      )}

      {children}
    </>
  );
}
