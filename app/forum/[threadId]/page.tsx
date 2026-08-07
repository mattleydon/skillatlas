import Link from "next/link";
import { forumCategories, getForumCategory, getForumThread, initialForumThreads } from "../forum-data";

export function generateStaticParams() {
  return initialForumThreads.map((thread) => ({ threadId: thread.slug }));
}

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const thread = getForumThread(threadId);
  const fallbackTitle = threadId
    .replace(/^local-/, "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <main className="forum-detail-shell relative min-h-screen overflow-hidden bg-[#F8FAFC] text-[#111827] transition-colors duration-300">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(25,211,207,0.17),transparent_30%),radial-gradient(circle_at_82%_24%,rgba(255,47,168,0.13),transparent_32%),linear-gradient(180deg,#F8FAFC_0%,#EEF7FA_100%)]" />
        <div className="absolute left-[-14%] top-32 h-[520px] w-[520px] rounded-full border border-[#19d3cf]/20" />
        <div className="absolute right-[-16%] top-72 h-[620px] w-[620px] rounded-full border border-[#ff2fa8]/20" />
      </div>

      <style>{`
        html.skillatlas-dark .forum-detail-shell [class*="bg-white"] {
          background-color: rgba(53, 66, 80, 0.94) !important;
        }

        html.skillatlas-dark .forum-detail-shell [class*="text-gray-"] {
          color: rgb(203, 213, 225) !important;
        }

        html.skillatlas-dark .forum-detail-shell {
          background: #2f3a46;
          color: rgb(248, 250, 252);
        }

        html.skillatlas-dark .forum-detail-shell > div:first-child {
          opacity: 0.58;
          filter: brightness(0.72) saturate(1.25);
        }
      `}</style>

      <section className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-[145px] sm:px-6 lg:px-8">
        <Link
          href="/forum"
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#19d3cf]/35 bg-white/80 px-4 py-2 text-sm font-black text-[#19d3cf] shadow-sm transition hover:border-[#19d3cf]"
        >
          <span aria-hidden="true">&larr;</span>
          Back to Forum
        </Link>

        {thread ? (
          <article className="overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white/92 shadow-sm backdrop-blur">
            <div className="border-b border-[#ff2fa8]/20 p-6 sm:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#19d3cf]/12 px-3 py-1 text-xs font-black text-[#19d3cf]">
                  {getForumCategory(thread.category)?.label}
                </span>
                <span className="rounded-full bg-[#ff2fa8]/10 px-3 py-1 text-xs font-black text-[#ff2fa8]">
                  {thread.status}
                </span>
              </div>

              <h1 className="max-w-4xl text-3xl font-black tracking-tight sm:text-4xl">{thread.title}</h1>
              <p className="mt-4 text-sm font-semibold text-gray-600">
                Started by <span className="font-black text-[#19d3cf]">{thread.author}</span> from {thread.country} · {thread.lastActivity}
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-base font-semibold leading-8 text-gray-700">{thread.body}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {thread.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-[#19d3cf]/25 bg-[#19d3cf]/8 px-3 py-1 text-xs font-black text-gray-700">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-8 grid gap-3 border-t border-[#ff2fa8]/15 pt-6 sm:grid-cols-3">
                {[
                  ["Replies", thread.replies.toLocaleString()],
                  ["Votes", thread.votes.toLocaleString()],
                  ["Views", thread.views.toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-gray-200 bg-white/70 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</p>
                    <p className="mt-1 text-2xl font-black text-[#19d3cf]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-[#ff2fa8]/25 bg-[#ff2fa8]/6 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff2fa8]">First release</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-600">
                  Replies and voting will become interactive in a later Forum milestone. This first version establishes the thread experience without authentication or backend storage.
                </p>
              </div>
            </div>
          </article>
        ) : (
          <section className="rounded-3xl border border-[#ff2fa8]/45 bg-white/92 p-8 shadow-sm backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#19d3cf]">Local thread preview</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">{fallbackTitle || "New Forum Thread"}</h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-gray-600">
              This thread was created locally for the first Forum prototype. Persistent thread details will arrive when Forum storage is added in a later milestone.
            </p>
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-[#19d3cf]/35 bg-white/88 p-5 shadow-sm backdrop-blur">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff2fa8]">Explore another category</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {forumCategories.map((category) => (
              <Link
                key={category.id}
                href={`/forum?category=${category.id}`}
                className="rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-xs font-black text-gray-700 transition hover:border-[#19d3cf] hover:text-[#19d3cf]"
              >
                {category.label}
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
