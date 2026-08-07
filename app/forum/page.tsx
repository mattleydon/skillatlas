"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  forumCategories,
  getForumCategory,
  initialForumThreads,
  type ForumCategoryId,
  type ForumStatus,
  type ForumThread,
} from "./forum-data";

type ActiveCategory = "all" | ForumCategoryId;

type ThreadDraft = {
  title: string;
  category: ForumCategoryId;
  author: string;
  country: string;
  preview: string;
  tags: string;
};

const emptyDraft: ThreadDraft = {
  title: "",
  category: "general",
  author: "",
  country: "",
  preview: "",
  tags: "",
};

function statusClass(status: ForumStatus) {
  if (status === "Hot") return "border-[#ff2fa8]/35 bg-[#ff2fa8]/10 text-[#ff2fa8]";
  if (status === "Suggestion") return "border-[#19d3cf]/35 bg-[#19d3cf]/10 text-[#19d3cf]";
  if (status === "Answered") return "border-emerald-400/35 bg-emerald-400/10 text-emerald-600";
  if (status === "Debate") return "border-purple-400/35 bg-purple-400/10 text-purple-600";
  return "border-sky-400/35 bg-sky-400/10 text-sky-600";
}

function formatMetric(value: number) {
  return new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function makeThreadSlug(title: string) {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 54);

  return `local-${titleSlug || "thread"}-${Date.now().toString().slice(-6)}`;
}

function ForumBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_9%,rgba(25,211,207,0.18),transparent_29%),radial-gradient(circle_at_82%_22%,rgba(255,47,168,0.14),transparent_31%),linear-gradient(180deg,#F8FAFC_0%,#EEF7FA_100%)]" />
      <div className="absolute left-[-12%] top-40 h-[560px] w-[560px] rounded-full border border-[#19d3cf]/20" />
      <div className="absolute right-[-14%] top-80 h-[640px] w-[640px] rounded-full border border-[#ff2fa8]/20" />
      <div className="absolute inset-x-0 top-[270px] h-px bg-[#ff2fa8]/20" />
      <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(15,23,42,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.28)_1px,transparent_1px)] [background-size:96px_96px]" />
    </div>
  );
}

export default function ForumPage() {
  const [threads, setThreads] = useState<ForumThread[]>(initialForumThreads);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("all");
  const [search, setSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState<ThreadDraft>(emptyDraft);
  const [formError, setFormError] = useState("");

  const categoryCounts = useMemo(
    () =>
      new Map(
        forumCategories.map((category) => [
          category.id,
          threads.filter((thread) => thread.category === category.id).length,
        ])
      ),
    [threads]
  );

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return threads.filter((thread) => {
      const matchesCategory = activeCategory === "all" || thread.category === activeCategory;
      const searchable = [
        thread.title,
        thread.preview,
        thread.author,
        thread.country,
        getForumCategory(thread.category)?.label ?? "",
        ...thread.tags,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!query || searchable.includes(query));
    });
  }, [activeCategory, search, threads]);

  const totalReplies = threads.reduce((sum, thread) => sum + thread.replies, 0);
  const totalVotes = threads.reduce((sum, thread) => sum + thread.votes, 0);

  function updateDraft<Key extends keyof ThreadDraft>(key: Key, value: ThreadDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleCreateThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = draft.title.trim();
    const author = draft.author.trim();
    const country = draft.country.trim();
    const preview = draft.preview.trim();

    if (!title || !author || !country || !preview) {
      setFormError("Add a title, author name, country, and opening message.");
      return;
    }

    const tags = draft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 4);
    const slug = makeThreadSlug(title);
    const createdThread: ForumThread = {
      id: slug,
      slug,
      title,
      category: draft.category,
      author,
      country,
      replies: 0,
      votes: 0,
      views: 1,
      status: "New",
      preview,
      body: preview,
      tags: tags.length > 0 ? tags : [getForumCategory(draft.category)?.label ?? "Forum"],
      lastActivity: "Just now",
    };

    setThreads((current) => [createdThread, ...current]);
    setActiveCategory("all");
    setSearch("");
    setDraft(emptyDraft);
    setFormError("");
    setComposerOpen(false);
  }

  return (
    <main className="forum-shell relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#111827] transition-colors duration-300">
      <ForumBackground />

      <style>{`
        html.skillatlas-dark .forum-shell [class*="bg-white"] {
          background-color: rgba(53, 66, 80, 0.94) !important;
        }

        html.skillatlas-dark .forum-shell [class*="bg-gray-50"] {
          background-color: rgba(32, 43, 55, 0.92) !important;
        }

        html.skillatlas-dark .forum-shell [class*="text-gray-"] {
          color: rgb(203, 213, 225) !important;
        }

        html.skillatlas-dark .forum-shell [class*="border-gray-"] {
          border-color: rgba(203, 213, 225, 0.30) !important;
        }

        html.skillatlas-dark .forum-shell input,
        html.skillatlas-dark .forum-shell select,
        html.skillatlas-dark .forum-shell textarea {
          background-color: rgba(32, 43, 55, 0.96) !important;
          color: rgb(248, 250, 252) !important;
        }

        html.skillatlas-dark .forum-shell {
          background: #2f3a46;
          color: rgb(248, 250, 252);
        }

        html.skillatlas-dark .forum-shell > div:first-child {
          opacity: 0.58;
          filter: brightness(0.72) saturate(1.25);
        }
      `}</style>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-[108px] sm:px-6 sm:pt-[116px] lg:px-8 lg:pt-[145px]">
        <section className="mb-6 overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white/92 shadow-sm backdrop-blur">
          <div className="grid gap-5 p-5 sm:gap-6 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-[#19d3cf]">SkillAtlas Forum</p>
              <h1 className="max-w-4xl text-[1.75rem] font-black leading-[1.08] tracking-tight sm:text-4xl">
                Debate the map. Explain the rankings.
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-gray-600 sm:text-base">
                Discuss country-level gaming strength, player identities, ranking movement, and the ideas that should shape SkillAtlas next.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setComposerOpen((open) => !open);
                setFormError("");
              }}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#ff2fa8] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#ff2fa8]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              aria-expanded={composerOpen}
              aria-controls="forum-thread-composer"
            >
              {composerOpen ? "Close composer" : "Create thread"}
            </button>
          </div>

          <div className="grid border-t border-[#ff2fa8]/20 sm:grid-cols-3">
            {[
              ["Open threads", threads.length],
              ["Replies", totalReplies],
              ["Community votes", totalVotes],
            ].map(([label, value]) => (
              <div key={label} className="border-t border-[#ff2fa8]/10 p-4 sm:border-l sm:border-t-0 first:sm:border-l-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-black text-[#19d3cf]">{Number(value).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>

        {composerOpen && (
          <section
            id="forum-thread-composer"
            className="mb-6 rounded-3xl border border-[#19d3cf]/45 bg-white/92 p-5 shadow-sm backdrop-blur sm:p-6"
            aria-labelledby="forum-thread-composer-title"
          >
            <div className="mb-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#ff2fa8]">Local preview</p>
              <h2 id="forum-thread-composer-title" className="mt-1 text-2xl font-black">Start a new discussion</h2>
              <p className="mt-2 text-sm font-semibold text-gray-600">
                Threads created in this prototype stay in the current page session. No account or backend is connected yet.
              </p>
            </div>

            <form onSubmit={handleCreateThread} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <label className="grid gap-2 text-sm font-black">
                  Thread title
                  <input
                    value={draft.title}
                    onChange={(event) => updateDraft("title", event.target.value)}
                    maxLength={120}
                    placeholder="What should the community discuss?"
                    className="h-12 rounded-2xl border border-gray-200 bg-white/90 px-4 text-sm font-semibold outline-none transition focus:border-[#19d3cf] focus:shadow-[0_0_0_4px_rgba(25,211,207,0.14)]"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-black">
                  Category
                  <select
                    value={draft.category}
                    onChange={(event) => updateDraft("category", event.target.value as ForumCategoryId)}
                    className="h-12 rounded-2xl border border-gray-200 bg-white/90 px-4 text-sm font-semibold outline-none focus:border-[#19d3cf]"
                  >
                    {forumCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-black">
                  Display name
                  <input
                    value={draft.author}
                    onChange={(event) => updateDraft("author", event.target.value)}
                    maxLength={32}
                    placeholder="AtlasFan"
                    className="h-12 rounded-2xl border border-gray-200 bg-white/90 px-4 text-sm font-semibold outline-none focus:border-[#19d3cf]"
                    required
                  />
                </label>

                <label className="grid gap-2 text-sm font-black">
                  Country
                  <input
                    value={draft.country}
                    onChange={(event) => updateDraft("country", event.target.value)}
                    maxLength={56}
                    placeholder="Australia"
                    className="h-12 rounded-2xl border border-gray-200 bg-white/90 px-4 text-sm font-semibold outline-none focus:border-[#19d3cf]"
                    required
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-black">
                Opening message
                <textarea
                  value={draft.preview}
                  onChange={(event) => updateDraft("preview", event.target.value)}
                  maxLength={420}
                  rows={4}
                  placeholder="Add the context that will help people join the discussion."
                  className="rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-sm font-semibold leading-relaxed outline-none focus:border-[#19d3cf] focus:shadow-[0_0_0_4px_rgba(25,211,207,0.14)]"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-black">
                Tags <span className="font-semibold text-gray-500">Optional, comma separated</span>
                <input
                  value={draft.tags}
                  onChange={(event) => updateDraft("tags", event.target.value)}
                  maxLength={80}
                  placeholder="CS2, Rankings, Debate"
                  className="h-12 rounded-2xl border border-gray-200 bg-white/90 px-4 text-sm font-semibold outline-none focus:border-[#19d3cf]"
                />
              </label>

              {formError && <p className="text-sm font-black text-[#ff2fa8]" role="alert">{formError}</p>}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setComposerOpen(false);
                    setFormError("");
                  }}
                  className="rounded-full border border-gray-200 bg-white/70 px-5 py-2.5 text-sm font-black text-gray-700 transition hover:border-[#ff2fa8]/60 hover:text-[#ff2fa8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#19d3cf] px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-[#19d3cf]/20 transition hover:-translate-y-0.5"
                >
                  Publish local thread
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="grid min-w-0 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit min-w-0 rounded-3xl border border-[#ff2fa8]/40 bg-white/90 p-4 shadow-sm backdrop-blur lg:sticky lg:top-24">
            <div className="mb-3 flex items-center justify-between gap-3 px-2">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#19d3cf]">Categories</p>
              <span className="text-xs font-black text-gray-400">{threads.length}</span>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`flex min-w-0 items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-black transition-all sm:px-4 ${
                  activeCategory === "all"
                    ? "border-[#19d3cf] bg-[#19d3cf] text-white shadow-lg shadow-[#19d3cf]/20"
                    : "border-gray-200 bg-white/70 text-gray-700 hover:border-[#19d3cf]/60 hover:text-[#19d3cf]"
                }`}
              >
                <span>All threads</span>
                <span>{threads.length}</span>
              </button>

              {forumCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  title={category.description}
                  className={`flex min-w-0 items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-black transition-all sm:px-4 ${
                    activeCategory === category.id
                      ? "border-[#ff2fa8] bg-[#ff2fa8] text-white shadow-lg shadow-[#ff2fa8]/20"
                      : "border-gray-200 bg-white/70 text-gray-700 hover:border-[#ff2fa8]/60 hover:text-[#ff2fa8]"
                  }`}
                >
                  <span>{category.label}</span>
                  <span>{categoryCounts.get(category.id) ?? 0}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0 w-full">
            <div className="mb-4 min-w-0 rounded-3xl border border-[#19d3cf]/35 bg-white/90 p-4 shadow-sm backdrop-blur">
              <label className="relative block min-w-0">
                <span className="sr-only">Search Forum threads</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, author, country, category, or tag..."
                  className="h-12 w-full max-w-full rounded-2xl border border-gray-200 bg-white/90 px-4 pr-24 text-sm font-bold outline-none transition focus:border-[#19d3cf] focus:shadow-[0_0_0_4px_rgba(25,211,207,0.14)]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-black text-[#ff2fa8] hover:bg-[#ff2fa8]/10"
                  >
                    Clear
                  </button>
                )}
              </label>
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff2fa8]">
                  {activeCategory === "all" ? "All discussions" : getForumCategory(activeCategory)?.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-500" aria-live="polite">
                  {filteredThreads.length} {filteredThreads.length === 1 ? "thread" : "threads"}
                  {search ? ` matching “${search}”` : ""}
                </p>
              </div>
              <p className="text-xs font-black text-gray-400">Most recently active first</p>
            </div>

            <div className="grid gap-4">
              {filteredThreads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/forum/${thread.slug}`}
                  className="group block w-full min-w-0 rounded-3xl border border-[#ff2fa8]/35 bg-white/92 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[#19d3cf]/70 hover:shadow-xl sm:p-6"
                >
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(thread.status)}`}>
                          {thread.status}
                        </span>
                        <span className="rounded-full border border-[#19d3cf]/25 bg-[#19d3cf]/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#19d3cf]">
                          {getForumCategory(thread.category)?.label}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-400">{thread.lastActivity}</span>
                    </div>

                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-black leading-tight tracking-tight transition-colors group-hover:text-[#19d3cf] sm:text-2xl">
                        {thread.title}
                      </h2>
                      <p className="mt-2 break-words text-sm font-semibold leading-relaxed text-gray-600">{thread.preview}</p>
                    </div>

                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-xs font-bold text-gray-500">
                      <span>By <strong className="text-gray-700">{thread.author}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>{thread.country}</span>
                      <div className="flex w-full min-w-0 flex-wrap gap-2 sm:ml-2 sm:w-auto">
                        {thread.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-black text-gray-600">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-x-2 gap-y-3 border-t border-[#ff2fa8]/15 pt-4 sm:flex sm:items-center sm:gap-5">
                      {[
                        ["Replies", formatMetric(thread.replies)],
                        ["Votes", formatMetric(thread.votes)],
                        ["Views", formatMetric(thread.views)],
                      ].map(([label, value]) => (
                        <span key={label} className="text-xs font-bold text-gray-500">
                          <strong className="block text-sm font-black text-[#19d3cf] sm:inline sm:mr-1">{value}</strong>
                          {label}
                        </span>
                      ))}
                      <span className="col-span-3 inline-flex justify-end text-sm font-black text-[#ff2fa8] transition-transform group-hover:translate-x-1 sm:ml-auto sm:inline">
                        Open thread &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {filteredThreads.length === 0 && (
                <div className="rounded-3xl border border-dashed border-[#19d3cf]/45 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
                  <p className="text-xl font-black">No threads found.</p>
                  <p className="mt-2 text-sm font-semibold text-gray-600">Try another category, clear the search, or start a new discussion.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setActiveCategory("all");
                    }}
                    className="mt-5 rounded-full bg-[#19d3cf] px-5 py-2.5 text-sm font-black text-white"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
