"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Enemy = { id: number; x: number; y: number };
type Bullet = { id: number; x: number; y: number };

const countries = ["Denmark", "South Korea", "China", "Sweden", "USA"];
const players = ["AtlasPilot", "PixelWarden", "RankGoblin", "GlobeRunner", "SkillGhost"];

function createEnemyWave(startId: number, y = 10): Enemy[] {
  return Array.from({ length: 24 }, (_, i) => ({
    id: startId + i,
    x: 12 + (i % 8) * 9,
    y: y + Math.floor(i / 8) * 7,
  }));
}

export default function SpaceInvaders() {
  const [intro, setIntro] = useState(true);
  const [shipX, setShipX] = useState(50);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>(() => createEnemyWave(0));
  const [score, setScore] = useState(0);
  const nextId = useRef(1000);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), 1700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") setShipX((x) => Math.max(5, x - 4));
      if (event.key === "ArrowRight") setShipX((x) => Math.min(82, x + 4));

      if (event.key === " ") {
        event.preventDefault();
        setBullets((current) => [...current, { id: Date.now(), x: shipX, y: 88 }]);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [shipX]);

  useEffect(() => {
    if (intro) return;

    const loop = window.setInterval(() => {
      setEnemies((enemyState) => {
        let nextEnemies = enemyState
          .map((enemy) => ({ ...enemy, y: enemy.y + 0.18 }))
          .filter((enemy) => enemy.y < 96);

        setBullets((bulletState) => {
          const movedBullets = bulletState
            .map((bullet) => ({ ...bullet, y: bullet.y - 3.8 }))
            .filter((bullet) => bullet.y > 0);

          const remainingBullets: Bullet[] = [];

          for (const bullet of movedBullets) {
            const hit = nextEnemies.find(
              (enemy) =>
                Math.abs(enemy.x - bullet.x) < 4 &&
                Math.abs(enemy.y - bullet.y) < 4
            );

            if (hit) {
              nextEnemies = nextEnemies.filter((enemy) => enemy.id !== hit.id);
              setScore((current) => current + 100);
            } else {
              remainingBullets.push(bullet);
            }
          }

          return remainingBullets;
        });

        if (nextEnemies.length < 12) {
          const newWave = createEnemyWave(nextId.current, 6);
          nextId.current += 1000;
          nextEnemies = [...nextEnemies, ...newWave];
        }

        return nextEnemies;
      });
    }, 70);

    return () => window.clearInterval(loop);
  }, [intro]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-[#111827]">
      {intro && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
          <div className="animate-[launch_1.6s_ease-in-out_forwards]">
            <Image
              src="/skillatlas-logo.png"
              alt="SkillAtlas launch"
              width={130}
              height={130}
              priority
            />
          </div>
        </div>
      )}

      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute left-8 top-8 z-20 rounded-2xl bg-white/85 p-4 backdrop-blur">
          <a href="/" className="text-sm font-bold text-[#ff2fa8]">
            ← Rankings
          </a>

          <h1 className="mt-3 text-3xl font-black">Skill Invaders</h1>

          <p className="mt-1 text-sm text-gray-500">
            Move with ← → and shoot with Space.
          </p>

          <p className="mt-4 text-2xl font-black text-[#19d3cf]">
            Score: {score}
          </p>
        </div>

        <div className="absolute right-6 top-6 z-20 grid max-h-[92vh] gap-4 overflow-hidden">
          <Leaderboard title="Top Countries" items={countries} />
          <Leaderboard title="Top Players" items={players} />
        </div>

        <div className="absolute inset-y-0 left-0 right-[300px]">
          {enemies.map((enemy) => (
            <Alien key={enemy.id} x={enemy.x} y={enemy.y} />
          ))}

          {bullets.map((bullet) => (
            <div
              key={bullet.id}
              className="absolute h-5 w-1 rounded-full bg-[#19d3cf]"
              style={{ left: `${bullet.x}%`, top: `${bullet.y}%` }}
            />
          ))}

          <div
            className="absolute bottom-8 h-16 w-16 -translate-x-1/2"
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
        </div>
      </section>

      <style jsx global>{`
        @keyframes launch {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          65% {
            opacity: 1;
            transform: translateY(-120px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-520px) scale(0.35);
          }
        }
      `}</style>
    </main>
  );
}

function Alien({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute h-8 w-10"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className="grid grid-cols-5 gap-[2px]">
        {[
          0, 1, 0, 1, 0,
          1, 1, 1, 1, 1,
          1, 0, 1, 0, 1,
          1, 1, 1, 1, 1,
          0, 1, 0, 1, 0,
        ].map((cell, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-sm ${
              cell ? "bg-[#ff2fa8]" : "bg-transparent"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Leaderboard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="w-64 rounded-2xl border border-[#ff2fa8]/35 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-[#19d3cf]">
        {title}
      </p>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item}
            className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm"
          >
            <span className="font-bold text-[#ff2fa8]">{index + 1}</span>
            <span className="font-semibold">{item}</span>
            <span className="text-xs font-bold text-gray-400">
              {1000 - index * 87}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}