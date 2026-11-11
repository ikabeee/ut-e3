import type { PendingDraw, RaffleAdminSnapshot, RaffleLiveSnapshot } from "@features/raffle/lib/types";

export const STARTS_AT = "2026-11-20T23:00:00.000Z";

export const DRAW_ID = "8f1c2a4e-5b6d-4e7f-8a9b-0c1d2e3f4a5b";

export function createPendingDraw(overrides: Partial<PendingDraw> = {}): PendingDraw {
  return {
    id: DRAW_ID,
    ticketNumber: 12,
    gamertag: "Neo",
    drawnAt: "2026-11-20T23:05:00.000Z",
    drawnById: "admin-1",
    drawnByName: "Animador Uno",
    ...overrides,
  };
}

export function createAdminSnapshot(overrides: Partial<RaffleAdminSnapshot> = {}): RaffleAdminSnapshot {
  return {
    phase: "open",
    startsAt: STARTS_AT,
    closedAt: null,
    activeTickets: 40,
    pending: null,
    winners: [],
    discardedCount: 0,
    revision: 0,
    serverNow: 0,
    ...overrides,
  };
}

export function createLiveSnapshot(overrides: Partial<RaffleLiveSnapshot> = {}): RaffleLiveSnapshot {
  return { phase: "open", startsAt: STARTS_AT, latest: null, winners: [], revision: 0, serverNow: 0, ...overrides };
}
