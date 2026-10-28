import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { GAMES_COPY } from "@features/games/lib/games-copy";
import { getGamePath } from "@features/games/lib/games-links";
import type { Game } from "@features/games/lib/types";
import { ArrowButton } from "@shared/components/arrow-button";

interface CoverflowPlateProps {
  game: Game;
  current: number;
  count: number;
  isFirst: boolean;
  isLast: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function CoverflowPlate({
  game,
  current,
  count,
  isFirst,
  isLast,
  onPrevious,
  onNext,
}: Readonly<CoverflowPlateProps>) {
  return (
    <div className="absolute top-[calc(var(--top)+var(--ch)*1.13)] left-1/2 z-300 flex -translate-x-1/2 gap-3">
      <ArrowButton
        direction="previous"
        label={GAMES_COPY.carousel.previous}
        tone="plate"
        className="size-14"
        isDisabled={isFirst}
        onPress={onPrevious}
      />
      <div className="sr-only" aria-live="polite">
        <h3>{game.name}</h3>
        <span>{GAMES_COPY.coverflow.position(current, count)}</span>
      </div>
      <GameDetailLink game={game} />
      <ArrowButton
        direction="next"
        label={GAMES_COPY.carousel.next}
        tone="plate"
        className="size-14"
        isDisabled={isLast}
        onPress={onNext}
      />
    </div>
  );
}

function GameDetailLink({ game }: Readonly<{ game: Game }>) {
  return (
    <Link
      href={getGamePath(game.slug)}
      aria-label={GAMES_COPY.coverflow.openDetailLabel(game.name)}
      className={buttonVariants({ variant: "outline", className: "h-14" })}
    >
      {GAMES_COPY.coverflow.openDetail}
    </Link>
  );
}
