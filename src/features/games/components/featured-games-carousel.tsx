"use client";

import { FeaturedCaption } from "@features/games/components/featured-caption";
import { FeaturedSlides } from "@features/games/components/featured-slides";
import { FeaturedThumbnails } from "@features/games/components/featured-thumbnails";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { Game } from "@features/games/lib/types";
import { ArrowButton } from "@shared/components/arrow-button";
import { useAutoplayCarousel } from "@shared/hooks/use-autoplay-carousel";

interface FeaturedGamesCarouselProps {
  games: Game[];
}

export function FeaturedGamesCarousel({ games }: Readonly<FeaturedGamesCarouselProps>) {
  if (games.length === 0) {
    return null;
  }

  return <Carousel games={games} />;
}

function Carousel({ games }: Readonly<FeaturedGamesCarouselProps>) {
  const carousel = useAutoplayCarousel(games.length);

  return (
    <section
      aria-roledescription={GAMES_COPY.carousel.roleDescription}
      aria-label={GAMES_COPY.carousel.label}
      className="grid h-[clamp(640px,calc(100svh-56px),1000px)] grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,7fr)_minmax(0,3fr)] max-[760px]:h-auto max-[760px]:grid-rows-[auto_auto]"
      {...carousel.pauseHandlers}
    >
      <div className="relative isolate min-h-0 overflow-hidden max-[760px]:h-[clamp(480px,72svh,640px)]">
        <FeaturedSlides games={games} current={carousel.current} swipeHandlers={carousel.swipeHandlers} />
        <FeaturedCaption game={games[carousel.current]} />
      </div>
      <div className="flex min-h-0 min-w-0 flex-col gap-2.5 border-t border-separator px-gutter pt-3.5 pb-4">
        <FeaturedThumbnails
          games={games}
          current={carousel.current}
          onSelect={carousel.goTo}
          progressBarRef={carousel.progressBarRef}
        />
        <div className="flex [&>*+*]:border-l-0">
          <ArrowButton direction="previous" label={GAMES_COPY.carousel.previous} onPress={carousel.goPrevious} />
          <ArrowButton direction="next" label={GAMES_COPY.carousel.next} onPress={carousel.goNext} />
        </div>
      </div>
    </section>
  );
}
