import type { Metadata } from "next";
import { Suspense } from "react";
import { getEventContent } from "@features/event/lib/event-content";
import { buildEventStructuredData } from "@features/event/lib/event-structured-data";
import { PLAN_ZONES } from "@features/floor-plan/lib/plan-places";
import { GAMES_PATH } from "@features/games/lib/game-links";
import { getGamesHydrationState } from "@features/games/lib/server/games-prefetch";
import { listGames } from "@features/games/lib/server/games-queries";
import { LandingDynamics } from "@features/landing/components/landing-dynamics";
import { LandingGamesCarousel } from "@features/landing/components/landing-games-carousel";
import { LandingGamesSection } from "@features/landing/components/landing-games-section";
import { LandingGroupsStrip } from "@features/landing/components/landing-groups-strip";
import { LandingHero } from "@features/landing/components/landing-hero";
import { LandingIntro } from "@features/landing/components/landing-intro";
import { LandingProgram } from "@features/landing/components/landing-program";
import { getGroupLabels } from "@features/landing/lib/landing-groups";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { resolveScheduleZones } from "@features/landing/lib/schedule-zones";
import { PASSPORT_PATH } from "@features/visitors/lib/visitors-links";
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
  const { info, venue, schedule, dynamics } = getEventContent();
  const { division } = siteConfig.organization;

  return (
    <div className="light bg-background text-foreground" data-theme="light">
      <JsonLd data={buildEventStructuredData(siteConfig.url, games.length)} />
      <main>
        <section id="hero">
          <LandingHero
            dateLabel={info.dateLabel}
            venueLabel={venue.shortName}
            admissionLabel={info.admission}
            division={division}
            gamesHref={GAMES_PATH}
            calendarUrl={info.calendarUrl}
          />
        </section>
        <section id="groups">
          <LandingGroupsStrip groups={getGroupLabels()} />
        </section>
        <section id="intro">
          <LandingIntro division={division} />
        </section>
        <section id="games">
          <LandingGamesSection teamCount={games.length}>
            <Suspense>
              <QueryHydrationBoundary state={getGamesHydrationState()}>
                <LandingGamesCarousel />
              </QueryHydrationBoundary>
            </Suspense>
          </LandingGamesSection>
        </section>
        <section id="dynamics">
          <LandingDynamics dynamics={dynamics} gamesCount={games.length} hrefs={{ raffle: PASSPORT_PATH }} />
        </section>
        <LandingProgram
          schedule={resolveScheduleZones(schedule, PLAN_ZONES)}
          dateLabel={info.dateLabel}
          calendarUrl={info.calendarUrl}
          startsAt={info.startsAt}
        />
      </main>
    </div>
  );
}
