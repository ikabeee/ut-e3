import type { Metadata } from "next";
import { Suspense } from "react";
import { EventClosingBanner } from "@features/event/components/event-closing-banner";
import { EventIntroSection } from "@features/event/components/event-intro-section";
import { EventVideoHero } from "@features/event/components/event-video-hero";
import { VenueSection } from "@features/event/components/venue-section";
import { getEventContent } from "@features/event/lib/event-content";
import { describeShowcase } from "@features/event/lib/event-program";
import { buildEventStructuredData } from "@features/event/lib/event-structured-data";
import { PLAN_ITEM_COVER_SIZES } from "@features/floor-plan/components/plan-item-card";
import { buildPlanItems } from "@features/floor-plan/lib/plan-items";
import { PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import { PLAN_ZONES } from "@features/floor-plan/lib/plan-places";
import { FeaturedGamesCarousel } from "@features/games/components/featured-games-carousel";
import { GameMedia } from "@features/games/components/game-media";
import { toStandOccupants } from "@features/games/lib/game-stand";
import { StandTrafficBadge } from "@features/visitors/components/stand-traffic-badge";
import { getGamesHydrationState } from "@features/games/lib/server/games-prefetch";
import { listGames } from "@features/games/lib/server/games-queries";
import { CatalogShowcase } from "@features/home/components/catalog-showcase";
import { HOME_PATH } from "@features/home/lib/home-links";
import { ProgramAndFloorPlan } from "@features/home/components/program-and-floor-plan";
import { resolveScheduleZones } from "@features/home/lib/schedule-zones";
import { JsonLd } from "@shared/components/json-ld";
import { buildOpenGraph } from "@shared/lib/metadata";
import { QueryHydrationBoundary } from "@shared/components/query-hydration-boundary";
import { siteConfig } from "@shared/lib/site-config";

export const homePageMetadata: Metadata = {
  title: { absolute: siteConfig.title },
  description: siteConfig.description,
  alternates: { canonical: HOME_PATH },
  openGraph: buildOpenGraph({ images: [{ url: getEventContent().reel.poster, alt: siteConfig.title }] }),
};

/** Portada (`index.html`): reel, destacados, evento, catálogo, programa, croquis y ubicación. */
export async function HomePage() {
  const games = await listGames();
  const event = getEventContent();
  // Cada stand de equipo lleva la portada del juego y su afluencia en vivo (feature `visitors`).
  const occupants = toStandOccupants(games, (game) => <GameMedia game={game} sizes={PLAN_ITEM_COVER_SIZES} />).map(
    (occupant) => ({ ...occupant, status: <StandTrafficBadge standCode={occupant.stand} /> }),
  );

  return (
    <>
      <JsonLd data={buildEventStructuredData(siteConfig.url, games.length)} />
      <EventVideoHero
        hero={event.hero}
        info={event.info}
        venueShortName={event.venue.shortName}
        description={describeShowcase(games.length)}
        reel={event.reel}
      />
      <Suspense>
        <QueryHydrationBoundary state={getGamesHydrationState()}>
          <FeaturedGamesCarousel />
          <main>
            <EventIntroSection intro={event.intro} activities={event.activities} />
            <CatalogShowcase />
            <ProgramAndFloorPlan
              scheduleTitle={event.info.shortDateLabel}
              schedule={resolveScheduleZones(event.schedule, PLAN_ZONES)}
              items={buildPlanItems(occupants, event.highlights)}
              layouts={PLAN_LAYOUTS}
            />
            <VenueSection venue={event.venue} />
          </main>
        </QueryHydrationBoundary>
      </Suspense>
      <EventClosingBanner
        admission={event.info.admission}
        dateLabel={event.info.dateLabel}
        venueShortName={event.venue.shortName}
      />
    </>
  );
}
