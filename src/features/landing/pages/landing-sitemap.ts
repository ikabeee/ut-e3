import { FLOOR_PLAN_PATH, FLOOR_PLAN_SECTION_ID } from "@features/floor-plan/lib/floor-plan-links";
import { GAMES_PATH, GAMES_SECTION_ID } from "@features/games/lib/games-links";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { EVENT_SECTION_ID, GUESTS_SECTION_ID, HOME_PATH, VENUE_SECTION_ID } from "@features/landing/lib/landing-links";
import type { FooterLink, FooterLinkGroup } from "@features/landing/lib/types";
import { RAFFLE_WINNERS_PATH } from "@features/raffle/lib/raffle-links";
import { SCHEDULE_SECTION_ID } from "@features/schedule/lib/schedule-links";
import { SPONSORS_PATH, SPONSORS_SECTION_ID } from "@features/sponsors/lib/sponsors-links";
import { PUBLIC_BRACKET_PATH } from "@features/tournament/lib/tournament-links";
import { PASSPORT_PATH } from "@features/visitors/lib/visitors-links";

const { groups, links: LABELS } = LANDING_COPY.footer.sitemap;

/**
 * The site map of the footer: the sections of the landing, and the public pages. While only the
 * landing is published (SITE_MODE=landing) it holds just the sections that exist there, as anchors of the same page:
 * every other path is redirected to the landing by the kill switch.
 */
export function buildFooterSitemap(isLandingOnly: boolean): FooterLinkGroup[] {
  const event = { id: "event", label: groups.event, links: getSectionLinks(isLandingOnly) };

  if (isLandingOnly) {
    return [event];
  }

  return [event, { id: "pages", label: groups.pages, links: PAGE_LINKS }];
}

// The special guests are not announced while only the landing is published, so their section is not there.
const SECTIONS = [
  { id: GAMES_SECTION_ID, label: LABELS.games },
  { id: EVENT_SECTION_ID, label: LABELS.activities },
  { id: GUESTS_SECTION_ID, label: LABELS.guests, isHiddenInLandingOnly: true },
  { id: SPONSORS_SECTION_ID, label: LABELS.sponsors },
  { id: SCHEDULE_SECTION_ID, label: LABELS.schedule },
  { id: FLOOR_PLAN_SECTION_ID, label: LABELS.floorPlan },
  { id: VENUE_SECTION_ID, label: LABELS.venue },
];

const PAGE_LINKS: FooterLink[] = [
  { href: GAMES_PATH, label: LABELS.gamesCatalog },
  { href: FLOOR_PLAN_PATH, label: LABELS.floorPlanPage },
  { href: SPONSORS_PATH, label: LABELS.sponsors },
  { href: RAFFLE_WINNERS_PATH, label: LABELS.raffle },
  { href: PUBLIC_BRACKET_PATH, label: LABELS.tournament },
  { href: PASSPORT_PATH, label: LABELS.passport },
];

function getSectionLinks(isLandingOnly: boolean): FooterLink[] {
  return SECTIONS.flatMap((section) =>
    isLandingOnly && section.isHiddenInLandingOnly
      ? []
      : [{ href: toSectionHref(section.id, isLandingOnly), label: section.label }],
  );
}

function toSectionHref(sectionId: string, isLandingOnly: boolean): string {
  return isLandingOnly ? `#${sectionId}` : `${HOME_PATH}#${sectionId}`;
}
