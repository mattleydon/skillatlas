import type { HTMLAttributes } from "react";

type DataLabelElement = "div" | "h2" | "h3" | "p" | "span";

type DataLabelProps = HTMLAttributes<HTMLElement> & {
  as?: DataLabelElement;
};

export default function DataLabel({
  as: Component = "span",
  className = "",
  ...props
}: DataLabelProps) {
  return (
    <Component
      className={`font-sa-data text-[10px] font-medium uppercase leading-4 tracking-[0.12em] text-sa-text-technical ${className}`}
      {...props}
    />
  );
}
