import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { getEventSettings } from "@features/event-settings/lib/server/event-settings-queries";
import type { EventSettings } from "@features/event-settings/lib/types";
import { FloorPlan } from "@features/floor-plan/components/floor-plan";
import { FLOOR_PLAN_SECTION_ID, getZoneLink } from "@features/floor-plan/lib/floor-plan-links";
import type { FloorPlanStand } from "@features/floor-plan/lib/types";
import { FeaturedGames } from "@features/games/components/featured-games";
import { GameCatalog } from "@features/games/components/game-catalog";
import { getCoverImage } from "@features/games/lib/game-cover";
import { GAMES_SECTION_ID } from "@features/games/lib/games-links";
import { getGames } from "@features/games/lib/server/games-queries";
import { formatStandCode } from "@features/games/lib/stand-code";
import type { Game } from "@features/games/lib/types";
import { ActivityCards } from "@features/landing/components/activity-cards";
import { ClosingBand } from "@features/landing/components/closing-band";
import { EventIntro } from "@features/landing/components/event-intro";
import { MarketplaceCard } from "@features/landing/components/marketplace-card";
import { SiteFooter } from "@features/landing/components/site-footer";
import { SiteNav } from "@features/landing/components/site-nav";
import { SpecialGuests } from "@features/landing/components/special-guests";
import { VenueLocation } from "@features/landing/components/venue-location";
import { VideoHero } from "@features/landing/components/video-hero";
import { buildCalendarUrl } from "@features/landing/lib/calendar-link";
import { buildEventStructuredData } from "@features/landing/lib/event-structured-data";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { HOME_PATH, TOP_SECTION_ID } from "@features/landing/lib/landing-links";
import { getMarketplaceRegistration } from "@features/landing/lib/marketplace-registration";
import { SPECIAL_GUESTS } from "@features/landing/lib/special-guests";
import { EVENT_VENUE, formatCopyableAddress } from "@features/landing/lib/venue";
import { EventSchedule } from "@features/schedule/components/event-schedule";
import { getScheduleItems } from "@features/schedule/lib/server/schedule-queries";
import type { ScheduleItem } from "@features/schedule/lib/types";
import { SponsorsBand } from "@features/sponsors/components/sponsors-band";
import { getSponsors } from "@features/sponsors/lib/server/sponsors-queries";
import type { Sponsor } from "@features/sponsors/lib/types";
import { JsonLd } from "@shared/components/json-ld";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

export const landingPageMetadata: Metadata = {
  title: { absolute: siteConfig.title },
  description: siteConfig.description,
  alternates: { canonical: HOME_PATH },
  openGraph: buildOpenGraph(),
};

const NAV_LINKS = [
  { href: `#${TOP_SECTION_ID}`, label: LANDING_COPY.nav.links.home },
  { href: `#${GAMES_SECTION_ID}`, label: LANDING_COPY.nav.links.games },
  { href: `#${FLOOR_PLAN_SECTION_ID}`, label: LANDING_COPY.nav.links.floorPlan },
];

interface LandingViewProps {
  settings: EventSettings;
  games: Game[];
  scheduleItems: ScheduleItem[];
  sponsors: Sponsor[];
  marketplace: ReactNode;
}

export async function LandingPage() {
  const [settings, games, scheduleItems, sponsors] = await Promise.all([
    getEventSettings(),
    getGames(),
    getScheduleItems(),
    getSponsors(),
  ]);

  return (
    <LandingView
      settings={settings}
      games={games}
      scheduleItems={scheduleItems}
      sponsors={sponsors}
      marketplace={
        <Suspense fallback={null}>
          <MarketplaceRegistration settings={settings} />
        </Suspense>
      }
    />
  );
}

export function LandingView({ settings, games, scheduleItems, sponsors, marketplace }: Readonly<LandingViewProps>) {
  const eventDate = formatEventDate(settings.eventStartsAt, "numeric");

  return (
    <>
      <SiteNav links={NAV_LINKS} />
      <main>
        <VideoHero
          kicker={LANDING_COPY.hero.kicker(eventDate, siteConfig.organization.universityShortName)}
          calendarUrl={buildEventCalendarUrl(settings)}
        />
        <SponsorsBand sponsors={sponsors} />
        <FeaturedGames games={games} />
        <EventIntro>
          <ActivityCards raffle={raffleLabels(settings)} kof={kofLabels(settings)} marketplace={marketplace} />
        </EventIntro>
        <SpecialGuests guests={SPECIAL_GUESTS} />
        <GameCatalog games={games} />
        <EventSchedule
          heading={formatEventDate(settings.eventStartsAt, "2-digit")}
          items={scheduleItems}
          zoneLink={getZoneLink}
        />
        <FloorPlan stands={games.map(toFloorPlanStand)} />
        <VenueLocation venue={EVENT_VENUE} />
        <ClosingBand dateLabel={eventDate} />
      </main>
      <SiteFooter />
      <JsonLd data={buildLandingStructuredData(settings)} />
    </>
  );
}

async function MarketplaceRegistration({ settings }: Readonly<{ settings: EventSettings }>) {
  await connection();

  const registration = getMarketplaceRegistration(
    { formUrl: settings.marketplaceFormUrl, closesAt: settings.marketplaceClosesAt },
    new Date(),
  );

  return <MarketplaceCard registration={registration} />;
}

function buildEventCalendarUrl(settings: EventSettings) {
  return buildCalendarUrl({
    title: LANDING_COPY.calendar.title,
    details: LANDING_COPY.calendar.details(siteConfig.organization.division),
    location: formatCopyableAddress(EVENT_VENUE),
    startsAt: settings.eventStartsAt,
    endsAt: settings.eventEndsAt,
  });
}

function raffleLabels(settings: EventSettings) {
  return {
    startsAtLabel: formatTimeOfDay(settings.raffleStartsAt),
    cutoffLabel: formatTimeOfDay(settings.checkInCutoffAt),
  };
}

function kofLabels(settings: EventSettings) {
  return {
    opensAtLabel: formatEventDate(settings.kofRegistrationOpensAt, "numeric"),
    closesAtLabel: formatTimeOfDay(settings.kofRegistrationClosesAt),
  };
}

function toFloorPlanStand(game: Game): FloorPlanStand {
  const cover = getCoverImage(game);

  return {
    code: formatStandCode(game.stand),
    name: game.name,
    genre: game.genre.name,
    synopsis: game.synopsis,
    coverSrc: cover.path,
    coverAlt: cover.alt,
  };
}

function buildLandingStructuredData(settings: EventSettings) {
  return buildEventStructuredData({
    siteUrl: siteConfig.url,
    description: siteConfig.description,
    startsAt: settings.eventStartsAt,
    endsAt: settings.eventEndsAt,
    venue: EVENT_VENUE,
  });
}
