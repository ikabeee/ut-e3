import type { Metadata } from "next";
import { NotFoundView } from "@features/site/components/not-found-view";
import { SITE_COPY } from "@features/site/lib/site-copy";

export const notFoundPageMetadata: Metadata = {
  title: SITE_COPY.notFound.title,
  robots: { index: false },
};

/** Página 404 (`src/app/not-found.tsx`). */
export function NotFoundPage() {
  return <NotFoundView />;
}
