"use client";

import { Suspense, type ReactNode } from "react";
import { GamesBrowser } from "@features/games/components/games-browser";
import { useGenreSearchParam } from "@features/games/hooks/use-genre-search-param";
import type { Game } from "@features/games/lib/types";

interface UrlGamesBrowserProps {
  games: Game[];
  hero?: ReactNode;
}

// useSearchParams has no value while prerendering, so the whole catalog is prerendered unfiltered and the genre of
// the URL applies on hydration (use-search-params.md "Prerendering").
export function UrlGamesBrowser({ games, hero }: Readonly<UrlGamesBrowserProps>) {
  return (
    <Suspense
      fallback={<GamesBrowser games={games} selectedGenreSlug={null} onSelectGenre={ignoreGenre} hero={hero} />}
    >
      <GamesBrowserWithUrlGenre games={games} hero={hero} />
    </Suspense>
  );
}

function GamesBrowserWithUrlGenre({ games, hero }: Readonly<UrlGamesBrowserProps>) {
  const [genreSlug, setGenreSlug] = useGenreSearchParam();

  return <GamesBrowser games={games} selectedGenreSlug={genreSlug} onSelectGenre={setGenreSlug} hero={hero} />;
}

// The fallback is only the prerendered HTML: it is replaced on hydration, before any press can reach it.
function ignoreGenre() {}
