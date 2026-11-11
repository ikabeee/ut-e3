import "server-only";
import type { EventSettings } from "@features/event-settings/lib/types";
import type { PrismaClient } from "@generated/prisma/client";

export const EVENT_SETTINGS_ID = 1;

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

// The salt of the PIN filter of the kiosk (RNF-19). It is fixed so the e2e flows can compute a PIN that passes the
// filter without being anybody's; it is not a secret, because every kiosk downloads it to check the PINs offline.
export const INITIAL_PIN_FILTER_SALT = "ut-e3-pixel-and-code-2026";

// Creates row 1 only when it is missing, so a setting edited later survives a new seed. Prisma takes the ISO strings
// as DateTime values, and the fraud thresholds come from the column defaults.
export async function seedEventSettings(prisma: PrismaClient): Promise<void> {
  await prisma.eventSettings.upsert({
    where: { id: EVENT_SETTINGS_ID },
    update: {},
    create: { id: EVENT_SETTINGS_ID, ...INITIAL_EVENT_SETTINGS, pinFilterSalt: INITIAL_PIN_FILTER_SALT },
  });
}
