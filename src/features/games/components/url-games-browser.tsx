"use client";

import { Suspense } from "react";
import { GamesBrowser } from "@features/games/components/games-browser";
import { useGenreSearchParam } from "@features/games/hooks/use-genre-search-param";
import type { Game } from "@features/games/lib/types";

// useSearchParams has no value while prerendering, so the whole catalog is prerendered unfiltered and the genre of
// the URL applies on hydration (use-search-params.md "Prerendering").
export function UrlGamesBrowser({ games }: Readonly<{ games: Game[] }>) {
  return (
    <Suspense fallback={<GamesBrowser games={games} selectedGenreSlug={null} onSelectGenre={ignoreGenre} />}>
      <GamesBrowserWithUrlGenre games={games} />
    </Suspense>
  );
}

function GamesBrowserWithUrlGenre({ games }: Readonly<{ games: Game[] }>) {
  const [genreSlug, setGenreSlug] = useGenreSearchParam();

  return <GamesBrowser games={games} selectedGenreSlug={genreSlug} onSelectGenre={setGenreSlug} />;
}

// The fallback is only the prerendered HTML: it is replaced on hydration, before any press can reach it.
function ignoreGenre() {}
