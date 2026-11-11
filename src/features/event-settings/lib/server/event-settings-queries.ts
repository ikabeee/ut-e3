import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  EDITABLE_INSTANT_FIELDS,
  type EditableEventSettings,
  type InstantField,
} from "@features/event-settings/lib/event-settings-input";
import { EVENT_SETTINGS_ID } from "@features/event-settings/lib/server/event-settings-seed";
import type { EventSettings } from "@features/event-settings/lib/types";
import type { EventSettings as EventSettingsFullRow, Prisma } from "@generated/prisma/client";
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

/**
 * What the form of the panel shows: the row as it is right now, with the fraud thresholds. Not cached, because the
 * sysadmin must see the value that the last save left (RF-43).
 */
export async function getEditableEventSettings(): Promise<EditableEventSettings> {
  const row = await getPrisma().eventSettings.findUnique({ where: { id: EVENT_SETTINGS_ID } });

  if (!row) throw new Error(MISSING_ROW_MESSAGE);

  return toEditableSettings(row);
}

export function toEditableSettings(row: EventSettingsFullRow): EditableEventSettings {
  // SAFETY: the entries are built from EDITABLE_INSTANT_FIELDS, one per field, so the record has every key.
  const instants = Object.fromEntries(
    EDITABLE_INSTANT_FIELDS.map((field) => [field, row[field].toISOString()]),
  ) as Record<InstantField, string>;

  return {
    ...instants,
    marketplaceFormUrl: row.marketplaceFormUrl,
    fraudTopScoreCount: row.fraudTopScoreCount,
    fraudWindowMinutes: row.fraudWindowMinutes,
    fraudSingleVisitMax: row.fraudSingleVisitMax,
  };
}
