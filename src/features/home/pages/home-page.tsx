import type { Metadata } from "next";
import { Suspense } from "react";
import { EventClosingBanner } from "@features/event/components/event-closing-banner";
import { EventIntroSection } from "@features/event/components/event-intro-section";
import { EventVideoHero } from "@features/event/components/event-video-hero";
import { VenueSection } from "@features/event/components/venue-section";
import { EVENT_REEL } from "@features/event/lib/event-media";
import { buildEventStructuredData } from "@features/event/lib/event-structured-data";
import { PLAN_ITEM_COVER_SIZES } from "@features/floor-plan/components/plan-item-card";
import { FeaturedGamesCarousel } from "@features/games/components/featured-games-carousel";
import { GameMedia } from "@features/games/components/game-media";
import { toStandOccupant } from "@features/games/lib/game-stand";
import { getGamesHydrationState } from "@features/games/lib/server/games-prefetch";
import { listGames } from "@features/games/lib/server/games-queries";
import { CatalogShowcase } from "@features/home/components/catalog-showcase";
import { ProgramAndFloorPlan } from "@features/home/components/program-and-floor-plan";
import { JsonLd } from "@shared/components/json-ld";
import { buildOpenGraph } from "@shared/lib/metadata";
import { QueryHydrationBoundary } from "@shared/components/query-hydration-boundary";
import { routes, siteConfig } from "@shared/lib/site-config";

export const homePageMetadata: Metadata = {
  title: { absolute: siteConfig.title },
  description: siteConfig.description,
  alternates: { canonical: routes.home },
  openGraph: buildOpenGraph({ images: [{ url: EVENT_REEL.poster, alt: siteConfig.title }] }),
};

/** Portada (`index.html`): reel, destacados, evento, catálogo, programa, croquis y ubicación. */
export async function HomePage() {
  const games = await listGames();
  const occupants = games.map((game) => toStandOccupant(game, <GameMedia game={game} sizes={PLAN_ITEM_COVER_SIZES} />));

  return (
    <>
      <JsonLd data={buildEventStructuredData(siteConfig.url, games.length)} />
      <EventVideoHero gameCount={games.length} />
      <Suspense>
        <QueryHydrationBoundary state={getGamesHydrationState()}>
          <FeaturedGamesCarousel />
          <main>
            <EventIntroSection />
            <CatalogShowcase />
            <ProgramAndFloorPlan occupants={occupants} />
            <VenueSection />
          </main>
        </QueryHydrationBoundary>
      </Suspense>
      <EventClosingBanner />
    </>
  );
}
