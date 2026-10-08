import type { GAME_GENRES } from "./genres";

export type GameGenre = (typeof GAME_GENRES)[number];

/** Videojuego que se exhibe en el evento. */
export interface Game {
  id: number;
  slug: string;
  title: string;
  description: string;
  genre: GameGenre;
  engine: string | null;
  coverUrl: string | null;
  playUrl: string | null;
  repoUrl: string | null;
  standNumber: number | null;
  team: {
    slug: string;
    name: string;
  };
}
