"use client";

import { useRef } from "react";
import { GameCard } from "@features/games/components/game-card";
import { GameSearchField } from "@features/games/components/game-search-field";
import { GamesEmptyState } from "@features/games/components/games-empty-state";
import { GenreRail } from "@features/games/components/genre-rail";
import { useGameCatalog } from "@features/games/hooks/use-game-catalog";
import { usePrefersReducedMotion } from "@shared/hooks/use-prefers-reduced-motion";

const CARD_COVER_SIZES = "(max-width: 760px) 50vw, (max-width: 1000px) 33vw, (max-width: 1200px) 25vw, 20vw";

/** Catálogo completo: géneros, buscador, contador y cuadrícula de juegos. */
export function GamesCatalog() {
  const catalog = useGameCatalog();
  const browseRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleSelectGenre = (genre: string) => {
    catalog.selectGenre(genre);
    browseRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <>
      <GenreRail genres={catalog.genres} selectedGenre={catalog.selectedGenre} onSelectGenre={handleSelectGenre} />

      <section ref={browseRef} aria-label="Todos los juegos" className="mt-[clamp(40px,6vw,72px)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
          <GameSearchField value={catalog.keyword} onChange={catalog.setKeyword} />
          <p className="type-tiny m-0 text-muted" aria-live="polite">
            {catalog.resultsLabel}
          </p>
        </div>

        {catalog.visibleGames.length > 0 ? (
          <div className="grid grid-cols-5 gap-x-4 gap-y-[22px] max-[1200px]:grid-cols-4 max-[1000px]:grid-cols-3 max-[760px]:grid-cols-2">
            {catalog.visibleGames.map((game) => (
              <GameCard key={game.slug} game={game} coverSizes={CARD_COVER_SIZES} />
            ))}
          </div>
        ) : (
          <GamesEmptyState onReset={catalog.resetFilters} />
        )}
      </section>
    </>
  );
}
