import Link from "next/link";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import SectionToolbar from "@/app/components/intelligence-ui/section-toolbar";
import { ROUTES } from "@/constants/routes";
import { getForumDiscussion, sampleForumDiscussions } from "../forum-data";

export function generateStaticParams() {
  return sampleForumDiscussions.map((discussion) => ({
    threadId: discussion.slug,
  }));
}

export default async function ForumDiscussionPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const discussion = getForumDiscussion(threadId);

  return (
    <main className="relative min-h-screen overflow-x-clip bg-sa-canvas text-sa-text-primary">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,color-mix(in_srgb,var(--sa-accent)_7%,transparent),transparent_30%)]"
        aria-hidden="true"
      />

      <div className="skillatlas-page-shell relative z-10 mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8 lg:pb-10">
        <Link
          href={ROUTES.forum}
          className="mb-sa-3 inline-flex min-h-11 items-center gap-sa-2 rounded-sa-control border border-sa-border-subtle bg-sa-surface-1 px-sa-3 text-sm font-bold text-sa-accent transition-colors duration-200 hover:border-sa-border-active hover:bg-sa-surface-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sa-accent/20"
        >
          <span aria-hidden="true">←</span>
          Back to Forum
        </Link>

        {discussion ? (
          <>
            <IntelligencePanel
              as="article"
              aria-labelledby="discussion-title"
              header={
                <div>
                  <div className="flex flex-wrap items-center gap-x-sa-3 gap-y-sa-1">
                    <DataLabel as="span" className="text-sa-accent">
                      SkillAtlas / Forum
                    </DataLabel>
                    <DataLabel as="span">Sample discussion</DataLabel>
                  </div>
                  <h1
                    id="discussion-title"
                    className="mt-sa-2 max-w-5xl break-words text-2xl font-black leading-tight tracking-tight text-sa-text-primary sm:text-4xl"
                  >
                    {discussion.title}
                  </h1>
                  <p className="mt-sa-3 font-sa-data text-xs leading-5 text-sa-text-technical">
                    Started by <span className="font-bold text-sa-text-primary">{discussion.author}</span>
                    <span aria-hidden="true"> · </span>
                    {discussion.country}
                  </p>
                </div>
              }
              bodyClassName="px-sa-4 py-sa-5 sm:px-sa-5 sm:py-sa-6"
              footer={
                <p className="text-sm leading-6 text-sa-text-muted">
                  This is an existing static Forum sample. Community discussions and replies are not persisted yet.
                </p>
              }
            >
              <p className="max-w-4xl break-words text-base font-normal leading-8 text-sa-text-primary">
                {discussion.body}
              </p>
            </IntelligencePanel>

            <IntelligencePanel
              as="section"
              aria-labelledby="discussion-replies-title"
              className="mt-sa-3"
              header={
                <SectionToolbar
                  eyebrow="Conversation"
                  title="Replies"
                  titleId="discussion-replies-title"
                  metadata="Not connected"
                />
              }
              bodyClassName="px-sa-4 py-8 sm:px-sa-5"
            >
              <div className="max-w-2xl">
                <h3 className="text-base font-bold text-sa-text-primary">No persisted replies are available.</h3>
                <p className="mt-sa-2 text-sm leading-6 text-sa-text-muted">
                  Replying will be added when the Forum has an approved discussion backend and identity model.
                </p>
              </div>
            </IntelligencePanel>
          </>
        ) : (
          <IntelligencePanel
            as="section"
            aria-labelledby="missing-discussion-title"
            bodyClassName="px-sa-5 py-10 text-center"
          >
            <DataLabel as="p" className="text-sa-accent">
              Community Forum
            </DataLabel>
            <h1 id="missing-discussion-title" className="mt-sa-2 text-2xl font-black text-sa-text-primary">
              Discussion unavailable
            </h1>
            <p className="mx-auto mt-sa-2 max-w-xl text-sm leading-6 text-sa-text-muted">
              This discussion is not part of the current Forum sample set.
            </p>
            <Link
              href={ROUTES.forum}
              className="mt-sa-4 inline-flex min-h-11 items-center rounded-sa-control bg-sa-accent px-sa-4 text-sm font-bold text-slate-950 transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sa-accent/25"
            >
              Browse discussions
            </Link>
          </IntelligencePanel>
        )}
      </div>
    </main>
  );
}
