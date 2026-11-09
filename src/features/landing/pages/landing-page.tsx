import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { getEventSettings } from "@features/event-settings/lib/server/event-settings-queries";
import type { EventSettings } from "@features/event-settings/lib/types";
import { FloorPlan } from "@features/floor-plan/components/floor-plan";
import { FLOOR_PLAN_SECTION_ID, getZoneLink } from "@features/floor-plan/lib/floor-plan-links";
import { toFloorPlanStand } from "@features/floor-plan/lib/floor-plan-stands";
import { GameCatalog } from "@features/games/components/game-catalog";
import { GAMES_PATH, GAMES_SECTION_ID } from "@features/games/lib/games-links";
import { getGames } from "@features/games/lib/server/games-queries";
import type { Game } from "@features/games/lib/types";
import { ClosingBand } from "@features/landing/components/closing-band";
import { EventActs } from "@features/landing/components/event-acts";
import { MarketplaceCard } from "@features/landing/components/marketplace-card";
import { SiteFooter } from "@features/landing/components/site-footer";
import { SiteNav } from "@features/landing/components/site-nav";
import { SpecialGuests } from "@features/landing/components/special-guests";
import { VenueLocation } from "@features/landing/components/venue-location";
import { VideoHero } from "@features/landing/components/video-hero";
import { buildEventCalendarUrl } from "@features/landing/lib/calendar-link";
import { buildEventStructuredData } from "@features/landing/lib/event-structured-data";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { HOME_PATH, TOP_SECTION_ID } from "@features/landing/lib/landing-links";
import { getCurrentMarketplaceRegistration } from "@features/landing/lib/server/marketplace-queries";
import { SPECIAL_GUESTS } from "@features/landing/lib/special-guests";
import { EVENT_VENUE } from "@features/landing/lib/venue";
import { EventSchedule } from "@features/schedule/components/event-schedule";
import { getScheduleItems } from "@features/schedule/lib/server/schedule-queries";
import type { ScheduleItem } from "@features/schedule/lib/types";
import { SponsorsCarousel } from "@features/sponsors/components/sponsors-carousel";
import { getSponsors } from "@features/sponsors/lib/server/sponsors-queries";
import { SPONSORS_PATH, SPONSORS_SECTION_ID } from "@features/sponsors/lib/sponsors-links";
import type { Sponsor } from "@features/sponsors/lib/types";
import { REGISTER_PATH } from "@features/visitors/lib/visitors-links";
import { JsonLd } from "@shared/components/json-ld";
import { formatEventDate, formatTimeOfDay } from "@shared/lib/date-time";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";
import { siteMode } from "@shared/lib/site-mode";

export const landingPageMetadata: Metadata = {
  title: { absolute: siteConfig.title },
  description: siteConfig.description,
  alternates: { canonical: HOME_PATH },
  openGraph: buildOpenGraph(),
};

const NAV_LINKS = [
  { href: `#${TOP_SECTION_ID}`, label: LANDING_COPY.nav.links.home },
  { href: GAMES_PATH, label: LANDING_COPY.nav.links.games },
  { href: `#${FLOOR_PLAN_SECTION_ID}`, label: LANDING_COPY.nav.links.floorPlan },
  { href: SPONSORS_PATH, label: LANDING_COPY.nav.links.sponsors },
];

// While only the landing is published (SITE_MODE=landing), every entry stays on this page and the logo goes home, so
// the three entries fit a 360 px phone.
const LANDING_ONLY_NAV_LINKS = [
  { href: `#${GAMES_SECTION_ID}`, label: LANDING_COPY.nav.links.games },
  { href: `#${FLOOR_PLAN_SECTION_ID}`, label: LANDING_COPY.nav.links.floorPlan },
  { href: `#${SPONSORS_SECTION_ID}`, label: LANDING_COPY.nav.links.sponsors },
];

const REGISTER_CTA = { href: REGISTER_PATH, label: LANDING_COPY.nav.createPassport };

interface LandingViewProps {
  settings: EventSettings;
  games: Game[];
  scheduleItems: ScheduleItem[];
  sponsors: Sponsor[];
  /** The Marketplace card, left out of the landing until the form URL exists (see MarketplaceSlot). */
  marketplace?: ReactNode;
  /**
   * Only the landing is published: no link leaves the page, the provisional stands stay out of the croquis and what
   * needs the passport or is not announced yet (rating, marketplace, special guests) is left out.
   */
  isLandingOnly?: boolean;
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
      isLandingOnly={siteMode === "landing"}
    />
  );
}

export function LandingView({
  settings,
  games,
  scheduleItems,
  sponsors,
  marketplace,
  isLandingOnly = false,
}: Readonly<LandingViewProps>) {
  const eventDate = formatEventDate(settings.eventStartsAt, "numeric");

  return (
    <>
      <LandingNav isLandingOnly={isLandingOnly} />
      <main>
        <VideoHero
          calendarUrl={buildEventCalendarUrl({ startsAt: settings.eventStartsAt, endsAt: settings.eventEndsAt })}
          registerHref={isLandingOnly ? undefined : REGISTER_PATH}
        />
        <SponsorsCarousel sponsors={sponsors} />
        <LandingEvent
          settings={settings}
          gamesCount={games.length}
          marketplace={marketplace}
          isLandingOnly={isLandingOnly}
        />
        <GameCatalog games={games} linksToGamePages={!isLandingOnly} />
        <EventSchedule
          heading={formatEventDate(settings.eventStartsAt, "2-digit")}
          items={scheduleItems}
          zoneLink={getZoneLink}
        />
        <FloorPlan stands={isLandingOnly ? [] : games.map(toFloorPlanStand)} />
        <VenueLocation venue={EVENT_VENUE} />
        <ClosingBand dateLabel={eventDate} />
      </main>
      <SiteFooter />
      <JsonLd data={buildLandingStructuredData(settings)} />
    </>
  );
}

function LandingNav({ isLandingOnly }: Readonly<{ isLandingOnly: boolean }>) {
  if (isLandingOnly) return <SiteNav homeHref={`#${TOP_SECTION_ID}`} links={LANDING_ONLY_NAV_LINKS} />;

  return <SiteNav homeHref={`#${TOP_SECTION_ID}`} links={NAV_LINKS} cta={REGISTER_CTA} />;
}

interface LandingEventProps {
  settings: EventSettings;
  gamesCount: number;
  marketplace?: ReactNode;
  isLandingOnly: boolean;
}

// What happens at the event: the acts and, once they are announced, the special guests.
function LandingEvent({ settings, gamesCount, marketplace, isLandingOnly }: Readonly<LandingEventProps>) {
  return (
    <>
      <EventActs
        gamesCount={gamesCount}
        raffle={raffleLabels(settings)}
        kof={kofLabels(settings)}
        marketplace={marketplace}
        isLandingOnly={isLandingOnly}
      />
      {isLandingOnly ? null : <SpecialGuests guests={SPECIAL_GUESTS} />}
    </>
  );
}

/**
 * The Marketplace card of RF-05 and RF-06, ready to plug back into the landing as `marketplace={<MarketplaceSlot .../>}`
 * once the form URL is defined. It is not part of the page now because it reads the clock of the server, which makes
 * the whole landing dynamic (no-store) and keeps it from being stored for offline use (RNF-14).
 */
export function MarketplaceSlot({ settings }: Readonly<{ settings: EventSettings }>) {
  return (
    <Suspense fallback={null}>
      <MarketplaceRegistration settings={settings} />
    </Suspense>
  );
}

async function MarketplaceRegistration({ settings }: Readonly<{ settings: EventSettings }>) {
  const registration = await getCurrentMarketplaceRegistration({
    formUrl: settings.marketplaceFormUrl,
    closesAt: settings.marketplaceClosesAt,
  });

  return <MarketplaceCard registration={registration} />;
}

function raffleLabels(settings: EventSettings) {
  return {
    startsAtLabel: formatTimeOfDay(settings.raffleStartsAt),
    cutoffLabel: formatTimeOfDay(settings.checkInCutoffAt),
  };
}

function kofLabels(settings: EventSettings) {
  return {
    checkInLabel: formatTimeRange(settings.kofCheckInStartsAt, settings.kofCheckInEndsAt),
    onsiteSignupLabel: formatTimeRange(settings.kofOnsiteSignupStartsAt, settings.kofOnsiteSignupEndsAt),
  };
}

function formatTimeRange(startsAt: string, endsAt: string) {
  return LANDING_COPY.acts.timeRange(formatTimeOfDay(startsAt), formatTimeOfDay(endsAt));
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
