"use client";

import { useState } from "react";
import { GameGrid } from "@features/games/components/game-grid";
import { GameSearchField } from "@features/games/components/game-search-field";
import { GamesEmptyState } from "@features/games/components/games-empty-state";
import { GenreRail } from "@features/games/components/genre-rail";
import { filterGames, toggleGenre } from "@features/games/lib/game-filters";
import { findGenre, summarizeGenres } from "@features/games/lib/game-genres";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { Game } from "@features/games/lib/types";

interface GamesBrowserProps {
  games: Game[];
  /** A slug no game has is ignored, so a stale shared link still shows the whole catalog. */
  selectedGenreSlug: string | null;
  onSelectGenre: (genreSlug: string | null) => void;
}

export function GamesBrowser({ games, selectedGenreSlug, onSelectGenre }: Readonly<GamesBrowserProps>) {
  const [keyword, setKeyword] = useState("");
  const genre = findGenre(games, selectedGenreSlug);
  const visibleGames = filterGames(games, { genreSlug: genre?.slug ?? null, keyword });

  function showAllGames() {
    onSelectGenre(null);
    setKeyword("");
  }

  return (
    <>
      <GenreRail
        genres={summarizeGenres(games)}
        selectedGenreSlug={genre?.slug ?? null}
        onSelectGenre={(genreSlug) => onSelectGenre(toggleGenre(genre?.slug ?? null, genreSlug))}
      />
      <section aria-label={GAMES_COPY.catalog.allGames} className="mt-[clamp(40px,6vw,72px)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
          <GameSearchField value={keyword} onChange={setKeyword} />
          <p aria-live="polite" className="m-0 type-tiny text-muted">
            {GAMES_COPY.catalog.results(visibleGames.length, games.length, genre?.name ?? null)}
          </p>
        </div>
        {visibleGames.length > 0 ? <GameGrid games={visibleGames} /> : <GamesEmptyState onReset={showAllGames} />}
      </section>
    </>
  );
}
