import type { ReactNode } from "react";
import DataLabel from "./data-label";

export function MetricItem({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 px-sa-3 py-sa-2 ${className}`}>
      <DataLabel as="p">{label}</DataLabel>
      <div className="mt-sa-1 min-w-0 font-sa-data text-sm font-bold leading-5 text-sa-text-primary">
        {children}
      </div>
    </div>
  );
}

export default function MetricStrip({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-sa-border-subtle border-t border-sa-border-subtle">
      {children}
    </div>
  );
}
