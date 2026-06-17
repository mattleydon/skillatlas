"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Enemy = { id: number; x: number; y: number };
type Bullet = { id: number; x: number; y: number };

const countries = ["Denmark", "South Korea", "China", "Sweden", "USA"];
const players = ["AtlasPilot", "PixelWarden", "RankGoblin", "GlobeRunner", "SkillGhost"];

function createEnemyWave(startId: number, y = 8): Enemy[] {
  return Array.from({ length: 24 }, (_, i) => ({
    id: startId + i,
    x: 8 + (i % 8) * 10,
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
      if (event.key === "ArrowLeft") setShipX((x) => Math.max(4, x - 4));
      if (event.key === "ArrowRight") setShipX((x) => Math.min(96, x + 4));

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
              (enemy) => Math.abs(enemy.x - bullet.x) < 3.8 && Math.abs(enemy.y - bullet.y) < 3.8
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
          const newWave = createEnemyWave(nextId.current, 4);
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
            <Image src="/skillatlas-logo.png" alt="SkillAtlas launch" width={130} height={130