"use client";

import type { ClipboardEvent, FormEvent, KeyboardEvent, ReactNode } from "react";
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
  { label: "Turquoise smiley", symbol: "🙂", code: ":sa_turquoise_smiley:", className: "turquoise native-tint face-emoji" },
  { label: "Pink frowny", symbol: "🙁", code: ":sa_pink_frowny:", className: "pink native-tint face-emoji" },
  { label: "Turquoise heart", symbol: "💙", code: ":sa_turquoise_heart:", className: "turquoise native-tint heart-emoji" },
  { label: "Pink heart", symbol: "💖", code: ":sa_pink_heart:", className: "pink native-tint heart-emoji" },
  { label: "Turquoise crying laughing", symbol: "😂", code: ":sa_turquoise_laugh:", className: "turquoise laugh native-tint" },
  { label: "Pink angry", symbol: "😠", code: ":sa_pink_angry:", className: "pink angry native-tint" },
  { label: "Turquoise thumbs up", symbol: "👍", code: ":sa_turquoise_thumbsup:", className: "turquoise thumb native-tint" },
  { label: "Pink thumbs down", symbol: "👎", code: ":sa_pink_thumbsdown:", className: "pink thumb native-tint" },
  { label: "Turquoise controller", symbol: "🎮", code: ":sa_turquoise_controller:", className: "turquoise controller native-tint" },
  { label: "Pink computer", symbol: "💻", code: ":sa_pink_computer:", className: "pink computer native-tint" },
  { label: "Turquoise globe", symbol: "🌍", code: ":sa_turquoise_earth:", className: "turquoise native-tint globe-emoji" },
  { label: "Pink globe", symbol: "🌍", code: ":sa_pink_earth:", className: "pink native-tint globe-emoji" },
  { label: "Turquoise crown", symbol: "♛", code: ":sa_turquoise_crown:", className: "turquoise crown" },
  { label: "Pink crown", symbol: "♛", code: ":sa_pink_crown:", className: "pink crown" },
  { label: "SkillAtlas logo", symbol: "", code: ":sa_logo:", className: "skillatlas-logo" },
  { label: "Turquoise number one", symbol: "☝", code: ":sa_turquoise_number_one:", className: "turquoise number-one native-tint" },
] as const;

type SkillAtlasEmoji = (typeof SKILLATLAS_EMOJIS)[number];

function findSkillAtlasEmoji(code: string) {
  return SKILLATLAS_EMOJIS.find((emoji) => emoji.code === code);
}

function renderSkillAtlasEmoji(emoji: SkillAtlasEmoji, key?: string | number) {
  if (emoji.className.includes("skillatlas-logo")) {
    return (
      <span
        key={key}
        className="skillatlas-custom-comment-emoji skillatlas-logo"
        aria-label={emoji.label}
        title={emoji.label}
      >
        <img src="/skillatlas-logo.png" alt="" className="skillatlas-mini-logo-image" />
      </span>
    );
  }

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


function setupRankingsDropdown() {
  const navs = Array.from(document.querySelectorAll<HTMLElement>("header nav"));

  navs.forEach((nav) => {
    const directUserRankingsLinks = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a[href]")).filter((link) => {
      const text = link.textContent?.trim().toLowerCase() ?? "";
      return text === "user rankings" && !link.closest(".skillatlas-rankings-dropdown");
    });

    directUserRankingsLinks.forEach((link) => link.remove());

    const existingDropdown = nav.querySelector<HTMLElement>(".skillatlas-rankings-dropdown");
    if (existingDropdown) return;

    const rankingsLink = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a[href]")).find((link) => {
      const text = link.textContent?.trim().toLowerCase() ?? "";
      const href = normaliseHref(link.getAttribute("href") ?? "");
      return text === "rankings" && href === "/";
    });

    if (!rankingsLink) return;

    const wrapper = document.createElement("div");
    wrapper.className = "skillatlas-rankings-dropdown";
    wrapper.setAttribute("data-skillatlas-rankings-dropdown", "true");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = rankingsLink.className;
    trigger.classList.add("skillatlas-rankings-trigger");
    trigger.innerHTML = '<span>Rankings</span><span class="skillatlas-rankings-chevron" aria-hidden="true">⌄</span>';
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");

    const menu = document.createElement("div");
    menu.className = "skillatlas-rankings-menu";
    menu.setAttribute("role", "menu");

    const items = [
      { label: "Rankings", href: "/", description: "General country rankings" },
      { label: "User Rankings", href: "/user-rankings", description: "Community country votes" },
      { label: "Live Rankings", href: "/live-rankings", description: "Drag countries in real time" },
    ];

    items.forEach((item) => {
      const anchor = document.createElement("a");
      anchor.href = item.href;
      anchor.className = "skillatlas-rankings-menu-item";
      anchor.setAttribute("role", "menuitem");
      anchor.innerHTML = `<span>${item.label}</span><small>${item.description}</small>`;
      menu.appendChild(anchor);
    });

    wrapper.append(trigger, menu);
    rankingsLink.replaceWith(wrapper);

    wrapper.addEventListener("mouseenter", () => trigger.setAttribute("aria-expanded", "true"));
    wrapper.addEventListener("mouseleave", () => trigger.setAttribute("aria-expanded", "false"));
    wrapper.addEventListener("focusin", () => trigger.setAttribute("aria-expanded", "true"));
    wrapper.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (!wrapper.contains(document.activeElement)) {
          trigger.setAttribute("aria-expanded", "false");
        }
      }, 0);
    });

    trigger.addEventListener("click", () => {
      const open = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", open ? "false" : "true");
    });
  });
}

function updateActiveHeaderNavigation() {
  setupRankingsDropdown();

  const currentPath = normaliseHref(window.location.pathname);
  const rankingPaths = ["/", "/user-rankings", "/live-rankings"];

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("header nav a[href]"));

  links.forEach((link) => {
    const linkPath = normaliseHref(link.getAttribute("href") ?? "");
    const isRankings = currentPath === "/" && linkPath === "/";
    const isOtherPage = linkPath !== "/" && currentPath.startsWith(linkPath);
    const isActive = isRankings || isOtherPage;

    link.classList.toggle("skillatlas-active-nav", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  const dropdowns = Array.from(document.querySelectorAll<HTMLElement>(".skillatlas-rankings-dropdown"));
  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector<HTMLElement>(".skillatlas-rankings-trigger");
    const menuItems = Array.from(dropdown.querySelectorAll<HTMLAnchorElement>(".skillatlas-rankings-menu-item"));

    const rankingsActive = rankingPaths.includes(currentPath);
    trigger?.classList.toggle("skillatlas-active-nav", rankingsActive);
    trigger?.setAttribute("aria-current", rankingsActive ? "page" : "false");

    menuItems.forEach((item) => {
      const itemPath = normaliseHref(item.getAttribute("href") ?? "");
      const itemActive = itemPath === currentPath || (itemPath !== "/" && currentPath.startsWith(itemPath));
      item.classList.toggle("skillatlas-active-nav", itemActive);
      item.setAttribute("aria-current", itemActive ? "page" : "false");
    });
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
  const [commentEditorEmpty, setCommentEditorEmpty] = useState(true);
  const [comments, setComments] = useState<PageComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const currentPagePath = pathname || "/";
  const currentPageName = useMemo(() => displayPathName(currentPagePath), [currentPagePath]);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);
  const commentEditorRef = useRef<HTMLDivElement | null>(null);
  const savedEditorRangeRef = useRef<Range | null>(null);
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

  function editorIsEmpty() {
    const editor = commentEditorRef.current;
    if (!editor) return true;

    const hasEmoji = Boolean(editor.querySelector("[data-emoji-code]"));
    const text = (editor.textContent ?? "").replace(/\u00a0/g, " ").trim();

    return !hasEmoji && !text;
  }

  function updateEditorEmptyState() {
    setCommentEditorEmpty(editorIsEmpty());
  }

  function saveEditorSelection() {
    const editor = commentEditorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    if (editor.contains(container)) {
      savedEditorRangeRef.current = range.cloneRange();
    }
  }

  function restoreEditorSelection() {
    const editor = commentEditorRef.current;
    if (!editor) return null;

    const selection = window.getSelection();
    let range = savedEditorRangeRef.current;

    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    selection?.removeAllRanges();
    selection?.addRange(range);

    return range;
  }

  function addEmojiToComment(emoji: SkillAtlasEmoji) {
    const editor = commentEditorRef.current;
    if (!editor) return;

    editor.focus();

    const range = restoreEditorSelection();
    if (!range) return;

    const emojiNode = document.createElement("span");
    emojiNode.className = `skillatlas-custom-comment-emoji ${emoji.className}`;
    emojiNode.dataset.emojiCode = emoji.code;
    emojiNode.setAttribute("aria-label", emoji.label);
    emojiNode.setAttribute("title", emoji.label);
    emojiNode.setAttribute("contenteditable", "false");

    if (emoji.className.includes("skillatlas-logo")) {
      emojiNode.innerHTML = '<img src="/skillatlas-logo.png" alt="" class="skillatlas-mini-logo-image" />';
    } else {
      emojiNode.textContent = emoji.symbol;
    }

    range.deleteContents();
    range.insertNode(emojiNode);
    range.setStartAfter(emojiNode);
    range.setEndAfter(emojiNode);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    savedEditorRangeRef.current = range.cloneRange();
    setCommentEditorEmpty(false);
  }

  function serializeEditorNode(node: ChildNode): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";

    if (node instanceof HTMLElement) {
      const emojiCode = node.dataset.emojiCode;
      if (emojiCode) return emojiCode;

      if (node.tagName === "BR") return "\n";
    }

    return Array.from(node.childNodes).map(serializeEditorNode).join("");
  }

  function getCommentEditorBody() {
    const editor = commentEditorRef.current;
    if (!editor) return "";

    return Array.from(editor.childNodes)
      .map(serializeEditorNode)
      .join("")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 500);
  }

  function clearCommentEditor() {
    if (commentEditorRef.current) {
      commentEditorRef.current.innerHTML = "";
    }

    savedEditorRangeRef.current = null;
    setCommentEditorEmpty(true);
  }

  function handleEditorInput() {
    saveEditorSelection();
    updateEditorEmptyState();
  }

  function handleEditorPaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();

    const pastedText = event.clipboardData.getData("text/plain").slice(0, 350);
    document.execCommand("insertText", false, pastedText);

    window.setTimeout(() => {
      saveEditorSelection();
      updateEditorEmptyState();
    }, 0);
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.closest("form")?.requestSubmit();
    }
  }

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = displayName.trim().slice(0, 32) || "Visitor";
    const commentBody = getCommentEditorBody();

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
    clearCommentEditor();
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


        header nav .skillatlas-rankings-dropdown {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
        }

        header nav .skillatlas-rankings-trigger {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-family: inherit;
          font-weight: 700;
          line-height: 1;
          padding: 0;
        }

        header nav .skillatlas-rankings-trigger.skillatlas-active-nav {
          color: var(--skillatlas-turquoise) !important;
        }

        header nav .skillatlas-rankings-chevron {
          display: inline-block;
          color: var(--skillatlas-pink);
          font-size: 0.92em;
          font-weight: 950;
          transform: translateY(-1px);
          transition: transform 180ms ease;
        }

        header nav .skillatlas-rankings-dropdown:hover .skillatlas-rankings-chevron,
        header nav .skillatlas-rankings-dropdown:focus-within .skillatlas-rankings-chevron,
        header nav .skillatlas-rankings-trigger[aria-expanded="true"] .skillatlas-rankings-chevron {
          transform: translateY(-1px) rotate(180deg);
        }

        header nav .skillatlas-rankings-menu {
          pointer-events: none;
          position: absolute;
          left: 50%;
          top: calc(100% + 10px);
          z-index: 80;
          width: 232px;
          transform: translateX(-50%) translateY(-8px) scale(0.98);
          overflow: hidden;
          border: 1px solid rgba(255, 47, 168, 0.28);
          border-radius: 20px;
          background:
            linear-gradient(135deg, rgba(25,211,207,0.10), rgba(255,47,168,0.10)),
            rgba(255,255,255,0.98);
          box-shadow: 0 22px 50px rgba(15, 23, 42, 0.16);
          opacity: 0;
          padding: 8px;
          transition:
            opacity 170ms ease,
            transform 170ms ease;
          backdrop-filter: blur(18px);
        }

        header nav .skillatlas-rankings-dropdown:hover .skillatlas-rankings-menu,
        header nav .skillatlas-rankings-dropdown:focus-within .skillatlas-rankings-menu,
        header nav .skillatlas-rankings-trigger[aria-expanded="true"] + .skillatlas-rankings-menu {
          pointer-events: auto;
          opacity: 1;
          transform: translateX(-50%) translateY(0) scale(1);
        }

        header nav .skillatlas-rankings-menu::before {
          content: "";
          position: absolute;
          left: 50%;
          top: -6px;
          width: 12px;
          height: 12px;
          border-left: 1px solid rgba(255, 47, 168, 0.28);
          border-top: 1px solid rgba(255, 47, 168, 0.28);
          background: rgba(255,255,255,0.98);
          transform: translateX(-50%) rotate(45deg);
        }

        header nav .skillatlas-rankings-menu-item {
          position: relative;
          display: block;
          border-radius: 14px;
          padding: 10px 12px;
          text-decoration: none;
          transition:
            background-color 160ms ease,
            color 160ms ease,
            transform 160ms ease;
        }

        header nav .skillatlas-rankings-menu-item:hover {
          transform: translateX(2px);
          background: rgba(25, 211, 207, 0.10);
        }

        header nav .skillatlas-rankings-menu-item span {
          display: block;
          color: #111827;
          font-size: 13px;
          font-weight: 950;
        }

        header nav .skillatlas-rankings-menu-item small {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.03em;
        }

        header nav .skillatlas-rankings-menu-item.skillatlas-active-nav {
          background: rgba(25, 211, 207, 0.14);
        }

        header nav .skillatlas-rankings-menu-item.skillatlas-active-nav span {
          color: var(--skillatlas-turquoise);
        }

        html.skillatlas-dark header nav .skillatlas-rankings-menu {
          border-color: rgba(255, 47, 168, 0.34);
          background:
            linear-gradient(135deg, rgba(25,211,207,0.10), rgba(255,47,168,0.10)),
            rgba(39,51,65,0.98);
          box-shadow: 0 24px 54px rgba(0,0,0,0.26);
        }

        html.skillatlas-dark header nav .skillatlas-rankings-menu::before {
          background: rgba(39,51,65,0.98);
          border-color: rgba(255, 47, 168, 0.34);
        }

        html.skillatlas-dark header nav .skillatlas-rankings-menu-item span {
          color: var(--skillatlas-text-dark);
        }

        html.skillatlas-dark header nav .skillatlas-rankings-menu-item small {
          color: var(--skillatlas-muted-dark);
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
          position: relative;
          display: grid;
          width: 32px;
          height: 32px;
          place-items: center;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          color: #111827;
          font-size: 0;
          font-weight: 900;
          line-height: 0;
          padding: 0;
          transition:
            border-color 180ms ease,
            color 180ms ease,
            transform 180ms ease;
        }

        .skillatlas-live-chat-close::before,
        .skillatlas-live-chat-close::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: 13px;
          height: 2.4px;
          border-radius: 999px;
          background: currentColor;
          transform-origin: center;
        }

        .skillatlas-live-chat-close::before {
          transform: translate(-50%, -50%) rotate(45deg);
        }

        .skillatlas-live-chat-close::after {
          transform: translate(-50%, -50%) rotate(-45deg);
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
          position: relative;
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
          overflow: hidden;
        }

        .skillatlas-custom-comment-emoji.turquoise {
          color: var(--skillatlas-turquoise);
        }

        .skillatlas-custom-comment-emoji.pink {
          color: var(--skillatlas-pink);
        }

        .skillatlas-custom-comment-emoji.native-tint {
          background: rgba(255,255,255,0.84);
          font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
          font-size: 1.12em;
          filter: saturate(1.25);
        }

        .skillatlas-custom-comment-emoji.native-tint.turquoise {
          filter: grayscale(0.45) sepia(0.9) saturate(2.7) hue-rotate(128deg) brightness(1.1);
        }

        .skillatlas-custom-comment-emoji.heart-emoji {
          background: rgba(255,255,255,0.84);
          font-size: 1.17em;
          filter: saturate(1.28);
        }

        .skillatlas-custom-comment-emoji.heart-emoji.turquoise {
          filter: grayscale(0.32) sepia(0.85) saturate(2.55) hue-rotate(128deg) brightness(1.12);
        }

        .skillatlas-custom-comment-emoji.heart-emoji.pink {
          filter: grayscale(0.12) sepia(0.75) saturate(2.4) hue-rotate(288deg) brightness(1.08);
        }

        .skillatlas-custom-comment-emoji.native-tint.pink {
          filter: grayscale(0.30) sepia(0.95) saturate(3.1) hue-rotate(288deg) brightness(1.08);
        }

        .skillatlas-custom-comment-emoji.face-emoji,
        .skillatlas-custom-comment-emoji.laugh,
        .skillatlas-custom-comment-emoji.angry,
        .skillatlas-custom-comment-emoji.thumb,
        .skillatlas-custom-comment-emoji.globe-emoji {
          font-size: 1.16em;
        }

        .skillatlas-custom-comment-emoji.controller,
        .skillatlas-custom-comment-emoji.computer {
          font-size: 0.98em;
        }

        .skillatlas-custom-comment-emoji.crown {
          font-size: 1.12em;
          background: rgba(255,255,255,0.84);
        }

        .skillatlas-custom-comment-emoji.skillatlas-gradient {
          color: #ffffff;
          background: linear-gradient(135deg, var(--skillatlas-turquoise), var(--skillatlas-pink));
        }

        .skillatlas-custom-comment-emoji.skillatlas-logo {
          background: transparent !important;
          box-shadow: none;
          overflow: visible;
        }

        .skillatlas-mini-logo-image {
          display: block;
          width: 1.42em;
          height: 1.42em;
          object-fit: contain;
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
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 999px;
          background: #ffffff;
          padding: 7px 12px;
          box-shadow: inset 0 0 0 1px rgba(25, 211, 207, 0);
          cursor: text;
        }

        .skillatlas-live-chat-input-shell:focus-within {
          border-color: var(--skillatlas-turquoise);
          box-shadow: 0 0 0 3px rgba(25, 211, 207, 0.14);
        }

        .skillatlas-live-chat-editor {
          min-width: 0;
          width: 100%;
          max-height: 86px;
          overflow-y: auto;
          color: #111827;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.35;
          outline: none;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .skillatlas-live-chat-input-shell.empty .skillatlas-live-chat-editor::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }

        .skillatlas-live-chat-editor .skillatlas-custom-comment-emoji {
          width: 1.5em;
          height: 1.5em;
          margin: 0 0.12em;
          font-size: 1em;
          vertical-align: -0.22em;
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
          border: 1px solid rgba(25, 211, 207, 0.34);
          border-radius: 999px;
          background:
            linear-gradient(135deg, rgba(25,211,207,0.14), rgba(255,47,168,0.10)),
            rgba(255,255,255,0.92);
          color: var(--skillatlas-turquoise);
          font-size: 18px;
          font-weight: 950;
          line-height: 1;
          padding: 0;
          transition:
            border-color 160ms ease,
            transform 160ms ease,
            box-shadow 160ms ease;
        }

        .skillatlas-live-chat-emoji-trigger .skillatlas-custom-comment-emoji {
          display: flex;
          width: 26px;
          height: 26px;
          align-items: center;
          justify-content: center;
          margin: 0;
          font-size: 20px;
          line-height: 1;
          vertical-align: middle;
          transform: translateY(-1.5px);
        }

        .skillatlas-live-chat-emoji-trigger:hover,
        .skillatlas-live-chat-emoji-trigger.open {
          transform: translateY(-1px);
          border-color: var(--skillatlas-turquoise);
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.12);
        }

        .skillatlas-live-chat-emoji-menu {
          position: absolute;
          right: 0;
          bottom: calc(100% + 8px);
          z-index: 6;
          display: grid;
          width: 224px;
          max-width: calc(100vw - 64px);
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
          transform: translateX(-2px);
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
          font-size: 18px;
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

        .skillatlas-live-chat-name {
          min-width: 0;
          width: 100%;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 999px;
          background: #ffffff;
          color: #111827;
          padding: 10px 13px;
          font-size: 13px;
          font-weight: 700;
          outline: none;
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

        html.skillatlas-dark .skillatlas-live-chat-name,
        html.skillatlas-dark .skillatlas-live-chat-input-shell {
          border-color: rgba(203, 213, 225, 0.24);
          background: rgba(32, 43, 55, 0.96);
          color: var(--skillatlas-text-dark);
        }

        html.skillatlas-dark .skillatlas-live-chat-editor {
          color: var(--skillatlas-text-dark);
        }

        html.skillatlas-dark .skillatlas-live-chat-input-shell.empty .skillatlas-live-chat-editor::before {
          color: rgba(203, 213, 225, 0.72);
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
            width: min(224px, calc(100vw - 64px));
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
                  <div
                    className={`skillatlas-live-chat-input-shell ${commentEditorEmpty ? "empty" : ""}`}
                    onClick={() => commentEditorRef.current?.focus()}
                  >
                    <div
                      ref={commentEditorRef}
                      className="skillatlas-live-chat-editor"
                      contentEditable
                      suppressContentEditableWarning
                      role="textbox"
                      aria-label="Page comment"
                      data-placeholder="Add a comment..."
                      onInput={handleEditorInput}
                      onKeyDown={handleEditorKeyDown}
                      onKeyUp={saveEditorSelection}
                      onMouseUp={saveEditorSelection}
                      onFocus={saveEditorSelection}
                      onBlur={saveEditorSelection}
                      onPaste={handleEditorPaste}
                    />
                  </div>

                  <div className="skillatlas-live-chat-emoji-menu-wrap">
                    <button
                      type="button"
                      className={`skillatlas-live-chat-emoji-trigger ${emojiMenuOpen ? "open" : ""}`}
                      onClick={() => {
                        saveEditorSelection();
                        setEmojiMenuOpen((open) => !open);
                      }}
                      aria-label="Open SkillAtlas emoji menu"
                      aria-expanded={emojiMenuOpen}
                    >
                      {renderSkillAtlasEmoji(SKILLATLAS_EMOJIS[0])}
                    </button>

                    {emojiMenuOpen && (
                      <div className="skillatlas-live-chat-emoji-menu" aria-label="SkillAtlas emojis">
                        {SKILLATLAS_EMOJIS.map((emoji) => (
                          <button
                            key={emoji.code}
                            type="button"
                            className={`skillatlas-live-chat-emoji-option ${emoji.className}`}
                            onMouseDown={(event) => event.preventDefault()}
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
