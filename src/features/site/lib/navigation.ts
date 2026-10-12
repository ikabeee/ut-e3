import { FLOOR_PLAN_PATH } from "@features/floor-plan/lib/floor-plan-links";
import { GAMES_PATH } from "@features/games/lib/game-links";
import { HOME_PATH } from "@features/home/lib/home-links";
import { SITE_COPY } from "@features/site/lib/site-copy";
import { PASSPORT_PATH } from "@features/visitors/lib/visitors-links";

export interface NavLink {
  href: string;
  label: string;
  /** Prefijo de ruta que marca el enlace como página actual. */
  activePrefix?: string;
}

/**
 * Secciones internas del sitio. Cada feature declara su ruta en su `lib/*-links.ts`; aquí sólo
 * se componen. También son los accesos directos de la app instalada (`manifest.ts`).
 */
export const SECTION_LINKS: readonly NavLink[] = [
  { href: GAMES_PATH, label: SITE_COPY.navigation.games, activePrefix: GAMES_PATH },
  { href: FLOOR_PLAN_PATH, label: SITE_COPY.navigation.floorPlan, activePrefix: FLOOR_PLAN_PATH },
  { href: PASSPORT_PATH, label: SITE_COPY.navigation.passport, activePrefix: PASSPORT_PATH },
];

/** Navegación principal. "Inicio" no se resalta: en el diseño sólo se marcan las secciones internas. */
export const NAV_LINKS: readonly NavLink[] = [{ href: HOME_PATH, label: SITE_COPY.navigation.home }, ...SECTION_LINKS];

export function isNavLinkActive(link: NavLink, pathname: string) {
  return link.activePrefix !== undefined && pathname.startsWith(link.activePrefix);
}
