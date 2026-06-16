export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-8 py-32 text-center">
        <h1 className="mb-6 text-6xl font-bold">
          SkillAtlas
        </h1>

        <p className="max-w-2xl text-xl text-gray-600">
          Discover the world's skills.
          Explore country rankings, compare strengths,
          and see how nations perform across gaming,
          sports, technology, education, creativity,
          and hundreds of other skills.
        </p>

        <div className="mt-10 flex gap-4">
          <button className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-white">
            Explore Rankings
          </button>

          <button className="rounded-full border border-pink-400 px-6 py-3 font-semibold">
            View World Map
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-8 pb-24">
        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-3xl border p-8">
            <h2 className="mb-4 text-2xl font-bold">
              Leaderboards
            </h2>

            <p className="text-gray-600">
              See which countries rank highest in every skill imaginable.
            </p>
          </div>

          <div className="rounded-3xl border p-8">
            <h2 className="mb-4 text-2xl font-bold">
              World Map
            </h2>

            <p className="text-gray-600">
              Explore global skill distributions visually.
            </p>
          </div>

          <div className="rounded-3xl border p-8">
            <h2 className="mb-4 text-2xl font-bold">
              Player Profiles
            </h2>

            <p className="text-gray-600">
              Build your own skill profile and compare yourself globally.
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}