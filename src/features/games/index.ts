// Client-safe public API of the `games` feature.
// Route containers live in "@/features/games/pages".
export { GameCard } from "./components/game-card";
export { GenreBadge } from "./components/genre-badge";
export { useGenreFilter } from "./hooks/use-genre-filter";
export { GAME_GENRE_LABELS, GAME_GENRES } from "./lib/genres";
export type { Game, GameGenre } from "./lib/types";
