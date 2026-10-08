"use client";

import { useGenreFilter } from "../hooks/use-genre-filter";
import type { Game } from "../lib/types";
import { GameGrid } from "./game-grid";
import { GenreFilter } from "./genre-filter";

export function GamesCatalog({ games }: { games: Game[] }) {
  const { availableGenres, selectedGenre, setSelectedGenre, filteredGames } =
    useGenreFilter(games);

  return (
    <div className="flex flex-col gap-6">
      {availableGenres.length > 1 && (
        <GenreFilter
          genres={availableGenres}
          selectedGenre={selectedGenre}
          onSelect={setSelectedGenre}
        />
      )}
      <GameGrid games={filteredGames} />
    </div>
  );
}
