import { FLOOR_PLAN_PATH } from "@features/floor-plan/lib/floor-plan-links";
import { GAMES_PATH } from "@features/games/lib/game-links";
import { HOME_PATH } from "@features/landing/lib/landing-links";
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

/** Anclas de la portada que usa la variante clara de la navegación. */
export const LANDING_DYNAMICS_HREF = `${HOME_PATH}#dynamics`;
export const LANDING_PROGRAM_HREF = `${HOME_PATH}#program`;

/** Navegación de la variante clara en la portada (Figma: INICIO, JUEGOS, DINÁMICAS, PROGRAMA, CROQUIS). */
export const LANDING_NAV_LINKS: readonly NavLink[] = [
  { href: HOME_PATH, label: SITE_COPY.navigation.home },
  { href: GAMES_PATH, label: SITE_COPY.navigation.games },
  { href: LANDING_DYNAMICS_HREF, label: SITE_COPY.navigation.dynamics },
  { href: LANDING_PROGRAM_HREF, label: SITE_COPY.navigation.program },
  { href: FLOOR_PLAN_PATH, label: SITE_COPY.navigation.floorPlan },
];

/** Enlaces según la ruta: la portada usa la variante clara; el resto, la navegación de siempre. */
export function getNavLinks(pathname: string): readonly NavLink[] {
  return pathname === HOME_PATH ? LANDING_NAV_LINKS : NAV_LINKS;
}

export function isNavLinkActive(link: NavLink, pathname: string) {
  return link.activePrefix !== undefined && pathname.startsWith(link.activePrefix);
}
