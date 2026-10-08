import { useMemo, useState } from "react";
import type { Game, GameGenre } from "../lib/types";

/** Filtra una lista de videojuegos por género en el cliente. */
export function useGenreFilter(games: Game[]) {
  const [selectedGenre, setSelectedGenre] = useState<GameGenre | null>(null);

  const availableGenres = useMemo(
    () => Array.from(new Set(games.map((game) => game.genre))),
    [games],
  );

  const filteredGames = useMemo(
    () =>
      selectedGenre === null
        ? games
        : games.filter((game) => game.genre === selectedGenre),
    [games, selectedGenre],
  );

  return { availableGenres, selectedGenre, setSelectedGenre, filteredGames };
}
