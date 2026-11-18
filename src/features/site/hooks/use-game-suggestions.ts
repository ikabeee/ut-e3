import { useEffect, useState } from "react";
import { fetchGameSuggestions } from "@features/games/api/games-api-client";
import { searchGames } from "@features/games/lib/game-search";
import type { GameSuggestion } from "@features/games/lib/types";

export type GameSuggestionsLoader = () => Promise<GameSuggestion[]>;

const MAX_SUGGESTIONS = 6;

/**
 * The games that match what is typed in the navbar search (S21), with the same search as the catalog. The list is
 * asked for once, when the visitor starts typing; `null` means it has not arrived yet. If the request fails (for
 * example, offline) there are no suggestions and the form still sends the search to /games.
 */
export function useGameSuggestions(query: string, load: GameSuggestionsLoader = fetchGameSuggestions) {
  const [games, setGames] = useState<GameSuggestion[] | null>(null);
  const shouldLoad = games === null && query.trim() !== "";

  useEffect(() => {
    if (!shouldLoad) return;

    let isCurrent = true;

    load().then(
      (loaded) => isCurrent && setGames(loaded),
      () => isCurrent && setGames([]),
    );

    return () => {
      isCurrent = false;
    };
  }, [shouldLoad, load]);

  return games === null ? null : searchGames(games, query, toSearchFields).slice(0, MAX_SUGGESTIONS);
}

function toSearchFields(game: GameSuggestion) {
  return game;
}
