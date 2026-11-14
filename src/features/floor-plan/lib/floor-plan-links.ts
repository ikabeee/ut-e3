import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";

export const FLOOR_PLAN_SECTION_ID = "floor-plan";

export const FLOOR_PLAN_PATH = "/floor-plan";

const ITEM_HASH_PREFIX = `#${FLOOR_PLAN_SECTION_ID}-`;

export function getZoneLink(zoneId: string) {
  const zone = Object.entries(FLOOR_PLAN_COPY.zones).find(([id]) => id === zoneId)?.[1];

  return zone ? { href: floorPlanItemHref(zoneId), label: zone.title } : null;
}

export function floorPlanItemHref(itemId: string) {
  return `${ITEM_HASH_PREFIX}${itemId}`;
}

export function getFloorPlanItemPath(itemId: string) {
  return `${FLOOR_PLAN_PATH}${floorPlanItemHref(itemId)}`;
}

export function getItemIdFromHash(hash: string) {
  return hash.startsWith(ITEM_HASH_PREFIX) ? hash.slice(ITEM_HASH_PREFIX.length) : null;
}
