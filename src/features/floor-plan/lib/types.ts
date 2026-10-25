export interface FloorPlanStand {
  code: string;
  name: string;
  genre: string;
  synopsis: string;
  coverSrc: string;
  coverAlt: string;
}

export const ZONE_IDS = [
  "stage",
  "kof",
  "mario-kart",
  "restrooms",
  "rear-marketplace",
  "marketplace",
  "cafeteria",
  "help-center-1",
  "help-center-2",
  "help-center-3",
  "help-center-4",
] as const;

export type ZoneId = (typeof ZONE_IDS)[number];

export const PLAN_CATEGORIES = ["team", "info", "act", "srv"] as const;

export type PlanCategory = (typeof PLAN_CATEGORIES)[number];

export type PlanOrientation = "wide" | "tall";

export type PlanRect = readonly [number, number, number, number];

export interface ZoneGeometry {
  rect: PlanRect;
  fontSize?: number;
  isLabelVertical?: boolean;
}

export type StandZone = "A" | "B" | "C" | "D" | "T";

export interface StandBlock {
  zone: StandZone;
  origin: readonly [number, number];
  step: readonly [number, number];
  size: readonly [number, number];
  columns: number;
  rows: number;
  labelAt: readonly [number, number];
  standNumbers?: readonly number[];
}

export interface PlanLayout {
  width: number;
  height: number;
  wall: string;
  dots: readonly [number, number, number, number];
  zones: Partial<Record<ZoneId, ZoneGeometry>>;
  standBlocks: readonly StandBlock[];
  standNameSize: number;
}

export interface StandCell {
  code: string;
  number: number;
  rect: PlanRect;
}

export interface PlanCover {
  src: string;
  alt: string;
}

export interface PlanItem {
  id: string;
  category: PlanCategory;
  label: string;
  kicker: string;
  title: string;
  description: string;
  code: string;
  drawingName: string;
  cover: PlanCover | null;
}

export interface PlanSelection {
  itemsById: ReadonlyMap<string, PlanItem>;
  selectedId: string;
  onSelectItem: (id: string) => void;
}
