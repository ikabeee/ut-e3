import { GAMES_PATH } from "@features/games/lib/games-links";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { HOME_PATH } from "@features/landing/lib/landing-links";

// The navbar of the pages outside the landing.
export const HOME_NAV_LINKS = [
  { href: HOME_PATH, label: LANDING_COPY.nav.links.home },
  { href: GAMES_PATH, label: LANDING_COPY.nav.links.games },
];
