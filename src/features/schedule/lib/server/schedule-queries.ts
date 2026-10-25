import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { ScheduleItem } from "@features/schedule/lib/types";
import { sortScheduleItems } from "@features/schedule/lib/schedule-order";
import { INITIAL_SCHEDULE_ITEMS } from "@features/schedule/lib/server/schedule-seed";

export const SCHEDULE_CACHE_TAG = "schedule";

export async function getScheduleItems(): Promise<ScheduleItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(SCHEDULE_CACHE_TAG);

  return sortScheduleItems(INITIAL_SCHEDULE_ITEMS);
}
