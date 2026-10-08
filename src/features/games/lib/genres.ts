import type { GameGenre } from "./types";

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
