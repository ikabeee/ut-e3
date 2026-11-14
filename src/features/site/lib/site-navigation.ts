import { LOGIN_PATH, ACTIVATE_PATH } from "@features/accounts/lib/accounts-links";
import { FLOOR_PLAN_PATH, FLOOR_PLAN_SECTION_ID } from "@features/floor-plan/lib/floor-plan-links";
import { GAMES_PATH, GAMES_SECTION_ID } from "@features/games/lib/games-links";
import { HOME_PATH, TOP_SECTION_ID } from "@features/landing/lib/landing-links";
import { RAFFLE_LIVE_PATH, RAFFLE_WINNERS_PATH } from "@features/raffle/lib/raffle-links";
import { SITE_COPY } from "@features/site/lib/site-copy";
import { STAFF_AREAS } from "@features/site/lib/staff-areas";
import { SPONSORS_PATH, SPONSORS_SECTION_ID } from "@features/sponsors/lib/sponsors-links";
import { PUBLIC_BRACKET_PATH } from "@features/tournament/lib/tournament-links";
import { PASSPORT_PATH } from "@features/visitors/lib/visitors-links";

export interface SiteNavLink {
  href: string;
  label: string;
}

export interface SiteNavigation {
  homeHref: string;
  links: SiteNavLink[];
  /** The highlighted link at the end of the bar. */
  cta?: SiteNavLink;
}

const { links: LABELS } = SITE_COPY.nav;

// The staff areas, their login and activation, and the screen projected on stage.
const HIDDEN_AREAS = [...STAFF_AREAS, LOGIN_PATH, ACTIVATE_PATH, RAFFLE_LIVE_PATH];

// `/passport` opens the registration when the phone has no passport yet, so one entry serves both.
const FULL_NAVIGATION: SiteNavigation = {
  homeHref: HOME_PATH,
  links: [
    { href: HOME_PATH, label: LABELS.home },
    { href: GAMES_PATH, label: LABELS.games },
    { href: FLOOR_PLAN_PATH, label: LABELS.floorPlan },
    { href: SPONSORS_PATH, label: LABELS.sponsors },
    { href: RAFFLE_WINNERS_PATH, label: LABELS.raffle },
    { href: PUBLIC_BRACKET_PATH, label: LABELS.tournament },
  ],
  cta: { href: PASSPORT_PATH, label: SITE_COPY.nav.passport },
};

// While only the landing is published (SITE_MODE=landing), every entry stays on the landing, so the three entries fit
// a 360 px phone without a menu.
const LANDING_ONLY_NAVIGATION: SiteNavigation = {
  homeHref: landingAnchor(TOP_SECTION_ID),
  links: [
    { href: landingAnchor(GAMES_SECTION_ID), label: LABELS.games },
    { href: landingAnchor(SPONSORS_SECTION_ID), label: LABELS.sponsors },
    { href: landingAnchor(FLOOR_PLAN_SECTION_ID), label: LABELS.floorPlan },
  ],
};

/** Whether the public navbar goes on this page: staff and projection screens have their own frame. */
export function isSiteNavShown(pathname: string): boolean {
  return !HIDDEN_AREAS.some((area) => isInside(pathname, area));
}

export function getSiteNavigation(isLandingOnly: boolean): SiteNavigation {
  return isLandingOnly ? LANDING_ONLY_NAVIGATION : FULL_NAVIGATION;
}

/** The entry of the page being shown: the one of the same path or of a parent path. Anchors are never current. */
export function getCurrentNavHref(pathname: string, hrefs: string[]): string | undefined {
  return hrefs.find((href) => !href.includes("#") && isCurrent(pathname, href));
}

function isCurrent(pathname: string, href: string): boolean {
  return href === HOME_PATH ? pathname === HOME_PATH : isInside(pathname, href);
}

function isInside(pathname: string, area: string): boolean {
  return pathname === area || pathname.startsWith(`${area}/`);
}

function landingAnchor(sectionId: string): string {
  return `${HOME_PATH}#${sectionId}`;
}
