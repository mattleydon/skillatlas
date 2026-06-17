import Image from "next/image";

const games = ["CS2", "League of Legends", "Valorant", "Fortnite", "Rocket League", "Chess"];

const leaderboard = [
  { rank: 1, country: "Denmark", game: "CS2", score: 98, change: "+4.2%", reason: "Elite team systems and tactical culture" },
  { rank: 2, country: "South Korea", game: "League of Legends", score: 96, change: "+3.8%", reason: "Training infrastructure and esports discipline" },
  { rank: 3, country: "China", game: "Dota 2", score: 94, change: "+2.1%", reason: "Huge player base and professional investment" },
  { rank: 4, country: "Sweden", game: "CS2", score: 91, change: "+1.7%", reason: "Long history of FPS excellence" },
  { rank: 5, country: "USA", game: "Fortnite", score: 89, change: "-0.6%", reason: "Large talent pool and creator-driven scene" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <header className="sticky top-0 z-50 border-b border-[#ff2fa8]/25 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-8 py-6">
          <div className="mr-20 flex shrink-0 items-center">
            <Image
              src="/skillatlas-logo.png"
              alt="SkillAtlas logo"
              width={230}
              height={230}
              className="rounded-2xl"
            />
          </div>

          <nav className="hidden flex-1 items-center justify-evenly text-base font-semibold text-gray-700 md:flex">
            <a className="hover:text-[#19d3cf]" href="/">Rankings</a>
            <a className="hover:text-[#19d3cf]" href="/world-map">World Map</a>
            <a className="hover:text-[#19d3cf]" href="/countries">Countries</a>
            <a className="hover:text-[#19d3cf]" href="/profiles">Profiles</a>
            <a className="hover:text-[#19d3cf]" href="/about">About</a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8 rounded-3xl border border-[#ff2fa8]/45 bg-white p-8 shadow-sm">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[#19d3cf]">
            Global Gaming Rankings
          </p>

          <h1 className="mb-3 text-xl font-black tracking-tight md:text-2xl">
            Which country is actually the best at gaming?
          </h1>

          <p className="whitespace-nowrap text-base text-gray-600">
            Track which countries dominate each game, why they win, and how skill changes across the world.
          </p>
        </div>

        <div className="mb-6 flex gap-3 overflow-x-auto rounded-3xl border border-[#ff2fa8]/45 bg-white p-4 shadow-sm">
          {games.map((game, index) => (
            <button
              key={game}
              className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-bold ${
                index === 0
                  ? "bg-[#19d3cf] text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-[#ff2fa8]"
              }`}
            >
              {game}
            </button>
          ))}
        </div>

        <section className="overflow-hidden rounded-3xl border border-[#ff2fa8]/45 bg-white shadow-sm">
          <div className="grid grid-cols-12 border-b border-[#ff2fa8]/20 bg-gray-50 px-6 py-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Country</div>
            <div className="col-span-2">Game</div>
            <div className="col-span-2">Score</div>
            <div className="col-span-1">7d</div>
            <div className="col-span-3">Why they win</div>
          </div>

          {leaderboard.map((item) => (
            <div
              key={item.rank}
              className="grid grid-cols-12 items-center border-b border-gray-100 px-6 py-6 last:border-b-0 hover:bg-gray-50"
            >
              <div className="col-span-1 text-xl font-normal text-[#ff2fa8]">
                {item.rank}
              </div>

              <div className="col-span-3 text-lg font-bold">
                {item.country}
              </div>

              <div className="col-span-2 text-gray-600">
                {item.game}
              </div>

              <div className="col-span-2">
                <span className="rounded-full bg-[#19d3cf]/10 px-4 py-2 font-black text-[#19d3cf]">
                  {item.score}
                </span>
              </div>

              <div
                className={`col-span-1 font-bold ${
                  item.change.startsWith("+")
                    ? "text-[#19d3cf]"
                    : "text-[#ff2fa8]"
                }`}
              >
                {item.change}
              </div>

              <div className="col-span-3 text-gray-600">
                {item.reason}
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}