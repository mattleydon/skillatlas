import type { ReactNode } from "react";

type StatsCardProps = {
  label: string;
  children: ReactNode;
};

export default function StatsCard({ label, children }: StatsCardProps) {
  return (
    <div className="rounded-3xl border border-[#ff2fa8]/40 bg-white/88 p-3 shadow-sm backdrop-blur">
      <p className="sa-type-label text-[10px] text-gray-500">{label}</p>
      {children}
    </div>
  );
}
