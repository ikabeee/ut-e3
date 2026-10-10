import { useMemo, useState } from "react";
import { useGames } from "@features/games/hooks/use-games";
import { describeResults, filterGames, toggleGenre } from "@features/games/lib/game-filters";
import { isKnownGenre, summarizeGenres } from "@features/games/lib/game-genres";
import { GENRE_SEARCH_PARAM } from "@features/games/lib/game-links";
import { useSearchParamState } from "@shared/hooks/use-search-param-state";

/**
 * Estado del catálogo: género (en la URL, para compartirlo) y texto de búsqueda.
 * Devuelve los juegos filtrados y las acciones de la pantalla.
 */
export function useGameCatalog() {
  const games = useGames();
  const [genreParam, setGenreParam] = useSearchParamState(GENRE_SEARCH_PARAM);
  const [keyword, setKeyword] = useState("");

  const genre = isKnownGenre(games, genreParam) ? genreParam : null;
  const genres = useMemo(() => summarizeGenres(games), [games]);
  const visibleGames = useMemo(() => filterGames(games, { genre, keyword }), [games, genre, keyword]);

  return {
    genres,
    selectedGenre: genre,
    keyword,
    visibleGames,
    resultsLabel: describeResults(visibleGames.length, games.length, genre),
    selectGenre: (name: string) => setGenreParam(toggleGenre(genre, name)),
    setKeyword,
    resetFilters: () => {
      setGenreParam(null);
      setKeyword("");
    },
  };
}
