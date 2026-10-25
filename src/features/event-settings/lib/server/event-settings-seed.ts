import "server-only";
import type { EventSettings } from "@features/event-settings/lib/types";

export const INITIAL_EVENT_SETTINGS: EventSettings = {
  eventStartsAt: "2026-11-20T17:00:00.000Z",
  eventEndsAt: "2026-11-20T23:30:00.000Z",
  registrationOpensAt: "2026-11-13T05:00:00.000Z",
  kofRegistrationOpensAt: "2026-11-13T05:00:00.000Z",
  kofCheckInStartsAt: "2026-11-20T17:00:00.000Z",
  kofCheckInEndsAt: "2026-11-20T17:45:00.000Z",
  kofOnsiteSignupStartsAt: "2026-11-20T17:00:00.000Z",
  kofOnsiteSignupEndsAt: "2026-11-20T17:45:00.000Z",
  kofBracketGeneratesAt: "2026-11-20T17:55:00.000Z",
  marketplaceClosesAt: "2026-11-11T04:59:00.000Z",
  marketplaceFormUrl: null,
  itchOpensAt: "2026-11-20T21:30:00.000Z",
  checkInCutoffAt: "2026-11-20T21:50:00.000Z",
  raffleStartsAt: "2026-11-20T23:00:00.000Z",
  publicBracketEnabled: true,
};
