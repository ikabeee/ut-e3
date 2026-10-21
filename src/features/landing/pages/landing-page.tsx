import type { Metadata } from "next";
import { Suspense } from "react";
import { getEventContent } from "@features/event/lib/event-content";
import { buildEventStructuredData } from "@features/event/lib/event-structured-data";
import { getGamesHydrationState } from "@features/games/lib/server/games-prefetch";
import { listGames } from "@features/games/lib/server/games-queries";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { JsonLd } from "@shared/components/json-ld";
import { QueryHydrationBoundary } from "@shared/components/query-hydration-boundary";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

export const landingPageMetadata: Metadata = {
  title: { absolute: siteConfig.title },
  description: siteConfig.description,
  alternates: { canonical: HOME_PATH },
  openGraph: buildOpenGraph({ images: [{ url: getEventContent().reel.poster, alt: siteConfig.title }] }),
};

/** Portada (`/`) en tema claro: hero, grupos, introducción, juegos, dinámicas y programa. */
export async function LandingPage() {
  const games = await listGames();

  return (
    <div className="light bg-background text-foreground" data-theme="light">
      <JsonLd data={buildEventStructuredData(siteConfig.url, games.length)} />
      <main>
        {/* T2 */}
        <section id="hero" />
        {/* T2 */}
        <section id="groups" />
        {/* T2 */}
        <section id="intro" />
        <section id="games">
          {/* T3 */}
          <Suspense>
            <QueryHydrationBoundary state={getGamesHydrationState()}>{null}</QueryHydrationBoundary>
          </Suspense>
        </section>
        {/* T4 */}
        <section id="dynamics" />
        {/* T5 */}
        <section id="program" />
      </main>
    </div>
  );
}
