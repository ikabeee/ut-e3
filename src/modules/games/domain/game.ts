export const GAME_GENRES = [
  "action",
  "adventure",
  "platformer",
  "puzzle",
  "rpg",
  "strategy",
  "sports",
  "horror",
  "educational",
  "other",
] as const;

export type GameGenre = (typeof GAME_GENRES)[number];

export const GAME_GENRE_LABELS: Record<GameGenre, string> = {
  action: "Acción",
  adventure: "Aventura",
  platformer: "Plataformas",
  puzzle: "Puzzle",
  rpg: "RPG",
  strategy: "Estrategia",
  sports: "Deportes",
  horror: "Terror",
  educational: "Educativo",
  other: "Otro",
};

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
