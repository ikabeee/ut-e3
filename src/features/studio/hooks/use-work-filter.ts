import { useMemo, useState } from "react";
import { filterGames, toggleGenre } from "@features/games/lib/game-filters";
import { summarizeGenres } from "@features/games/lib/game-genres";
import type { Game } from "@features/games/lib/types";

/** The genre filter of the studio carousel. `null` shows every game; the genres come from the games themselves. */
export function useWorkFilter(games: Game[]) {
  const [genreSlug, setGenreSlug] = useState<string | null>(null);
  const genres = useMemo(() => summarizeGenres(games).map((summary) => summary.genre), [games]);
  const visibleGames = useMemo(() => filterGames(games, { genreSlug, keyword: "" }), [games, genreSlug]);

  function selectGenre(slug: string | null) {
    setGenreSlug((current) => (slug === null ? null : toggleGenre(current, slug)));
  }

  return { genreSlug, genres, visibleGames, selectGenre };
}
