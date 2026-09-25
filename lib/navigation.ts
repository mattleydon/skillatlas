import type { MouseEvent } from "react";
import { ROUTES } from "@/constants/routes";

export function normalisePath(pathname: string) {
  if (!pathname || pathname === ROUTES.rankings) return ROUTES.rankings;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function pathIsActive(pathname: string, href: string) {
  if (href === ROUTES.rankings) return pathname === ROUTES.rankings;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function navigationCurrent(pathname: string, href: string) {
  if (pathname === href) return "page" as const;
  return pathIsActive(pathname, href) ? ("location" as const) : undefined;
}

export function isPlainNavigationClick(event: MouseEvent<HTMLAnchorElement>) {
  return !event.defaultPrevented && event.button === 0 &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey &&
    (!event.currentTarget.target || event.currentTarget.target === "_self") &&
    !event.currentTarget.hasAttribute("download");
}

export function preventRedundantNavigation(
  event: MouseEvent<HTMLAnchorElement>,
  pathname: string,
  href: string
) {
  if (
    normalisePath(href) !== pathname ||
    !isPlainNavigationClick(event)
  ) {
    return;
  }

  event.preventDefault();
}
