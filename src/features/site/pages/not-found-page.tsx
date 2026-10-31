import type { Metadata } from "next";
import { SiteNav } from "@features/landing/components/site-nav";
import { HOME_NAV_LINKS } from "@features/landing/lib/home-nav-links";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { NotFoundView } from "@features/site/components/not-found-view";
import { SITE_COPY } from "@features/site/lib/site-copy";

export const notFoundPageMetadata: Metadata = {
  title: SITE_COPY.notFound.title,
  robots: { index: false },
};

// Rendered by src/app/not-found.tsx for unknown routes and for notFound(), such as a game slug that does not exist.
export function NotFoundPage() {
  return (
    <>
      <SiteNav homeHref={HOME_PATH} links={HOME_NAV_LINKS} />
      <NotFoundView homeHref={HOME_PATH} />
    </>
  );
}
