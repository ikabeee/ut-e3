import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { ScheduleItem } from "@features/schedule/lib/types";
import { sortScheduleItems } from "@features/schedule/lib/schedule-order";
import type { Prisma } from "@generated/prisma/client";
import { getPrisma } from "@shared/lib/server/prisma";

export const SCHEDULE_CACHE_TAG = "schedule";

type ScheduleItemRow = Prisma.ScheduleItemGetPayload<{ select: typeof SCHEDULE_ITEM_FIELDS }>;

const SCHEDULE_ITEM_FIELDS = {
  id: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
  zone: true,
} satisfies Prisma.ScheduleItemSelect;

export async function getScheduleItems(): Promise<ScheduleItem[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(SCHEDULE_CACHE_TAG);

  // sortScheduleItems keeps the order of items that start together, so the database breaks those ties by end.
  const items = await getPrisma().scheduleItem.findMany({
    select: SCHEDULE_ITEM_FIELDS,
    orderBy: [{ startsAt: "asc" }, { endsAt: "asc" }],
  });

  return sortScheduleItems(items.map(toScheduleItem));
}

function toScheduleItem(item: ScheduleItemRow): ScheduleItem {
  return { ...item, startsAt: item.startsAt.toISOString(), endsAt: item.endsAt.toISOString() };
}
