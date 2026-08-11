"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import SectionToolbar from "@/app/components/intelligence-ui/section-toolbar";
import SearchBar from "@/app/components/search-bar";
import { ROUTES } from "@/constants/routes";
import { matchesSearchQuery } from "@/lib/search";
import { sampleForumDiscussions } from "./forum-data";

function ForumBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,color-mix(in_srgb,var(--sa-accent)_8%,transparent),transparent_30%),linear-gradient(180deg,var(--sa-canvas),var(--sa-canvas))]" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(var(--sa-border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--sa-border-subtle)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_58%)]" />
    </div>
  );
}

export default function ForumPage() {
  const [search, setSearch] = useState("");

  const filteredDiscussions = useMemo(
    () =>
      sampleForumDiscussions.filter((discussion) =>
        matchesSearchQuery(search, [
          discussion.title,
          discussion.preview,
          discussion.body,
          discussion.author,
          discussion.country,
        ])
      ),
    [search]
  );

  return (
    <main className="relative min-h-screen overflow-x-clip bg-sa-canvas text-sa-text-primary">
      <ForumBackground />

      <div className="skillatlas-page-shell relative z-10 mx-auto w-full max-w-[1600px] px-4 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <IntelligencePanel
          as="section"
          aria-labelledby="forum-page-title"
          bodyClassName="px-sa-4 py-sa-4 sm:px-sa-5"
        >
          <DataLabel as="p" className="mb-sa-1 text-sa-accent">
            SkillAtlas / Forum
          </DataLabel>
          <h1
            id="forum-page-title"
            className="text-[1.75rem] font-black leading-[1.08] tracking-tight text-sa-text-primary sm:text-4xl"
          >
            Community Forum
          </h1>
          <p className="mt-sa-2 max-w-4xl text-sm font-medium leading-6 text-sa-text-muted sm:text-[15px]">
            Discuss rankings, countries, games, players, and the competitive world with the SkillAtlas community.
          </p>
        </IntelligencePanel>

        <IntelligencePanel
          as="section"
          aria-label="Forum discovery controls"
          className="mt-sa-3"
          bodyClassName="px-sa-4 py-sa-3"
        >
          <div className="grid min-w-0 items-end gap-sa-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <DataLabel as="span" className="mb-sa-1 block">
                Search discussions
              </DataLabel>
              <SearchBar
                label="Search discussions"
                placeholder="Search title, message, author, or country"
                value={search}
                onValueChange={setSearch}
                variant="intelligence"
              />
            </div>

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="h-11 rounded-sa-control border border-sa-border-subtle bg-sa-surface-2 px-sa-4 text-sm font-bold text-sa-text-muted transition-colors duration-200 ease-sa-standard hover:border-sa-border-active hover:text-sa-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sa-accent/15 lg:h-10"
              >
                Clear search
              </button>
            ) : null}
          </div>
        </IntelligencePanel>

        <IntelligencePanel
          as="section"
          aria-labelledby="forum-discussions-title"
          className="mt-sa-3 overflow-hidden"
          header={
            <SectionToolbar
              eyebrow="Community layer"
              title="Discussions"
              titleId="forum-discussions-title"
              metadata={`${filteredDiscussions.length} of ${sampleForumDiscussions.length} sample discussions`}
            />
          }
          bodyClassName="divide-y divide-sa-border-subtle"
        >
          {filteredDiscussions.map((discussion) => (
            <Link
              key={discussion.id}
              href={`${ROUTES.forum}/${discussion.slug}`}
              className="group grid min-w-0 gap-sa-3 px-sa-4 py-sa-4 transition-colors duration-200 ease-sa-standard hover:bg-sa-surface-2 focus-visible:bg-sa-surface-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sa-accent/20 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-sa-5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-sa-3 gap-y-sa-1">
                  <DataLabel as="span" className="text-sa-accent">
                    Sample discussion
                  </DataLabel>
                  <span className="font-sa-data text-[11px] text-sa-text-technical">
                    {discussion.author} · {discussion.country}
                  </span>
                </div>
                <h2 className="mt-sa-1 break-words text-lg font-bold leading-6 tracking-tight text-sa-text-primary transition-colors duration-200 group-hover:text-sa-accent sm:text-xl">
                  {discussion.title}
                </h2>
                <p className="mt-sa-2 max-w-5xl break-words text-sm font-normal leading-6 text-sa-text-muted sm:text-[15px]">
                  {discussion.preview}
                </p>
              </div>

              <span className="inline-flex items-center gap-sa-2 text-sm font-bold text-sa-accent sm:justify-self-end">
                Read discussion
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          ))}

          {filteredDiscussions.length === 0 ? (
            <div className="px-sa-5 py-10 text-center" role="status">
              <h2 className="text-lg font-bold text-sa-text-primary">No discussions match that search.</h2>
              <p className="mx-auto mt-sa-2 max-w-xl text-sm leading-6 text-sa-text-muted">
                Try a country, player, game, or a shorter search phrase.
              </p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-sa-4 h-11 rounded-sa-control bg-sa-accent px-sa-4 text-sm font-bold text-slate-950 transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sa-accent/25"
              >
                Reset search
              </button>
            </div>
          ) : null}
        </IntelligencePanel>
      </div>
    </main>
  );
}
