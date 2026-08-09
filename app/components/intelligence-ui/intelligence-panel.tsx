import type { HTMLAttributes, ReactNode } from "react";

type PanelElement = "article" | "aside" | "div" | "section";

type IntelligencePanelProps = HTMLAttributes<HTMLElement> & {
  as?: PanelElement;
  header?: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
};

export default function IntelligencePanel({
  as: Component = "div",
  header,
  footer,
  bodyClassName = "",
  className = "",
  children,
  ...props
}: IntelligencePanelProps) {
  return (
    <Component
      className={`min-w-0 rounded-sa-panel border border-sa-border-subtle bg-sa-surface-1 text-sa-text-primary ${className}`}
      {...props}
    >
      {header ? (
        <div className="border-b border-sa-border-subtle px-sa-4 py-sa-3">{header}</div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
      {footer ? (
        <div className="border-t border-sa-border-subtle px-sa-4 py-sa-3">{footer}</div>
      ) : null}
    </Component>
  );
}
