import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { getStandCells, PLAN_LAYOUTS } from "@features/floor-plan/lib/plan-layouts";
import {
  ZONE_IDS,
  type FloorPlanStand,
  type PlanCategory,
  type PlanItem,
  type StandCell,
  type ZoneId,
} from "@features/floor-plan/lib/types";

const ZONE_CATEGORIES: Record<ZoneId, PlanCategory> = {
  stage: "act",
  kof: "act",
  "mario-kart": "act",
  restrooms: "srv",
  "rear-marketplace": "srv",
  marketplace: "srv",
  cafeteria: "srv",
  "help-center-1": "info",
  "help-center-2": "info",
  "help-center-3": "info",
  "help-center-4": "info",
};

export function buildPlanItems(stands: readonly FloorPlanStand[]): PlanItem[] {
  const standsByCode = new Map(stands.map((stand) => [stand.code, stand]));
  const cells = PLAN_LAYOUTS.wide.standBlocks.flatMap(getStandCells);
  const standItems = cells.map((cell) => buildTeamItem(cell, standsByCode.get(cell.code)));

  return [...standItems, ...ZONE_IDS.map(buildZoneItem)];
}

export function splitStandName(name: string): [string, string] {
  const words = name.toUpperCase().split(" ");
  const half = Math.ceil(words.length / 2);

  return [words.slice(0, half).join(" "), words.slice(half).join(" ")];
}

function buildTeamItem({ code }: StandCell, stand: FloorPlanStand | undefined): PlanItem {
  if (!stand) {
    return {
      id: code,
      category: "team",
      label: FLOOR_PLAN_COPY.drawing.standLabel(code),
      kicker: FLOOR_PLAN_COPY.unassignedKicker(code),
      title: FLOOR_PLAN_COPY.unassignedTitle,
      description: FLOOR_PLAN_COPY.unassignedDescription,
      code,
      drawingName: "",
      cover: null,
    };
  }

  return {
    id: code,
    category: "team",
    label: FLOOR_PLAN_COPY.drawing.standLabel(code, stand.name),
    kicker: FLOOR_PLAN_COPY.standKicker(code, stand.genre),
    title: stand.name,
    description: stand.synopsis,
    code,
    drawingName: stand.name,
    cover: { src: stand.coverSrc, alt: stand.coverAlt },
  };
}

function buildZoneItem(id: ZoneId): PlanItem {
  const zone = FLOOR_PLAN_COPY.zones[id];

  return {
    id,
    category: ZONE_CATEGORIES[id],
    label: zone.title,
    kicker: zone.kind,
    title: zone.title,
    description: zone.description,
    code: "",
    drawingName: FLOOR_PLAN_COPY.drawing.zoneLabels[id],
    cover: null,
  };
}
