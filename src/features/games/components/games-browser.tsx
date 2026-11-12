"use client";

import { useState, type ReactNode } from "react";
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
  /**
   * Rendered between the catalog header and the genre rail: the page shows the featured hero here so the
   * title and the search stay visible on the first phone screen.
   */
  hero?: ReactNode;
}

export function GamesBrowser({ games, selectedGenreSlug, onSelectGenre, hero }: Readonly<GamesBrowserProps>) {
  const [keyword, setKeyword] = useState("");
  const genre = findGenre(games, selectedGenreSlug);
  const visibleGames = filterGames(games, { genreSlug: genre?.slug ?? null, keyword });

  function showAllGames() {
    onSelectGenre(null);
    setKeyword("");
  }

  function selectGenre(genreSlug: string | null) {
    onSelectGenre(genreSlug === null ? null : toggleGenre(genre?.slug ?? null, genreSlug));
  }

  return (
    <>
      <div className="page-wrap pt-[clamp(32px,5vw,64px)]">
        <h1 className="type-wide text-[clamp(28px,4.4vw,60px)] leading-[.95] tracking-[-.035em] wrap-break-word">
          {GAMES_COPY.catalog.pageTitle}
        </h1>
        <p className="mt-3 max-w-[62ch] text-copy">{GAMES_COPY.catalog.pageDescription}</p>
        <div className="mt-6 mb-5 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
          <GameSearchField value={keyword} onChange={setKeyword} />
          <p aria-live="polite" className="m-0 type-tiny text-muted">
            {GAMES_COPY.catalog.results(visibleGames.length, games.length, genre?.name ?? null)}
          </p>
        </div>
      </div>
      {hero}
      <div className="page-wrap pt-[clamp(40px,6vw,72px)] pb-[clamp(56px,8vw,112px)]">
        <GenreRail
          genres={summarizeGenres(games)}
          selectedGenreSlug={genre?.slug ?? null}
          onSelectGenre={selectGenre}
        />
        <section aria-label={GAMES_COPY.catalog.allGames} className="mt-[clamp(40px,6vw,72px)]">
          {visibleGames.length > 0 ? <GameGrid games={visibleGames} /> : <GamesEmptyState onReset={showAllGames} />}
        </section>
      </div>
    </>
  );
}
