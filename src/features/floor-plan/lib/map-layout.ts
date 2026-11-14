import { formatStandCode } from "@features/games/lib/stand-code";
import type { StandZone } from "@features/floor-plan/lib/types";

export const MAP_WIDTH = 940;

export const MAP_HEIGHT = 600;

export const MAP_WALL = "M10 10 H292 V156 H746 V590 H10 Z M10 156 H292";

export const MAP_BUILDING = "M10 10 H292 V156 H746 V590 H10 Z";

export const MAP_DIVIDER = "M10 156 H292";

export const MAP_EXTERIOR_RECT: readonly [number, number, number, number] = [752, 156, 178, 434];

/** The four dashed activity and service areas inside the building, from the mockup rects. */
export const MAP_ZONE_RECTS: ReadonlyArray<readonly [number, number, number, number]> = [
  [18, 250, 50, 240],
  [78, 300, 50, 140],
  [602, 250, 50, 240],
  [664, 250, 70, 240],
];

/** Wide dark avenues crossing the whole map, slightly diagonal like the mockup. */
export const MAP_AVENUES: ReadonlyArray<readonly [string, number]> = [
  ["M-39 176 L990 89", 18],
  ["M749 -37 L749 629", 11],
  ["M-24 604 L964 600", 14],
  ["M419 -37 L390 176", 8],
];

/** Thin straight streets over the avenues. */
export const MAP_THIN_STREETS: readonly string[] = [
  "M-10 56 L950 11",
  "M-10 107 L950 61",
  "M-10 403 L950 373",
  "M-10 249 L950 277",
  "M147 -24 L116 616",
  "M347 -24 L324 616",
  "M547 -24 L540 616",
  "M661 -24 L676 616",
  "M861 -24 L919 616",
];

/** Dotted streets over the avenues. */
export const MAP_DOTTED_STREETS: readonly string[] = ["M-10 2 L950 -28", "M226 -24 L204 616", "M819 -24 L811 616"];

/** The top-row marker at each block left edge: labels float above this row in screen space. */
export const BLOCK_LABEL_SPOTS: ReadonlyArray<readonly [StandZone, number, number]> = [
  ["T", 63, 58],
  ["C", 178, 211],
  ["A", 412, 211],
  ["D", 178, 479],
  ["B", 412, 479],
];

/** The position of the EXTERIOR label above the marketplace area. */
export const EXTERIOR_LABEL_SPOT: readonly [number, number] = [763, 167];

export interface StandMarker {
  code: string;
  x: number;
  y: number;
}

export interface ZoneMarker {
  id: string;
  x: number;
  y: number;
}

interface StandSpot {
  zone: string;
  number: number;
  x: number;
  y: number;
}

const STAND_SPOTS: readonly StandSpot[] = [
  { zone: "T", number: 2, x: 63, y: 58 },
  { zone: "T", number: 4, x: 153, y: 58 },
  { zone: "T", number: 6, x: 243, y: 58 },
  { zone: "T", number: 1, x: 63, y: 120 },
  { zone: "T", number: 3, x: 153, y: 120 },
  { zone: "T", number: 5, x: 243, y: 120 },
  { zone: "C", number: 3, x: 178, y: 211 },
  { zone: "C", number: 2, x: 248, y: 211 },
  { zone: "C", number: 1, x: 318, y: 211 },
  { zone: "A", number: 3, x: 412, y: 211 },
  { zone: "A", number: 2, x: 482, y: 211 },
  { zone: "A", number: 1, x: 552, y: 211 },
  { zone: "D", number: 3, x: 178, y: 479 },
  { zone: "D", number: 2, x: 248, y: 479 },
  { zone: "D", number: 1, x: 318, y: 479 },
  { zone: "B", number: 3, x: 412, y: 479 },
  { zone: "B", number: 2, x: 482, y: 479 },
  { zone: "B", number: 1, x: 552, y: 479 },
];

const ZONE_SPOTS: readonly ZoneMarker[] = [
  { id: "restrooms", x: 43, y: 370 },
  { id: "mario-kart", x: 103, y: 370 },
  { id: "help-center-2", x: 80, y: 194 },
  { id: "help-center-1", x: 80, y: 550 },
  { id: "help-center-4", x: 696, y: 200 },
  { id: "help-center-3", x: 696, y: 548 },
  { id: "kof", x: 627, y: 370 },
  { id: "stage", x: 699, y: 370 },
  { id: "marketplace", x: 841, y: 373 },
];

/** The 18 stand cells of the Edificio B in plan order, with the code the games feature owns. */
export const STAND_MARKERS: readonly StandMarker[] = STAND_SPOTS.map(toStandMarker);

/** The 9 activity and service zones of the Edificio B. */
export const ZONE_MARKERS: readonly ZoneMarker[] = ZONE_SPOTS;

function toStandMarker(spot: StandSpot): StandMarker {
  return { code: formatStandCode(spot), x: spot.x, y: spot.y };
}
