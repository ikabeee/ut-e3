import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { EventSettings } from "@features/event-settings/lib/types";
import { INITIAL_EVENT_SETTINGS } from "@features/event-settings/lib/server/event-settings-seed";

export const EVENT_SETTINGS_CACHE_TAG = "event-settings";

export async function getEventSettings(): Promise<EventSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(EVENT_SETTINGS_CACHE_TAG);

  return INITIAL_EVENT_SETTINGS;
}
