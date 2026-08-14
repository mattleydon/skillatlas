import Link from "next/link";
import type { ReactNode } from "react";
import DataLabel from "@/app/components/intelligence-ui/data-label";
import IntelligencePanel from "@/app/components/intelligence-ui/intelligence-panel";
import { ROUTES } from "@/constants/routes";

type AuthShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthShell({
  eyebrow = "SkillAtlas / Account",
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="skillatlas-page-shell relative min-h-screen overflow-x-clip bg-sa-canvas text-sa-text-primary">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,color-mix(in_srgb,var(--sa-accent)_7%,transparent),transparent_30%),linear-gradient(180deg,var(--sa-canvas),var(--sa-canvas))]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(var(--sa-border-subtle)_1px,transparent_1px),linear-gradient(90deg,var(--sa-border-subtle)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1440px] justify-center px-4 pb-16 pt-sa-5 sm:px-6 sm:pb-20 sm:pt-sa-6 lg:px-8">
        <div className="w-full max-w-[540px]">
          <div className="mb-sa-3 px-sa-1">
            <DataLabel as="p" className="text-sa-accent">
              {eyebrow}
            </DataLabel>
            <h1 className="mt-sa-1 text-[1.75rem] font-black leading-[1.08] tracking-[-0.035em] text-sa-text-primary sm:text-4xl">
              {title}
            </h1>
            <p className="mt-sa-2 max-w-xl text-sm leading-6 text-sa-text-muted sm:text-[15px]">
              {description}
            </p>
          </div>

          <IntelligencePanel
            as="section"
            className="overflow-hidden border-sa-border-strong"
            bodyClassName="px-sa-4 py-sa-5 sm:px-sa-5"
          >
            {children}
            {footer ? (
              <div className="mt-sa-5 border-t border-sa-border-subtle pt-sa-4 text-sm leading-6 text-sa-text-muted">
                {footer}
              </div>
            ) : null}
          </IntelligencePanel>

          <p className="mt-sa-3 text-center text-xs leading-5 text-sa-text-technical">
            Account access is optional. Public SkillAtlas pages remain available without signing in. {" "}
            <Link
              href={ROUTES.rankings}
              className="font-bold text-sa-accent outline-none hover:text-sa-text-primary focus-visible:rounded-sa-sm focus-visible:ring-2 focus-visible:ring-sa-accent"
            >
              Return to Rankings
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
