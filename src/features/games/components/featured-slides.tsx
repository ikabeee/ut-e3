import type { TouchEvent } from "react";
import { cn } from "@heroui/react";
import { GameCoverImage } from "@features/games/components/game-cover-image";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { Game } from "@features/games/lib/types";

interface FeaturedSlidesProps {
  games: Game[];
  current: number;
  swipeHandlers: {
    onTouchStart: (event: TouchEvent) => void;
    onTouchEnd: (event: TouchEvent) => void;
  };
}

export function FeaturedSlides({ games, current, swipeHandlers }: Readonly<FeaturedSlidesProps>) {
  return (
    <div className="absolute inset-0 -z-1" {...swipeHandlers}>
      {games.map((game, index) => (
        <FeaturedSlide
          key={game.slug}
          game={game}
          isCurrent={index === current}
          isMounted={isNeighbor(index, current, games.length)}
          isFirst={index === 0}
        />
      ))}
      <div aria-hidden="true" className="absolute inset-0 shade-featured max-[760px]:hidden" />
      <div aria-hidden="true" className="absolute inset-0 hidden shade-featured-mobile max-[760px]:block" />
    </div>
  );
}

interface FeaturedSlideProps {
  game: Game;
  isCurrent: boolean;
  /** Only the current slide and its neighbors load their image: the previous one fades out, the next one is ready. */
  isMounted: boolean;
  isFirst: boolean;
}

function FeaturedSlide({ game, isCurrent, isMounted, isFirst }: Readonly<FeaturedSlideProps>) {
  return (
    <div
      role="group"
      aria-roledescription={GAMES_COPY.carousel.slideRoleDescription}
      aria-label={game.name}
      className={cn(
        "absolute inset-0",
        isCurrent
          ? "visible opacity-100 transition-opacity duration-700"
          : "invisible opacity-0 transition-[opacity,visibility] duration-700",
      )}
    >
      {isMounted ? (
        <GameCoverImage
          game={game}
          sizes="100vw"
          isEager={isFirst}
          className={cn("transition-transform duration-7000 ease-linear", isCurrent ? "scale-100" : "scale-105")}
        />
      ) : null}
    </div>
  );
}

function isNeighbor(index: number, current: number, count: number): boolean {
  const distance = Math.abs(index - current);

  return Math.min(distance, count - distance) <= 1;
}
