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
      className={`text-[10px] font-bold uppercase leading-4 tracking-[0.16em] text-sa-text-technical ${className}`}
      {...props}
    />
  );
}
