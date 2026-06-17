"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Enemy = { id: number; x: number; y: number; cells: number[] };
type Bullet = { id: number; x: number; y: number };
type EnemyBullet = { id: number; x: number; y: number };

const countries = ["Denmark", "South Korea", "China", "Sweden", "USA"];
const players = ["AtlasPilot", "PixelWarden", "RankGoblin", "GlobeRunner", "SkillGhost"];

const PLAY_LEFT = 23;
const PLAY_RIGHT = 77;
const PLAYER_Y = 86;
const START_SPEED = 0.01875;

const DOT_X_GAP = 1.05;
const DOT_Y_GAP = 1.45;
const HIT_X = 0.9;
const HIT_Y = 1.15;

const ALIEN_PATTERN = [
  0, 1, 0, 1, 0,
  1, 1, 1, 1, 1,
  1, 0, 1, 0, 1,
  1, 1, 1, 1, 1,
  0, 1, 0, 1, 0,
];

function createAlienLine(startId: number, y = 10): Enemy[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id: startId + i,
    x: 4 + i * 14.5,
    y,
    cells: ALIEN_PATTERN.map((cell) => (cell ? 3 : 0)),
  }));
}

function createInitialWave(): Enemy[] {
  return [...createAlienLine(0, 9), ...createAlienLine(100, 21)];
}

export default function SpaceInvaders() {
  const [intro, setIntro] = useState(true);
  const [shipX, setShipX] = useState(50);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemyBullets, setEnemyBullets] = useState<EnemyBullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>(createInitialWave);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const nextId = useRef(1000);
  const speed = useRef(START_SPEED);
  const spawnRate = useRef(82500);
  const lastSpawn = useRef(Date.now());
  const enemyFireChance = useRef(0.012);

  function restartGame() {
    setShipX(50);
    setBullets([]);
    setEnemyBullets([]);
    setEnemies(createInitialWave());
    setScore(0);
    setGameOver(false);
    speed.current = START_SPEED;
    spawnRate.current = 82500;
    lastSpawn.current = Date.now();
    enemyFireChance.current = 0.012;
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

      if (event.key === "ArrowLeft") setShipX((x) => Math.max(3, x - 0.75));
      if (event.key === "ArrowRight") setShipX((x) => Math.min(97, x + 0.75));

      if (event.key === " ") {
        event.preventDefault();
        setBullets((current) => [
          ...current,
          { id: Date.now() + Math.random(), x: shipX, y: PLAYER_Y },
        ]);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [shipX, gameOver]);

  useEffect(() => {
    if (intro || gameOver) return;

    const loop = window.setInterval(() => {
      speed.current = Math.min(0.09, speed.current + 0.000025);
      spawnRate.current = Math.max(24000, spawnRate.current - 2);
      enemyFireChance.current = Math.min(0.08, enemyFireChance.current + 0.000012);

      setEnemies((enemyState) => {
        let nextEnemies = enemyState.map((enemy) => ({
          ...enemy,
          y: enemy.y + speed.current,
          cells: [...enemy.cells],
        }));

        setBullets((bulletState) => {
          const movedBullets = bulletState
            .map((bullet) => ({ ...bullet, y: bullet.y - 3.2 }))
            .filter((bullet) => bullet.y > 0);

          const remainingBullets: Bullet[] = [];

          for (const bullet of movedBullets) {
            let bulletUsed = false;

            for (let enemyIndex = 0; enemyIndex < nextEnemies.length; enemyIndex++) {
              if (bulletUsed) break;

              const enemy = nextEnemies[enemyIndex];
              const newCells = [...enemy.cells];

              for (let cellIndex = 0; cellIndex < newCells.length; cellIndex++) {
                if (newCells[cellIndex] <= 0) continue;

                const col = cellIndex % 5;
                const row = Math.floor(cellIndex / 5);
                const dotX = enemy.x + col * DOT_X_GAP;
                const dotY = enemy.y + row * DOT_Y_GAP;

                if (Math.abs(dotX - bullet.x) <= HIT_X && Math.abs(dotY - bullet.y) <= HIT_Y) {
                  newCells[cellIndex] -= 1;
                  bulletUsed = true;
                  setScore((current) => current + 10);

                  nextEnemies[enemyIndex] = { ...enemy, cells: newCells };
                  break;
                }
              }
            }

            if (!bulletUsed) remainingBullets.push(bullet);
          }

          return remainingBullets;
        });

        nextEnemies = nextEnemies.filter((enemy) => {
          const alive = enemy.cells.some((cell) => cell > 0);
          if (!alive) setScore((current) => current + 75);
          return alive;
        });

        const touchingPlayer = nextEnemies.some((enemy) =>
          enemy.cells.some((cell, cellIndex) => {
            if (cell <= 0) return false;
            const row = Math.floor(cellIndex / 5);
            return enemy.y + row * DOT_Y_GAP >= PLAYER_Y - 2;
          })
        );

        if (touchingPlayer) {
          setGameOver(true);
          return nextEnemies;
        }

        if (nextEnemies.length > 0 && Math.random() < enemyFireChance.current) {
          const shooter = nextEnemies[Math.floor(Math.random() * nextEnemies.length)];
          setEnemyBullets((current) => [
            ...current,
            {
              id: Date.now() + Math.random(),
              x: shooter.x + 2.1,
              y: shooter.y + 4.8,
            },
          ]);
        }

        const now = Date.now();
        if (now - lastSpawn.current > spawnRate.current) {
          nextEnemies = [...nextEnemies, ...createAlienLine(nextId.current, 7)];
          nextId.current += 1000;
          lastSpawn.current = now;
        }

        return nextEnemies;
      });

      setEnemyBullets((bulletState) => {
        const moved = bulletState
          .map((bullet) => ({ ...bullet, y: bullet.y + 1.25 }))
          .filter((bullet) => bullet.y < 96);

        const playerHit = moved.some(
          (bullet) =>
            Math.abs(bullet.x - shipX) < 2.5 &&
            Math.abs(bullet.y - PLAYER_Y) < 3.5
        );

        if (playerHit) {
          setGameOver(true);
        }

        return moved;
      });
    }, 60);

    return () => window.clearInterval(loop);
  }, [intro, gameOver, shipX]);

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
              className="mix-blend-multiply"
            />
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

        <div className="absolute right-5 top-5 z-20 grid max-h-[90vh] gap-3 overflow-hidden">
          <Leaderboard title="Top Countries" items={countries} />
          <Leaderboard title="Top Players" items={players} />
        </div>

        <div className="absolute inset-y-0" style={{ left: `${PLAY_LEFT}%`, right: `${100 - PLAY_RIGHT}%` }}>
          {enemies.map((enemy) => <Alien key={enemy.id} enemy={enemy} />)}

          {bullets.map((bullet) => (
            <div
              key={bullet.id}
              className="absolute h-6 w-1 rounded-full bg-[#19d3cf]"
              style={{ left: `${bullet.x}%`, top: `${bullet.y}%` }}
            />
          ))}

          {enemyBullets.map((bullet) => (
            <div
              key={bullet.id}
              className="absolute h-5 w-1 rounded-full bg-[#ff2fa8]"
              style={{ left: `${bullet.x}%`, top: `${bullet.y}%` }}
            />
          ))}

          <div className="absolute bottom-8 h-16 w-16 -translate-x-1/2" style={{ left: `${shipX}%` }}>
            <Image
              src="/skillatlas-logo.png"
              alt="Player ship"
              fill
              className="object-contain mix-blend-multiply"
              priority
            />
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

function Alien({ enemy }: { enemy: Enemy }) {
  return (
    <>
      {enemy.cells.map((health, index) => {
        if (health <= 0) return null;

        const col = index % 5;
        const row = Math.floor(index / 5);

        return (
          <div
            key={`${enemy.id}-${index}`}
            className="absolute h-2.5 w-2.5 rounded-sm bg-[#ff2fa8]"
            style={{
              left: `${enemy.x + col * DOT_X_GAP}%`,
              top: `${enemy.y + row * DOT_Y_GAP}%`,
              opacity: health === 3 ? 1 : health === 2 ? 0.6 : 0.3,
            }}
          />
        );
      })}
    </>
  );
}

function Leaderboard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="w-64 rounded-2xl border border-[#ff2fa8]/35 bg-white p-3.5 shadow-sm">
      <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#19d3cf]">{title}</p>

      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={item} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-1.5 text-sm">
            <span className="font-bold text-[#ff2fa8]">{index + 1}</span>
            <span className="font-semibold">{item}</span>
            <span className="text-xs font-bold text-gray-400">{1000 - index * 87}</span>
          </div>
        ))}
      </div>
    </div>
  );
}