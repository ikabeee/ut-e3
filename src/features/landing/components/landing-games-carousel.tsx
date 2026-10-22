"use client";

import { LandingGamesCard } from "@features/landing/components/landing-games-card";
import { LandingIcon } from "@features/landing/components/landing-icon";
import { useCarousel } from "@features/landing/hooks/use-carousel";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import type { LandingGame } from "@features/landing/lib/landing-games";

const COPY = LANDING_COPY.games;

interface LandingGamesCarouselProps {
  games: readonly LandingGame[];
  /** Equipos del evento: el contador muestra "n/total" sobre este número, no sobre las tarjetas. */
  total: number;
}

/** Carrusel con `scroll-snap`: flechas, contador "n/total" y teclado (la pista recibe el foco). */
export function LandingGamesCarousel({ games, total }: Readonly<LandingGamesCarouselProps>) {
  const { trackRef, index, onScroll, previous, next } = useCarousel(games.length);

  return (
    <div className="flex flex-col gap-[49px]">
      <div
        ref={trackRef}
        onScroll={onScroll}
        role="region"
        aria-label={COPY.carouselLabel}
        tabIndex={0}
        className="scrollbar-none flex snap-x snap-mandatory gap-[25px] overflow-x-auto pt-40"
      >
        {games.map((game) => (
          <div key={game.id} className="w-[min(471px,85vw)] shrink-0 snap-start">
            <LandingGamesCard game={game} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-[18px]">
        <button type="button" aria-label={COPY.previous} onClick={previous} className="touch-target relative">
          <LandingIcon name="carousel-previous" className="size-[67px]" />
        </button>
        <button type="button" aria-label={COPY.next} onClick={next} className="touch-target relative">
          <LandingIcon name="carousel-next" className="size-[67px]" />
        </button>
        <span className="ml-4 text-xl" aria-live="polite">
          {COPY.counter(index + 1, total)}
        </span>
      </div>
    </div>
  );
}
