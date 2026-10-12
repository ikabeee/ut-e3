"use client";

import { FeaturedCaption } from "@features/games/components/featured-caption";
import { FeaturedSlides } from "@features/games/components/featured-slides";
import { FeaturedThumbnails } from "@features/games/components/featured-thumbnails";
import { useFeaturedCarousel } from "@features/games/hooks/use-featured-carousel";
import { useGames } from "@features/games/hooks/use-games";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { ArrowButton } from "@shared/components/arrow-button";

/** Carrusel de destacados de la portada (`.hero`): imagen grande, título y miniaturas. */
export function FeaturedGamesCarousel() {
  const games = useGames();
  const carousel = useFeaturedCarousel(games.length);

  return (
    <header
      id="featured"
      aria-roledescription={GAMES_COPY.carousel.roleDescription}
      aria-label={GAMES_COPY.carousel.label}
      className="grid h-[clamp(640px,calc(100svh-56px),1000px)] grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,7fr)_minmax(0,3fr)] bg-background max-[760px]:h-auto max-[760px]:grid-rows-[auto_auto]"
      {...carousel.pauseHandlers}
    >
      <div
        className="relative isolate min-h-0 overflow-hidden max-[760px]:h-[clamp(480px,72svh,640px)]"
        {...carousel.swipeHandlers}
      >
        <FeaturedSlides games={games} current={carousel.current} previous={carousel.previous} />
        <FeaturedCaption game={games[carousel.current]} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-col gap-[10px] border-t border-separator px-gutter pt-[14px] pb-4">
        <FeaturedThumbnails
          games={games}
          current={carousel.current}
          onSelect={carousel.goTo}
          progressBarRef={carousel.progressBarRef}
        />
        <div className="flex items-center justify-start gap-[10px]">
          <div className="flex [&>*+*]:border-l-0">
            <ArrowButton direction="previous" label={GAMES_COPY.carousel.previous} onPress={carousel.goPrevious} />
            <ArrowButton direction="next" label={GAMES_COPY.carousel.next} onPress={carousel.goNext} />
          </div>
        </div>
      </div>
    </header>
  );
}
