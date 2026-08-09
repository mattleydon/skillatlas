import type { ReactNode } from "react";
import DataLabel from "./data-label";

type SectionToolbarProps = {
  title: string;
  titleId?: string;
  eyebrow?: string;
  metadata?: string;
  controls?: ReactNode;
};

export default function SectionToolbar({
  title,
  titleId,
  eyebrow,
  metadata,
  controls,
}: SectionToolbarProps) {
  return (
    <div className="flex flex-col gap-sa-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? <DataLabel as="p">{eyebrow}</DataLabel> : null}
        <div className="mt-sa-1 flex flex-wrap items-baseline gap-x-sa-3 gap-y-sa-1">
          <h2 id={titleId} className="text-lg font-bold tracking-tight text-sa-text-primary">
            {title}
          </h2>
          {metadata ? <span className="font-sa-data text-xs text-sa-text-technical">{metadata}</span> : null}
        </div>
      </div>
      {controls ? <div className="grid min-w-0 gap-sa-2 sm:grid-cols-2 lg:w-[390px]">{controls}</div> : null}
    </div>
  );
}
