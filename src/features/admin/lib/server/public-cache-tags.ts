import { EVENT_SETTINGS_CACHE_TAG } from "@features/event-settings/lib/server/event-settings-queries";
import { GAMES_CACHE_TAG } from "@features/games/lib/server/games-queries";
import { SCHEDULE_CACHE_TAG } from "@features/schedule/lib/server/schedule-queries";
import { SPONSORS_CACHE_TAG } from "@features/sponsors/lib/server/sponsors-queries";
import { VISITOR_PINS_CACHE_TAG } from "@features/visitors/lib/visitor-cache-tags";

/**
 * Every tag a cached query of the public pages declares with cacheTag(). An arbitrary SQL write and "Invalidar cachés
 * públicas" (/admin/recovery) expire all of them; a test reads src/ and fails when a new cacheTag() is missing here.
 */
export const PUBLIC_CACHE_TAGS = [
  EVENT_SETTINGS_CACHE_TAG,
  GAMES_CACHE_TAG,
  SCHEDULE_CACHE_TAG,
  SPONSORS_CACHE_TAG,
  VISITOR_PINS_CACHE_TAG,
];
