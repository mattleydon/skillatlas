import Image from "next/image";

const leaderboard = [
  { rank: 1, country: "Denmark", game: "CS2", score: 98, reason: "Elite team systems and tactical culture" },
  { rank: 2, country: "South Korea", game: "League of Legends", score: 96, reason: "Training infrastructure and esports discipline" },
  { rank: 3, country: "China", game: "Dota 2", score: 94, reason: "Huge player base and professional investment" },
  { rank: 4, country: "Sweden", game: "CS2", score: 91, reason: "Long history of FPS excellence" },
  { rank: 5, country: "USA", game: "Fortnite", score: 89, reason: "Large talent pool and creator-driven scene" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/skillatlas-logo.png"
              alt="SkillAtlas logo"
              width={44}
              height={44}
              className="rounded-xl"
            />
            <span className="text-2xl font-bold tracking-tight">SkillAtlas</span>
          </div>

          <nav className="hidden gap-8 text-sm font-semibold text-gray-700 md:flex">
            <a href="/">Rankings</a>
            <a href="/world-map">World Map</a>
            <a href="/countries">Countries</a>
            <a href="/profiles">Profiles</a>
            <a href="/about">About</a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-8 py-20">
        <div className="mb-12 max-w-3xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-cyan-500">
            Global Gaming Intelligence
          </p>

          <h1 className="mb-6 text-5xl font-black leading-tight md:text-7xl">
            Which country is actually the best at gaming?
          </h1>

          <p className="text-xl leading-8 text-gray-600">
            SkillAtlas ranks countries by dominance, efficiency, and the deeper
            technical, mental, and cultural reasons behind elite performance.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap gap-4">
          <button className="rounded-full bg-cyan-500 px-7 py-4 font-bold text-white shadow-sm">
            CS2
          </button>
          <button className="rounded-full border border-pink-400 px-7 py-4 font-bold">
            League of Legends
          </button>
          <button className="rounded-full border border-gray-200 px-7 py-4 font-bold">
            Fortnite
          </button>
          <button className="rounded-full border border-gray-200 px-7 py-4 font-bold">
            Valorant
          </button>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 border-b border-gray-100 bg-gray-50 px-6 py-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Country</div>
            <div className="col-span-2">Game</div>
            <div className="col-span-2">Score</div>
            <div className="col-span-4">Why they win</div>
          </div>

          {leaderboard.map((item) => (
            <div
              key={item.rank}
              className="grid grid-cols-12 items-center border-b border-gray-100 px-6 py-6 last:border-b-0"
            >
              <div className="col-span-1 text-2xl font-black text-pink-500">
                {item.rank}
              </div>

              <div className="col-span-3 text-xl font-bold">
                {item.country}
              </div>

              <div className="col-span-2 text-gray-600">
                {item.game}
              </div>

              <div className="col-span-2">
                <span className="rounded-full bg-cyan-50 px-4 py-2 font-black text-cyan-600">
                  {item.score}
                </span>
              </div>

              <div className="col-span-4 text-gray-600">
                {item.reason}
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}