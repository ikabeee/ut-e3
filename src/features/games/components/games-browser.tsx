"use client";

import { Button } from "@heroui/react";
import { FeaturedGamesCarousel } from "@features/games/components/featured-games-carousel";
import { GameGrid } from "@features/games/components/game-grid";
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
  /** The text of the navbar search (`?q=`); blank shows every game. */
  keyword: string;
  onSelectGenre: (genreSlug: string | null) => void;
  onClearKeyword: () => void;
  /** Drops the genre and the search together. */
  onShowAll: () => void;
  /** Opens the page with the featured games carousel, so they are the first thing on a phone. */
  withFeatured?: boolean;
}

export function GamesBrowser({
  games,
  selectedGenreSlug,
  keyword,
  onSelectGenre,
  onClearKeyword,
  onShowAll,
  withFeatured = false,
}: Readonly<GamesBrowserProps>) {
  const genre = findGenre(games, selectedGenreSlug);
  const searchText = keyword.trim();

  // The carousel and the genre shelves follow the search; the genre only narrows the covers.
  const searchedGames = filterGames(games, { genreSlug: null, keyword: searchText });

  const visibleGames =
    genre === null ? searchedGames : filterGames(searchedGames, { genreSlug: genre.slug, keyword: "" });

  function selectGenre(genreSlug: string | null) {
    onSelectGenre(genreSlug === null ? null : toggleGenre(genre?.slug ?? null, genreSlug));
  }

  return (
    <>
      <h1 className="sr-only">{GAMES_COPY.catalog.pageTitle}</h1>
      {searchText === "" ? null : <SearchNote searchText={searchText} onClear={onClearKeyword} />}
      {withFeatured ? <FeaturedGamesCarousel key={searchText} games={searchedGames} /> : null}
      <div className="page-wrap pt-[clamp(40px,6vw,72px)] pb-[clamp(56px,8vw,112px)]">
        {searchedGames.length > 0 ? (
          <GenreRail
            genres={summarizeGenres(searchedGames)}
            selectedGenreSlug={genre?.slug ?? null}
            onSelectGenre={selectGenre}
          />
        ) : null}
        <section aria-label={GAMES_COPY.catalog.allGames} className="mt-[clamp(40px,6vw,72px)]">
          {visibleGames.length > 0 ? <GameGrid games={visibleGames} /> : <GamesEmptyState onReset={onShowAll} />}
        </section>
      </div>
    </>
  );
}

interface SearchNoteProps {
  searchText: string;
  onClear: () => void;
}

function SearchNote({ searchText, onClear }: Readonly<SearchNoteProps>) {
  return (
    <div className="page-wrap flex flex-wrap items-center gap-x-4 gap-y-2 pt-[clamp(24px,4vw,40px)]">
      <p role="status" className="m-0 type-tiny wrap-anywhere text-muted">
        {GAMES_COPY.catalog.searchingFor(searchText)}
      </p>
      <Button variant="outline" size="sm" onPress={onClear}>
        {GAMES_COPY.catalog.clearSearch}
      </Button>
    </div>
  );
}
