import { FLOOR_PLAN_COPY } from "@features/floor-plan/lib/floor-plan-copy";
import { STAND_MARKERS, ZONE_MARKERS } from "@features/floor-plan/lib/map-layout";
import type { FloorPlanStand, StandZone, ZoneId } from "@features/floor-plan/lib/types";

export type MapItemKind = "stand" | "activity" | "service";

export interface MapItem {
  id: string;
  kind: MapItemKind;
  label: string;
  kicker: string;
  title: string;
  description: string;
  code: string;
  gameName: string | null;
  slug: string | null;
  coverSrc: string | null;
  coverAlt: string;
  shortName: string;
  blockLabel: string | null;
  standNumber: number | null;
  blockSize: number;
  x: number;
  y: number;
}

const ZONE_KINDS: Record<ZoneId, MapItemKind> = {
  stage: "activity",
  kof: "activity",
  "mario-kart": "activity",
  restrooms: "service",
  marketplace: "service",
  "help-center-1": "service",
  "help-center-2": "service",
  "help-center-3": "service",
  "help-center-4": "service",
};

/** Every marker of the map in plan order: the 18 stand cells first, then the 9 zones. */
export function buildMapItems(stands: readonly FloorPlanStand[]): MapItem[] {
  const standsByCode = new Map(stands.map((stand) => [stand.code, stand]));
  const standItems = STAND_MARKERS.map((marker) => buildStandItem(marker.code, standsByCode.get(marker.code)));
  const zoneItems = ZONE_MARKERS.map((marker) => buildZoneItem(marker.id));

  return [...standItems, ...zoneItems];
}

export type MapFilter = "all" | MapItemKind;

/** The visible markers of one filter chip: every item for "all", only its kind otherwise. */
export function filterMapItems(items: readonly MapItem[], filter: MapFilter): MapItem[] {
  if (filter === "all") return [...items];

  return items.filter((item) => item.kind === filter);
}

/** How many blocks the stands belong to: T, C, A, D and B. */
export function countBlocks(): number {
  return new Set(STAND_MARKERS.map((marker) => marker.code.charAt(1))).size;
}

/** How many zones are activities: the stage, the KOF arena and Mario Kart. */
export function countActivities(): number {
  // SAFETY: every zone marker id is a key of the zone copy and its kinds.
  return ZONE_MARKERS.filter((marker) => ZONE_KINDS[marker.id as ZoneId] === "activity").length;
}

function buildStandItem(code: string, stand: FloorPlanStand | undefined): MapItem {
  const marker = STAND_MARKERS.find((candidate) => candidate.code === code);

  const placement = {
    parsed: parseStandCode(code),
    position: { x: marker?.x ?? 0, y: marker?.y ?? 0 },
  };

  if (!stand) return emptyStandItem(code, placement);

  return gameStandItem(code, stand, placement);
}

interface StandPlacement {
  parsed: ParsedStandCode;
  position: { x: number; y: number };
}

function emptyStandItem(code: string, placement: StandPlacement): MapItem {
  return {
    id: code,
    kind: "stand",
    label: FLOOR_PLAN_COPY.drawing.standLabel(code),
    kicker: FLOOR_PLAN_COPY.unassignedKicker(code),
    title: FLOOR_PLAN_COPY.unassignedTitle,
    description: FLOOR_PLAN_COPY.unassignedDescription,
    code,
    gameName: null,
    slug: null,
    coverSrc: null,
    coverAlt: "",
    shortName: code,
    blockLabel: placement.parsed.blockLabel,
    standNumber: placement.parsed.number,
    blockSize: placement.parsed.blockSize,
    x: placement.position.x,
    y: placement.position.y,
  };
}

function gameStandItem(code: string, stand: FloorPlanStand, placement: StandPlacement): MapItem {
  return {
    id: code,
    kind: "stand",
    label: FLOOR_PLAN_COPY.drawing.standLabel(code, stand.name),
    kicker: FLOOR_PLAN_COPY.standKicker(code, stand.genre),
    title: stand.name,
    description: stand.synopsis,
    code,
    gameName: stand.name,
    slug: stand.slug,
    coverSrc: stand.coverSrc,
    coverAlt: stand.coverAlt,
    shortName: code,
    blockLabel: placement.parsed.blockLabel,
    standNumber: placement.parsed.number,
    blockSize: placement.parsed.blockSize,
    x: placement.position.x,
    y: placement.position.y,
  };
}

function buildZoneItem(id: string): MapItem {
  // SAFETY: every zone marker id comes from ZONE_MARKERS, whose ids are the keys of the zone copy.
  const zone = FLOOR_PLAN_COPY.zones[id as ZoneId];
  const marker = ZONE_MARKERS.find((candidate) => candidate.id === id);

  return {
    id,
    // SAFETY: same zone id as above, a key of the zone copy and its kinds.
    kind: ZONE_KINDS[id as ZoneId],
    label: zone.title,
    kicker: zone.kind,
    title: zone.title,
    description: zone.description,
    code: "",
    gameName: null,
    slug: null,
    coverSrc: null,
    coverAlt: "",
    // SAFETY: same zone id as above, a key of the drawing labels.
    shortName: FLOOR_PLAN_COPY.drawing.zoneLabels[id as ZoneId],
    blockLabel: null,
    standNumber: null,
    blockSize: 0,
    x: marker?.x ?? 0,
    y: marker?.y ?? 0,
  };
}

interface ParsedStandCode {
  blockLabel: string | null;
  number: number | null;
  blockSize: number;
}

function parseStandCode(code: string): ParsedStandCode {
  // SAFETY: every stand code comes from formatStandCode as `Z<zone>-S<number>`, so the second char is its zone.
  const zone = code.charAt(1) as StandZone;
  const number = Number.parseInt(code.slice(code.indexOf("-S") + 2), 10);
  const blockLabel = FLOOR_PLAN_COPY.drawing.blockLabels[zone] ?? null;
  const blockSize = STAND_MARKERS.filter((marker) => marker.code.charAt(1) === code.charAt(1)).length;

  return {
    blockLabel,
    number: Number.isInteger(number) ? number : null,
    blockSize,
  };
}
