import type { GameSuggestion } from "@features/games/lib/types";

/** The body of GET /api/games: only what the navbar search shows and links (S21). */
export interface GameSuggestionsBody {
  games: GameSuggestion[];
}

export function isGameSuggestionsBody(value: unknown): value is GameSuggestionsBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "games" in value &&
    Array.isArray(value.games) &&
    value.games.every(isGameSuggestion)
  );
}

function isGameSuggestion(value: unknown): value is GameSuggestion {
  return (
    typeof value === "object" &&
    value !== null &&
    "slug" in value &&
    typeof value.slug === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "genreName" in value &&
    typeof value.genreName === "string"
  );
}
