import type { StandLocation } from "@features/games/lib/stand-code";

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface GameImage {
  path: string;
  alt: string;
  position: number;
  isCover: boolean;
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  synopsis: string;
  genre: Genre;
  stand: StandLocation;
  images: GameImage[];
  itchUrl: string | null;
}

export interface GameEventLabels {
  dateLabel: string;
  hoursLabel: string;
}

export interface GameDetailLinks {
  catalog: string;
  floorPlan: string;
  calendar: string;
}

export interface GenreSummary {
  genre: Genre;
  gameCount: number;
  /** Three covers: two at the back, then the one in front. */
  covers: Game[];
}
