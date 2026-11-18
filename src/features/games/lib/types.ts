import type { StandLocation } from "@features/games/lib/stand-code";

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

/** A genre of the catalog as the sysadmin manages it (RF-72): with how many games use it. */
export interface AdminGenre extends Genre {
  gameCount: number;
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
}

/** What the navbar search needs of a public game to suggest it (S21). */
export interface GameSuggestion {
  slug: string;
  name: string;
  genreName: string;
}

export interface GameEventLabels {
  dateLabel: string;
  hoursLabel: string;
}

export interface GameDetailLinks {
  catalog: string;
}

export interface GenreSummary {
  genre: Genre;
  gameCount: number;
  /** Three covers: two at the back, then the one in front. */
  covers: Game[];
}

/** The data of its game that the administrator of a stand registers (RF-31). */
export interface StandGame {
  name: string;
  synopsis: string;
  genreId: string;
  itchUrl: string | null;
}
