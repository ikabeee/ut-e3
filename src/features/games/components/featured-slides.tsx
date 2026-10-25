import { cn } from "@heroui/react";
import { GameCoverImage } from "@features/games/components/game-cover-image";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { Game } from "@features/games/lib/types";

interface FeaturedSlidesProps {
  games: Game[];
  current: number;
}

export function FeaturedSlides({ games, current }: Readonly<FeaturedSlidesProps>) {
  return (
    <div className="absolute inset-0 -z-1">
      {games.map((game, index) => (
        <FeaturedSlide key={game.id} game={game} isCurrent={index === current} />
      ))}
      <div aria-hidden="true" className="absolute inset-0 shade-featured max-[760px]:hidden" />
      <div aria-hidden="true" className="absolute inset-0 hidden shade-featured-mobile max-[760px]:block" />
    </div>
  );
}

interface FeaturedSlideProps {
  game: Game;
  isCurrent: boolean;
}

function FeaturedSlide({ game, isCurrent }: Readonly<FeaturedSlideProps>) {
  return (
    <div
      role="group"
      aria-roledescription={GAMES_COPY.carousel.slideRoleDescription}
      aria-label={game.name}
      className={cn(
        "absolute inset-0",
        isCurrent
          ? "visible opacity-100 [transition:opacity_.7s_ease]"
          : "invisible opacity-0 [transition:opacity_.7s_ease,visibility_0s_.7s]",
      )}
    >
      <GameCoverImage
        game={game}
        sizes="100vw"
        className={cn("transition-transform duration-[7s] ease-linear", isCurrent ? "scale-100" : "scale-[1.05]")}
      />
    </div>
  );
}
