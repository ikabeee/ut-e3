"use client";

import { Suspense } from "react";
import { GamesBrowser } from "@features/games/components/games-browser";
import { useGenreSearchParam } from "@features/games/hooks/use-genre-search-param";
import { useKeywordSearchParam } from "@features/games/hooks/use-keyword-search-param";
import type { Game } from "@features/games/lib/types";

interface UrlGamesBrowserProps {
  games: Game[];
  withFeatured?: boolean;
}

// useSearchParams has no value while prerendering, so the whole catalog is prerendered unfiltered and the genre and
// the search of the URL apply on hydration (use-search-params.md "Prerendering").
export function UrlGamesBrowser({ games, withFeatured }: Readonly<UrlGamesBrowserProps>) {
  return (
    <Suspense
      fallback={
        <GamesBrowser
          games={games}
          selectedGenreSlug={null}
          keyword=""
          onSelectGenre={ignore}
          onClearKeyword={ignore}
          onShowAll={ignore}
          withFeatured={withFeatured}
        />
      }
    >
      <GamesBrowserWithUrlFilters games={games} withFeatured={withFeatured} />
    </Suspense>
  );
}

function GamesBrowserWithUrlFilters({ games, withFeatured }: Readonly<UrlGamesBrowserProps>) {
  const [genreSlug, setGenreSlug] = useGenreSearchParam();
  const [keyword, clearKeyword] = useKeywordSearchParam();

  function showAll() {
    setGenreSlug(null);
    clearKeyword();
  }

  return (
    <GamesBrowser
      games={games}
      selectedGenreSlug={genreSlug}
      keyword={keyword}
      onSelectGenre={setGenreSlug}
      onClearKeyword={clearKeyword}
      onShowAll={showAll}
      withFeatured={withFeatured}
    />
  );
}

// The fallback is only the prerendered HTML: it is replaced on hydration, before any press can reach it.
function ignore() {}
