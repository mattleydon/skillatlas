"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Enemy = { id: number; x: number; y: number; health: number };
type Bullet = { id: number; x: number; y: number };

const countries = ["Denmark", "South Korea", "China", "Sweden", "USA"];
const players = ["AtlasPilot", "PixelWarden", "RankGoblin", "GlobeRunner", "SkillGhost"];

const PLAY_LEFT = 26;
const PLAY_RIGHT = 76;
const PLAYER_Y = 86;

function createEnemyWave(startId: number, y = 13): Enemy[] {
  return Array.from({ length: 18 }, (_, i) => ({
    id: startId + i,
    x: PLAY_LEFT + 3 + (i % 6) * 7.2,
    y: y + Math.floor(i / 6) * 6,
    health: 5,
  }));
}

export default function SpaceInvaders() {
  const [intro, setIntro] = useState(true);
  const [shipX, setShipX] = useState(51);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>(() => createEnemyWave(0));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const nextId = useRef(1000);
  const speed = useRef(0.035);
  const spawnRate = useRef(5200);
  const lastSpawn = useRef(Date.now());

  function restartGame() {
    setShipX(51);
    setBullets([]);
    setEnemies(createEnemyWave(0));
    setScore(0);
    setGameOver(false);
    speed.current = 0.035;
    spawnRate.current = 5200;
    lastSpawn.current = Date.now();
    nextId.current = 1000;
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), 1700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (gameOver) {
        if (event.key === "Enter") restartGame();
        return;
      }

      if (event.key === "ArrowLeft") setShipX((x) => Math.max(PLAY_LEFT + 2, x - 3));
      if (event.key === "ArrowRight") setShipX((x) => Math.min(PLAY_RIGHT - 2, x + 3));

      if (event.key === " ") {
        event.preventDefault();
        setBullets((current) => [...current, { id: Date.now(), x: shipX, y: PLAYER_Y }]);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [shipX, gameOver]);

  useEffect(() => {
    if (intro || gameOver) return;

    const loop = window.setInterval(() => {
      speed.current = Math.min(0.22, speed.current + 0.00045);
      spawnRate.current = Math.max(1700, spawnRate.current - 4);

      setEnemies((enemyState) => {
        let nextEnemies = enemyState.map((enemy) => ({
          ...enemy,
          y: enemy.y + speed.current,
        }));

        if (nextEnemies.some((enemy) => enemy.y >= PLAYER_Y - 3)) {
          setGameOver(true);
          return nextEnemies;
        }

        setBullets((bulletState) => {
          const movedBullets = bulletState
            .map((bullet) => ({ ...bullet, y: bullet.y - 2.8 }))
            .filter((bullet) => bullet.y > 0);

          const remainingBullets: Bullet[] = [];

          for (const bullet of movedBullets) {
            const hit = nextEnemies.find(
              (enemy) => Math.abs(enemy.x - bullet.x) < 2.8 && Math.abs(enemy.y - bullet.y) < 3.5
            );

            if (hit) {
              nextEnemies = nextEnemies
                .map((enemy) =>
                  enemy.id === hit.id ? { ...enemy, health: enemy.health - 1 } : enemy
                )
                .filter((enemy) => enemy.health > 0);

              setScore((current) => current + 20);
            } else {
              remainingBullets.push(bullet);
            }
          }

          return remainingBullets;
        });

        const now = Date.now();
        if (now - lastSpawn.current > spawnRate.current) {
          const newWave = createEnemyWave(nextId.current, 8);
          nextId.current += 1000;
          lastSpawn.current = now;
          nextEnemies = [...nextEnemies, ...newWave];
        }

        return nextEnemies;
      });
    }, 60);

    return () => window.clearInterval(loop);
  }, [intro, gameOver]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-[#111827]">
      {intro && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
          <div className="animate-[launch_1.6s_ease-in-out_forwards]">
            <Image src="/skillatlas-logo.png" alt="SkillAtlas launch" width={130} height={130} priority />
          </div>
        </div>
      )}

      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute left-8 top-8 z-20 rounded-2xl bg-white/90 p-4 backdrop-blur">
          <a href="/" className="text-sm font-bold text-[#ff2fa8]">← Rankings</a>
          <h1 className="mt-3 text-3xl font-black">SkillInvaders</h1>
          <p className="mt-1 text-sm text-gray-500">Move with ← → and shoot with Space.</p>
          <p className="mt-4 text-2xl font-black text-[#19d3cf]">Score: {score}</p>

          {gameOver && (
            <div className="mt-4 rounded-xl border border-[#ff2fa8]/35 bg-[#ff2fa8]/5 p-3">
              <p className="font-black text-[#ff2fa8]">Game Over</p>
              <p className="text-sm text-gray-600">Press Enter to restart.</p>
            </div>
          )}
        </div>

        <div className="absolute right-5 top-5 z-20 grid max-h-[88vh] gap-3 overflow-hidden">
          <Leaderboard title="Top Countries" items={countries} />
          <Leaderboard title="Top Players" items={players} />
        </div>

        <div
          className="absolute inset-y-0"
          style={{ left: `${PLAY_LEFT}%`, right: `${100 - PLAY_RIGHT}%` }}
        >
          {enemies.map((enemy) => (
            <Alien key={enemy.id} x={enemy.x - PLAY_LEFT} y={enemy.y} health={enemy.health} />
          ))}

          {bullets.map((bullet) => (
            <div
              key={bullet.id}
              className="absolute h-5 w-1 rounded-full bg-[#19d3cf]"
              style={{ left: `${bullet.x - PLAY_LEFT}%`, top: `${bullet.y}%` }}
            />
          ))}

          <div
            className="absolute bottom-8 h-16 w-16 -translate-x-1/2"
            style={{ left: `${shipX - PLAY_LEFT}%` }}
          >
            <Image src="/skillatlas-logo.png" alt="Player ship" fill className="object-contain" priority />
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes launch {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          65% { opacity: 1; transform: translateY(-120px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-520px) scale(0.35); }
        }
      `}</style>
    </main>
  );
}

function Alien({ x, y, health }: { x: number; y: number; health: number }) {
  const cells = [
    0, 1, 0, 1, 0,
    1, 1, 1, 1, 1,
    1, 0, 1, 0, 1,
    1, 1, 1, 1, 1,
    0, 1, 0, 1, 0,
  ];

  return (
    <div className="absolute h-8 w-10" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="grid grid-cols-5 gap-[2px]">
        {cells.map((cell, index) => {
          const visible = cell && index < health * 5;
          return (
            <div
              key={index}
              className={`h-2 w-2 rounded-sm ${visible ? "bg-[#ff2fa8]" : "bg-transparent"}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function Leaderboard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="w-60 rounded-2xl border border-[#ff2fa8]/35 bg-white p-3 shadow-sm">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#19d3cf]">
        {title}
      </p>

      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={item} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-1.5 text-xs">
            <span className="font-bold text-[#ff2fa8]">{index + 1}</span>
            <span className="font-semibold">{item}</span>
            <span className="text-[10px] font-bold text-gray-400">{1000 - index * 87}</span>
          </div>
        ))}
      </div>
    </div>
  );
}