import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { HOME_PATH } from "@features/landing/lib/landing-links";

// The navbar of the pages outside the landing: only "Inicio" until the games catalog gets its own page (S6).
export const HOME_NAV_LINKS = [{ href: HOME_PATH, label: LANDING_COPY.nav.links.home }];
