import type { Metadata } from "next";
import { getEventSettings } from "@features/event-settings/lib/server/event-settings-queries";
import type { EventSettings } from "@features/event-settings/lib/types";
import { FloorPlan } from "@features/floor-plan/components/floor-plan";
import { getZoneLink } from "@features/floor-plan/lib/floor-plan-links";
import { toFloorPlanStand } from "@features/floor-plan/lib/floor-plan-stands";
import { FeaturedGamesCarousel } from "@features/games/components/featured-games-carousel";
import { getGames } from "@features/games/lib/server/games-queries";
import type { Game } from "@features/games/lib/types";
import { SiteFooter } from "@features/landing/components/site-footer";
import { SiteNav } from "@features/landing/components/site-nav";
import { SpecialGuests } from "@features/landing/components/special-guests";
import { VenueLocation } from "@features/landing/components/venue-location";
import { HOME_NAV_LINKS } from "@features/landing/lib/home-nav-links";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { SPECIAL_GUESTS } from "@features/landing/lib/special-guests";
import { EVENT_VENUE } from "@features/landing/lib/venue";
import { EventSchedule } from "@features/schedule/components/event-schedule";
import { getScheduleItems } from "@features/schedule/lib/server/schedule-queries";
import type { ScheduleItem } from "@features/schedule/lib/types";
import { GamesShowcase } from "@features/showcase/components/games-showcase";
import { ShowcaseClosing } from "@features/showcase/components/showcase-closing";
import { ShowcaseHero } from "@features/showcase/components/showcase-hero";
import { ShowcaseReel } from "@features/showcase/components/showcase-reel";
import { splitEventTitle } from "@features/showcase/lib/event-title";
import { buildMarqueeText } from "@features/showcase/lib/marquee-text";
import { SHOWCASE_COPY } from "@features/showcase/lib/showcase-copy";
import { SHOWCASE_PATH } from "@features/showcase/lib/showcase-links";
import { SponsorTickets } from "@features/sponsors/components/sponsor-tickets";
import { getSponsors } from "@features/sponsors/lib/server/sponsors-queries";
import type { Sponsor } from "@features/sponsors/lib/types";
import { REGISTER_PATH } from "@features/visitors/lib/visitors-links";
import { formatEventDate } from "@shared/lib/date-time";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

const { title } = SHOWCASE_COPY.page;

export const showcasePageMetadata: Metadata = {
  title,
  description: siteConfig.description,
  alternates: { canonical: SHOWCASE_PATH },
  openGraph: buildOpenGraph({
    title: `${title} | ${siteConfig.title}`,
    description: siteConfig.description,
    url: SHOWCASE_PATH,
  }),
};

const REGISTER_CTA = { href: REGISTER_PATH, label: LANDING_COPY.hero.createPassport };

const CLOSING_MARQUEE = buildMarqueeText(LANDING_COPY.closing.firstLine, LANDING_COPY.closing.secondLine);

interface ShowcaseViewProps {
  settings: EventSettings;
  games: Game[];
  scheduleItems: ScheduleItem[];
  sponsors: Sponsor[];
}

export async function ShowcasePage() {
  const [settings, games, scheduleItems, sponsors] = await Promise.all([
    getEventSettings(),
    getGames(),
    getScheduleItems(),
    getSponsors(),
  ]);

  return <ShowcaseView settings={settings} games={games} scheduleItems={scheduleItems} sponsors={sponsors} />;
}

/** /showcase: the event page in the style of a game agency site, with the real data of the event. */
export function ShowcaseView({ settings, games, scheduleItems, sponsors }: Readonly<ShowcaseViewProps>) {
  return (
    <>
      <SiteNav homeHref={HOME_PATH} links={HOME_NAV_LINKS} />
      <ShowcaseHero
        title={splitEventTitle(siteConfig.name)}
        badge={SHOWCASE_COPY.hero.badge(formatEventDate(settings.eventStartsAt, "numeric"), EVENT_VENUE.shortName)}
        description={LANDING_COPY.hero.description(siteConfig.organization.division)}
        cta={REGISTER_CTA}
      />
      <main>
        <ShowcaseReel />
        <GamesShowcase>
          <FeaturedGamesCarousel games={games} />
        </GamesShowcase>
        <SpecialGuests guests={SPECIAL_GUESTS} />
        <EventSchedule
          heading={formatEventDate(settings.eventStartsAt, "2-digit")}
          items={scheduleItems}
          zoneLink={getZoneLink}
        />
        <SponsorTickets sponsors={sponsors} />
        <FloorPlan stands={games.map(toFloorPlanStand)} />
        <VenueLocation venue={EVENT_VENUE} />
      </main>
      <ShowcaseClosing marquee={CLOSING_MARQUEE} links={HOME_NAV_LINKS} />
      <SiteFooter />
    </>
  );
}
