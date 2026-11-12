"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { getBackFallbackPath } from "@features/site/lib/site-back";
import { SITE_COPY } from "@features/site/lib/site-copy";

interface SiteBackButtonProps {
  pathname: string;
}

/**
 * Volver, at the start of the shared navbar. It goes back in history when the previous entry belongs to this site;
 * otherwise the link falls back to the parent page.
 */
export function SiteBackButton({ pathname }: Readonly<SiteBackButtonProps>) {
  return (
    <Link
      href={getBackFallbackPath(pathname)}
      onClick={goBackWhenSameSite}
      className="touch-target relative flex flex-none items-center gap-1 border-r border-separator px-3 font-nav text-[13px] font-medium tracking-[.02em] uppercase no-underline"
    >
      <BackChevron />
      {SITE_COPY.nav.back}
    </Link>
  );
}

function goBackWhenSameSite(event: MouseEvent<HTMLAnchorElement>): void {
  if (hasSameSitePreviousEntry()) {
    event.preventDefault();
    window.history.back();
  }
}

function hasSameSitePreviousEntry(): boolean {
  // A same-site referrer with no previous entry (a link opened in a new tab) still falls back instead of a dead back().
  return window.history.length > 1 && document.referrer.startsWith(window.location.origin);
}

function BackChevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
