import { isAdminSnapshot, isLiveSnapshot } from "@features/raffle/lib/raffle-snapshot";
import type { RaffleAdminSnapshot, RaffleLiveSnapshot } from "@features/raffle/lib/types";
import { fetchJson } from "@shared/lib/fetch-json";

/** Public: the drum on stage and the section of winners. */
export const RAFFLE_LIVE_API_PATH = "/api/raffle/live";

/** Only for the raffle administrators. */
export const RAFFLE_ADMIN_API_PATH = "/api/raffle";

/** Asks for the public state of the raffle; the answer is never taken from the browser cache. */
export function fetchLiveSnapshot(): Promise<RaffleLiveSnapshot> {
  return fetchJson(RAFFLE_LIVE_API_PATH, isLiveSnapshot);
}

export function fetchAdminSnapshot(): Promise<RaffleAdminSnapshot> {
  return fetchJson(RAFFLE_ADMIN_API_PATH, isAdminSnapshot);
}
