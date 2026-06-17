"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const countries = [
  "Denmark",
  "South Korea",
  "China",
  "Sweden",
  "USA",
];

const players = [
  "AtlasPilot",
  "PixelWarden",
  "RankGoblin",
  "GlobeRunner",
  "SkillGhost",
];

type Enemy = {
  id: number;
  x: number;
  y: number;
};

type Bullet = {
  id: number;
  x: number;
  y: number;
};

export default function SpaceInvaders() {
  const [started, setStarted] = useState(false);
  const [shipX, setShipX] = useState(50);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const gameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const initialEnemies = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 10 + (i % 8) * 10,
      y: 12 + Math.floor(i / 8) * 8,
    }));

    setEnemies(initialEnemies);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setShipX((x) => Math.max(4, x - 4));
      }

      if (event.key === "ArrowRight") {
        setShipX((x) => Math.min(96, x + 4));
      }

      if (event.key === " ") {
        setBullets((current) => [
          ...current,
          {
            id: Date.now(),
            x: shipX,
            y: 78,
          },
        ]);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [shipX]);

  useEffect(() => {
    const loop = window.setInterval(() => {
      setBullets((current) =>
        current
          .map((bullet) => ({ ...bullet, y: bullet.y - 4 }))
          .filter((bullet) => bullet.y > 0)
      );

      setEnemies((currentEnemies) => {
        let updatedEnemies = [...currentEnemies];

        setBullets((currentBullets) => {
          const remainingBullets: Bullet[] = [];

          for (const bullet of currentBullets) {
            const hit = updatedEnemies.find(
              (enemy) =>
                Math.abs(enemy.x - bullet.x) < 4 &&
                Math.abs(enemy.y - bullet.y) < 4
            );

            if (hit) {
              updatedEnemies = updatedEnemies.filter((enemy) => enemy.id !== hit.id);
              setScore((score) => score + 100);
            } else {
              remainingBullets.push(bullet);
            }
          }

          return remainingBullets;
        });

        return updatedEnemies;
      });
    }, 80);

    return () => window.clearInterval(loop);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-[#111827]">
      {!started && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <div className="animate-[launch_1.2s_ease-in-out_forwards]">
            <Image
              src="/skillatlas-logo.png"
              alt="SkillAtlas logo"
              width={160}
              height={160}
              priority
            />
          </div>

          <button
            onClick={() => setStarted(true)}
            className="mt-10 rounded-full bg-[#19d3cf] px-8 py-4 font-black text-white shadow-sm transition hover:bg-[#12b9b5]"
          >
            Start Skill Invaders
          </button>

          <a href="/" className="mt-5 text-sm font-semibold text-[#ff2fa8]">
            Back to Rankings
          </a>
        </div>
      )}

      <section ref={gameRef} className="relative h-screen w-full">
        <div className="absolute left-8 top-8">
          <a href="/" className="text-sm font-bold text-[#ff2fa8]">
            ← Rankings
          </a>

          <h1 className="mt-3 text-3xl font-black">
            Skill Invaders
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Move with ← → and shoot with Space.
          </p>

          <p className="mt-4 text-2xl font-black text-[#19d3cf]">
            Score: {score}
          </p>
        </div>

        <div className="absolute right-8 top-8 grid gap-4">
          <Leaderboard title="Top Countries" items={countries} />
          <Leaderboard title="Top Players" items={players} />
        </div>

        {enemies.map((enemy) => (
          <div
            key={enemy.id}
            className="absolute h-6 w-8 rounded-md border border-[#ff2fa8]/40 bg-[#ff2fa8]/10"
            style={{
              left: `${enemy.x}%`,
              top: `${enemy.y}%`,
            }}
          />
        ))}

        {bullets.map((bullet) => (
          <div
            key={bullet.id}
            className="absolute h-5 w-1 rounded-full bg-[#19d3cf]"
            style={{
              left: `${bullet.x}%`,
              top: `${bullet.y}%`,
            }}
          />
        ))}

        <div
          className="absolute bottom-10 h-16 w-16 -translate-x-1/2"
          style={{ left: `${shipX}%` }}
        >
          <Image
            src="/skillatlas-logo.png"
            alt="Player ship"
            fill
            className="object-contain"
            priority
          />
        </div>
      </section>

      <style jsx global>{`
        @keyframes launch {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }

          60% {
            opacity: 1;
            transform: translateY(-80px) scale(1.15);
          }

          100% {
            opacity: 0;
            transform: translateY(-420px) scale(0.4);
          }
        }
      `}</style>
    </main>
  );
}

function Leaderboard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="w-64 rounded-2xl border border-[#ff2fa8]/35 bg-white p-5 shadow-sm">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-[#19d3cf]">
        {title}
      </p>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item}
            className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm"
          >
            <span className="font-bold text-[#ff2fa8]">
              {index + 1}
            </span>

            <span className="font-semibold">
              {item}
            </span>

            <span className="text-xs font-bold text-gray-400">
              {1000 - index * 87}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}