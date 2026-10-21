"use client";

import { useGames } from "@features/games/hooks/use-games";
import { LandingGamesCard } from "@features/landing/components/landing-games-card";
import { useCarousel } from "@features/landing/hooks/use-carousel";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { ArrowButton } from "@shared/components/arrow-button";

const COPY = LANDING_COPY.games;

/** Carrusel de juegos con `scroll-snap`: flechas, contador "n/total" y teclado (la pista recibe el foco). */
export function LandingGamesCarousel() {
  const games = useGames();
  const { trackRef, index, onScroll, previous, next } = useCarousel(games.length);

  return (
    <div className="flex flex-col gap-6">
      <div
        ref={trackRef}
        onScroll={onScroll}
        role="region"
        aria-label={COPY.carouselLabel}
        tabIndex={0}
        className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto"
      >
        {games.map((game) => (
          <div key={game.slug} className="w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-[28%]">
            <LandingGamesCard game={game} />
          </div>
        ))}
      </div>
      <div className="flex flex-row-reverse items-center justify-end gap-4">
        <span className="type-mono text-background" aria-live="polite">
          {COPY.counter(Math.min(index + 1, games.length), games.length)}
        </span>
        <div className="flex gap-3 text-background">
          <ArrowButton
            direction="previous"
            label={COPY.previous}
            onPress={previous}
            className="rounded-full border border-background"
          />
          <ArrowButton
            direction="next"
            label={COPY.next}
            onPress={next}
            className="rounded-full border border-background"
          />
        </div>
      </div>
    </div>
  );
}
