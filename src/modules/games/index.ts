// API pública del módulo `games` (seguro para Server y Client Components).
// Para casos de uso con acceso a datos importa desde "@/modules/games/server".
export { GAME_GENRES, GAME_GENRE_LABELS } from "./domain/game";
export type { Game, GameGenre } from "./domain/game";
export { GameCard } from "./ui/game-card";
export { GameDetail } from "./ui/game-detail";
export { GameGrid } from "./ui/game-grid";
export { GenreBadge } from "./ui/genre-badge";
