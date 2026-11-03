import { GAMES_PATH } from "@features/games/lib/games-links";
import { OFFLINE_PATH } from "@features/pwa/lib/pwa-links";
import { PASSPORT_PATH, PRIVACY_PATH, REGISTER_PATH } from "@features/visitors/lib/visitors-links";

// The public flow and the visitor flow. The staff areas (/admin, /stand, /support, /tournament), /login and /activate
// never register the worker.
const REGISTRABLE_EXACT = ["/", "/sponsors", PRIVACY_PATH, REGISTER_PATH, OFFLINE_PATH];

const REGISTRABLE_PREFIXES = [GAMES_PATH, PASSPORT_PATH];

/** Six hours: the public pages change when a stand registers its game, not while the visitor browses. */
export const PRECACHE_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function isRegistrablePath(pathname: string): boolean {
  if (REGISTRABLE_EXACT.includes(pathname)) return true;

  return REGISTRABLE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Whether the phone should ask for the public pages again: never asked, or the last time was long ago. */
export function shouldPrecache({ lastAt, now }: { lastAt: number | null; now: number }): boolean {
  return lastAt === null || now - lastAt >= PRECACHE_INTERVAL_MS || now < lastAt;
}
