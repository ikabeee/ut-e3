import type { RaffleAdminSnapshot, RaffleLiveSnapshot } from "@features/raffle/lib/types";

/** Answers can arrive out of order: a lower revision is older, and the same revision keeps the latest clock. */
export function pickNewerSnapshot<T extends { revision: number; serverNow: number }>(current: T, incoming: T): T {
  if (incoming.revision !== current.revision) return incoming.revision > current.revision ? incoming : current;

  return incoming.serverNow >= current.serverNow ? incoming : current;
}

export function isLiveSnapshot(value: unknown): value is RaffleLiveSnapshot {
  return hasSnapshotBase(value) && "latest" in value && "winners" in value && Array.isArray(value.winners);
}

export function isAdminSnapshot(value: unknown): value is RaffleAdminSnapshot {
  return (
    hasSnapshotBase(value) &&
    "pending" in value &&
    "activeTickets" in value &&
    typeof value.activeTickets === "number" &&
    "winners" in value &&
    Array.isArray(value.winners)
  );
}

function hasSnapshotBase(value: unknown): value is { phase: string; revision: number; serverNow: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "phase" in value &&
    typeof value.phase === "string" &&
    "revision" in value &&
    typeof value.revision === "number" &&
    "serverNow" in value &&
    typeof value.serverNow === "number"
  );
}
