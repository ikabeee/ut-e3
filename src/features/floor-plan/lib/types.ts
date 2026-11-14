export interface FloorPlanStand {
  code: string;
  name: string;
  /** The slug of the page of the game of the stand. */
  slug: string;
  genre: string;
  synopsis: string;
  /** Null while the game has no artwork: the markers show its initials and the detail its generic cover. */
  coverSrc: string | null;
  coverAlt: string;
}

export const ZONE_IDS = [
  "stage",
  "kof",
  "mario-kart",
  "restrooms",
  "marketplace",
  "help-center-1",
  "help-center-2",
  "help-center-3",
  "help-center-4",
] as const;

export type ZoneId = (typeof ZONE_IDS)[number];

export type StandZone = "A" | "B" | "C" | "D" | "T";
