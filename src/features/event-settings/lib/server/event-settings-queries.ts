import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { EVENT_SETTINGS_ID } from "@features/event-settings/lib/server/event-settings-seed";
import type { EventSettings } from "@features/event-settings/lib/types";
import type { Prisma } from "@generated/prisma/client";
import { getPrisma } from "@shared/lib/server/prisma";

export const EVENT_SETTINGS_CACHE_TAG = "event-settings";

const MISSING_ROW_MESSAGE =
  "Falta la fila de event_settings (id 1) en la base de datos. Corre `npm run db:seed` para cargar los horarios iniciales.";

type EventSettingsRow = Prisma.EventSettingsGetPayload<{ select: typeof EVENT_SETTINGS_FIELDS }>;

const EVENT_SETTINGS_FIELDS = {
  eventStartsAt: true,
  eventEndsAt: true,
  registrationOpensAt: true,
  kofRegistrationOpensAt: true,
  kofCheckInStartsAt: true,
  kofCheckInEndsAt: true,
  kofOnsiteSignupStartsAt: true,
  kofOnsiteSignupEndsAt: true,
  kofBracketGeneratesAt: true,
  marketplaceClosesAt: true,
  marketplaceFormUrl: true,
  itchOpensAt: true,
  checkInCutoffAt: true,
  raffleStartsAt: true,
  publicBracketEnabled: true,
} satisfies Prisma.EventSettingsSelect;

export async function getEventSettings(): Promise<EventSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(EVENT_SETTINGS_CACHE_TAG);

  const settings = await getPrisma().eventSettings.findUnique({
    where: { id: EVENT_SETTINGS_ID },
    select: EVENT_SETTINGS_FIELDS,
  });

  if (!settings) throw new Error(MISSING_ROW_MESSAGE);

  return toEventSettings(settings);
}

function toEventSettings(row: EventSettingsRow): EventSettings {
  return {
    eventStartsAt: row.eventStartsAt.toISOString(),
    eventEndsAt: row.eventEndsAt.toISOString(),
    registrationOpensAt: row.registrationOpensAt.toISOString(),
    kofRegistrationOpensAt: row.kofRegistrationOpensAt.toISOString(),
    kofCheckInStartsAt: row.kofCheckInStartsAt.toISOString(),
    kofCheckInEndsAt: row.kofCheckInEndsAt.toISOString(),
    kofOnsiteSignupStartsAt: row.kofOnsiteSignupStartsAt.toISOString(),
    kofOnsiteSignupEndsAt: row.kofOnsiteSignupEndsAt.toISOString(),
    kofBracketGeneratesAt: row.kofBracketGeneratesAt.toISOString(),
    marketplaceClosesAt: row.marketplaceClosesAt.toISOString(),
    marketplaceFormUrl: row.marketplaceFormUrl,
    itchOpensAt: row.itchOpensAt.toISOString(),
    checkInCutoffAt: row.checkInCutoffAt.toISOString(),
    raffleStartsAt: row.raffleStartsAt.toISOString(),
    publicBracketEnabled: row.publicBracketEnabled,
  };
}
