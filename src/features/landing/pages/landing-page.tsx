import type { Metadata } from "next";
import { LandingDynamics } from "@features/landing/components/landing-dynamics";
import { LandingGamesCarousel } from "@features/landing/components/landing-games-carousel";
import { LandingGamesSection } from "@features/landing/components/landing-games-section";
import { LandingGroupsStrip } from "@features/landing/components/landing-groups-strip";
import { LandingHeader } from "@features/landing/components/landing-header";
import { LandingHero } from "@features/landing/components/landing-hero";
import { LandingIntro } from "@features/landing/components/landing-intro";
import { LandingProgram } from "@features/landing/components/landing-program";
import { EVENT_DYNAMICS, EVENT_INFO, EVENT_SCHEDULE, EVENT_VENUE } from "@features/landing/lib/event-content";
import { formatDayMonthYearLabel, formatMonthDayYearLabel } from "@features/landing/lib/event-format";
import { buildEventStructuredData } from "@features/landing/lib/event-structured-data";
import { LANDING_GAMES, LANDING_TEAM_COUNT } from "@features/landing/lib/landing-games";
import { getGroupLabels } from "@features/landing/lib/landing-groups";
import { HOME_PATH, LANDING_GAMES_HREF } from "@features/landing/lib/landing-links";
import { JsonLd } from "@shared/components/json-ld";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

export const landingPageMetadata: Metadata = {
  title: { absolute: siteConfig.title },
  description: siteConfig.description,
  alternates: { canonical: HOME_PATH },
  openGraph: buildOpenGraph(),
};

/** Portada (`/`) en tema claro: navegación, hero, grupos, introducción, juegos, dinámicas y programa. */
export function LandingPage() {
  return (
    <div className="light bg-background text-foreground" data-theme="light">
      <JsonLd data={buildEventStructuredData(siteConfig.url, LANDING_TEAM_COUNT)} />
      <LandingHeader />
      <main>
        <section id="hero">
          <LandingHero
            dateLabel={formatDayMonthYearLabel(EVENT_INFO.startsAt)}
            venueLabel={EVENT_VENUE.shortName}
            admissionLabel={EVENT_INFO.admission}
            gamesHref={LANDING_GAMES_HREF}
            calendarUrl={EVENT_INFO.calendarUrl}
          />
        </section>
        <section id="groups">
          <LandingGroupsStrip groups={getGroupLabels()} />
        </section>
        <section id="intro">
          <LandingIntro division={siteConfig.organization.division} />
        </section>
        <section id="games">
          <LandingGamesSection teamCount={LANDING_TEAM_COUNT}>
            <LandingGamesCarousel games={LANDING_GAMES} total={LANDING_TEAM_COUNT} />
          </LandingGamesSection>
        </section>
        <section id="dynamics">
          <LandingDynamics dynamics={EVENT_DYNAMICS} gamesCount={LANDING_TEAM_COUNT} />
        </section>
        <LandingProgram
          schedule={EVENT_SCHEDULE}
          dateLabel={formatMonthDayYearLabel(EVENT_INFO.startsAt)}
          calendarUrl={EVENT_INFO.calendarUrl}
          startsAt={EVENT_INFO.startsAt}
        />
      </main>
    </div>
  );
}
