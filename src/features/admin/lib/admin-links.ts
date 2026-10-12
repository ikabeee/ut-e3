/** Ruta del panel de administración (protegida con HTTP Basic en `src/proxy.ts`). */
export const ADMIN_PATH = "/admin";

/** Secciones del panel. */
export type AdminSection = "home" | "teams" | "games" | "catalog" | "raffle";

export const ADMIN_SECTION_PATHS: Record<AdminSection, string> = {
  home: ADMIN_PATH,
  teams: `${ADMIN_PATH}/teams`,
  games: `${ADMIN_PATH}/games`,
  catalog: `${ADMIN_PATH}/catalog`,
  raffle: `${ADMIN_PATH}/raffle`,
};

/** `true` si la ruta es del panel: el service worker y los robots la dejan fuera. */
export function isAdminPath(pathname: string) {
  return pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`);
}
