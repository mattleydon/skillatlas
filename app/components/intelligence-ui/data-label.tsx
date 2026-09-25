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
      className={`sa-type-label text-[10px] leading-4 text-sa-text-technical ${className}`}
      {...props}
    />
  );
}
