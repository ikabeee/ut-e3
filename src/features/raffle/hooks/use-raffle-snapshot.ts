"use client";

import { fetchAdminSnapshot, fetchLiveSnapshot } from "@features/raffle/api/raffle-api-client";
import { pickNewerSnapshot } from "@features/raffle/lib/raffle-snapshot";
import type { RaffleAdminSnapshot, RaffleLiveSnapshot } from "@features/raffle/lib/types";
import { usePolledValue, type PolledValue } from "@shared/hooks/use-polled-value";

/** The drum asks every 2 seconds: a spin reaches the stage in about that time, as the bracket does (RF-49). */
export const RAFFLE_POLL_INTERVAL_MS = 2000;

export type LiveSnapshotLoader = () => Promise<RaffleLiveSnapshot>;

export type AdminSnapshotLoader = () => Promise<RaffleAdminSnapshot>;

/** Follows the public state of the raffle, starting from what the server rendered. */
export function useLiveRaffle(
  initial: RaffleLiveSnapshot,
  load: LiveSnapshotLoader = fetchLiveSnapshot,
): PolledValue<RaffleLiveSnapshot> {
  return usePolledValue(initial, { load, merge: pickNewerSnapshot, intervalMs: RAFFLE_POLL_INTERVAL_MS });
}

/** Follows the panel, so a spin of another administrator blocks this one too (RF-50). */
export function useAdminRaffle(
  initial: RaffleAdminSnapshot,
  load: AdminSnapshotLoader = fetchAdminSnapshot,
): PolledValue<RaffleAdminSnapshot> {
  return usePolledValue(initial, { load, merge: pickNewerSnapshot, intervalMs: RAFFLE_POLL_INTERVAL_MS });
}
