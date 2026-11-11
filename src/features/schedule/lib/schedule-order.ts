import type { ScheduleItem } from "@features/schedule/lib/types";

export function sortScheduleItems(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort(compareByStart);
}

function compareByStart(first: ScheduleItem, second: ScheduleItem): number {
  return Date.parse(first.startsAt) - Date.parse(second.startsAt);
}
